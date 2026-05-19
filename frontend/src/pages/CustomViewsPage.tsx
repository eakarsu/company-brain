import { Brain } from 'lucide-react';
import KnowledgeAccessChart from '../components/KnowledgeAccessChart';
import TopicCoverageHeatmap from '../components/TopicCoverageHeatmap';
import KnowledgeDigestPdf from '../components/KnowledgeDigestPdf';
import AccessRulesEditor from '../components/AccessRulesEditor';

export default function CustomViewsPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
          <Brain size={26} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Brain Views</h1>
          <p className="text-sm text-gray-400">Custom views over your company knowledge: access analytics, coverage heatmap, digest PDF, and access rules.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <KnowledgeAccessChart />
        <TopicCoverageHeatmap />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <KnowledgeDigestPdf />
        <AccessRulesEditor />
      </div>
    </div>
  );
}
