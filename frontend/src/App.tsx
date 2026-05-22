import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import KnowledgePage from './pages/KnowledgePage';
import DocumentsPage from './pages/DocumentsPage';
import QueriesPage from './pages/QueriesPage';
import ProceduresPage from './pages/ProceduresPage';
import PoliciesPage from './pages/PoliciesPage';
import DecisionsPage from './pages/DecisionsPage';
import AICenter from './components/AICenter';
import UtilitiesPage from './pages/UtilitiesPage';
import SampleDataPage from './pages/SampleDataPage';
import Dashboard from './pages/Dashboard';
import SourceConnectorsPage from './pages/SourceConnectorsPage';
import IngestionPipelinePage from './pages/IngestionPipelinePage';
import HybridSearchPage from './pages/HybridSearchPage';
import EmbeddingModelsPage from './pages/EmbeddingModelsPage';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import RetrievalEvalPage from './pages/RetrievalEvalPage';
import TenantsAclPage from './pages/TenantsAclPage';
import CustomViewsPage from './pages/CustomViewsPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

// Apply pass 7: audit-gap pages (gap-ai / gap-nonai / cf)
import GapSkillFileGenerator from './pages/GapSkillFileGenerator';
import GapKnowledgeRefreshAgent from './pages/GapKnowledgeRefreshAgent';
import GapQueryRouteToSource from './pages/GapQueryRouteToSource';
import GapContradictionDetector from './pages/GapContradictionDetector';
import GapOnboardingCurriculum from './pages/GapOnboardingCurriculum';
import GapConnectors from './pages/GapConnectors';
import GapEmbeddingsStore from './pages/GapEmbeddingsStore';
import GapVersioning from './pages/GapVersioning';
import GapDeptAccessControl from './pages/GapDeptAccessControl';
import GapWebhookIngest from './pages/GapWebhookIngest';
import GapScimSso from './pages/GapScimSso';
import CfSkillsJson from './pages/CfSkillsJson';
import CfStalenessPr from './pages/CfStalenessPr';
import CfMultiLlmVoting from './pages/CfMultiLlmVoting';
import CfDeptGraphs from './pages/CfDeptGraphs';
import CfMeetingTranscripts from './pages/CfMeetingTranscripts';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/knowledge" element={<KnowledgePage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/queries" element={<QueriesPage />} />
                <Route path="/procedures" element={<ProceduresPage />} />
                <Route path="/policies" element={<PoliciesPage />} />
                <Route path="/decisions" element={<DecisionsPage />} />
                <Route path="/ai" element={<AICenter />} />
                <Route path="/ai-more" element={<Navigate to="/ai" replace />} />
                <Route path="/utilities" element={<UtilitiesPage />} />
                <Route path="/sample-data" element={<SampleDataPage />} />
                <Route path="/source-connectors" element={<SourceConnectorsPage />} />
                <Route path="/ingestion" element={<IngestionPipelinePage />} />
                <Route path="/hybrid-search" element={<HybridSearchPage />} />
                <Route path="/embedding-models" element={<EmbeddingModelsPage />} />
                <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
                <Route path="/retrieval-eval" element={<RetrievalEvalPage />} />
                <Route path="/tenants-acl" element={<TenantsAclPage />} />
                <Route path="/custom-views" element={<CustomViewsPage />} />

                {/* Apply pass 7: audit-gap pages */}
                <Route path="/gap/skill-file-generator" element={<GapSkillFileGenerator />} />
                <Route path="/gap/knowledge-refresh-agent" element={<GapKnowledgeRefreshAgent />} />
                <Route path="/gap/query-route-to-source" element={<GapQueryRouteToSource />} />
                <Route path="/gap/contradiction-detector" element={<GapContradictionDetector />} />
                <Route path="/gap/onboarding-curriculum" element={<GapOnboardingCurriculum />} />
                <Route path="/gap/connectors" element={<GapConnectors />} />
                <Route path="/gap/embeddings-store" element={<GapEmbeddingsStore />} />
                <Route path="/gap/versioning" element={<GapVersioning />} />
                <Route path="/gap/dept-access-control" element={<GapDeptAccessControl />} />
                <Route path="/gap/webhook-ingest" element={<GapWebhookIngest />} />
                <Route path="/gap/scim-sso" element={<GapScimSso />} />
                <Route path="/cf/skills-json" element={<CfSkillsJson />} />
                <Route path="/cf/staleness-pr" element={<CfStalenessPr />} />
                <Route path="/cf/multi-llm-voting" element={<CfMultiLlmVoting />} />
                <Route path="/cf/dept-graphs" element={<CfDeptGraphs />} />
                <Route path="/cf/meeting-transcripts" element={<CfMeetingTranscripts />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
