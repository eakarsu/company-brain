import { useState, useEffect } from 'react';
import { Plus, Search, GitBranch, X, RotateCcw, Lock } from 'lucide-react';
import { apiFetch } from '../api';
import { Decision } from '../types';

const IMPACT_COLORS: Record<string,string> = { low:'bg-green-500/20 text-green-300', medium:'bg-yellow-500/20 text-yellow-300', high:'bg-orange-500/20 text-orange-300', critical:'bg-red-500/20 text-red-300' };

export default function DecisionsPage() {
  const [items, setItems] = useState<Decision[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Decision|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Decision|null>(null);
  const [form, setForm] = useState({ title:'',context:'',decision_made:'',rationale:'',made_by:'',decision_date:'',impact_level:'medium',tags:'',reversible:true });

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const data = await apiFetch(`/decisions?${params}`);
    setItems(data);
  }

  useEffect(() => { load(); }, [search]);

  async function save() {
    if (editing) {
      await apiFetch(`/decisions/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch('/decisions', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); load();
  }

  async function remove(id: number) {
    await apiFetch(`/decisions/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function openEdit(item: Decision) {
    setEditing(item);
    setForm({ title:item.title, context:item.context||'', decision_made:item.decision_made||'', rationale:item.rationale||'', made_by:item.made_by||'', decision_date:item.decision_date||'', impact_level:item.impact_level||'medium', tags:item.tags||'', reversible:item.reversible!==false });
    setShowForm(true);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Decisions</h1>
        <button onClick={() => { setEditing(null); setForm({ title:'',context:'',decision_made:'',rationale:'',made_by:'',decision_date:'',impact_level:'medium',tags:'',reversible:true }); setShowForm(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> New Decision
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search decisions..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <GitBranch size={14} className="text-yellow-400" />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${IMPACT_COLORS[item.impact_level]||'bg-gray-700 text-gray-300'}`}>{item.impact_level} impact</span>
                  {item.reversible ? <RotateCcw size={12} className="text-green-400" /> : <Lock size={12} className="text-red-400" />}
                </div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-gray-400 mt-1">By {item.made_by} • {item.decision_date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{selected.title}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${IMPACT_COLORS[selected.impact_level]}`}>{selected.impact_level} impact</span>
              <span className={`text-xs px-2 py-1 rounded-full ${selected.reversible ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {selected.reversible ? 'Reversible' : 'Irreversible'}
              </span>
            </div>
            <div><p className="text-xs text-gray-500 mb-1">Context</p><p className="text-gray-200 text-sm">{selected.context}</p></div>
            <div><p className="text-xs text-gray-500 mb-1">Decision Made</p><p className="text-white font-medium text-sm">{selected.decision_made}</p></div>
            <div><p className="text-xs text-gray-500 mb-1">Rationale</p><p className="text-gray-200 text-sm">{selected.rationale}</p></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Made By</p><p className="text-white">{selected.made_by}</p></div>
              <div><p className="text-xs text-gray-500">Date</p><p className="text-white">{selected.decision_date}</p></div>
            </div>
            {selected.tags && <div><p className="text-xs text-gray-500 mb-1">Tags</p><p className="text-gray-300 text-sm">{selected.tags}</p></div>}
            <div className="flex gap-2 pt-2">
              <button onClick={() => openEdit(selected)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium">Edit</button>
              <button onClick={() => remove(selected.id)} className="flex-1 bg-red-600/80 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'New'} Decision</h2>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="Decision title"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={form.context} onChange={e => setForm({...form,context:e.target.value})} placeholder="Context / problem statement"
                rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <textarea value={form.decision_made} onChange={e => setForm({...form,decision_made:e.target.value})} placeholder="Decision made"
                rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <textarea value={form.rationale} onChange={e => setForm({...form,rationale:e.target.value})} placeholder="Rationale"
                rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.made_by} onChange={e => setForm({...form,made_by:e.target.value})} placeholder="Made by"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input type="date" value={form.decision_date} onChange={e => setForm({...form,decision_date:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <select value={form.impact_level} onChange={e => setForm({...form,impact_level:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {['low','medium','high','critical'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <input value={form.tags} onChange={e => setForm({...form,tags:e.target.value})} placeholder="Tags"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.reversible} onChange={e => setForm({...form,reversible:e.target.checked})} />
                Reversible decision
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
