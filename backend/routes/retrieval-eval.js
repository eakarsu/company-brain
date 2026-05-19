// Retrieval evaluation — MTEB-style runs (NDCG@10, Recall@10/50, MRR) per corpus.
//
// Endpoints:
//   GET   /api/retrieval-eval/runs                       list runs (filter by index_id / model_id / benchmark)
//   GET   /api/retrieval-eval/runs/:id                   detail with per-query results
//   POST  /api/retrieval-eval/runs                       record a new run (provide metrics or gold set)
//   POST  /api/retrieval-eval/runs/:id/simulate          generate per-query results consistent with run metrics
//   DELETE/api/retrieval-eval/runs/:id
//   GET   /api/retrieval-eval/benchmarks                 known benchmarks
//   GET   /api/retrieval-eval/leaderboard                aggregate by model/benchmark

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

const BENCHMARKS = [
  { id: 'mteb-msmarco',      description: 'MS MARCO passage ranking (large-scale web QA).', num_queries: 6980 },
  { id: 'mteb-fiqa',         description: 'FiQA-2018 financial domain QA.',                 num_queries: 648  },
  { id: 'mteb-hotpotqa',     description: 'HotpotQA multi-hop QA.',                         num_queries: 7405 },
  { id: 'mteb-nfcorpus',     description: 'NFCorpus medical literature.',                   num_queries: 323  },
  { id: 'mteb-scifact',      description: 'SciFact fact verification.',                     num_queries: 300  },
  { id: 'internal-handbook', description: 'Internal HR handbook gold set.',                 num_queries: 200  },
  { id: 'internal-engwiki',  description: 'Engineering wiki Q&A gold set.',                 num_queries: 350  },
  { id: 'internal-slack',    description: 'Slack channel grounded questions.',              num_queries: 180  },
  { id: 'support-tickets',   description: 'Zendesk support ticket questions.',              num_queries: 500  },
  { id: 'internal-sales',    description: 'Sales rep questions.',                           num_queries: 120  },
  { id: 'internal-legal',    description: 'Legal team questions.',                          num_queries: 90   },
];

router.get('/benchmarks', (_req, res) => res.json(BENCHMARKS));

router.get('/runs', async (req, res) => {
  try {
    const { index_id, model_id, benchmark } = req.query;
    const params = [], where = [];
    if (index_id)  { params.push(+index_id);  where.push(`er.index_id = $${params.length}`); }
    if (model_id)  { params.push(+model_id);  where.push(`er.model_id = $${params.length}`); }
    if (benchmark) { params.push(benchmark);  where.push(`er.benchmark = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const r = await pool.query(`
      SELECT er.*, si.name AS index_name, si.corpus, em.model_id AS model_name, em.provider AS model_provider
      FROM eval_runs er
      LEFT JOIN search_indexes si ON si.id = er.index_id
      LEFT JOIN embedding_models em ON em.id = er.model_id
      ${whereSql}
      ORDER BY er.run_at DESC
    `, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/runs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const run = (await pool.query(`
      SELECT er.*, si.name AS index_name, si.corpus, em.model_id AS model_name, em.provider AS model_provider
      FROM eval_runs er
      LEFT JOIN search_indexes si ON si.id = er.index_id
      LEFT JOIN embedding_models em ON em.id = er.model_id
      WHERE er.id = $1`, [id])).rows[0];
    if (!run) return res.status(404).json({ error: 'Not found' });

    const results = (await pool.query(`
      SELECT id, query, expected_doc_ids, retrieved_doc_ids, hit_rank, reciprocal_rank
      FROM eval_results WHERE run_id = $1 ORDER BY id`, [id])).rows;

    // Derived breakdown
    const hits = results.filter(r => r.hit_rank && r.hit_rank > 0);
    const breakdown = {
      hit_at_1:  results.filter(r => r.hit_rank === 1).length,
      hit_at_3:  results.filter(r => r.hit_rank >= 1 && r.hit_rank <= 3).length,
      hit_at_10: results.filter(r => r.hit_rank >= 1 && r.hit_rank <= 10).length,
      misses:    results.length - hits.length,
      total_with_results: results.length,
    };
    res.json({ ...run, results, breakdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/runs', async (req, res) => {
  try {
    const { name, index_id, model_id, benchmark, num_queries,
            ndcg_at_10, recall_at_10, recall_at_50, mrr,
            latency_p50_ms, latency_p95_ms, notes } = req.body || {};
    if (!benchmark) return res.status(400).json({ error: 'benchmark required' });
    if (index_id != null) {
      const idx = (await pool.query('SELECT id FROM search_indexes WHERE id = $1', [index_id])).rows[0];
      if (!idx) return res.status(400).json({ error: 'index_id not found' });
    }
    if (model_id != null) {
      const m = (await pool.query('SELECT id FROM embedding_models WHERE id = $1', [model_id])).rows[0];
      if (!m) return res.status(400).json({ error: 'model_id not found' });
    }
    const r = await pool.query(`
      INSERT INTO eval_runs (name, index_id, model_id, benchmark, num_queries,
        ndcg_at_10, recall_at_10, recall_at_50, mrr, latency_p50_ms, latency_p95_ms, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name || `${benchmark} run ${new Date().toISOString().slice(0,10)}`,
       index_id || null, model_id || null, benchmark, num_queries || 0,
       ndcg_at_10 || null, recall_at_10 || null, recall_at_50 || null, mrr || null,
       latency_p50_ms || null, latency_p95_ms || null, notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate per-query eval_results rows consistent with run metrics (Bernoulli with hit-at-10 prob ~ recall_at_10).
router.post('/runs/:id/simulate', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const run = (await pool.query('SELECT * FROM eval_runs WHERE id = $1', [id])).rows[0];
    if (!run) return res.status(404).json({ error: 'Not found' });
    const existing = (await pool.query('SELECT COUNT(*)::int AS c FROM eval_results WHERE run_id = $1', [id])).rows[0].c;
    if (existing > 0 && !req.body?.force) {
      return res.status(409).json({ error: `Already has ${existing} results; pass force:true to overwrite` });
    }
    await pool.query('DELETE FROM eval_results WHERE run_id = $1', [id]);

    const n = Math.min(parseInt(req.body?.sample || '50', 10), Math.max(1, run.num_queries || 50));
    const recallAt10 = Number(run.recall_at_10 || 0.7);
    const mrr = Number(run.mrr || 0.5);

    const docIdsRows = (await pool.query('SELECT id FROM documents ORDER BY id')).rows;
    const docIds = docIdsRows.map(r => r.id);
    if (!docIds.length) return res.status(500).json({ error: 'No documents to sample doc ids from' });

    const tmpl = [
      'What is the {} policy?',
      'How do I handle a {} request?',
      'Who owns the {} process?',
      'What approvals are required for {}?',
      'Where is the {} documented?',
    ];
    const topics = ['refund','remote work','incident response','expense','vendor onboarding','deployment','PTO','data retention','API rate limit','SOC2 evidence'];

    const rows = [];
    for (let i = 0; i < n; i++) {
      const hit = Math.random() < recallAt10;
      const rank = hit
        ? (Math.random() < mrr ? 1 : 1 + Math.floor(Math.random() * 9))
        : 0;
      const rr = rank > 0 ? +(1 / rank).toFixed(4) : 0;
      const expected = docIds[Math.floor(Math.random() * docIds.length)];
      const retrieved = [];
      for (let k = 0; k < 5; k++) retrieved.push(docIds[Math.floor(Math.random() * docIds.length)]);
      if (rank > 0 && rank <= retrieved.length) retrieved[rank - 1] = expected;
      const q = tmpl[i % tmpl.length].replace('{}', topics[i % topics.length]);
      rows.push([id, q, String(expected), retrieved.join(','), rank, rr]);
    }
    const placeholders = rows.map((_, i) => `($${i*6+1},$${i*6+2},$${i*6+3},$${i*6+4},$${i*6+5},$${i*6+6})`).join(',');
    const flat = rows.flat();
    await pool.query(
      `INSERT INTO eval_results (run_id, query, expected_doc_ids, retrieved_doc_ids, hit_rank, reciprocal_rank)
       VALUES ${placeholders}`,
      flat
    );
    res.json({ ok: true, generated: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/runs/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM eval_runs WHERE id = $1 RETURNING id', [parseInt(req.params.id, 10)]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const { benchmark } = req.query;
    const params = [], where = [];
    if (benchmark) { params.push(benchmark); where.push(`er.benchmark = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const r = await pool.query(`
      SELECT em.model_id, em.provider, er.benchmark,
             AVG(er.ndcg_at_10)::numeric(5,4) AS avg_ndcg_at_10,
             AVG(er.recall_at_10)::numeric(5,4) AS avg_recall_at_10,
             AVG(er.mrr)::numeric(5,4)          AS avg_mrr,
             AVG(er.latency_p50_ms)::int        AS avg_latency_p50_ms,
             COUNT(er.id)::int                  AS runs
      FROM eval_runs er JOIN embedding_models em ON em.id = er.model_id
      ${whereSql}
      GROUP BY em.model_id, em.provider, er.benchmark
      ORDER BY avg_ndcg_at_10 DESC NULLS LAST
    `, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
