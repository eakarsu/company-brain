const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM knowledge_entries WHERE 1=1';
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length} OR tags ILIKE $${params.length})`; }
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += ' ORDER BY views DESC, created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE knowledge_entries SET views = views + 1 WHERE id = $1', [req.params.id]);
    const result = await pool.query('SELECT * FROM knowledge_entries WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, category, content, source_type, author, department, tags } = req.body;
    const result = await pool.query(
      'INSERT INTO knowledge_entries (title, category, content, source_type, author, department, tags) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, category, content, source_type, author, department, tags]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, category, content, source_type, author, department, tags } = req.body;
    const result = await pool.query(
      'UPDATE knowledge_entries SET title=$1, category=$2, content=$3, source_type=$4, author=$5, department=$6, tags=$7 WHERE id=$8 RETURNING *',
      [title, category, content, source_type, author, department, tags, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM knowledge_entries WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
