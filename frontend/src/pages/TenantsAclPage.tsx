import { useEffect, useState } from 'react';
import { Building2, Lock, AlertTriangle, Loader2, Plus, ShieldCheck, ShieldX, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';

interface Tenant { id: number; slug: string; name: string; plan: string; region: string; daily_query_quota: number; rules: number; }
interface Rule { id: number; tenant_id: number; tenant_slug: string; connector_id: number; connector_name: string; connector_provider: string; principal: string; principal_type: string; permission: string; resource_filter: string | null; }
interface Connector { id: number; name: string; provider: string; }

const PERM_TONE: Record<string,string> = {
  none:  'bg-gray-700/40 text-gray-300', read:  'bg-blue-500/20 text-blue-300',
  write: 'bg-amber-500/20 text-amber-300', admin: 'bg-red-500/20 text-red-300',
};
const PLAN_TONE: Record<string,string> = {
  team: 'bg-gray-500/20 text-gray-300', business: 'bg-blue-500/20 text-blue-300', enterprise: 'bg-violet-500/20 text-violet-300',
};

export default function TenantsAclPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [tenantFilter, setTenantFilter] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({ tenant_id: 0, connector_id: 0, principal: '', principal_type: 'group', permission: 'read', resource_filter: '' });
  const [tenantForm, setTenantForm] = useState({ slug: '', name: '', plan: 'team', region: 'us-east-1', daily_query_quota: 10000 });
  // Access check form
  const [check, setCheck] = useState({ tenant_id: 0, connector_id: 0, principal: '', principal_type: 'email', permission: 'read', resource_path: '' });
  const [checkResp, setCheckResp] = useState<any>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [t, r, c] = await Promise.all([
        apiFetch('/tenants-acl/tenants'),
        apiFetch(`/tenants-acl/rules${tenantFilter ? `?tenant_id=${tenantFilter}` : ''}`),
        apiFetch('/source-connectors'),
      ]);
      setTenants(t); setRules(r); setConnectors(c.connectors || []);
      if (t.length && !ruleForm.tenant_id) setRuleForm(prev => ({ ...prev, tenant_id: t[0].id }));
      if ((c.connectors || []).length && !ruleForm.connector_id) setRuleForm(prev => ({ ...prev, connector_id: c.connectors[0].id }));
      if (t.length && !check.tenant_id) setCheck(prev => ({ ...prev, tenant_id: t[0].id, connector_id: c.connectors?.[0]?.id || 0 }));
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tenantFilter]);

  async function createTenant() {
    if (!tenantForm.slug) { setError('Slug required'); return; }
    try {
      await apiFetch('/tenants-acl/tenants', { method: 'POST', body: JSON.stringify(tenantForm) });
      setShowTenantForm(false); setTenantForm({ slug: '', name: '', plan: 'team', region: 'us-east-1', daily_query_quota: 10000 });
      await load();
    } catch (e: any) { setError(e?.message || 'Create failed'); }
  }

  async function createRule() {
    if (!ruleForm.tenant_id || !ruleForm.connector_id || !ruleForm.principal) { setError('tenant, connector, principal required'); return; }
    try {
      await apiFetch('/tenants-acl/rules', { method: 'POST', body: JSON.stringify(ruleForm) });
      setShowRuleForm(false); setRuleForm({ ...ruleForm, principal: '', resource_filter: '' });
      await load();
    } catch (e: any) { setError(e?.message || 'Create failed'); }
  }

  async function deleteRule(id: number) {
    if (!confirm('Delete rule?')) return;
    try { await apiFetch(`/tenants-acl/rules/${id}`, { method: 'DELETE' }); await load(); }
    catch (e: any) { setError(e?.message || 'Delete failed'); }
  }

  async function runCheck() {
    setCheckResp(null);
    try { setCheckResp(await apiFetch('/tenants-acl/check', { method: 'POST', body: JSON.stringify(check) })); }
    catch (e: any) { setError(e?.message || 'Check failed'); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-600 flex items-center justify-center"><Lock size={22} className="text-white" /></div>
          <div><h1 className="text-2xl font-bold text-white">Tenants & Access Control</h1>
            <p className="text-sm text-gray-400">Multi-tenant isolation + per-connector ACL rules</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTenantForm(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Plus size={14} />Tenant</button>
          <button onClick={() => setShowRuleForm(true)} className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Plus size={14} />Rule</button>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}
      {loading && <div className="text-gray-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Loading…</div>}

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Building2 size={14} />Tenants</h3>
          {tenants.map(t => (
            <button key={t.id} onClick={() => setTenantFilter(tenantFilter === t.id ? '' : t.id)} className={`w-full text-left bg-gray-900 border rounded-xl p-3 transition-colors ${tenantFilter === t.id ? 'border-amber-500' : 'border-gray-800 hover:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${PLAN_TONE[t.plan]}`}>{t.plan}</span>
                <span className="text-white text-sm font-medium">{t.name}</span>
              </div>
              <div className="text-xs text-gray-400">slug: <code>{t.slug}</code> · region {t.region} · {t.rules} rules</div>
              <div className="text-xs text-gray-500 mt-0.5 tabular-nums">{t.daily_query_quota.toLocaleString()} queries/day</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">ACL Rules{tenantFilter ? ` · filtered to tenant #${tenantFilter}` : ''}</h3>
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800 overflow-hidden">
            {rules.map(r => (
              <div key={r.id} className="p-3 hover:bg-gray-800/40 flex items-center gap-3">
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${PERM_TONE[r.permission]}`}>{r.permission}</span>
                <div className="flex-1 min-w-0 text-sm">
                  <div className="text-white truncate"><code className="text-violet-300">{r.principal}</code> <span className="text-gray-500">({r.principal_type})</span> → {r.connector_name} <span className="text-gray-500">[{r.connector_provider}]</span></div>
                  <div className="text-xs text-gray-400 mt-0.5">tenant: <code>{r.tenant_slug}</code>{r.resource_filter ? ` · filter ${r.resource_filter}` : ''}</div>
                </div>
                <button onClick={() => deleteRule(r.id)} className="p-1.5 text-red-300 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
              </div>
            ))}
            {!rules.length && !loading && <div className="p-6 text-center text-gray-500 text-sm">No rules.</div>}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">Access check</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <select value={check.tenant_id} onChange={e => setCheck({ ...check, tenant_id: parseInt(e.target.value) })} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm">
                {tenants.map(t => <option key={t.id} value={t.id}>{t.slug}</option>)}
              </select>
              <select value={check.connector_id} onChange={e => setCheck({ ...check, connector_id: parseInt(e.target.value) })} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm">
                {connectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={check.principal} onChange={e => setCheck({ ...check, principal: e.target.value })} placeholder="principal e.g. user@acme.com" className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm" />
              <select value={check.principal_type} onChange={e => setCheck({ ...check, principal_type: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm">
                {['email','group','role'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={check.permission} onChange={e => setCheck({ ...check, permission: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm">
                {['read','write','admin'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={check.resource_path} onChange={e => setCheck({ ...check, resource_path: e.target.value })} placeholder="resource_path (optional)" className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm" />
            </div>
            <button onClick={runCheck} className="mt-3 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm">Evaluate</button>
            {checkResp && (
              <div className={`mt-3 p-3 rounded-lg border text-sm ${checkResp.allowed ? 'bg-emerald-900/30 border-emerald-700 text-emerald-200' : 'bg-red-900/30 border-red-700 text-red-200'}`}>
                <div className="flex items-center gap-2 font-semibold">{checkResp.allowed ? <ShieldCheck size={14} /> : <ShieldX size={14} />}{checkResp.allowed ? 'ALLOWED' : 'DENIED'} · {checkResp.decision_reason}</div>
                <div className="text-xs mt-1">Matched {checkResp.matched_rules.length} rule(s)</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTenantForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowTenantForm(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg mb-4">Create Tenant</h2>
            <div className="space-y-2">
              <input value={tenantForm.slug} onChange={e => setTenantForm({ ...tenantForm, slug: e.target.value.toLowerCase() })} placeholder="slug (e.g. acme)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input value={tenantForm.name} onChange={e => setTenantForm({ ...tenantForm, name: e.target.value })} placeholder="Display name" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <select value={tenantForm.plan} onChange={e => setTenantForm({ ...tenantForm, plan: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {['team','business','enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={tenantForm.region} onChange={e => setTenantForm({ ...tenantForm, region: e.target.value })} placeholder="Region (e.g. us-east-1)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input type="number" value={tenantForm.daily_query_quota} onChange={e => setTenantForm({ ...tenantForm, daily_query_quota: parseInt(e.target.value) || 1000 })} placeholder="Daily quota" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowTenantForm(false)} className="text-gray-400 hover:text-white text-sm px-3">Cancel</button><button onClick={createTenant} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm">Create</button></div>
          </div>
        </div>
      )}

      {showRuleForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowRuleForm(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg mb-4">Add ACL Rule</h2>
            <div className="space-y-2">
              <select value={ruleForm.tenant_id} onChange={e => setRuleForm({ ...ruleForm, tenant_id: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {tenants.map(t => <option key={t.id} value={t.id}>{t.slug}</option>)}
              </select>
              <select value={ruleForm.connector_id} onChange={e => setRuleForm({ ...ruleForm, connector_id: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {connectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={ruleForm.principal} onChange={e => setRuleForm({ ...ruleForm, principal: e.target.value })} placeholder="Principal (email, group name)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <select value={ruleForm.principal_type} onChange={e => setRuleForm({ ...ruleForm, principal_type: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {['email','group','role'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={ruleForm.permission} onChange={e => setRuleForm({ ...ruleForm, permission: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {['none','read','write','admin'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={ruleForm.resource_filter} onChange={e => setRuleForm({ ...ruleForm, resource_filter: e.target.value })} placeholder='Resource filter JSON, e.g. {"path":"hr/*"}' className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono" />
            </div>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowRuleForm(false)} className="text-gray-400 hover:text-white text-sm px-3">Cancel</button><button onClick={createRule} className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-sm">Create</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
