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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
