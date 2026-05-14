const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM queries WHERE 1=1';
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND (question ILIKE $${params.length} OR answer ILIKE $${params.length})`; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM queries WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { question, answer, confidence, helpful, sources } = req.body;
    const result = await pool.query(
      'INSERT INTO queries (question, answer, confidence, user_id, helpful, sources) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [question, answer, confidence, req.user.id, helpful, sources]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { question, answer, confidence, helpful, sources } = req.body;
    const result = await pool.query(
      'UPDATE queries SET question=$1, answer=$2, confidence=$3, helpful=$4, sources=$5 WHERE id=$6 RETURNING *',
      [question, answer, confidence, helpful, sources, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM queries WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
