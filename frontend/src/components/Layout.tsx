import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, BookOpen, FileText, MessageSquare, ListChecks, Shield, GitBranch, Sparkles, LogOut, Wrench, Database, LayoutDashboard, Plug, Workflow, Search as SearchIcon, Cpu, Network, Activity, Lock, Eye, Zap, RefreshCw, Map, AlertTriangle, GraduationCap, Layers, Tag, History, Webhook, Key, FileJson, GitPullRequest, Vote, Mic } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/knowledge', label: 'Knowledge', icon: BookOpen },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/queries', label: 'Queries', icon: MessageSquare },
  { path: '/procedures', label: 'Procedures', icon: ListChecks },
  { path: '/policies', label: 'Policies', icon: Shield },
  { path: '/decisions', label: 'Decisions', icon: GitBranch },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">CompanyBrain</h1>
              <p className="text-xs text-gray-400 mt-0.5">Knowledge Hub</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Features</p>
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === path
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">AI Center</p>
            <Link
              to="/ai"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/ai'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Sparkles size={18} />
              AI Tools
            </Link>
          </div>
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Brain Platform</p>
            {[
              { path: '/source-connectors', label: 'Source Connectors', icon: Plug,      color: 'bg-purple-600' },
              { path: '/ingestion',         label: 'Ingestion Pipeline', icon: Workflow, color: 'bg-blue-600' },
              { path: '/hybrid-search',     label: 'Hybrid Search',     icon: SearchIcon,color: 'bg-violet-600' },
              { path: '/embedding-models',  label: 'Embedding Models',  icon: Cpu,       color: 'bg-emerald-600' },
              { path: '/knowledge-graph',   label: 'Knowledge Graph',   icon: Network,   color: 'bg-pink-600' },
              { path: '/retrieval-eval',    label: 'Retrieval Eval',    icon: Activity,  color: 'bg-cyan-600' },
              { path: '/tenants-acl',       label: 'Tenants & ACL',     icon: Lock,      color: 'bg-amber-600' },
            ].map(({ path, label, icon: Icon, color }) => (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === path ? `${color} text-white` : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Brain Views</p>
            <Link
              to="/custom-views"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/custom-views'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Eye size={18} />
              Brain Views
            </Link>
          </div>
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Gap AI</p>
            {[
              { path: '/gap/skill-file-generator',    label: 'Skill File Generator',     icon: Zap,            color: 'bg-purple-600' },
              { path: '/gap/knowledge-refresh-agent', label: 'Knowledge Refresh Agent',  icon: RefreshCw,      color: 'bg-blue-600' },
              { path: '/gap/query-route-to-source',   label: 'Query Route To Source',    icon: Map,            color: 'bg-violet-600' },
              { path: '/gap/contradiction-detector',  label: 'Contradiction Detector',   icon: AlertTriangle,  color: 'bg-rose-600' },
              { path: '/gap/onboarding-curriculum',   label: 'Onboarding Curriculum',    icon: GraduationCap,  color: 'bg-emerald-600' },
            ].map(({ path, label, icon: Icon, color }) => (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === path ? `${color} text-white` : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Gap Infra</p>
            {[
              { path: '/gap/connectors',          label: 'Connectors',          icon: Plug,    color: 'bg-purple-600' },
              { path: '/gap/embeddings-store',    label: 'Embeddings Store',    icon: Layers,  color: 'bg-blue-600' },
              { path: '/gap/versioning',          label: 'Versioning',          icon: History, color: 'bg-violet-600' },
              { path: '/gap/dept-access-control', label: 'Dept Access Control', icon: Tag,     color: 'bg-amber-600' },
              { path: '/gap/webhook-ingest',      label: 'Webhook Ingest',      icon: Webhook, color: 'bg-cyan-600' },
              { path: '/gap/scim-sso',            label: 'SCIM / SSO',          icon: Key,     color: 'bg-pink-600' },
            ].map(({ path, label, icon: Icon, color }) => (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === path ? `${color} text-white` : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Custom Features</p>
            {[
              { path: '/cf/skills-json',         label: 'skills.json Generator',     icon: FileJson,       color: 'bg-purple-600' },
              { path: '/cf/staleness-pr',        label: 'Staleness Auto-PR',         icon: GitPullRequest, color: 'bg-blue-600' },
              { path: '/cf/multi-llm-voting',    label: 'Multi-LLM Voting',          icon: Vote,           color: 'bg-violet-600' },
              { path: '/cf/dept-graphs',         label: 'Departmental Graphs',       icon: Network,        color: 'bg-emerald-600' },
              { path: '/cf/meeting-transcripts', label: 'Meeting Transcript Ingest', icon: Mic,            color: 'bg-rose-600' },
            ].map(({ path, label, icon: Icon, color }) => (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === path ? `${color} text-white` : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Utilities</p>
            <Link
              to="/utilities"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/utilities'
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Wrench size={18} />
              Export / Search / Audit
            </Link>
            <Link
              to="/sample-data"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/sample-data'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Database size={18} />
              Sample Data
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{user.name || 'User'}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
