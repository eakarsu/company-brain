export type Role = 'reader' | 'editor' | 'reviewer' | 'admin' | 'operator';
export interface Session { subject: string; tenantId: string; role: Role; name: string; email?: string; groups: string[]; }
export interface Connector { id: string; provider: string; name: string; workspace_url: string; status: string; cursor?: string; last_sync_at?: string; last_success_at?: string; last_error_code?: string; document_count: number; }
export interface SourceDocument { id: string; connector_id: string; external_id: string; title: string; source_url: string; source_version: string; source_updated_at: string; synced_at: string; deleted_at?: string; risk_flags: string[]; }
export interface BrainQuery { id: string; requester_subject: string; question: string; state: string; answer?: string; confidence?: number; citations?: { sourceId: string; claim: string }[]; cost_cents?: number; latency_ms?: number; failure_code?: string; created_at: string; }
export interface QuerySource { query_id: string; source_id: string; rank: number; score: number; external_id: string; title: string; source_url: string; source_version: string; source_updated_at: string; synced_at: string; excerpt: string; }
export interface Job { id: string; provider: string; operation: string; resource_type: string; resource_id: string; status: string; attempts: number; next_attempt_at: string; last_error_code?: string; }
export interface EvalCase { id: string; question: string; expected_external_ids: string[]; active: boolean; }
export interface EvalRun { id: string; status: string; case_count: number; hit_count: number; recall_at_5: number; threshold: number; latency_p95_ms: number; created_at: string; }
export interface AclRule { id: string; connector_id: string; principal_type: string; principal: string; permission: string; }
export interface Workspace { connectors: Connector[]; documents: SourceDocument[]; queries: BrainQuery[]; sources: QuerySource[]; jobs: Job[]; evalCases: EvalCase[]; evalRuns: EvalRun[]; acl: AclRule[]; boundary: string; }

// Compatibility-only types for quarantined legacy components.
export interface User { id: number; email: string; name: string; role: string; }
export interface KnowledgeEntry { id: number; title: string; category: string; content: string; source_type: string; author: string; department: string; tags: string; views: number; helpful_votes: number; created_at: string; }
export interface Document { id: number; title: string; source_url: string; content: string; department: string; doc_type: string; status: string; last_updated: string; word_count: number; indexed: boolean; }
export interface Query { id: number; question: string; answer: string; confidence: number; user_id: number; helpful: boolean; sources: string; created_at: string; }
export interface Procedure { id: number; name: string; department: string; steps_json: string; version: string; owner: string; last_updated: string; status: string; usage_count: number; }
export interface Policy { id: number; name: string; category: string; content: string; effective_date: string; owner: string; approved_by: string; review_date: string; status: string; }
export interface Decision { id: number; title: string; context: string; decision_made: string; rationale: string; made_by: string; decision_date: string; impact_level: string; tags: string; reversible: boolean; }
