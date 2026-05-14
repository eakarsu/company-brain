import { useState } from 'react'

type SourceType = 'slack' | 'email' | 'document' | 'ticket'

interface RecentIngestion {
  id: number
  source: SourceType
  title: string
  entries: number
  timeAgo: string
}

const recentIngestions: RecentIngestion[] = [
  { id: 1, source: 'slack', title: '#eng-decisions: TypeScript migration thread', entries: 8, timeAgo: '2h ago' },
  { id: 2, source: 'document', title: 'Q2 2026 Engineering Roadmap.pdf', entries: 23, timeAgo: '5h ago' },
  { id: 3, source: 'email', title: 'Vendor Contract — DataDog renewal terms', entries: 6, timeAgo: '1d ago' },
  { id: 4, source: 'ticket', title: 'JIRA-4412: Auth service incident retrospective', entries: 11, timeAgo: '2d ago' },
  { id: 5, source: 'slack', title: '#product-feedback: Onboarding flow discussion', entries: 15, timeAgo: '3d ago' },
]

const sourceIcons: Record<SourceType, string> = {
  slack: '💬',
  email: '📧',
  document: '📄',
  ticket: '🎫',
}

export default function IngestPanel() {
  const [sourceType, setSourceType] = useState<SourceType>('slack')
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [department, setDepartment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setContent('')
      setAuthor('')
      setDepartment('')
    }, 2500)
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-100">Ingest Knowledge</h2>
        <p className="text-gray-400 text-sm mt-1">Add new knowledge from any source to the company brain</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <form onSubmit={handleSubmit}>
          {/* Source type selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">Source Type</label>
            <div className="flex gap-2 flex-wrap">
              {(['slack', 'email', 'document', 'ticket'] as SourceType[]).map(src => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceType(src)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    sourceType === src
                      ? 'bg-purple-800/50 border-purple-600 text-purple-200'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {sourceIcons[src]}
                  <span className="capitalize">{src}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content textarea */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content
              <span className="text-gray-500 font-normal ml-2">— paste raw text, thread transcript, or document content</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={8}
              placeholder={
                sourceType === 'slack' ? 'Paste Slack thread or message content here...' :
                sourceType === 'email' ? 'Paste email content (subject + body)...' :
                sourceType === 'document' ? 'Paste document text or summary...' :
                'Paste ticket description, comments, and resolution...'
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm resize-none"
            />
          </div>

          {/* Metadata fields */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Author</label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              >
                <option value="">Select department</option>
                <option value="engineering">Engineering</option>
                <option value="product">Product</option>
                <option value="design">Design</option>
                <option value="hr">HR / People</option>
                <option value="finance">Finance</option>
                <option value="legal">Legal</option>
                <option value="security">Security</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!content.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              submitted
                ? 'bg-green-700 text-green-100 cursor-default'
                : content.trim()
                ? 'bg-purple-700 hover:bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {submitted ? '✓ Ingested — extracting knowledge entries...' : 'Submit for Ingestion'}
          </button>
        </form>
      </div>

      {/* Recent ingestions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Recent Ingestions</h3>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-right px-4 py-3">Entries</th>
                <th className="text-right px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {recentIngestions.map((ing, i) => (
                <tr key={ing.id} className={i < recentIngestions.length - 1 ? 'border-b border-gray-800/50' : ''}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-gray-400">
                      {sourceIcons[ing.source]}
                      <span className="capitalize text-xs">{ing.source}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{ing.title}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium">
                      {ing.entries} entries
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{ing.timeAgo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
