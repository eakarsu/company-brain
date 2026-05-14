const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const RESOURCES = {
  knowledge: { table: 'knowledge_entries', columns: ['id','title','category','content','source_type','author','department','tags','views','helpful_votes','created_at'] },
  documents: { table: 'documents', columns: ['id','title','source_url','content','department','doc_type','status','last_updated','word_count','indexed'] },
  queries: { table: 'queries', columns: ['id','question','answer','confidence','user_id','helpful','sources','created_at'] },
  procedures: { table: 'procedures', columns: ['id','name','department','steps_json','version','owner','last_updated','status','usage_count'] },
  policies: { table: 'policies', columns: ['id','name','category','content','effective_date','owner','approved_by','review_date','status'] },
  decisions: { table: 'decisions', columns: ['id','title','context','decision_made','rationale','made_by','decision_date','impact_level','tags','reversible'] },
  audit: { table: 'audit_log', columns: ['id','user_id','user_email','action','resource','resource_id','details','created_at'] },
};

function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const s = typeof val === 'string' ? val : (val instanceof Date ? val.toISOString() : String(val));
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

router.get('/:resource', verifyToken, async (req, res) => {
  try {
    const cfg = RESOURCES[req.params.resource];
    if (!cfg) return res.status(400).json({ error: 'Unknown resource. Valid: ' + Object.keys(RESOURCES).join(', ') });
    const result = await pool.query(`SELECT ${cfg.columns.join(', ')} FROM ${cfg.table} ORDER BY id ASC`);
    const header = cfg.columns.join(',');
    const rows = result.rows.map(r => cfg.columns.map(c => csvEscape(r[c])).join(','));
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.resource}-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', verifyToken, (req, res) => {
  res.json({ resources: Object.keys(RESOURCES) });
});

module.exports = router;
