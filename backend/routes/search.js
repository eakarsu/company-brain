const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// Cross-corpus search & filter across knowledge, documents, queries, procedures, policies, decisions
router.get('/', verifyToken, async (req, res) => {
  try {
    const { q, scope, department, category, limit } = req.query;
    const lim = Math.max(1, Math.min(parseInt(limit, 10) || 50, 200));
    const term = q ? `%${q}%` : null;
    const wantedScopes = scope
      ? String(scope).split(',').map(s => s.trim()).filter(Boolean)
      : ['knowledge', 'documents', 'queries', 'procedures', 'policies', 'decisions'];

    const out = { query: q || '', scopes: wantedScopes, total: 0, results: [] };
    const push = (kind, id, title, snippet, meta) =>
      out.results.push({ kind, id, title, snippet: (snippet || '').slice(0, 240), meta: meta || {} });

    if (wantedScopes.includes('knowledge')) {
      let sql = 'SELECT id, title, content, category, department FROM knowledge_entries WHERE 1=1';
      const params = [];
      if (term) { params.push(term); sql += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length} OR tags ILIKE $${params.length})`; }
      if (category) { params.push(category); sql += ` AND category = $${params.length}`; }
      if (department) { params.push(department); sql += ` AND department = $${params.length}`; }
      sql += ` ORDER BY created_at DESC LIMIT ${lim}`;
      const r = await pool.query(sql, params);
      r.rows.forEach(row => push('knowledge', row.id, row.title, row.content, { category: row.category, department: row.department }));
    }

    if (wantedScopes.includes('documents')) {
      let sql = 'SELECT id, title, content, doc_type, department, status FROM documents WHERE 1=1';
      const params = [];
      if (term) { params.push(term); sql += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`; }
      if (department) { params.push(department); sql += ` AND department = $${params.length}`; }
      sql += ` ORDER BY last_updated DESC NULLS LAST LIMIT ${lim}`;
      const r = await pool.query(sql, params);
      r.rows.forEach(row => push('documents', row.id, row.title, row.content, { doc_type: row.doc_type, department: row.department, status: row.status }));
    }

    if (wantedScopes.includes('queries')) {
      let sql = 'SELECT id, question, answer FROM queries WHERE 1=1';
      const params = [];
      if (term) { params.push(term); sql += ` AND (question ILIKE $${params.length} OR answer ILIKE $${params.length})`; }
      sql += ` ORDER BY created_at DESC LIMIT ${lim}`;
      const r = await pool.query(sql, params);
      r.rows.forEach(row => push('queries', row.id, row.question, row.answer, {}));
    }

    if (wantedScopes.includes('procedures')) {
      let sql = 'SELECT id, name, steps_json, department, status FROM procedures WHERE 1=1';
      const params = [];
      if (term) { params.push(term); sql += ` AND (name ILIKE $${params.length} OR steps_json ILIKE $${params.length})`; }
      if (department) { params.push(department); sql += ` AND department = $${params.length}`; }
      sql += ` ORDER BY last_updated DESC NULLS LAST LIMIT ${lim}`;
      const r = await pool.query(sql, params);
      r.rows.forEach(row => push('procedures', row.id, row.name, row.steps_json, { department: row.department, status: row.status }));
    }

    if (wantedScopes.includes('policies')) {
      let sql = 'SELECT id, name, content, category, status FROM policies WHERE 1=1';
      const params = [];
      if (term) { params.push(term); sql += ` AND (name ILIKE $${params.length} OR content ILIKE $${params.length})`; }
      if (category) { params.push(category); sql += ` AND category = $${params.length}`; }
      sql += ` ORDER BY effective_date DESC NULLS LAST LIMIT ${lim}`;
      const r = await pool.query(sql, params);
      r.rows.forEach(row => push('policies', row.id, row.name, row.content, { category: row.category, status: row.status }));
    }

    if (wantedScopes.includes('decisions')) {
      let sql = 'SELECT id, title, context, decision_made, impact_level FROM decisions WHERE 1=1';
      const params = [];
      if (term) { params.push(term); sql += ` AND (title ILIKE $${params.length} OR context ILIKE $${params.length} OR decision_made ILIKE $${params.length} OR rationale ILIKE $${params.length})`; }
      sql += ` ORDER BY decision_date DESC NULLS LAST LIMIT ${lim}`;
      const r = await pool.query(sql, params);
      r.rows.forEach(row => push('decisions', row.id, row.title, row.decision_made || row.context, { impact_level: row.impact_level }));
    }

    out.total = out.results.length;
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
