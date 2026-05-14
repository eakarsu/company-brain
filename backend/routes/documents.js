const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, department, doc_type } = req.query;
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`; }
    if (department) { params.push(department); query += ` AND department = $${params.length}`; }
    if (doc_type) { params.push(doc_type); query += ` AND doc_type = $${params.length}`; }
    query += ' ORDER BY last_updated DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, source_url, content, department, doc_type, status, last_updated, word_count, indexed } = req.body;
    const result = await pool.query(
      'INSERT INTO documents (title, source_url, content, department, doc_type, status, last_updated, word_count, indexed) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title, source_url, content, department, doc_type, status, last_updated, word_count, indexed]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, source_url, content, department, doc_type, status, last_updated, word_count, indexed } = req.body;
    const result = await pool.query(
      'UPDATE documents SET title=$1, source_url=$2, content=$3, department=$4, doc_type=$5, status=$6, last_updated=$7, word_count=$8, indexed=$9 WHERE id=$10 RETURNING *',
      [title, source_url, content, department, doc_type, status, last_updated, word_count, indexed, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
