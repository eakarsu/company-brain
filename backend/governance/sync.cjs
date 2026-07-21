const {
  validateSyncResult,
  injectionFlags,
  chunks,
  digest,
} = require("./domain.cjs");
async function applySync(
  client,
  principal,
  connector,
  delivery,
  rawResult,
  audit,
) {
  const result = validateSyncResult(rawResult);
  let upserted = 0,
    deleted = 0;
  for (const item of result.documents) {
    const flags = injectionFlags(item.content),
      hash = digest(item.content),
      document = (
        await client.query(
          `INSERT INTO brain_source_documents(tenant_id,connector_id,external_id,title,content,source_url,content_sha256,source_version,source_updated_at,synced_at,deleted_at,risk_flags,metadata)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),NULL,$10,$11)ON CONFLICT(tenant_id,connector_id,external_id)DO UPDATE SET title=EXCLUDED.title,content=EXCLUDED.content,source_url=EXCLUDED.source_url,content_sha256=EXCLUDED.content_sha256,source_version=EXCLUDED.source_version,source_updated_at=EXCLUDED.source_updated_at,synced_at=now(),deleted_at=NULL,risk_flags=EXCLUDED.risk_flags,metadata=EXCLUDED.metadata RETURNING id`,
          [
            principal.tenantId,
            connector.id,
            item.externalId,
            item.title,
            item.content,
            item.sourceUrl,
            hash,
            item.version,
            item.updatedAt,
            flags,
            item.metadata || {},
          ],
        )
      ).rows[0];
    await client.query(
      "DELETE FROM brain_document_chunks WHERE tenant_id=$1 AND document_id=$2",
      [principal.tenantId, document.id],
    );
    if (!flags.length) {
      for (const [index, content] of chunks(item.content).entries())
        await client.query(
          `INSERT INTO brain_document_chunks(tenant_id,document_id,chunk_index,content,token_estimate)VALUES($1,$2,$3,$4,$5)`,
          [
            principal.tenantId,
            document.id,
            index,
            content,
            Math.ceil(content.length / 4),
          ],
        );
    }
    upserted += 1;
  }
  for (const externalId of result.deletedExternalIds) {
    const removed = await client.query(
      `UPDATE brain_source_documents SET deleted_at=now(),synced_at=now() WHERE tenant_id=$1 AND connector_id=$2 AND external_id=$3 AND deleted_at IS NULL RETURNING id`,
      [principal.tenantId, connector.id, externalId],
    );
    if (removed.rowCount) {
      await client.query(
        "DELETE FROM brain_document_chunks WHERE tenant_id=$1 AND document_id=$2",
        [principal.tenantId, removed.rows[0].id],
      );
      deleted += 1;
    }
  }
  await client.query(
    `UPDATE brain_connectors SET cursor=$1,last_sync_at=now(),last_success_at=now(),last_error_code=NULL,status='ACTIVE',document_count=(SELECT count(*) FROM brain_source_documents WHERE tenant_id=$2 AND connector_id=$3 AND deleted_at IS NULL),updated_at=now() WHERE tenant_id=$2 AND id=$3`,
    [result.nextCursor, principal.tenantId, connector.id],
  );
  await client.query(
    `UPDATE brain_sync_deliveries SET cursor_after=$1,status='SUCCEEDED',upserted=$2,deleted=$3,completed_at=now() WHERE tenant_id=$4 AND id=$5`,
    [result.nextCursor, upserted, deleted, principal.tenantId, delivery.id],
  );
  await audit(
    client,
    principal,
    "connector.sync-applied",
    "connector",
    connector.id,
    {
      deliveryId: delivery.id,
      upserted,
      deleted,
      quarantined: result.documents.filter(
        (x) => injectionFlags(x.content).length,
      ).length,
    },
  );
  return { upserted, deleted, nextCursor: result.nextCursor };
}
module.exports = { applySync };
