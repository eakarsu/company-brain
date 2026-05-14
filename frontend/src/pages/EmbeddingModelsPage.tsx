import { useEffect, useState } from 'react';
import { Cpu, Star, AlertTriangle, Loader2, GitCompare, DollarSign, HardDrive } from 'lucide-react';
import { apiFetch } from '../api';

interface Model {
  id: number; model_id: string; provider: string; dimension: number; max_tokens: number;
  cost_per_million_tokens_usd: number; mteb_avg: number | null; retrieval_avg: number | null;
  released_on: string | null; description: string | null; is_default: boolean;
  jobs_using: number; indexes_using: number;
}

interface ComparisonItem {
  model_id: string; provider: string; dimension: number; retrieval_avg: number | null;
  workload_cost_usd: number; storage_mb: number; cost_per_million_tokens_usd: number;
}
interface CompareResp {
  workload: { docs: number; avg_tokens_per_doc: number; total_tokens: number };
  comparison: ComparisonItem[];
  verdict: { cheapest: any; best_perf: any; best_value: any };
}

const PROVIDER_TONE: Record<string,string> = {
  openai: 'bg-emerald-500/20 text-emerald-300', voyage: 'bg-violet-500/20 text-violet-300',
  cohere: 'bg-cyan-500/20 text-cyan-300', baai: 'bg-amber-500/20 text-amber-300',
  mixedbread: 'bg-pink-500/20 text-pink-300', nomic: 'bg-blue-500/20 text-blue-300',
  mistral: 'bg-orange-500/20 text-orange-300',
};

export default function EmbeddingModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [docs, setDocs] = useState(10000);
  const [avgTok, setAvgTok] = useState(2500);
  const [resp, setResp] = useState<CompareResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch('/embedding-models');
      setModels(data);
      // Default selection: top 3 by retrieval score
      const top3 = [...data].sort((a: Model, b: Model) => (b.retrieval_avg || 0) - (a.retrieval_avg || 0)).slice(0, 3).map((m: Model) => m.id);
      if (!selected.length) setSelected(top3);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function toggle(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length >= 4 ? prev : [...prev, id]));
    setResp(null);
  }

  async function compare() {
    if (selected.length < 2) { setError('Select 2-4 models to compare'); return; }
    setComparing(true); setError(null); setResp(null);
    try { setResp(await apiFetch('/embedding-models/compare', { method: 'POST', body: JSON.stringify({ ids: selected, docs, avg_tokens_per_doc: avgTok }) })); }
    catch (e: any) { setError(e?.message || 'Compare failed'); }
    finally { setComparing(false); }
  }

  async function setDefault(id: number) {
    try {
      await apiFetch(`/embedding-models/${id}`, { method: 'PATCH', body: JSON.stringify({ is_default: true }) });
      await load();
    } catch (e: any) { setError(e?.message || 'Update failed'); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center"><Cpu size={22} className="text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Embedding Models</h1>
          <p className="text-sm text-gray-400">OpenAI text-embedding-3, Voyage-3, Cohere v3, BGE-M3 — real MTEB scores</p></div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}
      {loading && <div className="text-gray-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Loading...</div>}

      <div className="grid gap-2">
        {models.map(m => (
          <div key={m.id} className={`bg-gray-900 border rounded-xl p-4 flex items-center gap-4 transition-colors ${selected.includes(m.id) ? 'border-emerald-500' : 'border-gray-800'}`}>
            <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} disabled={!selected.includes(m.id) && selected.length >= 4} className="w-4 h-4 accent-emerald-500" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${PROVIDER_TONE[m.provider] || 'bg-gray-700/40 text-gray-300'}`}>{m.provider}</span>
                <span className="text-white font-medium font-mono text-sm">{m.model_id}</span>
                {m.is_default && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded flex items-center gap-1"><Star size={10} />default</span>}
              </div>
              <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>{m.dimension}-dim</span>
                <span>{m.max_tokens.toLocaleString()} tok ctx</span>
                <span>${Number(m.cost_per_million_tokens_usd).toFixed(4)}/M tok</span>
                <span>MTEB avg: <span className="text-white tabular-nums">{m.mteb_avg ?? '—'}</span></span>
                <span>Retrieval avg: <span className="text-white tabular-nums">{m.retrieval_avg ?? '—'}</span></span>
                <span>Used by: {m.jobs_using} jobs, {m.indexes_using} indexes</span>
              </div>
              {m.description && <p className="text-xs text-gray-300 mt-1">{m.description}</p>}
            </div>
            {!m.is_default && <button onClick={() => setDefault(m.id)} className="text-xs text-yellow-300 hover:text-yellow-200 underline">Set default</button>}
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><GitCompare size={16} />Workload comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Docs</label>
            <input type="number" value={docs} onChange={e => setDocs(parseInt(e.target.value) || 1000)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Avg tokens/doc</label>
            <input type="number" value={avgTok} onChange={e => setAvgTok(parseInt(e.target.value) || 1)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <button disabled={comparing || selected.length < 2} onClick={compare} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">{comparing ? 'Comparing…' : `Compare ${selected.length} models`}</button>
        </div>
        {resp && (
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-3">Workload: {resp.workload.docs.toLocaleString()} docs × {resp.workload.avg_tokens_per_doc.toLocaleString()} tok = {resp.workload.total_tokens.toLocaleString()} tokens</div>
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 uppercase">
                <tr><th className="text-left pb-2">Model</th><th className="text-right pb-2">Dim</th><th className="text-right pb-2">Retrieval</th><th className="text-right pb-2"><DollarSign size={11} className="inline" />Cost</th><th className="text-right pb-2"><HardDrive size={11} className="inline" />Storage</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {resp.comparison.map(c => (
                  <tr key={c.model_id}>
                    <td className="py-2 text-white font-mono text-xs">{c.model_id} <span className="text-gray-500">({c.provider})</span></td>
                    <td className="text-right text-gray-300 tabular-nums">{c.dimension}</td>
                    <td className="text-right text-white tabular-nums">{c.retrieval_avg ?? '—'}</td>
                    <td className="text-right text-yellow-300 tabular-nums">${c.workload_cost_usd.toFixed(2)}</td>
                    <td className="text-right text-gray-300 tabular-nums">{c.storage_mb.toLocaleString()} MB</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-3"><div className="text-xs text-gray-400">Cheapest</div><div className="text-white font-mono text-xs mt-1">{resp.verdict.cheapest.model}</div><div className="text-xs text-yellow-300 mt-0.5">${resp.verdict.cheapest.cost_usd.toFixed(2)}</div></div>
              <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-3"><div className="text-xs text-gray-400">Best performance</div><div className="text-white font-mono text-xs mt-1">{resp.verdict.best_perf.model}</div><div className="text-xs text-emerald-300 mt-0.5">{resp.verdict.best_perf.retrieval_avg} retrieval avg</div></div>
              <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-3"><div className="text-xs text-gray-400">Best value</div><div className="text-white font-mono text-xs mt-1">{resp.verdict.best_value.model}</div><div className="text-xs text-violet-300 mt-0.5">{resp.verdict.best_value.retrieval_avg} @ ${resp.verdict.best_value.cost_usd.toFixed(2)}</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
