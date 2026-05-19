import { useEffect, useState } from 'react';
import { Plug, RefreshCw, Pause, Play, AlertTriangle, Loader2, Database, Trash2, Plus, Key } from 'lucide-react';
import { apiFetch } from '../api';

interface Connector {
  id: number;
  name: string;
  provider: string;
  workspace: string | null;
  auth_type: string;
  scopes: string;
  status: 'active' | 'paused' | 'syncing' | 'error';
  sync_interval_minutes: number;
  last_sync_at: string | null;
  last_error: string | null;
  items_synced: number;
  bytes_synced: number;
  enabled_for_rag: boolean;
  owner_email: string | null;
}
interface Summary { total: number; active: number; paused: number; syncing: number; error: number; items_synced_total: number; bytes_synced_total: number; }
interface ProviderDef { provider: string; label: string; auth_types: string[]; default_scopes: string; }

const STATUS_TONE: Record<string,string> = {
  active:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  paused:  'bg-gray-500/20 text-gray-300 border-gray-500/40',
  syncing: 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse',
  error:   'bg-red-500/20 text-red-300 border-red-500/40',
};

const PROVIDER_TONE: Record<string,string> = {
  notion: 'bg-purple-500/20 text-purple-300', confluence: 'bg-blue-500/20 text-blue-300',
  gdrive: 'bg-yellow-500/20 text-yellow-300', slack: 'bg-fuchsia-500/20 text-fuchsia-300',
  github: 'bg-gray-500/20 text-gray-200',     gmail: 'bg-rose-500/20 text-rose-300',
  linear: 'bg-violet-500/20 text-violet-300', zendesk: 'bg-emerald-500/20 text-emerald-300',
  salesforce: 'bg-cyan-500/20 text-cyan-300',
};

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  if (b < 1073741824) return `${(b/1048576).toFixed(1)} MB`;
  return `${(b/1073741824).toFixed(2)} GB`;
}
function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function SourceConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [providers, setProviders] = useState<ProviderDef[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', provider: 'notion', workspace: '', auth_type: 'oauth2', scopes: '', sync_interval_minutes: 60, owner_email: '' });

  async function load() {
    setLoading(true); setError(null);
    try {
      const qs = filter ? `?provider=${filter}` : '';
      const data = await apiFetch(`/source-connectors${qs}`);
      setConnectors(data.connectors); setSummary(data.summary);
      if (!providers.length) setProviders(await apiFetch('/source-connectors/providers'));
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filter]);

  async function act(id: number, kind: 'sync' | 'reauth' | 'pause' | 'resume' | 'delete') {
    setBusyId(id);
    try {
      if (kind === 'sync')   await apiFetch(`/source-connectors/${id}/sync`,   { method: 'POST' });
      if (kind === 'reauth') await apiFetch(`/source-connectors/${id}/reauth`, { method: 'POST' });
      if (kind === 'pause')  await apiFetch(`/source-connectors/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paused' }) });
      if (kind === 'resume') await apiFetch(`/source-connectors/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) });
      if (kind === 'delete') await apiFetch(`/source-connectors/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) { setError(e?.message || 'Action failed'); }
    finally { setBusyId(null); }
  }

  async function create() {
    if (!form.name) { setError('Name is required'); return; }
    try {
      await apiFetch('/source-connectors', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false);
      setForm({ name: '', provider: 'notion', workspace: '', auth_type: 'oauth2', scopes: '', sync_interval_minutes: 60, owner_email: '' });
      await load();
    } catch (e: any) { setError(e?.message || 'Create failed'); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center"><Plug size={22} className="text-white" /></div>
          <div><h1 className="text-2xl font-bold text-white">Source Connectors</h1>
            <p className="text-sm text-gray-400">Notion, Confluence, Drive, Slack, GitHub, Gmail, Linear, Zendesk, Salesforce</p></div>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">All providers</option>
            {providers.map(p => <option key={p.provider} value={p.provider}>{p.label}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Plus size={16} />Add Connector</button>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total',   v: summary.total,            tone: 'text-white' },
            { label: 'Active',  v: summary.active,           tone: 'text-emerald-300' },
            { label: 'Syncing', v: summary.syncing,          tone: 'text-blue-300' },
            { label: 'Paused',  v: summary.paused,           tone: 'text-gray-300' },
            { label: 'Errors',  v: summary.error,            tone: 'text-red-300' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className={`text-2xl font-bold tabular-nums ${s.tone}`}>{s.v}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-400"><Database size={14} /> Total items synced: <span className="text-white tabular-nums">{summary.items_synced_total?.toLocaleString() ?? 0}</span></div>
          <div className="flex items-center gap-2 text-gray-400">Total bytes: <span className="text-white tabular-nums">{fmtBytes(summary.bytes_synced_total || 0)}</span></div>
        </div>
      )}

      {loading && !connectors.length && <div className="text-gray-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Loading...</div>}

      <div className="grid gap-3">
        {connectors.map(c => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-4 hover:border-purple-700/40 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${PROVIDER_TONE[c.provider] || 'bg-gray-700/40 text-gray-300'}`}>{c.provider}</span>
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${STATUS_TONE[c.status]}`}>{c.status}</span>
                <h3 className="text-white font-semibold truncate">{c.name}</h3>
                {!c.enabled_for_rag && <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">RAG disabled</span>}
              </div>
              <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>{c.workspace || '—'}</span>
                <span className="flex items-center gap-1"><Key size={11} />{c.auth_type}</span>
                <span>Every {c.sync_interval_minutes} min</span>
                <span>Last sync: {timeAgo(c.last_sync_at)}</span>
                <span className="tabular-nums">{c.items_synced.toLocaleString()} items · {fmtBytes(c.bytes_synced || 0)}</span>
              </div>
              {c.last_error && <div className="text-xs text-red-300 mt-1 truncate">⚠ {c.last_error}</div>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button disabled={busyId === c.id || c.status === 'error'} onClick={() => act(c.id, 'sync')} title="Sync now" className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-40"><RefreshCw size={16} className={busyId === c.id ? 'animate-spin' : ''} /></button>
              {c.status === 'error' && <button disabled={busyId === c.id} onClick={() => act(c.id, 'reauth')} title="Reauthorize" className="p-2 text-emerald-300 hover:bg-emerald-500/10 rounded-lg disabled:opacity-40"><Key size={16} /></button>}
              {c.status === 'paused'
                ? <button onClick={() => act(c.id, 'resume')} title="Resume" className="p-2 text-emerald-300 hover:bg-emerald-500/10 rounded-lg"><Play size={16} /></button>
                : <button onClick={() => act(c.id, 'pause')} title="Pause" className="p-2 text-gray-300 hover:bg-gray-800 rounded-lg"><Pause size={16} /></button>}
              <button onClick={() => { if (confirm(`Delete connector "${c.name}"?`)) act(c.id, 'delete'); }} title="Delete" className="p-2 text-red-300 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-white font-bold text-lg mb-4">Add Connector</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name (e.g. Notion - Engineering)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <select value={form.provider} onChange={e => { const p = providers.find(x => x.provider === e.target.value); setForm({ ...form, provider: e.target.value, auth_type: p?.auth_types[0] || 'oauth2', scopes: p?.default_scopes || '' }); }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {providers.map(p => <option key={p.provider} value={p.provider}>{p.label}</option>)}
              </select>
              <input value={form.workspace} onChange={e => setForm({ ...form, workspace: e.target.value })} placeholder="Workspace (e.g. acme.slack.com)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.scopes} onChange={e => setForm({ ...form, scopes: e.target.value })} placeholder="Scopes" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.owner_email} onChange={e => setForm({ ...form, owner_email: e.target.value })} placeholder="Owner email" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input type="number" value={form.sync_interval_minutes} onChange={e => setForm({ ...form, sync_interval_minutes: parseInt(e.target.value) || 60 })} placeholder="Sync interval (min)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={create} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
