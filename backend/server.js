require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/queries', require('./routes/queries'));
app.use('/api/procedures', require('./routes/procedures'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/decisions', require('./routes/decisions'));
app.use('/api/export', require('./routes/export'));
app.use('/api/search', require('./routes/search'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/admin', require('./routes/sample_data'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use('/api/gap-ai-skill-file-generator', require('./routes/gap-ai-skill-file-generator'));
app.use('/api/gap-ai-knowledge-refresh-agent', require('./routes/gap-ai-knowledge-refresh-agent'));
app.use('/api/gap-ai-query-route-to-source', require('./routes/gap-ai-query-route-to-source'));
app.use('/api/gap-ai-contradiction-detector', require('./routes/gap-ai-contradiction-detector'));
app.use('/api/gap-ai-onboarding-curriculum', require('./routes/gap-ai-onboarding-curriculum'));
app.use('/api/gap-nonai-connectors', require('./routes/gap-nonai-connectors'));
app.use('/api/gap-nonai-embeddings-store', require('./routes/gap-nonai-embeddings-store'));
app.use('/api/gap-nonai-versioning', require('./routes/gap-nonai-versioning'));
app.use('/api/gap-nonai-dept-access-control', require('./routes/gap-nonai-dept-access-control'));
app.use('/api/gap-nonai-webhook-ingest', require('./routes/gap-nonai-webhook-ingest'));
app.use('/api/gap-nonai-scim-sso', require('./routes/gap-nonai-scim-sso'));
app.use('/api/cf-skills-json', require('./routes/cf-skills-json'));
app.use('/api/cf-staleness-pr', require('./routes/cf-staleness-pr'));
app.use('/api/cf-multi-llm-voting', require('./routes/cf-multi-llm-voting'));
app.use('/api/cf-dept-graphs', require('./routes/cf-dept-graphs'));
app.use('/api/cf-meeting-transcripts', require('./routes/cf-meeting-transcripts'));

// Deep feature pass (2026-05-14): connectors, ingestion, hybrid search, embedding models,
// knowledge graph, retrieval eval, tenants/ACL.
app.use('/api/source-connectors',  require('./routes/source-connectors'));
app.use('/api/ingestion',          require('./routes/ingestion'));
app.use('/api/search-indexes',     require('./routes/search-indexes'));
app.use('/api/embedding-models',   require('./routes/embedding-models'));
app.use('/api/knowledge-graph',    require('./routes/knowledge-graph'));
app.use('/api/retrieval-eval',     require('./routes/retrieval-eval'));
app.use('/api/tenants-acl',        require('./routes/tenants-acl'));

// Custom Views (Brain Views) — 4 endpoints, mounted BEFORE 404/error handler
app.use('/api/custom-views', require('./routes/customViews'));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'company-brain', ts: Date.now() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`CompanyBrain backend running on port ${PORT}`));
