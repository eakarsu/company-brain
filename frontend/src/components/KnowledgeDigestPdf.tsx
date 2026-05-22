import { useState } from 'react';
import { FileDown, Loader2, CheckCircle2 } from 'lucide-react';

export default function KnowledgeDigestPdf() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  async function download() {
    setBusy(true); setErr(''); setDone(false);
    try {
      const res = await fetch('/api/custom-views/digest-pdf', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `company-brain-digest-${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e: any) {
      setErr(e.message || 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
          <FileDown size={20} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Knowledge Digest PDF</h3>
          <p className="text-xs text-gray-400">Weekly summary of brain health & top articles</p>
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-4">
        Generate and download a PDF digest covering top accessed knowledge, stale articles, and active access rules.
      </p>

      <button
        onClick={download}
        disabled={busy}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium flex items-center gap-2"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        {busy ? 'Generating...' : 'Download digest PDF'}
      </button>

      {done && (
        <p className="mt-3 text-sm text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 size={14} /> Digest downloaded successfully.
        </p>
      )}
      {err && <p className="mt-3 text-sm text-red-400">Error: {err}</p>}
    </div>
  );
}
