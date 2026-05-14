import { useState, useEffect } from 'react';
import { Plus, Search, Shield, X } from 'lucide-react';
import { apiFetch } from '../api';
import { Policy } from '../types';

const STATUS_COLORS: Record<string,string> = { active:'bg-green-500/20 text-green-300', inactive:'bg-gray-500/20 text-gray-300', draft:'bg-yellow-500/20 text-yellow-300', archived:'bg-red-500/20 text-red-300' };

export default function PoliciesPage() {
  const [items, setItems] = useState<Policy[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Policy|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Policy|null>(null);
  const [form, setForm] = useState({ name:'',category:'',content:'',effective_date:'',owner:'',approved_by:'',review_date:'',status:'active' });

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const data = await apiFetch(`/policies?${params}`);
    setItems(data);
  }

  useEffect(() => { load(); }, [search]);

  async function save() {
    if (editing) {
      await apiFetch(`/policies/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch('/policies', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); load();
  }

  async function remove(id: number) {
    await apiFetch(`/policies/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function openEdit(item: Policy) {
    setEditing(item);
    setForm({ name:item.name, category:item.category||'', content:item.content||'', effective_date:item.effective_date||'', owner:item.owner||'', approved_by:item.approved_by||'', review_date:item.review_date||'', status:item.status||'active' });
    setShowForm(true);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Policies</h1>
        <button onClick={() => { setEditing(null); setForm({ name:'',category:'',content:'',effective_date:'',owner:'',approved_by:'',review_date:'',status:'active' }); setShowForm(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> New Policy
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search policies..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={14} className="text-red-400" />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]||'bg-gray-700 text-gray-300'}`}>{item.status}</span>
                  <span className="text-xs text-gray-500">{item.category}</span>
                </div>
                <h3 className="font-semibold text-white">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-1">Owner: {item.owner} • Approved by: {item.approved_by}</p>
              </div>
              <div className="text-xs text-gray-500 ml-4 text-right">
                <div>Effective</div>
                <div>{item.effective_date}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{selected.name}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[selected.status]||'bg-gray-700 text-gray-300'}`}>{selected.status}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">{selected.category}</span>
            </div>
            <div><p className="text-xs text-gray-500 mb-1">Policy Content</p><p className="text-gray-200 text-sm whitespace-pre-wrap">{selected.content}</p></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Owner</p><p className="text-white">{selected.owner}</p></div>
              <div><p className="text-xs text-gray-500">Approved By</p><p className="text-white">{selected.approved_by}</p></div>
              <div><p className="text-xs text-gray-500">Effective Date</p><p className="text-white">{selected.effective_date}</p></div>
              <div><p className="text-xs text-gray-500">Review Date</p><p className="text-white">{selected.review_date}</p></div>
            </div>
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
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'New'} Policy</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Policy name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.category} onChange={e => setForm({...form,category:e.target.value})} placeholder="Category"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={form.content} onChange={e => setForm({...form,content:e.target.value})} placeholder="Policy content"
                rows={5} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.owner} onChange={e => setForm({...form,owner:e.target.value})} placeholder="Owner"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input value={form.approved_by} onChange={e => setForm({...form,approved_by:e.target.value})} placeholder="Approved by"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input type="date" value={form.effective_date} onChange={e => setForm({...form,effective_date:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Effective date" />
                <input type="date" value={form.review_date} onChange={e => setForm({...form,review_date:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Review date" />
              </div>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {['active','draft','archived','inactive'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
