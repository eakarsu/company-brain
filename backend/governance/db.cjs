const { Pool } = require("pg");
let singleton;
function createPool(config) {
  return new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl,
    max: 12,
    idleTimeoutMillis: 10000,
  });
}
function getPool(config) {
  if (!singleton) singleton = createPool(config);
  return singleton;
}
async function tx(pool, work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function register(client, principal) {
  await client.query(
    `INSERT INTO brain_identities(tenant_id,subject,role,email,display_name,groups)VALUES($1,$2,$3,$4,$5,$6)ON CONFLICT(tenant_id,subject)DO UPDATE SET role=EXCLUDED.role,email=EXCLUDED.email,display_name=EXCLUDED.display_name,groups=EXCLUDED.groups,active=true,last_seen_at=now()`,
    [
      principal.tenantId,
      principal.subject,
      principal.role,
      principal.email,
      principal.name,
      principal.groups,
    ],
  );
}
async function audit(
  client,
  principal,
  action,
  resourceType,
  resourceId,
  metadata = {},
) {
  await client.query(
    `INSERT INTO brain_audit_events(tenant_id,actor_subject,action,resource_type,resource_id,metadata)VALUES($1,$2,$3,$4,$5,$6)`,
    [
      principal.tenantId,
      principal.subject,
      action,
      resourceType,
      resourceId || null,
      metadata,
    ],
  );
}
module.exports = { createPool, getPool, tx, register, audit };
