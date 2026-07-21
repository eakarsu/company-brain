const crypto = require("node:crypto");
function problem(status, message, code) {
  return Object.assign(new Error(message), { status, code });
}
function text(value, name, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw problem(
      400,
      `${name} is required and must not exceed ${max} characters`,
    );
  return value.trim();
}
function url(value, name) {
  const parsed = new URL(text(value, name, 2048));
  if (parsed.protocol !== "https:")
    throw problem(400, `${name} must use HTTPS`);
  return parsed.toString();
}
function role(principal, ...allowed) {
  if (!allowed.includes(principal.role)) throw problem(403, "Forbidden");
}
function injectionFlags(content) {
  const patterns = [
    /ignore\s+(all|any|the|previous).*instructions?/i,
    /(system|developer)\s+(prompt|message)/i,
    /reveal.*(secret|credential|token)/i,
  ];
  return patterns
    .filter((x) => x.test(content))
    .map((_, i) => `PROMPT_INJECTION_PATTERN_${i + 1}`);
}
function chunks(content, size = 1200, overlap = 100) {
  const output = [];
  for (
    let start = 0;
    start < content.length && output.length < 100;
    start += size - overlap
  )
    output.push(content.slice(start, start + size));
  return output;
}
function digest(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}
function validateSyncResult(result) {
  if (
    !result ||
    !Array.isArray(result.documents) ||
    !Array.isArray(result.deletedExternalIds) ||
    typeof result.nextCursor !== "string" ||
    result.documents.length > 100
  )
    throw problem(
      502,
      "Connector returned an invalid sync contract",
      "CONNECTOR_SCHEMA",
    );
  for (const doc of result.documents) {
    text(doc.externalId, "externalId", 500);
    text(doc.title, "title", 500);
    text(doc.content, "content", 100000);
    url(doc.sourceUrl, "sourceUrl");
    text(doc.version, "version", 200);
    if (!Number.isFinite(Date.parse(doc.updatedAt)))
      throw problem(
        502,
        "Connector returned an invalid updatedAt",
        "CONNECTOR_SCHEMA",
      );
  }
  return result;
}
function validateAnswer(result, allowedSources, maxCost) {
  if (
    !result ||
    result.schemaVersion !== "grounded-answer-v1" ||
    typeof result.answer !== "string" ||
    !result.answer.trim() ||
    result.answer.length > 5000 ||
    !Array.isArray(result.citations) ||
    result.citations.length === 0 ||
    !Array.isArray(result.unsupportedClaims) ||
    !result.usage ||
    !Number.isInteger(result.costCents)
  )
    throw problem(
      502,
      "Answer provider returned an invalid typed contract",
      "ANSWER_SCHEMA",
    );
  if (result.costCents > maxCost)
    throw problem(
      422,
      "Answer exceeded the configured cost budget",
      "COST_BUDGET",
    );
  if (result.unsupportedClaims.length)
    throw problem(
      422,
      "Answer provider reported unsupported claims",
      "UNGROUNDED_OUTPUT",
    );
  for (const citation of result.citations)
    if (
      !allowedSources.has(citation.sourceId) ||
      typeof citation.claim !== "string" ||
      !citation.claim.trim()
    )
      throw problem(
        422,
        "Answer citation does not match retrieved evidence",
        "INVALID_CITATION",
      );
  const confidence = Number(result.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)
    throw problem(502, "Answer confidence is invalid", "ANSWER_SCHEMA");
  return { ...result, confidence };
}
module.exports = {
  problem,
  text,
  url,
  role,
  injectionFlags,
  chunks,
  digest,
  validateSyncResult,
  validateAnswer,
};
