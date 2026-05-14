import { useState } from 'react'

interface Source {
  title: string
  type: string
}

interface QAExchange {
  id: number
  question: string
  answer: string
  confidence: number
  sources: Source[]
}

const initialHistory: QAExchange[] = [
  {
    id: 1,
    question: 'What is our process for handling P0 incidents?',
    answer: 'When a P0 incident is detected, the on-call engineer must acknowledge within 5 minutes and page the team lead. The incident response procedure requires beginning with an impact assessment before attempting fixes. A dedicated incident Slack channel (#incident-YYYYMMDD) should be created immediately, and status updates posted every 15 minutes to the company-wide #status channel. Post-incident, a retrospective must be filed within 48 hours.',
    confidence: 94,
    sources: [
      { title: 'Incident Response Procedure', type: 'doc' },
      { title: '#eng-oncall runbook thread', type: 'slack' },
    ],
  },
  {
    id: 2,
    question: 'Why did we decide to switch to Postgres?',
    answer: 'The decision to move to Postgres 15 was made on April 2nd after evaluating it against MySQL for the new analytics pipeline. The team selected Postgres due to its superior native JSON support, built-in partitioning capabilities, and better performance on complex analytical queries. The migration is planned for completion by Q3 2026. The decision was led by Marco Rossi and discussed in the #engineering-arch Slack channel.',
    confidence: 88,
    sources: [
      { title: 'Switch to Postgres decision', type: 'slack' },
      { title: 'Q2 2026 Architecture Notes', type: 'doc' },
    ],
  },
  {
    id: 3,
    question: 'What is the vendor approval process for new contracts?',
    answer: 'New vendors require different approval levels based on contract value. Vendors above $5,000/year need finance sign-off plus a security review using the standard vendor intake form. Contracts exceeding $50,000 require VP-level approval. All vendor engagements must use the official vendor intake form, and legal review is mandatory for any contract with data processing terms. The full policy was updated in January 2026.',
    confidence: 91,
    sources: [
      { title: 'Vendor Approval Process', type: 'email' },
      { title: 'Procurement Policy 2026', type: 'doc' },
    ],
  },
]

const sourceIcons: Record<string, string> = {
  doc: '📄',
  slack: '💬',
  email: '📧',
  ticket: '🎫',
}

function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-green-900/60 text-green-300 border-green-700/50' :
    score >= 75 ? 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50' :
    'bg-red-900/60 text-red-300 border-red-700/50'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>
      {score}% confidence
    </span>
  )
}

export default function QueryPanel() {
  const [history, setHistory] = useState<QAExchange[]>(initialHistory)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setLoading(true)

    setTimeout(() => {
      const newExchange: QAExchange = {
        id: Date.now(),
        question,
        answer: `Based on the company knowledge base, I found relevant information about "${question}". This is a simulated response — in production, this would query your actual knowledge entries and return a synthesized answer with citations from matched documents, Slack threads, and emails.`,
        confidence: Math.floor(Math.random() * 20) + 72,
        sources: [
          { title: 'Related Policy Document', type: 'doc' },
          { title: '#relevant-slack-channel', type: 'slack' },
        ],
      }
      setHistory(prev => [...prev, newExchange])
      setLoading(false)
    }, 1400)
  }

  return (
    <div className="max-w-3xl flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-100">Query Knowledge</h2>
        <p className="text-gray-400 text-sm mt-1">Ask any question — the brain searches all ingested knowledge</p>
      </div>

      {/* Q&A history */}
      <div className="flex-1 space-y-6 mb-6 overflow-auto">
        {history.map(exchange => (
          <div key={exchange.id} className="space-y-3">
            {/* Question */}
            <div className="flex justify-end">
              <div className="bg-purple-800/40 border border-purple-700/50 rounded-2xl rounded-tr-sm px-4 py-3 max-w-lg">
                <p className="text-purple-100 text-sm">{exchange.question}</p>
              </div>
            </div>

            {/* Answer */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm shrink-0 mt-1">
                🧠
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-4 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <ConfidenceBadge score={exchange.confidence} />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{exchange.answer}</p>
                <div>
                  <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Sources</div>
                  <div className="flex flex-wrap gap-2">
                    {exchange.sources.map((src, i) => (
                      <button
                        key={i}
                        className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>{sourceIcons[src.type] || '📎'}</span>
                        {src.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm shrink-0 mt-1">🧠</div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                Searching knowledge base...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything about company procedures, decisions, policies, contacts..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-purple-700 hover:bg-purple-600 disabled:bg-gray-800 disabled:text-gray-600 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all"
        >
          Ask
        </button>
      </form>
    </div>
  )
}
