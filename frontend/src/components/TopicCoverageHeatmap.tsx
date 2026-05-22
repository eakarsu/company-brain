import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Grid3x3 } from 'lucide-react';

type Resp = { departments: string[]; topics: string[]; matrix: number[][]; coverageAvg: number; gapCount: number };

function colorFor(v: number) {
  // 0..100 -> red(low) -> yellow -> green(high)
  const clamped = Math.max(0, Math.min(100, v));
  const hue = (clamped / 100) * 130; // 0=red, 130=green
  return `hsl(${hue}, 70%, 35%)`;
}

export default function TopicCoverageHeatmap() {
  const [d, setD] = useState<Resp | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    apiFetch('/custom-views/topic-heatmap').then(setD).catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="p-4 text-red-400">Error: {err}</div>;
  if (!d) return <div className="p-4 text-gray-400">Loading heatmap...</div>;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-pink-600/20 flex items-center justify-center">
          <Grid3x3 size={20} className="text-pink-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Topic Coverage Heatmap</h3>
          <p className="text-xs text-gray-400">
            Avg coverage <span className="text-white font-semibold">{d.coverageAvg}%</span>
            <span className="ml-3">Gaps: <span className="text-red-400 font-semibold">{d.gapCount}</span></span>
          </p>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="text-left p-1 text-gray-400"></th>
              {d.topics.map(t => (
                <th key={t} className="px-2 py-1 text-gray-400 font-medium">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.departments.map((dep, di) => (
              <tr key={dep}>
                <td className="pr-2 py-1 text-gray-300 font-medium whitespace-nowrap">{dep}</td>
                {d.topics.map((t, ti) => {
                  const v = d.matrix[di][ti];
                  return (
                    <td key={t} className="p-0.5">
                      <div
                        title={`${dep} / ${t}: ${v}%`}
                        className="w-12 h-10 rounded flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: colorFor(v) }}
                      >
                        {v}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
