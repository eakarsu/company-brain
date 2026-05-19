// Source connectors — list, inspect, sync, pause/resume, reauth (Notion, Confluence,
// Google Drive, Slack, GitHub, Gmail, Linear, Zendesk, Salesforce).
//
// Endpoints:
//   GET    /api/source-connectors                  list + summary
//   GET    /api/source-connectors/providers        catalog of supported providers
//   GET    /api/source-connectors/:id              detail (with recent jobs + ACL)
//   POST   /api/source-connectors                  create (no real OAuth — config only)
//   PATCH  /api/source-connectors/:id              update (pause, rename, change interval)
//   POST   /api/source-connectors/:id/sync         trigger an immediate sync (simulated)
//   POST   /api/source-connectors/:id/reauth       clear last_error and mark active
//   DELETE /api/source-connectors/:id              delete

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

const PROVIDERS = [
  { provider: 'notion',     label: 'Notion',           auth_types: ['oauth2'],                  default_scopes: 'read_content,read_user' },
  { provider: 'confluence', label: 'Atlassian Confluence', auth_types: ['oauth2','api_key'],    default_scopes: 'read:confluence-content.all,read:confluence-space.summary' },
  { provider: 'gdrive',     label: 'Google Drive',     auth_types: ['oauth2','service_account'],default_scopes: 'drive.readonly' },
  { provider: 'slack',      label: 'Slack',            auth_types: ['oauth2'],                  default_scopes: 'channels:history,channels:read,users:read' },
  { provider: 'github',     label: 'GitHub',           auth_types: ['pat','github_app'],        default_scopes: 'repo,read:org' },
  { provider: 'gmail',      label: 'Gmail',            auth_types: ['oauth2'],                  default_scopes: 'gmail.readonly' },
  { provider: 'linear',     label: 'Linear',           auth_types: ['oauth2','api_key'],        default_scopes: 'read' },
  { provider: 'zendesk',    label: 'Zendesk',          auth_types: ['api_key'],                 default_scopes: 'tickets:read,users:read' },
  { provider: 'salesforce', label: 'Salesforce',       auth_types: ['oauth2'],                  default_scopes: 'api,refresh_token' },
];

router.get('/providers', (_req, res) => res.json(PROVIDERS));

router.get('/', async (req, res) => {
  try {
    const { provider, status } = req.query;
    const params = [];
    const where = [];
    if (provider) { params.push(provider); where.push(`provider = $${params.length}`); }
    if (status)   { params.push(status);   where.push(`status   = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = (await pool.query(
      `SELECT id, name, provider, workspace, auth_type, scopes, status, sync_interval_minutes,
              last_sync_at, last_error, items_synced, bytes_synced, enabled_for_rag, owner_email, created_at
       FROM source_connectors ${whereSql}
       ORDER BY status = 'error' DESC, status = 'syncing' DESC, last_sync_at DESC NULLS LAST`,
      params
    )).rows;

    const summary = (await pool.query(`
      SELECT
        COUNT(*)::int                                        AS total,
        SUM(CASE WHEN status='active'  THEN 1 ELSE 0 END)::int AS active,
        SUM(CASE WHEN status='paused'  THEN 1 ELSE 0 END)::int AS paused,
        SUM(CASE WHEN status='syncing' THEN 1 ELSE 0 END)::int AS syncing,
        SUM(CASE WHEN status='error'   THEN 1 ELSE 0 END)::int AS error,
        SUM(items_synced)::bigint                            AS items_synced_total,
        SUM(bytes_synced)::bigint                            AS bytes_synced_total
      FROM source_connectors
    `)).rows[0];

    const byProvider = (await pool.query(`
      SELECT provider, COUNT(*)::int AS connectors, SUM(items_synced)::bigint AS items
      FROM source_connectors GROUP BY provider ORDER BY connectors DESC
    `)).rows;

    res.json({ connectors: rows, summary, by_provider: byProvider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Bad id' });
    const c = (await pool.query('SELECT * FROM source_connectors WHERE id = $1', [id])).rows[0];
    if (!c) return res.status(404).json({ error: 'Not found' });

    const jobs = (await pool.query(`
      SELECT ij.id, ij.status, ij.chunks_total, ij.chunks_done, ij.tokens_consumed,
             ij.cost_usd, ij.started_at, ij.finished_at, ij.error,
             d.title AS document_title
      FROM ingestion_jobs ij LEFT JOIN documents d ON d.id = ij.document_id
      WHERE ij.connector_id = $1
      ORDER BY ij.started_at DESC LIMIT 20
    `, [id])).rows;

    const acl = (await pool.query(`
      SELECT a.id, a.principal, a.principal_type, a.permission, a.resource_filter, t.slug AS tenant
      FROM acl_rules a LEFT JOIN tenants t ON t.id = a.tenant_id
      WHERE a.connector_id = $1
      ORDER BY a.id ASC
    `, [id])).rows;

    res.json({ ...c, recent_jobs: jobs, acl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, provider, workspace, auth_type, scopes, sync_interval_minutes, owner_email } = req.body || {};
    if (!name || !provider) return res.status(400).json({ error: 'name and provider required' });
    if (!PROVIDERS.find(p => p.provider === provider)) {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }
    const r = await pool.query(
      `INSERT INTO source_connectors (name, provider, workspace, auth_type, scopes, sync_interval_minutes, owner_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, provider, workspace || null, auth_type || 'oauth2', scopes || '',
       sync_interval_minutes || 60, owner_email || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const allowed = ['name','status','sync_interval_minutes','enabled_for_rag','owner_email','scopes'];
    const sets = [], params = [];
    for (const k of allowed) {
      if (k in (req.body || {})) {
        params.push(req.body[k]);
        sets.push(`${k} = $${params.length}`);
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No allowed fields provided' });
    params.push(id);
    const r = await pool.query(
      `UPDATE source_connectors SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simulate an immediate sync (no actual external API calls — updates counters and timestamp)
router.post('/:id/sync', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const c = (await pool.query('SELECT * FROM source_connectors WHERE id = $1', [id])).rows[0];
    if (!c) return res.status(404).json({ error: 'Not found' });
    if (c.status === 'error') {
      return res.status(409).json({ error: 'Connector in error — reauth first', last_error: c.last_error });
    }
    // Simulated delta: 10..150 new items, scaled bytes
    const delta = 10 + Math.floor(Math.random() * 140);
    const bytes = delta * (5000 + Math.floor(Math.random() * 20000));
    await pool.query('UPDATE source_connectors SET status = $1 WHERE id = $2', ['syncing', id]);
    // Mark complete immediately for the demo loop
    const r = await pool.query(`
      UPDATE source_connectors
      SET status='active', last_sync_at=NOW(), items_synced=items_synced+$1, bytes_synced=bytes_synced+$2
      WHERE id=$3 RETURNING *`,
      [delta, bytes, id]
    );
    res.json({ ok: true, delta_items: delta, delta_bytes: bytes, connector: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reauth', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const r = await pool.query(
      `UPDATE source_connectors SET status='active', last_error=NULL WHERE id=$1 RETURNING *`,
      [id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, connector: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const r = await pool.query('DELETE FROM source_connectors WHERE id = $1 RETURNING id', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
