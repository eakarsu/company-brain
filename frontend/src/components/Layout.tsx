import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, BookOpen, FileText, MessageSquare, ListChecks, Shield, GitBranch, Sparkles, LogOut, Wrench, Database, LayoutDashboard } from 'lucide-react';

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
