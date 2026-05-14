import { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

interface Props {
  title: string;
  content: string;
  loading?: boolean;
  timestamp?: string;
}

function parseContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="font-bold text-white mt-2">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return <li key={i} className="ml-4 text-gray-200">{line.slice(2)}</li>;
    }
    if (line.match(/^\d+\./)) {
      return <li key={i} className="ml-4 text-gray-200 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
    }
    if (line === '') return <br key={i} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-gray-200">
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="text-white">{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    );
  });
}

export default function AIResponse({ title, content, loading, timestamp }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-violet-900 to-indigo-900 p-6 border border-violet-700/50">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles size={20} className="text-violet-300" />
          <span className="font-semibold text-violet-200">{title}</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-violet-800/50 rounded animate-pulse w-full" />
          <div className="h-4 bg-violet-800/50 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-violet-800/50 rounded animate-pulse w-4/6" />
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-900 to-indigo-900 p-6 border border-violet-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-violet-300" />
          <span className="font-semibold text-violet-200">{title}</span>
          {timestamp && <span className="text-xs text-violet-400">{timestamp}</span>}
        </div>
        <button
          onClick={copy}
          className="text-violet-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="prose prose-invert max-w-none text-sm space-y-1">
        {parseContent(content)}
      </div>
    </div>
  );
}
