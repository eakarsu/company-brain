const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, department } = req.query;
    let query = 'SELECT * FROM procedures WHERE 1=1';
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND (name ILIKE $${params.length} OR owner ILIKE $${params.length})`; }
    if (department) { params.push(department); query += ` AND department = $${params.length}`; }
    query += ' ORDER BY usage_count DESC, last_updated DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE procedures SET usage_count = usage_count + 1 WHERE id = $1', [req.params.id]);
    const result = await pool.query('SELECT * FROM procedures WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, department, steps_json, version, owner, last_updated, status } = req.body;
    const result = await pool.query(
      'INSERT INTO procedures (name, department, steps_json, version, owner, last_updated, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, department, steps_json, version, owner, last_updated, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, department, steps_json, version, owner, last_updated, status } = req.body;
    const result = await pool.query(
      'UPDATE procedures SET name=$1, department=$2, steps_json=$3, version=$4, owner=$5, last_updated=$6, status=$7 WHERE id=$8 RETURNING *',
      [name, department, steps_json, version, owner, last_updated, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM procedures WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
