const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, action, resource, limit } = req.query;
    const lim = Math.max(1, Math.min(parseInt(limit, 10) || 100, 500));
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    if (search) { params.push(`%${search}%`); sql += ` AND (user_email ILIKE $${params.length} OR details ILIKE $${params.length} OR resource_id ILIKE $${params.length})`; }
    if (action) { params.push(action); sql += ` AND action = $${params.length}`; }
    if (resource) { params.push(resource); sql += ` AND resource = $${params.length}`; }
    sql += ` ORDER BY created_at DESC LIMIT ${lim}`;
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { action, resource, resource_id, details } = req.body;
    if (!action) return res.status(400).json({ error: 'action is required' });
    const result = await pool.query(
      'INSERT INTO audit_log (user_id, user_email, action, resource, resource_id, details) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.id, req.user.email, action, resource || null, resource_id || null, details || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM audit_log WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
