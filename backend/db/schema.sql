-- Legacy comparison schema is additive. Destructive resets are intentionally unsupported.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_entries (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  category VARCHAR(50),
  content TEXT,
  source_type VARCHAR(50),
  author VARCHAR(255),
  department VARCHAR(100),
  tags TEXT,
  views INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  source_url TEXT,
  content TEXT,
  department VARCHAR(100),
  doc_type VARCHAR(50),
  status VARCHAR(30),
  last_updated DATE,
  word_count INTEGER,
  indexed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS queries (
  id SERIAL PRIMARY KEY,
  question TEXT,
  answer TEXT,
  confidence DECIMAL,
  user_id INT REFERENCES users,
  helpful BOOLEAN,
  sources TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS procedures (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  department VARCHAR(100),
  steps_json TEXT,
  version VARCHAR(10),
  owner VARCHAR(255),
  last_updated DATE,
  status VARCHAR(30),
  usage_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(100),
  content TEXT,
  effective_date DATE,
  owner VARCHAR(255),
  approved_by VARCHAR(255),
  review_date DATE,
  status VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS decisions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  context TEXT,
  decision_made TEXT,
  rationale TEXT,
  made_by VARCHAR(255),
  decision_date DATE,
  impact_level VARCHAR(20),
  tags TEXT,
  reversible BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users,
  user_email VARCHAR(255),
  action VARCHAR(100),
  resource VARCHAR(100),
  resource_id VARCHAR(100),
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Source connectors: Notion / Confluence / Drive / Slack / GitHub / Gmail / Linear / Zendesk
CREATE TABLE IF NOT EXISTS source_connectors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  provider VARCHAR(40) NOT NULL,        -- notion, confluence, gdrive, slack, github, gmail, linear, zendesk, salesforce
  workspace VARCHAR(120),               -- e.g. "acme.slack.com" or "github.com/acme"
  auth_type VARCHAR(30),                -- oauth2, pat, api_key, service_account
  scopes TEXT,                          -- comma separated
  status VARCHAR(20) DEFAULT 'active',  -- active, paused, error, syncing
  sync_interval_minutes INTEGER DEFAULT 60,
  last_sync_at TIMESTAMP,
  last_error TEXT,
  items_synced INTEGER DEFAULT 0,
  bytes_synced BIGINT DEFAULT 0,
  enabled_for_rag BOOLEAN DEFAULT TRUE,
  owner_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Embedding models catalog (real model specs)
CREATE TABLE IF NOT EXISTS embedding_models (
  id SERIAL PRIMARY KEY,
  model_id VARCHAR(100) UNIQUE NOT NULL, -- e.g. text-embedding-3-large
  provider VARCHAR(40) NOT NULL,         -- openai, voyage, cohere, baai, mistral
  dimension INTEGER NOT NULL,
  max_tokens INTEGER NOT NULL,
  cost_per_million_tokens_usd DECIMAL(10,4),
  mteb_avg DECIMAL(5,2),                 -- average MTEB score
  retrieval_avg DECIMAL(5,2),            -- retrieval subset avg
  released_on DATE,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE
);

-- Ingestion pipeline jobs (per document)
CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  connector_id INTEGER REFERENCES source_connectors(id) ON DELETE SET NULL,
  model_id INTEGER REFERENCES embedding_models(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'queued',   -- queued, chunking, embedding, indexing, complete, failed
  chunks_total INTEGER DEFAULT 0,
  chunks_done INTEGER DEFAULT 0,
  tokens_consumed INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  chunk_strategy VARCHAR(40) DEFAULT 'recursive_512_50',
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP,
  error TEXT
);

-- Per-chunk records (no raw vectors stored here — pgvector would, but we track metadata)
CREATE TABLE IF NOT EXISTS document_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES ingestion_jobs(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text TEXT,
  token_count INTEGER,
  embedding_vector_id VARCHAR(64),       -- handle into a vector store (e.g. pgvector / pinecone id)
  section_path TEXT,                      -- e.g. "Onboarding > Week 1 > Setup"
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hybrid search indexes (per corpus / per tenant)
CREATE TABLE IF NOT EXISTS search_indexes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  corpus VARCHAR(60),                    -- e.g. handbook, engineering-wiki, slack-eng
  model_id INTEGER REFERENCES embedding_models(id),
  bm25_enabled BOOLEAN DEFAULT TRUE,
  dense_enabled BOOLEAN DEFAULT TRUE,
  reranker VARCHAR(80),                  -- e.g. cohere-rerank-3, bge-reranker-v2-m3, none
  hybrid_alpha DECIMAL(3,2) DEFAULT 0.50,-- 0=bm25 only, 1=dense only
  top_k INTEGER DEFAULT 50,
  rerank_top_n INTEGER DEFAULT 10,
  total_chunks INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ready',    -- building, ready, stale
  last_built_at TIMESTAMP
);

-- Knowledge graph: entities and relations
CREATE TABLE IF NOT EXISTS kg_entities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(40) NOT NULL,             -- person, team, system, vendor, project, concept, policy_ref, decision_ref
  aliases TEXT,
  confidence DECIMAL(4,3) DEFAULT 1.0,
  occurrences INTEGER DEFAULT 1,
  first_seen_doc_id INTEGER,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS kg_relations (
  id SERIAL PRIMARY KEY,
  src_entity_id INTEGER REFERENCES kg_entities(id) ON DELETE CASCADE,
  dst_entity_id INTEGER REFERENCES kg_entities(id) ON DELETE CASCADE,
  relation VARCHAR(60) NOT NULL,         -- owns, reports_to, uses, replaces, depends_on, approves, deprecates
  confidence DECIMAL(4,3) DEFAULT 1.0,
  evidence_doc_id INTEGER,
  evidence_snippet TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tenant isolation + ACL
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(120),
  plan VARCHAR(30) DEFAULT 'team',       -- team, business, enterprise
  region VARCHAR(20) DEFAULT 'us-east-1',
  daily_query_quota INTEGER DEFAULT 10000,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS acl_rules (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  connector_id INTEGER REFERENCES source_connectors(id) ON DELETE CASCADE,
  principal VARCHAR(120) NOT NULL,       -- email, group, role
  principal_type VARCHAR(20) DEFAULT 'group',
  permission VARCHAR(20) DEFAULT 'read', -- read, write, admin, none
  resource_filter TEXT,                  -- optional JSON filter like {"path":"hr/*"}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Retrieval evaluation runs (MTEB-style)
CREATE TABLE IF NOT EXISTS eval_runs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  index_id INTEGER REFERENCES search_indexes(id) ON DELETE CASCADE,
  model_id INTEGER REFERENCES embedding_models(id),
  benchmark VARCHAR(60),                 -- mteb-retrieval, hotpotqa, fiqa, msmarco, internal-handbook
  num_queries INTEGER,
  ndcg_at_10 DECIMAL(5,4),
  recall_at_10 DECIMAL(5,4),
  recall_at_50 DECIMAL(5,4),
  mrr DECIMAL(5,4),
  latency_p50_ms INTEGER,
  latency_p95_ms INTEGER,
  run_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS eval_results (
  id SERIAL PRIMARY KEY,
  run_id INTEGER REFERENCES eval_runs(id) ON DELETE CASCADE,
  query TEXT,
  expected_doc_ids TEXT,                 -- comma separated
  retrieved_doc_ids TEXT,
  hit_rank INTEGER,                      -- 0 means miss, else position
  reciprocal_rank DECIMAL(5,4)
);

CREATE INDEX idx_chunks_doc ON document_chunks(document_id);
CREATE INDEX idx_chunks_job ON document_chunks(job_id);
CREATE INDEX idx_jobs_doc ON ingestion_jobs(document_id);
CREATE INDEX idx_kg_rel_src ON kg_relations(src_entity_id);
CREATE INDEX idx_kg_rel_dst ON kg_relations(dst_entity_id);
CREATE INDEX idx_eval_results_run ON eval_results(run_id);

-- Apply pass 7 (full backlog implementation): persistence for audit-gap features.
-- The gap-* and cf-* routes call ensureTable() at request time; this DDL hoists
-- the same definition into the canonical schema so fresh installs include it.
CREATE TABLE IF NOT EXISTS gap_features (
  id SERIAL PRIMARY KEY,
  feature_slug TEXT NOT NULL,
  user_id INTEGER,
  input JSONB,
  output TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gap_features_slug ON gap_features(feature_slug);
CREATE INDEX IF NOT EXISTS idx_gap_features_created ON gap_features(created_at);
