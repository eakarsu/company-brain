import { useState, useEffect } from 'react';
import { Plus, Search, Eye, ThumbsUp, X } from 'lucide-react';
import { apiFetch } from '../api';
import { KnowledgeEntry } from '../types';

const CATEGORIES = ['procedure','policy','decision','contact','process','guideline'];
const SOURCE_TYPES = ['slack','email','document','ticket','meeting','wiki'];
const CATEGORY_COLORS: Record<string,string> = {
  procedure: 'bg-blue-500/20 text-blue-300',
  policy: 'bg-red-500/20 text-red-300',
  decision: 'bg-yellow-500/20 text-yellow-300',
  contact: 'bg-green-500/20 text-green-300',
  process: 'bg-purple-500/20 text-purple-300',
  guideline: 'bg-orange-500/20 text-orange-300',
};

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeEntry[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<KnowledgeEntry|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KnowledgeEntry|null>(null);
  const [form, setForm] = useState({ title:'',category:'procedure',content:'',source_type:'document',author:'',department:'',tags:'' });

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    const data = await apiFetch(`/knowledge?${params}`);
    setItems(data);
  }

  useEffect(() => { load(); }, [search, category]);

  async function save() {
    if (editing) {
      await apiFetch(`/knowledge/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch('/knowledge', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); setForm({ title:'',category:'procedure',content:'',source_type:'document',author:'',department:'',tags:'' }); load();
  }

  async function remove(id: number) {
    await apiFetch(`/knowledge/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function openEdit(item: KnowledgeEntry) {
    setEditing(item);
    setForm({ title: item.title, category: item.category, content: item.content, source_type: item.source_type, author: item.author, department: item.department, tags: item.tags });
    setShowForm(true);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Knowledge Entries</h1>
        <button onClick={() => { setEditing(null); setForm({ title:'',category:'procedure',content:'',source_type:'document',author:'',department:'',tags:'' }); setShowForm(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> New Entry
        </button>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search knowledge..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] || 'bg-gray-700 text-gray-300'}`}>{item.category}</span>
                  <span className="text-xs text-gray-500">{item.source_type} • {item.department}</span>
                </div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.content}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 ml-4 flex-shrink-0">
                <span className="flex items-center gap-1"><Eye size={12} />{item.views}</span>
                <span className="flex items-center gap-1"><ThumbsUp size={12} />{item.helpful_votes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{selected.title}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full ${CATEGORY_COLORS[selected.category]}`}>{selected.category}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">{selected.source_type}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">{selected.department}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Content</p>
              <p className="text-gray-200 text-sm whitespace-pre-wrap">{selected.content}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Author</p><p className="text-white">{selected.author}</p></div>
              <div><p className="text-xs text-gray-500">Created</p><p className="text-white">{new Date(selected.created_at).toLocaleDateString()}</p></div>
              <div><p className="text-xs text-gray-500">Views</p><p className="text-white">{selected.views}</p></div>
              <div><p className="text-xs text-gray-500">Helpful Votes</p><p className="text-white">{selected.helpful_votes}</p></div>
            </div>
            {selected.tags && <div><p className="text-xs text-gray-500 mb-1">Tags</p><p className="text-gray-300 text-sm">{selected.tags}</p></div>}
            <div className="flex gap-2 pt-2">
              <button onClick={() => openEdit(selected)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium">Edit</button>
              <button onClick={() => remove(selected.id)} className="flex-1 bg-red-600/80 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'New'} Knowledge Entry</h2>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="Title"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e => setForm({...form,category:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.source_type} onChange={e => setForm({...form,source_type:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <textarea value={form.content} onChange={e => setForm({...form,content:e.target.value})} placeholder="Content"
                rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <input value={form.author} onChange={e => setForm({...form,author:e.target.value})} placeholder="Author"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.department} onChange={e => setForm({...form,department:e.target.value})} placeholder="Department"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={form.tags} onChange={e => setForm({...form,tags:e.target.value})} placeholder="Tags (comma-separated)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
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
