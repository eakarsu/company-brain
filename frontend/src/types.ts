export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface KnowledgeEntry {
  id: number;
  title: string;
  category: string;
  content: string;
  source_type: string;
  author: string;
  department: string;
  tags: string;
  views: number;
  helpful_votes: number;
  created_at: string;
}

export interface Document {
  id: number;
  title: string;
  source_url: string;
  content: string;
  department: string;
  doc_type: string;
  status: string;
  last_updated: string;
  word_count: number;
  indexed: boolean;
}

export interface Query {
  id: number;
  question: string;
  answer: string;
  confidence: number;
  user_id: number;
  helpful: boolean;
  sources: string;
  created_at: string;
}

export interface Procedure {
  id: number;
  name: string;
  department: string;
  steps_json: string;
  version: string;
  owner: string;
  last_updated: string;
  status: string;
  usage_count: number;
}

export interface Policy {
  id: number;
  name: string;
  category: string;
  content: string;
  effective_date: string;
  owner: string;
  approved_by: string;
  review_date: string;
  status: string;
}

export interface Decision {
  id: number;
  title: string;
  context: string;
  decision_made: string;
  rationale: string;
  made_by: string;
  decision_date: string;
  impact_level: string;
  tags: string;
  reversible: boolean;
}
