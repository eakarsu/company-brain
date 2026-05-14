const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, impact_level } = req.query;
    let query = 'SELECT * FROM decisions WHERE 1=1';
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND (title ILIKE $${params.length} OR context ILIKE $${params.length} OR tags ILIKE $${params.length})`; }
    if (impact_level) { params.push(impact_level); query += ` AND impact_level = $${params.length}`; }
    query += ' ORDER BY decision_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM decisions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, context, decision_made, rationale, made_by, decision_date, impact_level, tags, reversible } = req.body;
    const result = await pool.query(
      'INSERT INTO decisions (title, context, decision_made, rationale, made_by, decision_date, impact_level, tags, reversible) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title, context, decision_made, rationale, made_by, decision_date, impact_level, tags, reversible]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, context, decision_made, rationale, made_by, decision_date, impact_level, tags, reversible } = req.body;
    const result = await pool.query(
      'UPDATE decisions SET title=$1, context=$2, decision_made=$3, rationale=$4, made_by=$5, decision_date=$6, impact_level=$7, tags=$8, reversible=$9 WHERE id=$10 RETURNING *',
      [title, context, decision_made, rationale, made_by, decision_date, impact_level, tags, reversible, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM decisions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
