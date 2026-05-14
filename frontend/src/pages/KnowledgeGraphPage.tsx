import { useEffect, useMemo, useState } from 'react';
import { Network, Search, Loader2, AlertTriangle, Sparkles, ArrowRight, X } from 'lucide-react';
import { apiFetch } from '../api';

interface Entity { id: number; name: string; type: string; aliases: string | null; confidence: number; occurrences: number; first_seen_doc_id: number | null; }
interface Relation { id: number; relation: string; confidence: number; evidence_snippet: string | null; evidence_doc_id: number | null; other_id: number; other_name: string; other_type: string; }
interface EntityDetail extends Entity { outgoing: Relation[]; incoming: Relation[]; }
interface GraphNode { id: number; label: string; type: string; weight: number; }
interface GraphEdge { id: number; source: number; target: number; label: string; confidence: number; }
interface Stats { totals: { entities: number; relations: number; avg_relation_confidence: number }; entities_by_type: Array<{ type: string; c: number }>; relations_by_kind: Array<{ relation: string; c: number }>; }

const TYPE_TONE: Record<string,string> = {
  person:'bg-emerald-500/20 text-emerald-300', team:'bg-blue-500/20 text-blue-300', role:'bg-cyan-500/20 text-cyan-300',
  system:'bg-violet-500/20 text-violet-300', vendor:'bg-amber-500/20 text-amber-300', project:'bg-pink-500/20 text-pink-300',
  concept:'bg-gray-500/20 text-gray-300', policy_ref:'bg-red-500/20 text-red-300', decision_ref:'bg-yellow-500/20 text-yellow-300',
};

export default function KnowledgeGraphPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detail, setDetail] = useState<EntityDetail | null>(null);
  const [extractDocId, setExtractDocId] = useState<number | ''>('');
  const [extractResult, setExtractResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (typeFilter) qs.set('type', typeFilter);
      const [list, s, g] = await Promise.all([
        apiFetch(`/knowledge-graph/entities?${qs}`),
        apiFetch('/knowledge-graph/stats'),
        apiFetch('/knowledge-graph/graph?limit=40'),
      ]);
      setEntities(list); setStats(s); setGraph(g);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [search, typeFilter]);

  async function openDetail(id: number) {
    try { setDetail(await apiFetch(`/knowledge-graph/entities/${id}`)); }
    catch (e: any) { setError(e?.message || 'Failed to load entity'); }
  }

  async function extract() {
    if (!extractDocId) return;
    setExtractResult(null);
    try { setExtractResult(await apiFetch('/knowledge-graph/extract', { method: 'POST', body: JSON.stringify({ document_id: extractDocId }) })); }
    catch (e: any) { setError(e?.message || 'Extract failed'); }
  }

  // Build SVG positions for graph nodes (force-free circular layout)
  const layout = useMemo(() => {
    if (!graph) return null;
    const cx = 400, cy = 240, R = 200;
    const n = graph.nodes.length;
    const pos: Record<number, { x: number; y: number }> = {};
    graph.nodes.forEach((nd, i) => {
      const a = (i / n) * Math.PI * 2;
      pos[nd.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });
    return pos;
  }, [graph]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-pink-600 flex items-center justify-center"><Network size={22} className="text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Knowledge Graph</h1>
          <p className="text-sm text-gray-400">Entities + relations extracted from your corpus</p></div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-2xl font-bold text-white tabular-nums">{stats.totals.entities}</div><div className="text-xs text-gray-400 mt-1">Entities</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-2xl font-bold text-white tabular-nums">{stats.totals.relations}</div><div className="text-xs text-gray-400 mt-1">Relations</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-2xl font-bold text-emerald-300 tabular-nums">{stats.totals.avg_relation_confidence ?? '—'}</div><div className="text-xs text-gray-400 mt-1">Avg confidence</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-sm text-gray-300 truncate">{(stats.relations_by_kind || []).slice(0, 4).map(r => `${r.relation}(${r.c})`).join(', ')}</div><div className="text-xs text-gray-400 mt-1">Top relations</div></div>
        </div>
      )}

      {graph && layout && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-2 text-sm">Top-{graph.nodes.length} entity neighborhood</h3>
          <svg viewBox="0 0 800 480" className="w-full h-80">
            {graph.edges.map(e => {
              const a = layout[e.source], b = layout[e.target];
              if (!a || !b) return null;
              return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#4b5563" strokeWidth={1 + e.confidence} opacity={0.6} />;
            })}
            {graph.nodes.map(nd => {
              const p = layout[nd.id];
              return (
                <g key={nd.id} className="cursor-pointer" onClick={() => openDetail(nd.id)}>
                  <circle cx={p.x} cy={p.y} r={Math.max(6, Math.min(18, Math.sqrt(nd.weight) * 2))} fill={nd.type === 'person' ? '#34d399' : nd.type === 'system' ? '#a78bfa' : nd.type === 'team' ? '#60a5fa' : '#f472b6'} stroke="#1f2937" strokeWidth={2} />
                  <text x={p.x} y={p.y + 28} textAnchor="middle" fill="#e5e7eb" fontSize={10}>{nd.label.length > 18 ? nd.label.slice(0, 16) + '…' : nd.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entities…" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              <option value="">All types</option>
              {Object.keys(TYPE_TONE).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {loading && !entities.length && <div className="text-gray-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Loading…</div>}
          <div className="grid gap-2">
            {entities.map(e => (
              <div key={e.id} onClick={() => openDetail(e.id)} className="bg-gray-900 border border-gray-800 hover:border-pink-700/40 rounded-xl p-3 cursor-pointer flex items-center gap-3">
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${TYPE_TONE[e.type] || 'bg-gray-700/40 text-gray-300'}`}>{e.type}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{e.name}</div>
                  {e.aliases && <div className="text-xs text-gray-400">aka {e.aliases}</div>}
                </div>
                <div className="text-xs text-gray-400 tabular-nums">{e.occurrences}× · {Number(e.confidence).toFixed(2)}</div>
              </div>
            ))}
            {!entities.length && !loading && <div className="text-gray-500 text-sm text-center py-6">No entities.</div>}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-2 text-sm"><Sparkles size={14} />Extract from document</h3>
            <input type="number" value={extractDocId} onChange={e => setExtractDocId(parseInt(e.target.value) || '')} placeholder="document_id" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <button onClick={extract} disabled={!extractDocId} className="mt-2 w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium">Find entities</button>
            {extractResult && (
              <div className="mt-3 text-sm">
                <div className="text-xs text-gray-400 mb-2">{extractResult.matches.length} entities in "{extractResult.document_title}"</div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {extractResult.matches.map((m: any) => (
                    <div key={m.entity_id} onClick={() => openDetail(m.entity_id)} className="flex items-center justify-between text-xs bg-gray-950/60 rounded-lg px-2 py-1.5 cursor-pointer">
                      <span className="text-white">{m.name}</span>
                      <span className="text-gray-400 tabular-nums">{m.hits}× · {m.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-white font-bold text-lg">{detail.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5"><span className={`px-2 py-0.5 rounded ${TYPE_TONE[detail.type]}`}>{detail.type}</span> · {detail.occurrences} occurrences · confidence {Number(detail.confidence).toFixed(2)}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            {detail.aliases && <div className="text-xs text-gray-300 mb-3">aka: {detail.aliases}</div>}
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Outgoing ({detail.outgoing.length})</h4>
                <div className="space-y-1">{detail.outgoing.map(r => (
                  <div key={r.id} className="bg-gray-950/60 rounded-lg px-2 py-1.5 text-xs">
                    <div className="flex items-center gap-1 text-gray-300"><span className="text-violet-300">{r.relation}</span><ArrowRight size={11} /><span className="text-white">{r.other_name}</span><span className="text-gray-500">({r.other_type})</span></div>
                    {r.evidence_snippet && <div className="text-gray-500 mt-0.5 italic">"{r.evidence_snippet}"</div>}
                  </div>))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Incoming ({detail.incoming.length})</h4>
                <div className="space-y-1">{detail.incoming.map(r => (
                  <div key={r.id} className="bg-gray-950/60 rounded-lg px-2 py-1.5 text-xs">
                    <div className="flex items-center gap-1 text-gray-300"><span className="text-white">{r.other_name}</span><ArrowRight size={11} /><span className="text-violet-300">{r.relation}</span></div>
                    {r.evidence_snippet && <div className="text-gray-500 mt-0.5 italic">"{r.evidence_snippet}"</div>}
                  </div>))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
