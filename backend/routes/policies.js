const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let query = 'SELECT * FROM policies WHERE 1=1';
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND (name ILIKE $${params.length} OR content ILIKE $${params.length})`; }
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    query += ' ORDER BY effective_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, category, content, effective_date, owner, approved_by, review_date, status } = req.body;
    const result = await pool.query(
      'INSERT INTO policies (name, category, content, effective_date, owner, approved_by, review_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, category, content, effective_date, owner, approved_by, review_date, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, category, content, effective_date, owner, approved_by, review_date, status } = req.body;
    const result = await pool.query(
      'UPDATE policies SET name=$1, category=$2, content=$3, effective_date=$4, owner=$5, approved_by=$6, review_date=$7, status=$8 WHERE id=$9 RETURNING *',
      [name, category, content, effective_date, owner, approved_by, review_date, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM policies WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
