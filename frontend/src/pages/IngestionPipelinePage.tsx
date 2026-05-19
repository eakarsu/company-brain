import { useEffect, useState } from 'react';
import { Workflow, RefreshCw, AlertTriangle, Loader2, ChevronRight, RotateCcw, X, Play } from 'lucide-react';
import { apiFetch } from '../api';

interface Job {
  id: number;
  document_id: number;
  document_title: string | null;
  document_department: string | null;
  connector_id: number | null;
  connector_name: string | null;
  connector_provider: string | null;
  model_id: number | null;
  model_name: string | null;
  model_provider: string | null;
  model_dimension: number | null;
  status: string;
  chunks_total: number;
  chunks_done: number;
  pct_complete: number;
  tokens_consumed: number;
  cost_usd: number;
  chunk_strategy: string;
  started_at: string;
  finished_at: string | null;
  error: string | null;
}
interface ChunkPreview { id: number; chunk_index: number; preview: string; token_count: number; embedding_vector_id: string; section_path: string; }
interface Stats {
  overall: { total_jobs: number; complete: number; failed: number; in_flight: number; chunks_done: number; tokens_consumed: number; total_cost_usd: number };
  by_model: Array<{ model_id: string; provider: string; dimension: number; jobs: number; tokens: number; cost_usd: number }>;
}

const STATUS_TONE: Record<string, string> = {
  queued:    'bg-gray-500/20 text-gray-300',
  chunking:  'bg-blue-500/20 text-blue-300',
  embedding: 'bg-purple-500/20 text-purple-300 animate-pulse',
  indexing:  'bg-cyan-500/20 text-cyan-300',
  complete:  'bg-emerald-500/20 text-emerald-300',
  failed:    'bg-red-500/20 text-red-300',
  cancelled: 'bg-amber-500/20 text-amber-300',
};

export default function IngestionPipelinePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [selected, setSelected] = useState<(Job & { chunks_sample: ChunkPreview[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const qs = filter ? `?status=${filter}` : '';
      const [j, s] = await Promise.all([apiFetch(`/ingestion/jobs${qs}`), apiFetch('/ingestion/stats')]);
      setJobs(j); setStats(s);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filter]);

  async function openDetail(id: number) {
    try { setSelected(await apiFetch(`/ingestion/jobs/${id}`)); }
    catch (e: any) { setError(e?.message || 'Failed to open job'); }
  }

  async function act(id: number, kind: 'advance' | 'cancel' | 'retry') {
    setBusy(id);
    try {
      await apiFetch(`/ingestion/jobs/${id}/${kind}`, { method: 'POST' });
      await load();
      if (selected?.id === id) openDetail(id);
    } catch (e: any) { setError(e?.message || `${kind} failed`); }
    finally { setBusy(null); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center"><Workflow size={22} className="text-white" /></div>
          <div><h1 className="text-2xl font-bold text-white">Ingestion Pipeline</h1>
            <p className="text-sm text-gray-400">chunk → embed → index — per-document jobs across all connectors</p></div>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">All statuses</option>
            {['queued','chunking','embedding','indexing','complete','failed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm border border-gray-700"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh</button>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total jobs', v: stats.overall.total_jobs, tone: 'text-white' },
            { label: 'Complete',   v: stats.overall.complete,   tone: 'text-emerald-300' },
            { label: 'In flight',  v: stats.overall.in_flight,  tone: 'text-blue-300' },
            { label: 'Failed',     v: stats.overall.failed,     tone: 'text-red-300' },
            { label: 'Cost (USD)', v: Number(stats.overall.total_cost_usd).toFixed(2), tone: 'text-yellow-300' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className={`text-2xl font-bold tabular-nums ${s.tone}`}>{s.v}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {stats?.by_model?.length ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3 text-sm">Tokens & cost by embedding model</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {stats.by_model.map(m => (
              <div key={m.model_id} className="bg-gray-950/60 border border-gray-800 rounded-lg p-3">
                <div className="text-white font-medium">{m.model_id}</div>
                <div className="text-xs text-gray-400">{m.provider} · {m.dimension}-dim</div>
                <div className="text-xs text-gray-300 mt-1 tabular-nums">{m.tokens.toLocaleString()} tokens · ${Number(m.cost_usd).toFixed(4)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {loading && !jobs.length && <div className="text-gray-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Loading...</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800 overflow-hidden">
        {jobs.map(j => (
          <div key={j.id} onClick={() => openDetail(j.id)} className="px-4 py-3 hover:bg-gray-800/40 cursor-pointer flex items-center gap-4">
            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${STATUS_TONE[j.status] || 'bg-gray-700/40 text-gray-300'}`}>{j.status}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{j.document_title || `doc #${j.document_id}`}</div>
              <div className="text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                <span>{j.connector_name || 'manual'}</span>
                <span>{j.model_name || '—'} ({j.model_dimension || '?'}-dim)</span>
                <span>{j.chunk_strategy}</span>
                <span className="tabular-nums">{j.chunks_done}/{j.chunks_total} chunks · {j.tokens_consumed.toLocaleString()} tok · ${Number(j.cost_usd).toFixed(4)}</span>
              </div>
            </div>
            <div className="w-24 h-2 bg-gray-800 rounded overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min(100, j.pct_complete)}%` }} /></div>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
        ))}
        {!jobs.length && !loading && <div className="px-4 py-8 text-center text-gray-500 text-sm">No jobs match this filter.</div>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-bold text-lg">{selected.document_title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Job #{selected.id} · {selected.model_name} ({selected.model_dimension}-dim)</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
              <div><div className="text-xs text-gray-400">Status</div><div className="text-white">{selected.status}</div></div>
              <div><div className="text-xs text-gray-400">Chunks</div><div className="text-white tabular-nums">{selected.chunks_done}/{selected.chunks_total}</div></div>
              <div><div className="text-xs text-gray-400">Tokens</div><div className="text-white tabular-nums">{selected.tokens_consumed.toLocaleString()}</div></div>
              <div><div className="text-xs text-gray-400">Cost</div><div className="text-white">${Number(selected.cost_usd).toFixed(4)}</div></div>
            </div>
            {selected.error && <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-lg p-3 text-sm mb-4">{selected.error}</div>}
            <div className="flex gap-2 mb-4">
              {!['complete','failed','cancelled'].includes(selected.status) && <button disabled={busy === selected.id} onClick={() => act(selected.id, 'advance')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"><Play size={14} />Advance</button>}
              {!['complete','failed','cancelled'].includes(selected.status) && <button disabled={busy === selected.id} onClick={() => act(selected.id, 'cancel')} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"><X size={14} />Cancel</button>}
              {selected.status === 'failed' && <button disabled={busy === selected.id} onClick={() => act(selected.id, 'retry')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"><RotateCcw size={14} />Retry</button>}
            </div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Chunk samples</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(selected.chunks_sample || []).map(c => (
                <div key={c.id} className="bg-gray-950/60 border border-gray-800 rounded-lg p-3 text-sm">
                  <div className="flex justify-between text-xs text-gray-400 mb-1"><span>#{c.chunk_index} · {c.token_count} tok · {c.embedding_vector_id}</span><span>{c.section_path}</span></div>
                  <p className="text-gray-200">{c.preview}</p>
                </div>
              ))}
              {(!selected.chunks_sample || !selected.chunks_sample.length) && <div className="text-gray-500 text-sm text-center py-4">No chunk samples yet.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
