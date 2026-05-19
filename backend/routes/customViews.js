const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// In-memory store for access rules (CRUD)
let accessRules = [
  { id: 1, name: 'Engineering Wiki Read', resource: 'engineering-wiki', principal: 'team:engineering', action: 'read', enabled: true, createdAt: '2026-04-01' },
  { id: 2, name: 'HR Policy Write',      resource: 'hr-policies',      principal: 'role:hr-admin',    action: 'write', enabled: true, createdAt: '2026-04-05' },
  { id: 3, name: 'Finance Confidential', resource: 'finance-docs',     principal: 'role:cfo',         action: 'read', enabled: true, createdAt: '2026-04-12' },
  { id: 4, name: 'Sales Playbook',       resource: 'sales-playbook',   principal: 'team:sales',       action: 'read', enabled: false, createdAt: '2026-04-20' },
];
let nextRuleId = 5;

// VIZ 1: Knowledge access chart (7-day series across resource categories)
router.get('/access-chart', verifyToken, (req, res) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const categories = ['Docs', 'Procedures', 'Policies', 'Decisions', 'Queries'];
  const series = categories.map((cat, i) => ({
    name: cat,
    data: days.map((_, d) => Math.round(40 + Math.sin(d + i) * 25 + (i * 7) + Math.random() * 15)),
  }));
  const totals = series.map(s => ({ name: s.name, total: s.data.reduce((a, b) => a + b, 0) }));
  res.json({ days, series, totals, generatedAt: new Date().toISOString() });
});

// VIZ 2: Topic coverage heatmap (departments x knowledge domains)
router.get('/topic-heatmap', verifyToken, (req, res) => {
  const departments = ['Engineering', 'Sales', 'HR', 'Finance', 'Marketing', 'Ops'];
  const topics = ['Onboarding', 'Security', 'Compliance', 'Product', 'Process', 'Tools'];
  const matrix = departments.map((dep, di) =>
    topics.map((_, ti) => Math.round(20 + Math.abs(Math.sin(di * 1.3 + ti * 0.7)) * 80))
  );
  const coverageAvg = Math.round(matrix.flat().reduce((a, b) => a + b, 0) / (departments.length * topics.length));
  res.json({ departments, topics, matrix, coverageAvg, gapCount: matrix.flat().filter(v => v < 35).length });
});

// NON-VIZ 1: Knowledge digest PDF (generate downloadable text "PDF")
router.get('/digest-pdf', verifyToken, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const body = [
    `%PDF-1.4 CompanyBrain Knowledge Digest`,
    ``,
    `=== CompanyBrain Knowledge Digest (${today}) ===`,
    ``,
    `Top 5 most-referenced articles this week:`,
    `  1. Engineering onboarding checklist (212 views)`,
    `  2. Q2 Sales playbook v3 (188 views)`,
    `  3. Incident response runbook (151 views)`,
    `  4. HR PTO policy 2026 (134 views)`,
    `  5. Vendor security review SOP (118 views)`,
    ``,
    `Knowledge Health:`,
    `  - Total articles indexed: 1,284`,
    `  - Stale (>180d): 97`,
    `  - Pending review: 41`,
    `  - Access rules active: ${accessRules.filter(r => r.enabled).length}`,
    ``,
    `Recommended actions:`,
    `  - Refresh Finance compliance section`,
    `  - Tag 12 untagged engineering docs`,
    `  - Re-run embedding on updated HR set`,
    ``,
    `Generated for tenant: default`,
    `--- End of digest ---`,
  ].join('\n');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="company-brain-digest-${today}.pdf"`);
  res.send(Buffer.from(body, 'utf8'));
});

// NON-VIZ 2: Access rules editor (CRUD via single endpoint, supports list+mutate)
router.all('/access-rules', verifyToken, (req, res) => {
  if (req.method === 'GET') {
    return res.json({ rules: accessRules, count: accessRules.length });
  }
  if (req.method === 'POST') {
    const { name, resource, principal, action, enabled } = req.body || {};
    if (!name || !resource || !principal || !action) {
      return res.status(400).json({ error: 'name, resource, principal, action required' });
    }
    const rule = {
      id: nextRuleId++, name, resource, principal, action,
      enabled: enabled !== false,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    accessRules.push(rule);
    return res.status(201).json(rule);
  }
  if (req.method === 'PUT') {
    const { id, ...patch } = req.body || {};
    const idx = accessRules.findIndex(r => r.id === Number(id));
    if (idx < 0) return res.status(404).json({ error: 'rule not found' });
    accessRules[idx] = { ...accessRules[idx], ...patch };
    return res.json(accessRules[idx]);
  }
  if (req.method === 'DELETE') {
    const id = Number(req.body?.id ?? req.query?.id);
    const before = accessRules.length;
    accessRules = accessRules.filter(r => r.id !== id);
    return res.json({ deleted: before - accessRules.length, remaining: accessRules.length });
  }
  res.status(405).json({ error: 'method not allowed' });
});

module.exports = router;
