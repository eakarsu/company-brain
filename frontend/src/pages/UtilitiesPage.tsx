import { useState, useEffect } from 'react';
import { Download, Search, Activity, Wrench, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';

const RESOURCES = ['knowledge', 'documents', 'queries', 'procedures', 'policies', 'decisions', 'audit'];
const SCOPES = ['knowledge', 'documents', 'queries', 'procedures', 'policies', 'decisions'];
const KIND_COLORS: Record<string, string> = {
  knowledge: 'bg-purple-500/20 text-purple-300',
  documents: 'bg-blue-500/20 text-blue-300',
  queries: 'bg-green-500/20 text-green-300',
  procedures: 'bg-yellow-500/20 text-yellow-300',
  policies: 'bg-red-500/20 text-red-300',
  decisions: 'bg-pink-500/20 text-pink-300',
};

interface SearchHit {
  kind: string;
  id: number;
  title: string;
  snippet: string;
  meta: Record<string, any>;
}

interface AuditEntry {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  details: string | null;
  created_at: string;
}

export default function UtilitiesPage() {
  // CSV Export
  const [exportResource, setExportResource] = useState('knowledge');
  const [exportStatus, setExportStatus] = useState('');
  const [exporting, setExporting] = useState(false);

  // Search
  const [q, setQ] = useState('');
  const [scopes, setScopes] = useState<string[]>([...SCOPES]);
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);

  // Audit log
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [auditResource, setAuditResource] = useState('');
  const [showAddAudit, setShowAddAudit] = useState(false);
  const [newAudit, setNewAudit] = useState({ action: '', resource: '', resource_id: '', details: '' });

  async function runExport() {
    setExporting(true); setExportStatus('');
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/export/${exportResource}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportResource}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportStatus('Downloaded ' + exportResource + '.csv');
      try {
        await apiFetch('/audit', { method: 'POST', body: JSON.stringify({ action: 'export.csv', resource: exportResource, details: 'CSV export downloaded' }) });
        loadAudit();
      } catch { /* ignore audit failure */ }
    } catch (e: any) {
      setExportStatus('Error: ' + (e?.message || 'failed'));
    } finally { setExporting(false); }
  }

  async function runSearch() {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (scopes.length && scopes.length < SCOPES.length) params.set('scope', scopes.join(','));
      if (department) params.set('department', department);
      if (category) params.set('category', category);
      const data = await apiFetch(`/search?${params}`);
      setHits(data.results || []);
      setSearchTotal(data.total || 0);
    } catch (e: any) {
      setHits([]); setSearchTotal(0);
    } finally { setSearching(false); }
  }

  function toggleScope(s: string) {
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function loadAudit() {
    try {
      const params = new URLSearchParams();
      if (auditSearch) params.set('search', auditSearch);
      if (auditAction) params.set('action', auditAction);
      if (auditResource) params.set('resource', auditResource);
      const data = await apiFetch(`/audit?${params}`);
      setAuditEntries(data);
    } catch { setAuditEntries([]); }
  }

  async function addAuditEntry() {
    if (!newAudit.action.trim()) return;
    try {
      await apiFetch('/audit', { method: 'POST', body: JSON.stringify(newAudit) });
      setNewAudit({ action: '', resource: '', resource_id: '', details: '' });
      setShowAddAudit(false);
      loadAudit();
    } catch { /* swallow */ }
  }

  async function deleteAudit(id: number) {
    try {
      await apiFetch(`/audit/${id}`, { method: 'DELETE' });
      loadAudit();
    } catch { /* swallow */ }
  }

  useEffect(() => { loadAudit(); }, [auditSearch, auditAction, auditResource]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Wrench size={28} className="text-cyan-400" />
        <h1 className="text-2xl font-bold text-white">Utilities</h1>
      </div>

      {/* CSV Export */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Download size={20} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">CSV Export</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">Download any resource table as CSV.</p>
        <div className="flex gap-3 items-center">
          <select value={exportResource} onChange={e => setExportResource(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={runExport} disabled={exporting}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Download size={16} /> {exporting ? 'Exporting...' : 'Download CSV'}
          </button>
          {exportStatus && <span className="text-xs text-gray-400">{exportStatus}</span>}
        </div>
      </div>

      {/* Cross-Corpus Search */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Cross-Corpus Search & Filter</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">Search across all knowledge, documents, queries, procedures, policies, and decisions in one place.</p>
        <div className="space-y-3">
          <div className="flex gap-3">
            <input value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
              placeholder="Search term (leave blank for all)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <button onClick={runSearch} disabled={searching}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Search size={16} /> {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <div className="flex gap-3">
            <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="Filter: department"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Filter: category"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map(s => (
              <button key={s} onClick={() => toggleScope(s)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${scopes.includes(s) ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        {searchTotal > 0 && <div className="text-xs text-gray-400 mt-4 mb-2">{searchTotal} result{searchTotal === 1 ? '' : 's'}</div>}
        <div className="grid gap-2 mt-2">
          {hits.map((h, i) => (
            <div key={`${h.kind}-${h.id}-${i}`} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KIND_COLORS[h.kind] || 'bg-gray-700 text-gray-300'}`}>{h.kind}</span>
                <span className="text-xs text-gray-500">#{h.id}</span>
              </div>
              <div className="text-sm font-semibold text-white">{h.title || '(untitled)'}</div>
              {h.snippet && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{h.snippet}</div>}
            </div>
          ))}
          {!searching && hits.length === 0 && searchTotal === 0 && q && (
            <div className="text-sm text-gray-500 italic">No matches.</div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Audit Log</h2>
          </div>
          <button onClick={() => setShowAddAudit(s => !s)}
            className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg font-medium">
            {showAddAudit ? 'Cancel' : '+ Manual Entry'}
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-4">Track admin actions and significant events. CSV exports are auto-logged.</p>

        {showAddAudit && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-4 space-y-2">
            <input value={newAudit.action} onChange={e => setNewAudit({ ...newAudit, action: e.target.value })} placeholder="action (e.g. policy.approved)"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input value={newAudit.resource} onChange={e => setNewAudit({ ...newAudit, resource: e.target.value })} placeholder="resource (e.g. policies)"
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={newAudit.resource_id} onChange={e => setNewAudit({ ...newAudit, resource_id: e.target.value })} placeholder="resource id"
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <textarea value={newAudit.details} onChange={e => setNewAudit({ ...newAudit, details: e.target.value })} placeholder="details / notes"
              rows={2} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <button onClick={addAuditEntry} disabled={!newAudit.action.trim()}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
              Save Entry
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-3">
          <input value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="search email/details"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <input value={auditAction} onChange={e => setAuditAction(e.target.value)} placeholder="filter: action"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <input value={auditResource} onChange={e => setAuditResource(e.target.value)} placeholder="filter: resource"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
        </div>

        <div className="grid gap-2">
          {auditEntries.map(e => (
            <div key={e.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-medium">{e.action}</span>
                  {e.resource && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{e.resource}{e.resource_id ? `/${e.resource_id}` : ''}</span>}
                  <span className="text-xs text-gray-500">{e.user_email || `user#${e.user_id ?? '?'}`}</span>
                  <span className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</span>
                </div>
                {e.details && <div className="text-xs text-gray-400 line-clamp-2">{e.details}</div>}
              </div>
              <button onClick={() => deleteAudit(e.id)} className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {auditEntries.length === 0 && <div className="text-sm text-gray-500 italic">No audit entries.</div>}
        </div>
      </div>
    </div>
  );
}
