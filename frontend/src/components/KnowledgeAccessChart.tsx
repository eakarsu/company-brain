import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { BarChart3 } from 'lucide-react';

type Series = { name: string; data: number[] };
type Resp = { days: string[]; series: Series[]; totals: { name: string; total: number }[]; generatedAt: string };

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export default function KnowledgeAccessChart() {
  const [d, setD] = useState<Resp | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    apiFetch('/custom-views/access-chart').then(setD).catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="p-4 text-red-400">Error: {err}</div>;
  if (!d) return <div className="p-4 text-gray-400">Loading access chart...</div>;

  const max = Math.max(...d.series.flatMap(s => s.data), 1);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
          <BarChart3 size={20} className="text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Knowledge Access Chart</h3>
          <p className="text-xs text-gray-400">7-day access by resource category</p>
        </div>
      </div>

      <div className="flex items-end gap-2 h-48 border-b border-l border-gray-700 pl-2 pb-1">
        {d.days.map((day, di) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center gap-0.5 h-44">
              {d.series.map((s, si) => {
                const h = (s.data[di] / max) * 100;
                return (
                  <div key={s.name}
                    title={`${s.name}: ${s.data[di]}`}
                    className="w-2 rounded-t"
                    style={{ height: `${h}%`, backgroundColor: COLORS[si % COLORS.length] }}
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-gray-500">{day}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {d.series.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-300">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {s.name} <span className="text-gray-500">({d.totals[i]?.total ?? 0})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
