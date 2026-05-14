// Tenants + ACL — multi-tenant isolation and per-connector access control rules.
//
// Endpoints:
//   GET    /api/tenants-acl/tenants                   list tenants
//   POST   /api/tenants-acl/tenants                   create tenant
//   PATCH  /api/tenants-acl/tenants/:id               update plan / region / quota
//   DELETE /api/tenants-acl/tenants/:id
//   GET    /api/tenants-acl/rules                     list rules (filter by tenant_id, connector_id)
//   POST   /api/tenants-acl/rules                     create rule
//   PATCH  /api/tenants-acl/rules/:id                 update permission / resource_filter
//   DELETE /api/tenants-acl/rules/:id
//   POST   /api/tenants-acl/check                     evaluate access for principal+connector+permission

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

const PERMISSIONS = ['none','read','write','admin'];
const PERM_RANK = { none: 0, read: 1, write: 2, admin: 3 };
const PRINCIPAL_TYPES = ['email','group','role'];

router.get('/tenants', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT t.*,
        (SELECT COUNT(*)::int FROM acl_rules a WHERE a.tenant_id = t.id) AS rules
      FROM tenants t ORDER BY t.id`);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tenants', async (req, res) => {
  try {
    const { slug, name, plan, region, daily_query_quota } = req.body || {};
    if (!slug) return res.status(400).json({ error: 'slug required' });
    if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: 'slug must be lowercase letters/digits/dashes' });
    const r = await pool.query(`
      INSERT INTO tenants (slug, name, plan, region, daily_query_quota)
      VALUES ($1,$2, COALESCE($3,'team'), COALESCE($4,'us-east-1'), COALESCE($5,10000)) RETURNING *`,
      [slug, name || slug, plan, region, daily_query_quota]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (String(err.message).includes('unique')) return res.status(409).json({ error: 'slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/tenants/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const allowed = ['name','plan','region','daily_query_quota'];
    const sets = [], params = [];
    for (const k of allowed) {
      if (k in (req.body || {})) { params.push(req.body[k]); sets.push(`${k} = $${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No allowed fields' });
    params.push(id);
    const r = await pool.query(`UPDATE tenants SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tenants/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM tenants WHERE id = $1 RETURNING id', [parseInt(req.params.id, 10)]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rules', async (req, res) => {
  try {
    const { tenant_id, connector_id, principal } = req.query;
    const params = [], where = [];
    if (tenant_id)    { params.push(+tenant_id);   where.push(`a.tenant_id = $${params.length}`); }
    if (connector_id) { params.push(+connector_id);where.push(`a.connector_id = $${params.length}`); }
    if (principal)    { params.push(`%${principal}%`); where.push(`a.principal ILIKE $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const r = await pool.query(`
      SELECT a.*, t.slug AS tenant_slug, t.name AS tenant_name,
             sc.name AS connector_name, sc.provider AS connector_provider
      FROM acl_rules a
      LEFT JOIN tenants t ON t.id = a.tenant_id
      LEFT JOIN source_connectors sc ON sc.id = a.connector_id
      ${whereSql}
      ORDER BY a.tenant_id, a.connector_id, a.principal`, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rules', async (req, res) => {
  try {
    const { tenant_id, connector_id, principal, principal_type, permission, resource_filter } = req.body || {};
    if (!tenant_id || !connector_id || !principal) {
      return res.status(400).json({ error: 'tenant_id, connector_id, principal required' });
    }
    if (principal_type && !PRINCIPAL_TYPES.includes(principal_type)) {
      return res.status(400).json({ error: `principal_type must be one of ${PRINCIPAL_TYPES.join(',')}` });
    }
    if (permission && !PERMISSIONS.includes(permission)) {
      return res.status(400).json({ error: `permission must be one of ${PERMISSIONS.join(',')}` });
    }
    if (resource_filter && typeof resource_filter !== 'string') {
      try { JSON.parse(JSON.stringify(resource_filter)); }
      catch { return res.status(400).json({ error: 'resource_filter must be JSON-serializable' }); }
    }
    const filterStr = resource_filter
      ? (typeof resource_filter === 'string' ? resource_filter : JSON.stringify(resource_filter))
      : null;
    const r = await pool.query(`
      INSERT INTO acl_rules (tenant_id, connector_id, principal, principal_type, permission, resource_filter)
      VALUES ($1,$2,$3, COALESCE($4,'group'), COALESCE($5,'read'), $6) RETURNING *`,
      [tenant_id, connector_id, principal, principal_type, permission, filterStr]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/rules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const allowed = ['principal','principal_type','permission','resource_filter'];
    const sets = [], params = [];
    for (const k of allowed) {
      if (k in (req.body || {})) {
        let v = req.body[k];
        if (k === 'resource_filter' && v && typeof v !== 'string') v = JSON.stringify(v);
        params.push(v); sets.push(`${k} = $${params.length}`);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'No allowed fields' });
    params.push(id);
    const r = await pool.query(`UPDATE acl_rules SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM acl_rules WHERE id = $1 RETURNING id', [parseInt(req.params.id, 10)]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Evaluate access: { tenant_id, connector_id, principal, principal_type?, permission?, resource_path? }
router.post('/check', async (req, res) => {
  try {
    const { tenant_id, connector_id, principal, principal_type, permission, resource_path } = req.body || {};
    if (!tenant_id || !connector_id || !principal) {
      return res.status(400).json({ error: 'tenant_id, connector_id, principal required' });
    }
    const need = permission || 'read';
    if (!PERMISSIONS.includes(need)) return res.status(400).json({ error: `permission must be one of ${PERMISSIONS.join(',')}` });

    // Find candidate rules: exact principal match OR same principal_type group/role
    const rules = (await pool.query(`
      SELECT * FROM acl_rules
      WHERE tenant_id = $1 AND connector_id = $2
        AND (principal = $3 OR principal_type IN ('group','role'))
    `, [tenant_id, connector_id, principal])).rows;

    const matches = rules.filter(r => {
      // Filter by principal_type if given
      if (principal_type && r.principal_type !== principal_type && r.principal !== principal) return false;
      // Resource filter: simple path glob like {"path":"engineering/*"}
      if (!resource_path) return true;
      if (!r.resource_filter) return true;
      try {
        const filt = JSON.parse(r.resource_filter);
        if (!filt.path) return true;
        const re = new RegExp('^' + filt.path.replace(/\*/g, '.*') + '$');
        return re.test(resource_path);
      } catch { return true; }
    });

    const granted = matches.some(r => PERM_RANK[r.permission] >= PERM_RANK[need]);
    res.json({
      allowed: granted,
      needed_permission: need,
      principal,
      tenant_id,
      connector_id,
      matched_rules: matches.map(r => ({
        id: r.id, principal: r.principal, principal_type: r.principal_type,
        permission: r.permission, resource_filter: r.resource_filter
      })),
      decision_reason: granted ? 'rule_match' : (matches.length ? 'matched_but_insufficient' : 'no_matching_rule'),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
