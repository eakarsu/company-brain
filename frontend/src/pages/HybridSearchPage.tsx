import { useEffect, useState } from 'react';
import { Search, Sliders, Hammer, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { apiFetch } from '../api';

interface Idx {
  id: number; name: string; corpus: string; model_id: number | null; model_name: string | null;
  model_provider: string | null; model_dimension: number | null;
  bm25_enabled: boolean; dense_enabled: boolean; reranker: string;
  hybrid_alpha: number; top_k: number; rerank_top_n: number; total_chunks: number;
  status: string; last_built_at: string | null; flavor: string;
}
interface QueryResult {
  chunk_id: number; document_id: number; document_title: string; section_path: string;
  preview: string; bm25_hits: number; dense_score: number; fused_score: number; rerank_score?: number;
}
interface QueryResp { index_id: number; query: string; flavor: string; hybrid_alpha: number; reranker: string; latency_ms: number; results: QueryResult[]; }

const FLAVOR_TONE: Record<string,string> = {
  'hybrid+rerank': 'bg-purple-500/20 text-purple-300',
  'hybrid':       'bg-blue-500/20 text-blue-300',
  'dense':        'bg-emerald-500/20 text-emerald-300',
  'bm25':         'bg-amber-500/20 text-amber-300',
};
const STATUS_TONE: Record<string,string> = {
  ready: 'bg-emerald-500/20 text-emerald-300', building: 'bg-blue-500/20 text-blue-300 animate-pulse',
  stale: 'bg-amber-500/20 text-amber-300',
};

export default function HybridSearchPage() {
  const [indexes, setIndexes] = useState<Idx[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rerankers, setRerankers] = useState<Array<{ id: string; provider: string }>>([]);
  const [q, setQ] = useState('What is the API rate limit per token?');
  const [resp, setResp] = useState<QueryResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [rebuildBusy, setRebuildBusy] = useState<number | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [list, rr] = await Promise.all([apiFetch('/search-indexes'), apiFetch('/search-indexes/rerankers')]);
      setIndexes(list); setRerankers(rr);
      if (!selectedId && list.length) setSelectedId(list[0].id);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const selected = indexes.find(i => i.id === selectedId);

  async function patch(field: string, value: any) {
    if (!selected) return;
    try {
      const updated = await apiFetch(`/search-indexes/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ [field]: value }) });
      setIndexes(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
    } catch (e: any) { setError(e?.message || 'Update failed'); }
  }

  async function rebuild() {
    if (!selected) return;
    setRebuildBusy(selected.id);
    try { await apiFetch(`/search-indexes/${selected.id}/rebuild`, { method: 'POST' }); await load(); }
    catch (e: any) { setError(e?.message || 'Rebuild failed'); }
    finally { setRebuildBusy(null); }
  }

  async function runQuery() {
    if (!selected || !q.trim()) return;
    setSearching(true); setError(null); setResp(null);
    try { setResp(await apiFetch(`/search-indexes/${selected.id}/query`, { method: 'POST', body: JSON.stringify({ q }) })); }
    catch (e: any) { setError(e?.message || 'Query failed'); }
    finally { setSearching(false); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center"><Search size={22} className="text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Hybrid Search</h1>
          <p className="text-sm text-gray-400">BM25 + dense + reranker — per-corpus indexes with tunable fusion</p></div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}
      {loading && <div className="text-gray-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Loading...</div>}

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Indexes</h3>
          {indexes.map(i => (
            <button key={i.id} onClick={() => { setSelectedId(i.id); setResp(null); }} className={`w-full text-left bg-gray-900 border rounded-xl p-3 transition-colors ${selectedId === i.id ? 'border-violet-500' : 'border-gray-800 hover:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${FLAVOR_TONE[i.flavor]}`}>{i.flavor}</span>
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${STATUS_TONE[i.status]}`}>{i.status}</span>
              </div>
              <div className="text-white text-sm font-medium truncate">{i.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{i.corpus} · {i.model_name || 'no model'} · {i.total_chunks.toLocaleString()} chunks</div>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {selected && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-bold">{selected.name}</h2>
                  <p className="text-xs text-gray-400">{selected.model_name} · {selected.model_dimension}-dim · corpus <code>{selected.corpus}</code></p>
                </div>
                <button disabled={rebuildBusy === selected.id} onClick={rebuild} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><Hammer size={14} className={rebuildBusy === selected.id ? 'animate-pulse' : ''} />Rebuild</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Sliders size={12} />Hybrid alpha ({Number(selected.hybrid_alpha).toFixed(2)})</label>
                  <input type="range" min={0} max={1} step={0.05} value={selected.hybrid_alpha} onChange={e => patch('hybrid_alpha', parseFloat(e.target.value))} className="w-full" />
                  <div className="text-[10px] text-gray-500 flex justify-between"><span>BM25</span><span>Dense</span></div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Reranker</label>
                  <select value={selected.reranker || 'none'} onChange={e => patch('reranker', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm">
                    {rerankers.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">top_k / rerank_top_n</label>
                  <div className="flex gap-2">
                    <input type="number" value={selected.top_k} onChange={e => patch('top_k', parseInt(e.target.value) || 50)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm" />
                    <input type="number" value={selected.rerank_top_n} onChange={e => patch('rerank_top_n', parseInt(e.target.value) || 10)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex gap-2">
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && runQuery()} placeholder="Ask a question…" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <button disabled={searching || !selected} onClick={runQuery} className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Sparkles size={14} />Search</button>
            </div>
            {resp && (
              <div className="mt-4">
                <div className="text-xs text-gray-400 mb-3 flex flex-wrap gap-x-4">
                  <span>flavor: <span className="text-white">{resp.flavor}</span></span>
                  <span>alpha: <span className="text-white tabular-nums">{Number(resp.hybrid_alpha).toFixed(2)}</span></span>
                  <span>reranker: <span className="text-white">{resp.reranker || 'none'}</span></span>
                  <span>latency: <span className="text-white tabular-nums">{resp.latency_ms} ms</span></span>
                  <span>{resp.results.length} results</span>
                </div>
                <div className="space-y-2">
                  {resp.results.map((r, i) => (
                    <div key={r.chunk_id} className="bg-gray-950/60 border border-gray-800 rounded-lg p-3 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-white font-medium">#{i+1} · {r.document_title}</div>
                        <div className="text-xs text-gray-400 tabular-nums">
                          fused {Number(r.fused_score).toFixed(3)}{r.rerank_score !== undefined ? ` · rr ${Number(r.rerank_score).toFixed(3)}` : ''} · bm {r.bm25_hits} · dense {Number(r.dense_score).toFixed(3)}
                        </div>
                      </div>
                      <div className="text-[11px] text-violet-300 mb-1">{r.section_path}</div>
                      <p className="text-gray-200">{r.preview}</p>
                    </div>
                  ))}
                  {!resp.results.length && <div className="text-gray-500 text-sm text-center py-4">No matches.</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
