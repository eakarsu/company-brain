import { useState, useEffect } from 'react';
import { Plus, Search, MessageSquare, X, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '../api';
import { Query } from '../types';

export default function QueriesPage() {
  const [items, setItems] = useState<Query[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Query|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Query|null>(null);
  const [form, setForm] = useState({ question:'',answer:'',confidence:0.9,helpful:true,sources:'' });

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const data = await apiFetch(`/queries?${params}`);
    setItems(data);
  }

  useEffect(() => { load(); }, [search]);

  async function save() {
    if (editing) {
      await apiFetch(`/queries/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch('/queries', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); load();
  }

  async function remove(id: number) {
    await apiFetch(`/queries/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Query History</h1>
        <button onClick={() => { setEditing(null); setForm({ question:'',answer:'',confidence:0.9,helpful:true,sources:'' }); setShowForm(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> Add Query
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search queries..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={14} className="text-blue-400" />
                  <span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                  {item.helpful !== null && (
                    item.helpful
                      ? <CheckCircle size={14} className="text-green-400" />
                      : <XCircle size={14} className="text-red-400" />
                  )}
                </div>
                <h3 className="font-semibold text-white">{item.question}</h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.answer}</p>
              </div>
              {item.confidence && (
                <div className="ml-4 text-right">
                  <div className="text-xs text-gray-500">Confidence</div>
                  <div className="text-sm font-semibold text-green-400">{(Number(item.confidence)*100).toFixed(0)}%</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Query Detail</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div><p className="text-xs text-gray-500 mb-1">Question</p><p className="text-white font-medium">{selected.question}</p></div>
            <div><p className="text-xs text-gray-500 mb-1">Answer</p><p className="text-gray-200 text-sm whitespace-pre-wrap">{selected.answer}</p></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Confidence</p><p className="text-green-400 font-semibold">{selected.confidence ? (Number(selected.confidence)*100).toFixed(0)+'%' : 'N/A'}</p></div>
              <div><p className="text-xs text-gray-500">Helpful</p><p className="text-white">{selected.helpful === null ? 'Unrated' : selected.helpful ? 'Yes' : 'No'}</p></div>
              <div><p className="text-xs text-gray-500">Date</p><p className="text-white">{new Date(selected.created_at).toLocaleDateString()}</p></div>
            </div>
            {selected.sources && <div><p className="text-xs text-gray-500 mb-1">Sources</p><p className="text-gray-300 text-sm">{selected.sources}</p></div>}
            <div className="flex gap-2 pt-2">
              <button onClick={() => remove(selected.id)} className="flex-1 bg-red-600/80 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Add Query</h2>
            <div className="space-y-3">
              <textarea value={form.question} onChange={e => setForm({...form,question:e.target.value})} placeholder="Question"
                rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <textarea value={form.answer} onChange={e => setForm({...form,answer:e.target.value})} placeholder="Answer"
                rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <input type="number" min={0} max={1} step={0.01} value={form.confidence} onChange={e => setForm({...form,confidence:parseFloat(e.target.value)})} placeholder="Confidence (0-1)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.sources} onChange={e => setForm({...form,sources:e.target.value})} placeholder="Sources"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.helpful} onChange={e => setForm({...form,helpful:e.target.checked})} />
                Marked as helpful
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
