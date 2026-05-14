import { useState, useEffect } from 'react';
import { Plus, Search, ListChecks, X } from 'lucide-react';
import { apiFetch } from '../api';
import { Procedure } from '../types';

export default function ProceduresPage() {
  const [items, setItems] = useState<Procedure[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Procedure|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Procedure|null>(null);
  const [form, setForm] = useState({ name:'',department:'',steps_json:'[]',version:'1.0',owner:'',last_updated:'',status:'active' });

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const data = await apiFetch(`/procedures?${params}`);
    setItems(data);
  }

  useEffect(() => { load(); }, [search]);

  async function save() {
    if (editing) {
      await apiFetch(`/procedures/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch('/procedures', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); load();
  }

  async function remove(id: number) {
    await apiFetch(`/procedures/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  }

  function openEdit(item: Procedure) {
    setEditing(item);
    setForm({ name:item.name, department:item.department||'', steps_json:item.steps_json||'[]', version:item.version||'1.0', owner:item.owner||'', last_updated:item.last_updated||'', status:item.status||'active' });
    setShowForm(true);
  }

  function parseSteps(json: string) {
    try { return JSON.parse(json) as {step:number,action:string}[]; } catch { return []; }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Procedures</h1>
        <button onClick={() => { setEditing(null); setForm({ name:'',department:'',steps_json:'[]',version:'1.0',owner:'',last_updated:'',status:'active' }); setShowForm(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> New Procedure
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search procedures..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm" />
      </div>
      <div className="grid gap-3">
        {items.map(item => {
          const steps = parseSteps(item.steps_json);
          return (
            <div key={item.id} onClick={() => setSelected(item)}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ListChecks size={14} className="text-purple-400" />
                    <span className="text-xs text-gray-500">{item.department} • v{item.version} • {item.status}</span>
                  </div>
                  <h3 className="font-semibold text-white">{item.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{steps.length} steps • Owner: {item.owner}</p>
                </div>
                <div className="text-xs text-gray-500 ml-4">{item.usage_count} uses</div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{selected.name}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Department</p><p className="text-white">{selected.department}</p></div>
              <div><p className="text-xs text-gray-500">Version</p><p className="text-white">v{selected.version}</p></div>
              <div><p className="text-xs text-gray-500">Owner</p><p className="text-white">{selected.owner}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><p className="text-white capitalize">{selected.status}</p></div>
              <div><p className="text-xs text-gray-500">Last Updated</p><p className="text-white">{selected.last_updated}</p></div>
              <div><p className="text-xs text-gray-500">Usage Count</p><p className="text-white">{selected.usage_count}</p></div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Steps</p>
              <div className="space-y-2">
                {parseSteps(selected.steps_json).map((s: {step:number,action:string}) => (
                  <div key={s.step} className="flex items-start gap-3 bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-purple-400 font-bold text-sm w-6 flex-shrink-0">{s.step}</span>
                    <p className="text-gray-200 text-sm">{s.action}</p>
                  </div>
                ))}
              </div>
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
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit' : 'New'} Procedure</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Procedure name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.department} onChange={e => setForm({...form,department:e.target.value})} placeholder="Department"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input value={form.version} onChange={e => setForm({...form,version:e.target.value})} placeholder="Version"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input value={form.owner} onChange={e => setForm({...form,owner:e.target.value})} placeholder="Owner"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <select value={form.status} onChange={e => setForm({...form,status:e.target.value})}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {['active','draft','deprecated'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <input type="date" value={form.last_updated} onChange={e => setForm({...form,last_updated:e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={form.steps_json} onChange={e => setForm({...form,steps_json:e.target.value})} placeholder='Steps JSON, e.g. [{"step":1,"action":"Do this"}]'
                rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none font-mono text-xs" />
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
