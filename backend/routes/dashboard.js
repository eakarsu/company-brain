const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/dashboard/stats — KPI counts + recent activity
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const counts = {};

    const tables = [
      ['knowledge_entries', 'knowledge'],
      ['documents',         'documents'],
      ['queries',           'queries'],
      ['procedures',        'procedures'],
      ['policies',          'policies'],
      ['decisions',         'decisions'],
    ];

    for (const [table, key] of tables) {
      const r = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
      counts[key] = r.rows[0].c;
    }

    // Recent activity from audit_log (latest 10)
    const recentResult = await pool.query(
      'SELECT id, user_email, action, resource, resource_id, details, created_at FROM audit_log ORDER BY created_at DESC LIMIT 10'
    );

    // Quick health snapshot
    const indexedDocs = await pool.query(
      'SELECT COUNT(*)::int AS c FROM documents WHERE indexed = TRUE'
    );
    const helpfulQueries = await pool.query(
      'SELECT COUNT(*)::int AS c FROM queries WHERE helpful = TRUE'
    );
    const activePolicies = await pool.query(
      "SELECT COUNT(*)::int AS c FROM policies WHERE status = 'active'"
    );

    res.json({
      counts,
      meta: {
        indexed_documents: indexedDocs.rows[0].c,
        helpful_queries: helpfulQueries.rows[0].c,
        active_policies: activePolicies.rows[0].c,
      },
      recent_activity: recentResult.rows,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
