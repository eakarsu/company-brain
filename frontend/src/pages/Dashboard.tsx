import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, MessageSquare, ListChecks, Shield, GitBranch,
  Sparkles, Database, Activity, Loader2, AlertTriangle, RefreshCcw, CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '../api';

interface AuditRow {
  id: number;
  user_email: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  details: string | null;
  created_at: string;
}

interface Stats {
  counts: {
    knowledge: number;
    documents: number;
    queries: number;
    procedures: number;
    policies: number;
    decisions: number;
  };
  meta: {
    indexed_documents: number;
    helpful_queries: number;
    active_policies: number;
  };
  recent_activity: AuditRow[];
  generated_at: string;
}

interface KpiDef {
  key: keyof Stats['counts'];
  label: string;
  icon: any;
  color: string;
  to: string;
  hint?: (m: Stats['meta']) => string | null;
}

const KPIS: KpiDef[] = [
  { key: 'knowledge',  label: 'Knowledge Entries',  icon: BookOpen,      color: 'purple', to: '/knowledge' },
  { key: 'documents',  label: 'Documents',          icon: FileText,      color: 'blue',   to: '/documents',  hint: m => `${m.indexed_documents} indexed` },
  { key: 'queries',    label: 'Queries Answered',   icon: MessageSquare, color: 'green',  to: '/queries',    hint: m => `${m.helpful_queries} marked helpful` },
  { key: 'procedures', label: 'Procedures',         icon: ListChecks,    color: 'yellow', to: '/procedures' },
  { key: 'policies',   label: 'Policies',           icon: Shield,        color: 'red',    to: '/policies',   hint: m => `${m.active_policies} active` },
  { key: 'decisions',  label: 'Decisions Logged',   icon: GitBranch,     color: 'pink',   to: '/decisions' },
];

const COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  purple: { bg: 'bg-purple-600', text: 'text-purple-300', border: 'border-purple-500/30', glow: 'shadow-purple-500/10' },
  blue:   { bg: 'bg-blue-600',   text: 'text-blue-300',   border: 'border-blue-500/30',   glow: 'shadow-blue-500/10' },
  green:  { bg: 'bg-green-600',  text: 'text-green-300',  border: 'border-green-500/30',  glow: 'shadow-green-500/10' },
  yellow: { bg: 'bg-yellow-600', text: 'text-yellow-300', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/10' },
  red:    { bg: 'bg-red-600',    text: 'text-red-300',    border: 'border-red-500/30',    glow: 'shadow-red-500/10' },
  pink:   { bg: 'bg-pink-600',   text: 'text-pink-300',   border: 'border-pink-500/30',   glow: 'shadow-pink-500/10' },
};

const ACTION_TONE: Record<string, string> = {
  create: 'text-emerald-300 bg-emerald-500/10',
  update: 'text-blue-300 bg-blue-500/10',
  delete: 'text-red-300 bg-red-500/10',
  view:   'text-gray-300 bg-gray-500/10',
};

function actionTone(action: string): string {
  const a = (action || '').toLowerCase();
  for (const k of Object.keys(ACTION_TONE)) if (a.includes(k)) return ACTION_TONE[k];
  return 'text-purple-300 bg-purple-500/10';
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/dashboard/stats');
      setStats(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center">
            <LayoutDashboard size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400">
              Welcome back{user.name ? `, ${user.name}` : ''} — your CompanyBrain at a glance
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-700 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPIS.map(k => {
          const cc = COLORS[k.color];
          const Icon = k.icon;
          const value = stats ? stats.counts[k.key] : null;
          const hint = stats && k.hint ? k.hint(stats.meta) : null;
          return (
            <Link
              key={k.key}
              to={k.to}
              className={`bg-gray-900 rounded-2xl p-5 border ${cc.border} hover:border-gray-600 transition-colors flex flex-col gap-3 shadow ${cc.glow}`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-lg ${cc.bg} flex items-center justify-center`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tabular-nums">
                  {loading && value === null ? <span className="text-gray-600">—</span> : value ?? 0}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{k.label}</div>
                {hint && <div className={`text-[11px] mt-1 ${cc.text}`}>{hint}</div>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/ai" className="bg-gray-900 hover:bg-gray-800/80 rounded-2xl p-5 border border-violet-500/30 transition-colors flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">AI Center</div>
              <div className="text-xs text-gray-400">Extract, answer, generate</div>
            </div>
          </Link>
          <Link to="/knowledge" className="bg-gray-900 hover:bg-gray-800/80 rounded-2xl p-5 border border-purple-500/30 transition-colors flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">Knowledge</div>
              <div className="text-xs text-gray-400">Browse & add entries</div>
            </div>
          </Link>
          <Link to="/documents" className="bg-gray-900 hover:bg-gray-800/80 rounded-2xl p-5 border border-blue-500/30 transition-colors flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">Documents</div>
              <div className="text-xs text-gray-400">Manage corpus</div>
            </div>
          </Link>
          <Link to="/sample-data" className="bg-gray-900 hover:bg-gray-800/80 rounded-2xl p-5 border border-emerald-500/30 transition-colors flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Database size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">Sample Data</div>
              <div className="text-xs text-gray-400">Seed demo rows</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-purple-400" />
            <h2 className="text-white font-semibold">Recent activity</h2>
          </div>
          <Link to="/utilities" className="text-xs text-purple-300 hover:text-purple-200">
            Full audit log →
          </Link>
        </div>
        <div className="divide-y divide-gray-800">
          {loading && !stats && (
            <div className="px-5 py-8 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </div>
          )}
          {!loading && stats && stats.recent_activity.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={14} /> No activity yet — actions appear here once logged to <code className="text-gray-400 ml-1">audit_log</code>.
            </div>
          )}
          {stats && stats.recent_activity.map(row => (
            <div key={row.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-800/40 transition-colors">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${actionTone(row.action)}`}>
                {row.action || 'event'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 truncate">
                  {row.resource ? <span className="text-gray-400">{row.resource}</span> : null}
                  {row.resource_id ? <span className="text-gray-500"> #{row.resource_id}</span> : null}
                  {row.details ? <span className="text-gray-300"> — {row.details}</span> : null}
                  {!row.resource && !row.details ? <span className="text-gray-500">No details</span> : null}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {row.user_email || 'unknown'} · {timeAgo(row.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {stats && (
        <p className="text-[11px] text-gray-600 text-right">
          Updated {timeAgo(stats.generated_at)}
        </p>
      )}
    </div>
  );
}
