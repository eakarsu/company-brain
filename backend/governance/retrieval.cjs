async function retrieve(client, principal, question, limit = 5) {
  const elevated = ["admin", "operator"].includes(principal.role),
    groups = principal.groups || [];
  const result = await client.query(
    `SELECT c.id AS chunk_id,c.content,d.id AS document_id,d.external_id,d.title,d.source_url,d.source_version,d.source_updated_at,d.synced_at,co.id AS connector_id,co.name AS connector_name,ts_rank_cd(c.search_vector,websearch_to_tsquery('english',$2)) AS score
    FROM brain_document_chunks c JOIN brain_source_documents d ON d.id=c.document_id JOIN brain_connectors co ON co.id=d.connector_id
    WHERE c.tenant_id=$1 AND d.deleted_at IS NULL AND cardinality(d.risk_flags)=0 AND c.search_vector@@websearch_to_tsquery('english',$2)
    AND ($3::boolean OR EXISTS(SELECT 1 FROM brain_connector_acl a WHERE a.tenant_id=$1 AND a.connector_id=d.connector_id AND a.permission='read' AND ((a.principal_type='role' AND a.principal=$4)OR(a.principal_type='subject' AND a.principal=$5)OR(a.principal_type='group' AND a.principal=ANY($6::text[])))))
    ORDER BY score DESC,d.source_updated_at DESC,c.chunk_index ASC LIMIT $7`,
    [
      principal.tenantId,
      question,
      elevated,
      principal.role,
      principal.subject,
      groups,
      limit,
    ],
  );
  return result.rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    score: Number(row.score),
  }));
}
module.exports = { retrieve };
