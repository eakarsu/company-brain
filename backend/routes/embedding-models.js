// Embedding models catalog — real model specs (OpenAI, Voyage, Cohere, BAAI, etc.)
// with MTEB scores, costs, and a side-by-side comparison helper.
//
// Endpoints:
//   GET   /api/embedding-models                catalog
//   GET   /api/embedding-models/:id            detail with usage stats
//   POST  /api/embedding-models                add a model
//   PATCH /api/embedding-models/:id            update price/MTEB/etc.
//   POST  /api/embedding-models/compare        compare 2-4 models with a workload estimate

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { provider } = req.query;
    const params = [];
    let where = '';
    if (provider) { params.push(provider); where = 'WHERE provider = $1'; }
    const r = await pool.query(`
      SELECT em.*,
        (SELECT COUNT(*)::int FROM ingestion_jobs ij WHERE ij.model_id = em.id) AS jobs_using,
        (SELECT COUNT(*)::int FROM search_indexes si WHERE si.model_id = em.id) AS indexes_using
      FROM embedding_models em ${where}
      ORDER BY is_default DESC, retrieval_avg DESC NULLS LAST
    `, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const m = (await pool.query('SELECT * FROM embedding_models WHERE id = $1', [id])).rows[0];
    if (!m) return res.status(404).json({ error: 'Not found' });

    const usage = (await pool.query(`
      SELECT COUNT(*)::int AS jobs,
             COALESCE(SUM(tokens_consumed),0)::bigint AS tokens,
             COALESCE(SUM(cost_usd),0)::numeric        AS cost_usd,
             COALESCE(SUM(chunks_done),0)::int         AS chunks_embedded
      FROM ingestion_jobs WHERE model_id = $1
    `, [id])).rows[0];

    const indexes = (await pool.query(`
      SELECT id, name, corpus, status FROM search_indexes WHERE model_id = $1 ORDER BY id
    `, [id])).rows;

    const evalRuns = (await pool.query(`
      SELECT id, name, benchmark, ndcg_at_10, recall_at_10, mrr, run_at
      FROM eval_runs WHERE model_id = $1 ORDER BY run_at DESC LIMIT 10
    `, [id])).rows;

    res.json({ ...m, usage, indexes, recent_eval_runs: evalRuns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { model_id, provider, dimension, max_tokens, cost_per_million_tokens_usd,
            mteb_avg, retrieval_avg, released_on, description, is_default } = req.body || {};
    if (!model_id || !provider || !dimension || !max_tokens) {
      return res.status(400).json({ error: 'model_id, provider, dimension, max_tokens required' });
    }
    if (is_default) {
      await pool.query('UPDATE embedding_models SET is_default = FALSE');
    }
    const r = await pool.query(`
      INSERT INTO embedding_models (model_id, provider, dimension, max_tokens,
        cost_per_million_tokens_usd, mteb_avg, retrieval_avg, released_on, description, is_default)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10, FALSE)) RETURNING *`,
      [model_id, provider, dimension, max_tokens, cost_per_million_tokens_usd || 0,
       mteb_avg || null, retrieval_avg || null, released_on || null, description || null, is_default]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (String(err.message).includes('unique')) return res.status(409).json({ error: 'model_id already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const allowed = ['cost_per_million_tokens_usd','mteb_avg','retrieval_avg','description','is_default'];
    const sets = [], params = [];
    for (const k of allowed) {
      if (k in (req.body || {})) { params.push(req.body[k]); sets.push(`${k} = $${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No allowed fields' });
    if ('is_default' in (req.body || {}) && req.body.is_default) {
      await pool.query('UPDATE embedding_models SET is_default = FALSE');
    }
    params.push(id);
    const r = await pool.query(
      `UPDATE embedding_models SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compare 2-4 models on a workload: { docs, avg_tokens_per_doc, ids: [..] }
router.post('/compare', async (req, res) => {
  try {
    const { ids, docs, avg_tokens_per_doc } = req.body || {};
    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4) {
      return res.status(400).json({ error: 'ids must be array of 2-4 model ids' });
    }
    const nDocs = Math.max(1, parseInt(docs || '1000', 10));
    const avgTok = Math.max(1, parseInt(avg_tokens_per_doc || '2500', 10));
    const totalTokens = nDocs * avgTok;

    const rows = (await pool.query(
      'SELECT * FROM embedding_models WHERE id = ANY($1::int[])',
      [ids.map(n => parseInt(n, 10))]
    )).rows;
    if (rows.length !== ids.length) return res.status(404).json({ error: 'One or more model ids not found' });

    const comparison = rows.map(m => {
      const costForWorkload = (totalTokens / 1_000_000) * Number(m.cost_per_million_tokens_usd || 0);
      const storageBytes = nDocs * Number(m.dimension) * 4; // fp32
      return {
        id: m.id,
        model_id: m.model_id,
        provider: m.provider,
        dimension: m.dimension,
        max_tokens: m.max_tokens,
        retrieval_avg: m.retrieval_avg,
        mteb_avg: m.mteb_avg,
        cost_per_million_tokens_usd: Number(m.cost_per_million_tokens_usd),
        workload_cost_usd: +costForWorkload.toFixed(4),
        storage_mb: +(storageBytes / 1024 / 1024).toFixed(1),
      };
    }).sort((a, b) => (b.retrieval_avg || 0) - (a.retrieval_avg || 0));

    // Verdict heuristics
    const cheapest = [...comparison].sort((a,b) => a.workload_cost_usd - b.workload_cost_usd)[0];
    const bestPerf = comparison[0];
    const bestValue = [...comparison].sort((a,b) =>
      (b.retrieval_avg || 0)/(b.workload_cost_usd || 0.0001) -
      (a.retrieval_avg || 0)/(a.workload_cost_usd || 0.0001)
    )[0];

    res.json({
      workload: { docs: nDocs, avg_tokens_per_doc: avgTok, total_tokens: totalTokens },
      comparison,
      verdict: {
        cheapest:    { model: cheapest.model_id,  cost_usd: cheapest.workload_cost_usd },
        best_perf:   { model: bestPerf.model_id,  retrieval_avg: bestPerf.retrieval_avg },
        best_value:  { model: bestValue.model_id, retrieval_avg: bestValue.retrieval_avg, cost_usd: bestValue.workload_cost_usd },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
