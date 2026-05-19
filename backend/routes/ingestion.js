// Document ingestion pipeline — chunk → embed → index.
//
// Endpoints:
//   GET  /api/ingestion/jobs                       list jobs (filter by status, document_id, connector_id)
//   GET  /api/ingestion/jobs/:id                   detail with chunks
//   POST /api/ingestion/jobs                       enqueue a job for a document
//   POST /api/ingestion/jobs/:id/advance           advance status (simulated state machine)
//   POST /api/ingestion/jobs/:id/cancel            cancel a non-terminal job
//   POST /api/ingestion/jobs/:id/retry             retry a failed job
//   GET  /api/ingestion/stats                      pipeline-wide stats

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

const TERMINAL = new Set(['complete', 'failed', 'cancelled']);
const NEXT = {
  queued:    'chunking',
  chunking:  'embedding',
  embedding: 'indexing',
  indexing:  'complete',
};

router.get('/jobs', async (req, res) => {
  try {
    const { status, document_id, connector_id, limit } = req.query;
    const params = [], where = [];
    if (status)       { params.push(status);       where.push(`ij.status = $${params.length}`); }
    if (document_id)  { params.push(+document_id); where.push(`ij.document_id = $${params.length}`); }
    if (connector_id) { params.push(+connector_id);where.push(`ij.connector_id = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const lim = Math.min(parseInt(limit || '50', 10), 200);
    const r = await pool.query(`
      SELECT ij.*, d.title AS document_title, d.department AS document_department,
             em.model_id AS model_name, em.provider AS model_provider, em.dimension AS model_dimension,
             sc.name AS connector_name, sc.provider AS connector_provider,
             CASE WHEN ij.chunks_total = 0 THEN 0 ELSE ROUND(100.0 * ij.chunks_done / ij.chunks_total, 1) END AS pct_complete
      FROM ingestion_jobs ij
      LEFT JOIN documents d ON d.id = ij.document_id
      LEFT JOIN embedding_models em ON em.id = ij.model_id
      LEFT JOIN source_connectors sc ON sc.id = ij.connector_id
      ${whereSql}
      ORDER BY ij.started_at DESC
      LIMIT ${lim}
    `, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Bad id' });
    const job = (await pool.query(`
      SELECT ij.*, d.title AS document_title, d.word_count, em.model_id AS model_name,
             em.dimension AS model_dimension, em.provider AS model_provider,
             em.cost_per_million_tokens_usd AS model_unit_cost,
             sc.name AS connector_name
      FROM ingestion_jobs ij
      LEFT JOIN documents d ON d.id = ij.document_id
      LEFT JOIN embedding_models em ON em.id = ij.model_id
      LEFT JOIN source_connectors sc ON sc.id = ij.connector_id
      WHERE ij.id = $1
    `, [id])).rows[0];
    if (!job) return res.status(404).json({ error: 'Not found' });

    const chunks = (await pool.query(`
      SELECT id, chunk_index, LEFT(text, 240) AS preview, token_count, embedding_vector_id, section_path
      FROM document_chunks WHERE job_id = $1
      ORDER BY chunk_index ASC LIMIT 50
    `, [id])).rows;

    res.json({ ...job, chunks_sample: chunks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs', async (req, res) => {
  try {
    const { document_id, connector_id, model_id, chunk_strategy } = req.body || {};
    if (!document_id) return res.status(400).json({ error: 'document_id required' });

    const doc = (await pool.query('SELECT id, word_count FROM documents WHERE id = $1', [document_id])).rows[0];
    if (!doc) return res.status(404).json({ error: 'document_id does not exist' });

    let effectiveModel = model_id;
    if (!effectiveModel) {
      const def = (await pool.query('SELECT id FROM embedding_models WHERE is_default = TRUE LIMIT 1')).rows[0];
      if (!def) return res.status(500).json({ error: 'No default embedding model configured' });
      effectiveModel = def.id;
    }

    // Estimate chunks: ~512-token chunks from word_count (rough: 1 word ≈ 1.3 tokens)
    const totalTokens = Math.max(1, Math.round((doc.word_count || 500) * 1.3));
    const chunksEstimate = Math.max(1, Math.ceil(totalTokens / 512));

    const r = await pool.query(`
      INSERT INTO ingestion_jobs (document_id, connector_id, model_id, status,
                                  chunks_total, chunk_strategy)
      VALUES ($1, $2, $3, 'queued', $4, $5) RETURNING *`,
      [document_id, connector_id || null, effectiveModel, chunksEstimate, chunk_strategy || 'recursive_512_50']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs/:id/advance', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const job = (await pool.query('SELECT * FROM ingestion_jobs WHERE id = $1', [id])).rows[0];
    if (!job) return res.status(404).json({ error: 'Not found' });
    if (TERMINAL.has(job.status)) {
      return res.status(409).json({ error: `Job already terminal: ${job.status}` });
    }
    const next = NEXT[job.status];
    if (!next) return res.status(400).json({ error: `No transition from ${job.status}` });

    // Simulated progress: complete some chunks each step
    const remaining = (job.chunks_total || 0) - (job.chunks_done || 0);
    const step = next === 'complete' ? remaining : Math.ceil(remaining / 3);
    const newDone = (job.chunks_done || 0) + step;

    const model = (await pool.query('SELECT cost_per_million_tokens_usd FROM embedding_models WHERE id = $1', [job.model_id])).rows[0];
    const unitCost = Number(model?.cost_per_million_tokens_usd || 0);
    const addedTokens = step * 500; // avg 500 tokens/chunk
    const addedCost = (addedTokens / 1_000_000) * unitCost;

    const r = await pool.query(`
      UPDATE ingestion_jobs
      SET status = $1,
          chunks_done = $2,
          tokens_consumed = tokens_consumed + $3,
          cost_usd = cost_usd + $4,
          finished_at = CASE WHEN $1 = 'complete' THEN NOW() ELSE finished_at END
      WHERE id = $5 RETURNING *`,
      [next, newDone, addedTokens, addedCost, id]
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs/:id/cancel', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const job = (await pool.query('SELECT status FROM ingestion_jobs WHERE id = $1', [id])).rows[0];
    if (!job) return res.status(404).json({ error: 'Not found' });
    if (TERMINAL.has(job.status)) return res.status(409).json({ error: `Already terminal: ${job.status}` });
    const r = await pool.query(`UPDATE ingestion_jobs SET status='cancelled', finished_at=NOW() WHERE id=$1 RETURNING *`, [id]);
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs/:id/retry', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const job = (await pool.query('SELECT * FROM ingestion_jobs WHERE id = $1', [id])).rows[0];
    if (!job) return res.status(404).json({ error: 'Not found' });
    if (job.status !== 'failed') return res.status(409).json({ error: 'Only failed jobs can be retried' });
    const r = await pool.query(`
      UPDATE ingestion_jobs
      SET status='queued', chunks_done=0, tokens_consumed=0, cost_usd=0,
          error=NULL, started_at=NOW(), finished_at=NULL
      WHERE id=$1 RETURNING *`,
      [id]
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const overall = (await pool.query(`
      SELECT
        COUNT(*)::int                                                AS total_jobs,
        SUM(CASE WHEN status='complete' THEN 1 ELSE 0 END)::int     AS complete,
        SUM(CASE WHEN status='failed'   THEN 1 ELSE 0 END)::int     AS failed,
        SUM(CASE WHEN status IN ('queued','chunking','embedding','indexing') THEN 1 ELSE 0 END)::int AS in_flight,
        COALESCE(SUM(chunks_done),0)::int                            AS chunks_done,
        COALESCE(SUM(tokens_consumed),0)::bigint                     AS tokens_consumed,
        COALESCE(SUM(cost_usd),0)::numeric                           AS total_cost_usd
      FROM ingestion_jobs
    `)).rows[0];

    const byModel = (await pool.query(`
      SELECT em.model_id, em.provider, em.dimension,
             COUNT(ij.id)::int AS jobs,
             COALESCE(SUM(ij.tokens_consumed),0)::bigint AS tokens,
             COALESCE(SUM(ij.cost_usd),0)::numeric        AS cost_usd
      FROM ingestion_jobs ij
      JOIN embedding_models em ON em.id = ij.model_id
      GROUP BY em.model_id, em.provider, em.dimension
      ORDER BY tokens DESC
    `)).rows;

    res.json({ overall, by_model: byModel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
