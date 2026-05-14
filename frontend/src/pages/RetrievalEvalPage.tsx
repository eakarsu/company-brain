import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Loader2, X, Trophy, FlaskConical, Sparkles } from 'lucide-react';
import { apiFetch } from '../api';

interface Run {
  id: number; name: string; index_id: number | null; index_name: string | null; corpus: string | null;
  model_id: number | null; model_name: string | null; model_provider: string | null;
  benchmark: string; num_queries: number;
  ndcg_at_10: number | null; recall_at_10: number | null; recall_at_50: number | null; mrr: number | null;
  latency_p50_ms: number | null; latency_p95_ms: number | null; run_at: string; notes: string | null;
}
interface RunDetail extends Run { results: Array<{ id: number; query: string; expected_doc_ids: string; retrieved_doc_ids: string; hit_rank: number; reciprocal_rank: number; }>; breakdown: { hit_at_1: number; hit_at_3: number; hit_at_10: number; misses: number; total_with_results: number; } }
interface LeaderRow { model_id: string; provider: string; benchmark: string; avg_ndcg_at_10: number; avg_recall_at_10: number; avg_mrr: number; avg_latency_p50_ms: number; runs: number; }
interface Benchmark { id: string; description: string; num_queries: number; }

function fmt(n: number | null, dp = 4): string { return n == null ? '—' : Number(n).toFixed(dp); }
function colorScore(v: number | null): string { if (v == null) return 'text-gray-400'; if (v >= 0.75) return 'text-emerald-300'; if (v >= 0.6) return 'text-blue-300'; if (v >= 0.4) return 'text-amber-300'; return 'text-red-300'; }

export default function RetrievalEvalPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [benchmarkFilter, setBenchmarkFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<number | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const qs = benchmarkFilter ? `?benchmark=${benchmarkFilter}` : '';
      const [r, lb, bm] = await Promise.all([
        apiFetch(`/retrieval-eval/runs${qs}`),
        apiFetch(`/retrieval-eval/leaderboard${qs}`),
        apiFetch('/retrieval-eval/benchmarks'),
      ]);
      setRuns(r); setLeaderboard(lb); setBenchmarks(bm);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [benchmarkFilter]);

  async function openDetail(id: number) {
    try { setDetail(await apiFetch(`/retrieval-eval/runs/${id}`)); }
    catch (e: any) { setError(e?.message || 'Open failed'); }
  }

  async function simulate(id: number) {
    setSimulatingId(id);
    try { await apiFetch(`/retrieval-eval/runs/${id}/simulate`, { method: 'POST', body: JSON.stringify({ force: true, sample: 50 }) }); await openDetail(id); }
    catch (e: any) { setError(e?.message || 'Simulate failed'); }
    finally { setSimulatingId(null); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-600 flex items-center justify-center"><Activity size={22} className="text-white" /></div>
          <div><h1 className="text-2xl font-bold text-white">Retrieval Evaluation</h1>
            <p className="text-sm text-gray-400">MTEB-style runs: NDCG@10 · Recall@10/50 · MRR · latency</p></div>
        </div>
        <select value={benchmarkFilter} onChange={e => setBenchmarkFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">All benchmarks</option>
          {benchmarks.map(b => <option key={b.id} value={b.id}>{b.id} ({b.num_queries} q)</option>)}
        </select>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}
      {loading && <div className="text-gray-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Loading…</div>}

      {leaderboard.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-3"><Trophy size={16} />Leaderboard</h3>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-400 uppercase">
              <tr><th className="text-left pb-2">Model</th><th className="text-left pb-2">Benchmark</th><th className="text-right pb-2">NDCG@10</th><th className="text-right pb-2">Recall@10</th><th className="text-right pb-2">MRR</th><th className="text-right pb-2">p50</th><th className="text-right pb-2">Runs</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {leaderboard.map((r, i) => (
                <tr key={`${r.model_id}-${r.benchmark}-${i}`}>
                  <td className="py-1.5 text-white font-mono text-xs">{r.model_id}<span className="text-gray-500"> ({r.provider})</span></td>
                  <td className="text-gray-300 text-xs">{r.benchmark}</td>
                  <td className={`text-right tabular-nums ${colorScore(r.avg_ndcg_at_10)}`}>{fmt(r.avg_ndcg_at_10)}</td>
                  <td className={`text-right tabular-nums ${colorScore(r.avg_recall_at_10)}`}>{fmt(r.avg_recall_at_10)}</td>
                  <td className={`text-right tabular-nums ${colorScore(r.avg_mrr)}`}>{fmt(r.avg_mrr)}</td>
                  <td className="text-right text-gray-300 tabular-nums">{r.avg_latency_p50_ms ?? '—'} ms</td>
                  <td className="text-right text-gray-400 tabular-nums">{r.runs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><FlaskConical size={16} />Recent runs</h3>
        <div className="grid gap-2">
          {runs.map(r => (
            <div key={r.id} onClick={() => openDetail(r.id)} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-cyan-700/40 cursor-pointer">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.benchmark} · {r.index_name || '—'} · {r.model_name || '—'} ({r.model_provider}) · {r.num_queries} queries</div>
                </div>
                <div className="flex gap-3 text-sm tabular-nums whitespace-nowrap">
                  <span className="text-gray-400">NDCG@10 <span className={colorScore(r.ndcg_at_10)}>{fmt(r.ndcg_at_10)}</span></span>
                  <span className="text-gray-400">R@10 <span className={colorScore(r.recall_at_10)}>{fmt(r.recall_at_10)}</span></span>
                  <span className="text-gray-400">MRR <span className={colorScore(r.mrr)}>{fmt(r.mrr)}</span></span>
                  <span className="text-gray-400">p50 <span className="text-white">{r.latency_p50_ms ?? '—'}ms</span></span>
                </div>
              </div>
              {r.notes && <div className="text-xs text-gray-500 mt-2 italic">{r.notes}</div>}
            </div>
          ))}
          {!runs.length && !loading && <div className="text-gray-500 text-sm text-center py-6">No runs yet.</div>}
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-white font-bold text-lg">{detail.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{detail.benchmark} · index <code>{detail.index_name}</code> · model <code>{detail.model_name}</code></p>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mb-4">
              <div className="bg-gray-950/60 rounded-lg p-3"><div className="text-xs text-gray-400">Hit@1</div><div className="text-white tabular-nums">{detail.breakdown.hit_at_1}</div></div>
              <div className="bg-gray-950/60 rounded-lg p-3"><div className="text-xs text-gray-400">Hit@3</div><div className="text-white tabular-nums">{detail.breakdown.hit_at_3}</div></div>
              <div className="bg-gray-950/60 rounded-lg p-3"><div className="text-xs text-gray-400">Hit@10</div><div className="text-white tabular-nums">{detail.breakdown.hit_at_10}</div></div>
              <div className="bg-gray-950/60 rounded-lg p-3"><div className="text-xs text-gray-400">Misses</div><div className="text-red-300 tabular-nums">{detail.breakdown.misses}</div></div>
              <div className="bg-gray-950/60 rounded-lg p-3"><div className="text-xs text-gray-400">Total</div><div className="text-white tabular-nums">{detail.breakdown.total_with_results}</div></div>
            </div>
            <button disabled={simulatingId === detail.id} onClick={() => simulate(detail.id)} className="mb-4 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><Sparkles size={14} />Generate 50 sample per-query rows</button>
            <table className="w-full text-xs">
              <thead className="text-gray-400 uppercase"><tr><th className="text-left pb-2">Query</th><th className="text-left pb-2">Expected</th><th className="text-left pb-2">Retrieved (top 5)</th><th className="text-right pb-2">Rank</th><th className="text-right pb-2">RR</th></tr></thead>
              <tbody className="divide-y divide-gray-800">
                {detail.results.map(rs => (
                  <tr key={rs.id} className={rs.hit_rank ? '' : 'opacity-60'}>
                    <td className="py-1.5 text-gray-200 max-w-xs truncate">{rs.query}</td>
                    <td className="text-gray-400">{rs.expected_doc_ids}</td>
                    <td className="text-gray-400">{rs.retrieved_doc_ids}</td>
                    <td className={`text-right tabular-nums ${rs.hit_rank === 1 ? 'text-emerald-300' : rs.hit_rank > 0 ? 'text-blue-300' : 'text-red-300'}`}>{rs.hit_rank || '—'}</td>
                    <td className="text-right text-white tabular-nums">{fmt(rs.reciprocal_rank, 3)}</td>
                  </tr>
                ))}
                {!detail.results.length && <tr><td colSpan={5} className="text-center text-gray-500 py-4">No per-query rows. Click "Generate" above.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
