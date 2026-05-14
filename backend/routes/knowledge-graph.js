// Knowledge graph — entities + relations extracted from the corpus.
//
// Endpoints:
//   GET    /api/knowledge-graph/entities                 list (filter by type, search)
//   GET    /api/knowledge-graph/entities/:id             detail + neighborhood
//   POST   /api/knowledge-graph/entities                 create
//   PATCH  /api/knowledge-graph/entities/:id             update
//   DELETE /api/knowledge-graph/entities/:id
//   GET    /api/knowledge-graph/relations                list relations (filter)
//   POST   /api/knowledge-graph/relations                create
//   DELETE /api/knowledge-graph/relations/:id
//   GET    /api/knowledge-graph/graph                    cytoscape-ish nodes+edges payload
//   GET    /api/knowledge-graph/stats                    summary counts by type / relation
//   POST   /api/knowledge-graph/extract                  heuristic extractor over a document

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

const ENTITY_TYPES = ['person','team','role','system','vendor','project','concept','policy_ref','decision_ref'];
const RELATIONS = ['owns','reports_to','uses','replaces','depends_on','approves','deprecates','similar_to','used_by','enables'];

router.get('/entities', async (req, res) => {
  try {
    const { type, search, limit } = req.query;
    const params = [], where = [];
    if (type)   { params.push(type);            where.push(`type = $${params.length}`); }
    if (search) { params.push(`%${search}%`);   where.push(`(name ILIKE $${params.length} OR aliases ILIKE $${params.length})`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const lim = Math.min(parseInt(limit || '200', 10), 1000);
    const r = await pool.query(`
      SELECT id, name, type, aliases, confidence, occurrences, first_seen_doc_id
      FROM kg_entities ${whereSql}
      ORDER BY occurrences DESC, name ASC LIMIT ${lim}
    `, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/entities/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ent = (await pool.query('SELECT * FROM kg_entities WHERE id = $1', [id])).rows[0];
    if (!ent) return res.status(404).json({ error: 'Not found' });

    const out = (await pool.query(`
      SELECT r.id, r.relation, r.confidence, r.evidence_snippet, r.evidence_doc_id,
             e2.id AS other_id, e2.name AS other_name, e2.type AS other_type
      FROM kg_relations r JOIN kg_entities e2 ON e2.id = r.dst_entity_id
      WHERE r.src_entity_id = $1 ORDER BY r.confidence DESC`, [id])).rows;

    const incoming = (await pool.query(`
      SELECT r.id, r.relation, r.confidence, r.evidence_snippet, r.evidence_doc_id,
             e1.id AS other_id, e1.name AS other_name, e1.type AS other_type
      FROM kg_relations r JOIN kg_entities e1 ON e1.id = r.src_entity_id
      WHERE r.dst_entity_id = $1 ORDER BY r.confidence DESC`, [id])).rows;

    res.json({ ...ent, outgoing: out, incoming });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/entities', async (req, res) => {
  try {
    const { name, type, aliases, confidence, first_seen_doc_id } = req.body || {};
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    if (!ENTITY_TYPES.includes(type)) return res.status(400).json({ error: `type must be one of ${ENTITY_TYPES.join(',')}` });
    const r = await pool.query(`
      INSERT INTO kg_entities (name, type, aliases, confidence, occurrences, first_seen_doc_id)
      VALUES ($1,$2,$3, COALESCE($4, 0.9), 1, $5) RETURNING *`,
      [name, type, aliases || null, confidence, first_seen_doc_id || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/entities/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const allowed = ['name','type','aliases','confidence','occurrences'];
    const sets = [], params = [];
    for (const k of allowed) {
      if (k in (req.body || {})) { params.push(req.body[k]); sets.push(`${k} = $${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No allowed fields' });
    params.push(id);
    const r = await pool.query(`UPDATE kg_entities SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/entities/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM kg_entities WHERE id = $1 RETURNING id', [parseInt(req.params.id, 10)]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/relations', async (req, res) => {
  try {
    const { relation, src_id, dst_id, limit } = req.query;
    const params = [], where = [];
    if (relation) { params.push(relation);    where.push(`r.relation = $${params.length}`); }
    if (src_id)   { params.push(+src_id);     where.push(`r.src_entity_id = $${params.length}`); }
    if (dst_id)   { params.push(+dst_id);     where.push(`r.dst_entity_id = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const lim = Math.min(parseInt(limit || '300', 10), 1000);
    const r = await pool.query(`
      SELECT r.*, s.name AS src_name, s.type AS src_type, d.name AS dst_name, d.type AS dst_type
      FROM kg_relations r
      JOIN kg_entities s ON s.id = r.src_entity_id
      JOIN kg_entities d ON d.id = r.dst_entity_id
      ${whereSql}
      ORDER BY r.confidence DESC LIMIT ${lim}
    `, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/relations', async (req, res) => {
  try {
    const { src_entity_id, dst_entity_id, relation, confidence, evidence_doc_id, evidence_snippet } = req.body || {};
    if (!src_entity_id || !dst_entity_id || !relation) {
      return res.status(400).json({ error: 'src_entity_id, dst_entity_id, relation required' });
    }
    if (!RELATIONS.includes(relation)) return res.status(400).json({ error: `relation must be one of ${RELATIONS.join(',')}` });
    if (src_entity_id === dst_entity_id) return res.status(400).json({ error: 'src and dst must differ' });
    const r = await pool.query(`
      INSERT INTO kg_relations (src_entity_id, dst_entity_id, relation, confidence, evidence_doc_id, evidence_snippet)
      VALUES ($1,$2,$3, COALESCE($4, 0.9), $5, $6) RETURNING *`,
      [src_entity_id, dst_entity_id, relation, confidence, evidence_doc_id || null, evidence_snippet || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/relations/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM kg_relations WHERE id = $1 RETURNING id', [parseInt(req.params.id, 10)]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/graph', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '60', 10), 300);
    const ents = (await pool.query(`
      SELECT id, name, type, occurrences FROM kg_entities ORDER BY occurrences DESC LIMIT $1`, [limit])).rows;
    const ids = ents.map(e => e.id);
    const rels = ids.length ? (await pool.query(
      `SELECT id, src_entity_id, dst_entity_id, relation, confidence
       FROM kg_relations WHERE src_entity_id = ANY($1::int[]) AND dst_entity_id = ANY($1::int[])`,
      [ids])).rows : [];
    res.json({
      nodes: ents.map(e => ({ id: e.id, label: e.name, type: e.type, weight: e.occurrences })),
      edges: rels.map(r => ({ id: r.id, source: r.src_entity_id, target: r.dst_entity_id,
                              label: r.relation, confidence: Number(r.confidence) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const byType  = (await pool.query(`SELECT type, COUNT(*)::int AS c FROM kg_entities GROUP BY type ORDER BY c DESC`)).rows;
    const byRel   = (await pool.query(`SELECT relation, COUNT(*)::int AS c FROM kg_relations GROUP BY relation ORDER BY c DESC`)).rows;
    const totals  = (await pool.query(`SELECT
        (SELECT COUNT(*) FROM kg_entities)::int AS entities,
        (SELECT COUNT(*) FROM kg_relations)::int AS relations,
        (SELECT AVG(confidence)::numeric(4,3) FROM kg_relations) AS avg_relation_confidence
    `)).rows[0];
    res.json({ totals, entities_by_type: byType, relations_by_kind: byRel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Heuristic extractor — finds known entity names inside a document body and proposes occurrences.
router.post('/extract', async (req, res) => {
  try {
    const { document_id } = req.body || {};
    if (!document_id) return res.status(400).json({ error: 'document_id required' });
    const doc = (await pool.query('SELECT id, title, content FROM documents WHERE id = $1', [document_id])).rows[0];
    if (!doc) return res.status(404).json({ error: 'document_id not found' });

    const all = (await pool.query('SELECT id, name, aliases, type FROM kg_entities')).rows;
    const text = `${doc.title}\n${doc.content || ''}`.toLowerCase();
    const found = [];
    for (const e of all) {
      const aliases = [e.name, ...((e.aliases || '').split(',').map(a => a.trim()).filter(Boolean))];
      let hits = 0;
      for (const a of aliases) {
        if (!a || a.length < 3) continue;
        const re = new RegExp(`\\b${a.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        const m = text.match(re);
        if (m) hits += m.length;
      }
      if (hits > 0) found.push({ entity_id: e.id, name: e.name, type: e.type, hits });
    }
    found.sort((a, b) => b.hits - a.hits);
    res.json({ document_id: doc.id, document_title: doc.title, matches: found });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
