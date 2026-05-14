import { useState } from 'react';
import { Database, BookOpen, FileText, MessageSquare, ListChecks, Shield, GitBranch, Loader2, Check, AlertTriangle } from 'lucide-react';

interface EntityDef {
  key: string;
  label: string;
  description: string;
  icon: any;
  color: string;
}

const ENTITIES: EntityDef[] = [
  { key: 'knowledge',  label: 'Knowledge Entries', description: 'Wiki, FAQs, runbooks, guides',           icon: BookOpen,      color: 'purple' },
  { key: 'documents',  label: 'Documents',         description: 'Roadmaps, contracts, postmortems',       icon: FileText,      color: 'blue' },
  { key: 'queries',    label: 'Queries',           description: 'Sample Q&A history with confidence',     icon: MessageSquare, color: 'green' },
  { key: 'procedures', label: 'Procedures',        description: 'Step-by-step SOPs across departments',   icon: ListChecks,    color: 'yellow' },
  { key: 'policies',   label: 'Policies',          description: 'HR, security, finance, AI usage',        icon: Shield,        color: 'red' },
  { key: 'decisions',  label: 'Decisions',         description: 'Architecture + GTM decision records',    icon: GitBranch,     color: 'pink' },
];

const COLOR_CLASSES: Record<string, { bg: string; hover: string; text: string; ring: string }> = {
  purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-300', ring: 'ring-purple-500/30' },
  blue:   { bg: 'bg-blue-600',   hover: 'hover:bg-blue-700',   text: 'text-blue-300',   ring: 'ring-blue-500/30' },
  green:  { bg: 'bg-green-600',  hover: 'hover:bg-green-700',  text: 'text-green-300',  ring: 'ring-green-500/30' },
  yellow: { bg: 'bg-yellow-600', hover: 'hover:bg-yellow-700', text: 'text-yellow-300', ring: 'ring-yellow-500/30' },
  red:    { bg: 'bg-red-600',    hover: 'hover:bg-red-700',    text: 'text-red-300',    ring: 'ring-red-500/30' },
  pink:   { bg: 'bg-pink-600',   hover: 'hover:bg-pink-700',   text: 'text-pink-300',   ring: 'ring-pink-500/30' },
};

interface ToastState {
  kind: 'success' | 'error';
  message: string;
}

export default function SampleDataPage() {
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(t: ToastState) {
    setToast(t);
    window.setTimeout(() => setToast(null), 3500);
  }

  async function seed(entity: string) {
    setBusy(b => ({ ...b, [entity]: true }));
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/admin/sample-data/${entity}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Seed failed');
      }
      const data = await res.json();
      const inserted: number = data.inserted || 0;
      setCounts(c => ({ ...c, [entity]: (c[entity] || 0) + inserted }));
      showToast({ kind: 'success', message: `Inserted ${inserted} ${entity} rows` });
    } catch (e: any) {
      showToast({ kind: 'error', message: e?.message || 'Seed failed' });
    } finally {
      setBusy(b => ({ ...b, [entity]: false }));
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Database size={28} className="text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Sample Data</h1>
      </div>
      <p className="text-gray-400 text-sm">
        Populate the database with domain-realistic rows for each main entity. Each
        button inserts 5-10 rows. Safe to click multiple times — rows accumulate.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ENTITIES.map(({ key, label, description, icon: Icon, color }) => {
          const cc = COLOR_CLASSES[color];
          const isBusy = !!busy[key];
          const total = counts[key] || 0;
          return (
            <div key={key} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${cc.bg} flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold">{label}</div>
                  <div className="text-xs text-gray-400">{description}</div>
                </div>
                {total > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full bg-gray-800 ${cc.text} font-medium flex items-center gap-1`}>
                    <Check size={12} /> {total}
                  </span>
                )}
              </div>
              <button
                onClick={() => seed(key)}
                disabled={isBusy}
                className={`${cc.bg} ${cc.hover} disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors`}
              >
                {isBusy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Inserting...
                  </>
                ) : (
                  <>
                    <Database size={16} /> Insert sample {label.toLowerCase()}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 ${
            toast.kind === 'success'
              ? 'bg-emerald-600/90 border-emerald-500 text-white'
              : 'bg-red-600/90 border-red-500 text-white'
          }`}
        >
          {toast.kind === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
