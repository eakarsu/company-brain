DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS decisions CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS procedures CASCADE;
DROP TABLE IF EXISTS queries CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS knowledge_entries CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE knowledge_entries (
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

CREATE TABLE documents (
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

CREATE TABLE queries (
  id SERIAL PRIMARY KEY,
  question TEXT,
  answer TEXT,
  confidence DECIMAL,
  user_id INT REFERENCES users,
  helpful BOOLEAN,
  sources TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE procedures (
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

CREATE TABLE policies (
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

CREATE TABLE decisions (
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

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users,
  user_email VARCHAR(255),
  action VARCHAR(100),
  resource VARCHAR(100),
  resource_id VARCHAR(100),
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
