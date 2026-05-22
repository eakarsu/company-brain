import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Lock, Plus, Trash2, Power } from 'lucide-react';

type Rule = {
  id: number;
  name: string;
  resource: string;
  principal: string;
  action: string;
  enabled: boolean;
  createdAt: string;
};

export default function AccessRulesEditor() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', resource: '', principal: '', action: 'read' });
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await apiFetch('/custom-views/access-rules');
      setRules(r.rules || []);
    } catch (e: any) { setErr(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name || !form.resource || !form.principal) { setErr('All fields required'); return; }
    setBusy(true); setErr('');
    try {
      await apiFetch('/custom-views/access-rules', { method: 'POST', body: JSON.stringify({ ...form, enabled: true }) });
      setForm({ name: '', resource: '', principal: '', action: 'read' });
      await load();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  async function toggle(r: Rule) {
    try {
      await apiFetch('/custom-views/access-rules', { method: 'PUT', body: JSON.stringify({ id: r.id, enabled: !r.enabled }) });
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  async function remove(id: number) {
    try {
      await apiFetch('/custom-views/access-rules', { method: 'DELETE', body: JSON.stringify({ id }) });
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
          <Lock size={20} className="text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Access Rules Editor</h3>
          <p className="text-xs text-gray-400">CRUD for knowledge access rules ({rules.length} total)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
        <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
          placeholder="Rule name" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
          placeholder="Resource" value={form.resource}
          onChange={e => setForm({ ...form, resource: e.target.value })} />
        <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
          placeholder="Principal (team:*/role:*)" value={form.principal}
          onChange={e => setForm({ ...form, principal: e.target.value })} />
        <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
          value={form.action}
          onChange={e => setForm({ ...form, action: e.target.value })}>
          <option value="read">read</option>
          <option value="write">write</option>
          <option value="admin">admin</option>
        </select>
        <button onClick={create} disabled={busy}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded text-sm text-white flex items-center justify-center gap-1.5">
          <Plus size={14} /> Add
        </button>
      </div>

      {err && <p className="text-sm text-red-400 mb-2">{err}</p>}

      <div className="overflow-auto border border-gray-800 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr className="text-left text-gray-400">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Resource</th>
              <th className="px-3 py-2">Principal</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 w-28">Manage</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} className="border-t border-gray-800 text-gray-200">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-gray-400">{r.resource}</td>
                <td className="px-3 py-2 text-gray-400">{r.principal}</td>
                <td className="px-3 py-2"><span className="px-2 py-0.5 rounded bg-gray-800 text-xs">{r.action}</span></td>
                <td className="px-3 py-2">
                  {r.enabled
                    ? <span className="text-emerald-400 text-xs">enabled</span>
                    : <span className="text-gray-500 text-xs">disabled</span>}
                </td>
                <td className="px-3 py-2 flex gap-1">
                  <button onClick={() => toggle(r)} title="Toggle" className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white">
                    <Power size={14} />
                  </button>
                  <button onClick={() => remove(r.id)} title="Delete" className="p-1.5 rounded hover:bg-gray-800 text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">No rules yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
