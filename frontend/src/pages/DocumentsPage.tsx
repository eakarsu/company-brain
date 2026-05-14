import { useState, useEffect } from 'react';
import { Plus, Search, FileText, X, ExternalLink } from 'lucide-react';
import { apiFetch } from '../api';
import { Document } from '../types';

export default function DocumentsPage() {
  const [items, setItems] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Document|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Document|null>(null);
  const [form, setForm] = useState({ title:'',source_url:'',content:'',department:'',doc_type:'',status:'active',last_updated:'',word_count:0,indexed:false });

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const data = await apiFetch(`/documents?${params}`);
    setItems(data);
  }

  useEffect(() => { load(); }, [search]);

  async function save() {
    if (editing) {
      await apiFetch(`/documents/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch('/documents', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); load();
  }

  async function remove(id: number) {
    await apiFetch(`/documents/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function openEdit(item: Document) {
    setEditing(item);
    setForm({ title:item.title, source_url:item.source_url||'', content:item.content||'', department:item.department||'', doc_type:item.doc_type||'', status:item.status||'active', last_updated:item.last_updated||'', word_count:item.word_count||0, indexed:item.indexed||false });
    setShowForm(true);
  }

  const STATUS_COLORS: Record<string,string> = { active:'bg-green-500/20 text-green-300', archived:'bg-gray-500/20 text-gray-300', draft:'bg-yellow-500/20 text-yellow-300', confidential:'bg-red-500/20 text-red-300' };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Documents</h1>
        <button onClick={() => { setEditing(null); setForm({ title:'',source_url:'',content:'',department:'',doc_type:'',status:'active',last_updated:'',word_count:0,indexed:false }); setShowForm(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> Add Document
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className="text-purple-400" />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]||'bg-gray-700 text-gray-300'}`}>{item.status}</span>
                  <span className="text-xs text-gray-500">{item.department} • {item.doc_type}</span>
                  {item.indexed && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">indexed</span>}
                </div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                {item.content && <p className="text-sm text-gray-400 mt-1 line-clamp-1">{item.content}</p>}
              </div>
              <div className="text-xs text-gray-500 ml-4">{item.word_count?.toLocaleString()} words</div>
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
            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[selected.status]||'bg-gray-700 text-gray-300'}`}>{selected.status}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">{selected.doc_type}</span>
              {selected.indexed && <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">indexed</span>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Department</p><p className="text-white">{selected.department}</p></div>
              <div><p className="text-xs text-gray-500">Last Updated</p><p className="text-white">{selected.last_updated}</p></div>
              <div><p className="text-xs text-gray-500">Word Count</p><p className="text-white">{selected.word_count?.toLocaleString()}</p></div>
            </div>
            {selected.content && <div><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-gray-200 text-sm">{selected.content}</p></div>}
            {selected.source_url && (
              <a href={selected.source_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm">
                <ExternalLink size={14} /> View Source
              </a>
            )}
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
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'Add'} Document</h2>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="Title"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.source_url} onChange={e => setForm({...form,source_url:e.target.value})} placeholder="Source URL"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={form.content} onChange={e => setForm({...form,content:e.target.value})} placeholder="Description"
                rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.department} onChange={e => setForm({...form,department:e.target.value})} placeholder="Department"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input value={form.doc_type} onChange={e => setForm({...form,doc_type:e.target.value})} placeholder="Doc Type"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <select value={form.status} onChange={e => setForm({...form,status:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {['active','draft','archived','confidential'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="date" value={form.last_updated} onChange={e => setForm({...form,last_updated:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="indexed" checked={form.indexed} onChange={e => setForm({...form,indexed:e.target.checked})}
                  className="rounded" />
                <label htmlFor="indexed" className="text-sm text-gray-300">Indexed</label>
              </div>
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
