// Hybrid search indexes — BM25 + dense + reranker configurations per corpus.
//
// Endpoints:
//   GET    /api/search-indexes                       list (with computed flavor)
//   GET    /api/search-indexes/rerankers             catalog of supported rerankers
//   GET    /api/search-indexes/:id                   detail
//   POST   /api/search-indexes                       create
//   PATCH  /api/search-indexes/:id                   update alpha / top_k / reranker / status
//   POST   /api/search-indexes/:id/rebuild           rebuild (sets status=building, then ready)
//   POST   /api/search-indexes/:id/query             execute a hybrid query against documents/chunks
//   DELETE /api/search-indexes/:id

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

const RERANKERS = [
  { id: 'cohere-rerank-3',    provider: 'cohere', max_docs: 1000, cost_per_search: 0.002 },
  { id: 'cohere-rerank-3.5',  provider: 'cohere', max_docs: 1000, cost_per_search: 0.0035 },
  { id: 'bge-reranker-v2-m3', provider: 'baai',   max_docs: 500,  cost_per_search: 0.0 },
  { id: 'jina-reranker-v2',   provider: 'jina',   max_docs: 1000, cost_per_search: 0.0008 },
  { id: 'voyage-rerank-2',    provider: 'voyage', max_docs: 1000, cost_per_search: 0.0035 },
  { id: 'none',               provider: 'n/a',    max_docs: 0,    cost_per_search: 0.0 },
];

router.get('/rerankers', (_req, res) => res.json(RERANKERS));

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT si.*, em.model_id AS model_name, em.provider AS model_provider, em.dimension AS model_dimension,
        CASE
          WHEN si.bm25_enabled AND si.dense_enabled AND si.reranker IS NOT NULL AND si.reranker <> 'none'
            THEN 'hybrid+rerank'
          WHEN si.bm25_enabled AND si.dense_enabled THEN 'hybrid'
          WHEN si.dense_enabled THEN 'dense'
          ELSE 'bm25'
        END AS flavor
      FROM search_indexes si
      LEFT JOIN embedding_models em ON em.id = si.model_id
      ORDER BY si.id
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const idx = (await pool.query(`
      SELECT si.*, em.model_id AS model_name, em.provider AS model_provider,
             em.dimension AS model_dimension, em.retrieval_avg AS model_retrieval_avg
      FROM search_indexes si LEFT JOIN embedding_models em ON em.id = si.model_id
      WHERE si.id = $1`, [id])).rows[0];
    if (!idx) return res.status(404).json({ error: 'Not found' });
    const recent = (await pool.query(`
      SELECT id, benchmark, ndcg_at_10, recall_at_10, recall_at_50, mrr,
             latency_p50_ms, latency_p95_ms, run_at
      FROM eval_runs WHERE index_id = $1 ORDER BY run_at DESC LIMIT 10`, [id])).rows;
    res.json({ ...idx, recent_eval_runs: recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, corpus, model_id, bm25_enabled, dense_enabled, reranker,
            hybrid_alpha, top_k, rerank_top_n } = req.body || {};
    if (!name || !corpus) return res.status(400).json({ error: 'name and corpus required' });
    if (hybrid_alpha != null && (hybrid_alpha < 0 || hybrid_alpha > 1)) {
      return res.status(400).json({ error: 'hybrid_alpha must be in [0,1]' });
    }
    if (reranker && !RERANKERS.find(r => r.id === reranker)) {
      return res.status(400).json({ error: `Unknown reranker: ${reranker}` });
    }
    const r = await pool.query(`
      INSERT INTO search_indexes (name, corpus, model_id, bm25_enabled, dense_enabled,
        reranker, hybrid_alpha, top_k, rerank_top_n, status, last_built_at)
      VALUES ($1,$2,$3, COALESCE($4,TRUE), COALESCE($5,TRUE), COALESCE($6,'cohere-rerank-3'),
        COALESCE($7,0.5), COALESCE($8,50), COALESCE($9,10), 'ready', NOW())
      RETURNING *`,
      [name, corpus, model_id || null, bm25_enabled, dense_enabled, reranker,
       hybrid_alpha, top_k, rerank_top_n]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const allowed = ['hybrid_alpha','top_k','rerank_top_n','reranker','bm25_enabled','dense_enabled','status','model_id'];
    const sets = [], params = [];
    for (const k of allowed) {
      if (k in (req.body || {})) { params.push(req.body[k]); sets.push(`${k} = $${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No allowed fields' });
    params.push(id);
    const r = await pool.query(
      `UPDATE search_indexes SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/rebuild', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const idx = (await pool.query('SELECT id FROM search_indexes WHERE id = $1', [id])).rows[0];
    if (!idx) return res.status(404).json({ error: 'Not found' });
    // Count chunks across all docs (no per-index linkage in schema; approximate full corpus build)
    const cnt = (await pool.query('SELECT COUNT(*)::int AS c FROM document_chunks')).rows[0].c;
    const r = await pool.query(`
      UPDATE search_indexes SET status='ready', last_built_at=NOW(), total_chunks=$1 WHERE id=$2 RETURNING *`,
      [cnt, id]);
    res.json({ ok: true, index: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Execute a hybrid search query: BM25 via ILIKE token-match + simulated dense + reranker shuffle.
router.post('/:id/query', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { q, top_k_override } = req.body || {};
    if (!q || typeof q !== 'string' || !q.trim()) return res.status(400).json({ error: 'q required' });
    const idx = (await pool.query('SELECT * FROM search_indexes WHERE id = $1', [id])).rows[0];
    if (!idx) return res.status(404).json({ error: 'Not found' });
    if (idx.status !== 'ready') return res.status(409).json({ error: `Index not ready: ${idx.status}` });

    const k = Math.min(parseInt(top_k_override || idx.top_k, 10) || 50, 200);
    const start = Date.now();

    // BM25 leg — ILIKE over chunks; score by occurrence count of each query token.
    const tokens = q.toLowerCase().split(/\s+/).filter(t => t.length > 2).slice(0, 8);
    if (!tokens.length) return res.json({ index_id: id, query: q, results: [], note: 'No usable query tokens (min length 3)' });

    const bm25Sql = `
      SELECT dc.id AS chunk_id, dc.document_id, dc.chunk_index, dc.section_path,
             LEFT(dc.text, 240) AS preview, d.title AS document_title, d.department,
             (${tokens.map((_,i) => `(LENGTH(LOWER(dc.text)) - LENGTH(REPLACE(LOWER(dc.text), $${i+1}, ''))) / GREATEST(LENGTH($${i+1}),1)`).join(' + ')}) AS bm25_hits
      FROM document_chunks dc JOIN documents d ON d.id = dc.document_id
      WHERE ${tokens.map((_,i)=>`LOWER(dc.text) LIKE '%' || $${i+1} || '%'`).join(' OR ')}
      ORDER BY bm25_hits DESC LIMIT ${k}`;
    const bm25 = (await pool.query(bm25Sql, tokens)).rows;

    // Dense leg — simulated cosine similarity = function of length match + token overlap noise.
    const dense = bm25.map(row => {
      const overlap = tokens.reduce((s,t) => s + (row.preview.toLowerCase().includes(t) ? 1 : 0), 0);
      const sim = 0.55 + 0.05 * overlap + (row.bm25_hits ? 0.02 : 0) - 0.02 * Math.random();
      return { ...row, dense_score: +Math.min(0.99, sim).toFixed(4) };
    });

    // Hybrid combine
    const alpha = Number(idx.hybrid_alpha);
    const maxBm = Math.max(1, ...dense.map(r => Number(r.bm25_hits) || 0));
    const fused = dense.map(r => {
      const bm = (Number(r.bm25_hits) || 0) / maxBm;
      const den = Number(r.dense_score);
      const score = idx.bm25_enabled && idx.dense_enabled
        ? alpha * den + (1 - alpha) * bm
        : idx.dense_enabled ? den : bm;
      return { ...r, fused_score: +score.toFixed(4) };
    }).sort((a, b) => b.fused_score - a.fused_score);

    // Reranker — simple boost: items mentioning all tokens win.
    let reranked = fused.slice(0, idx.rerank_top_n);
    if (idx.reranker && idx.reranker !== 'none') {
      reranked = reranked.map(r => {
        const all = tokens.every(t => r.preview.toLowerCase().includes(t));
        return { ...r, rerank_score: +(r.fused_score + (all ? 0.10 : 0)).toFixed(4) };
      }).sort((a, b) => b.rerank_score - a.rerank_score);
    }
    const latency_ms = Date.now() - start;

    res.json({
      index_id: id,
      query: q,
      flavor: idx.bm25_enabled && idx.dense_enabled
        ? (idx.reranker && idx.reranker !== 'none' ? 'hybrid+rerank' : 'hybrid')
        : (idx.dense_enabled ? 'dense' : 'bm25'),
      hybrid_alpha: alpha,
      reranker: idx.reranker,
      latency_ms,
      result_count: reranked.length,
      results: reranked,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM search_indexes WHERE id = $1 RETURNING id', [parseInt(req.params.id, 10)]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
