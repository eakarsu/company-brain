interface KnowledgeEntry {
  id: number
  title: string
  category: 'Procedures' | 'Policies' | 'Decisions' | 'Contacts'
  source: 'slack' | 'email' | 'doc' | 'ticket'
  tags: string[]
  snippet: string
  author: string
  date: string
}

const entries: KnowledgeEntry[] = [
  {
    id: 1,
    title: 'Incident Response Procedure',
    category: 'Procedures',
    source: 'doc',
    tags: ['ops', 'security', 'oncall'],
    snippet: 'When a P0 incident is detected, the on-call engineer must acknowledge within 5 minutes and page the team lead. Begin with impact assessment before...',
    author: 'Priya Nair',
    date: '2026-04-12',
  },
  {
    id: 2,
    title: 'Remote Work Policy Update',
    category: 'Policies',
    source: 'email',
    tags: ['hr', 'remote', 'policy'],
    snippet: 'Effective Q2 2026, all employees are permitted up to 3 days remote per week. Core hours 10am–3pm PST must be observed regardless of location...',
    author: 'Alex Chen',
    date: '2026-03-28',
  },
  {
    id: 3,
    title: 'Switch to Postgres decision',
    category: 'Decisions',
    source: 'slack',
    tags: ['engineering', 'database', 'architecture'],
    snippet: 'After evaluating MySQL vs Postgres for the new analytics pipeline, the team agreed to move to Postgres 15 due to better JSON support and native partitioning...',
    author: 'Marco Rossi',
    date: '2026-04-02',
  },
  {
    id: 4,
    title: 'Sarah Kim — Head of Design',
    category: 'Contacts',
    source: 'doc',
    tags: ['design', 'leadership', 'product'],
    snippet: 'Sarah Kim leads the design team across product and brand. Best reached on Slack (@sarah.k). Owns design review process and component library governance...',
    author: 'System',
    date: '2026-01-15',
  },
  {
    id: 5,
    title: 'Customer Escalation Runbook',
    category: 'Procedures',
    source: 'ticket',
    tags: ['support', 'customer', 'escalation'],
    snippet: 'When a customer escalates beyond Tier 2, create a Jira ticket tagged ESCALATION and notify the account manager within 1 hour. SLA breach requires VP approval...',
    author: 'David Park',
    date: '2026-04-18',
  },
  {
    id: 6,
    title: 'Data Retention Policy',
    category: 'Policies',
    source: 'doc',
    tags: ['legal', 'data', 'compliance'],
    snippet: 'All user PII must be deleted within 90 days of account deletion request. Backups are purged on a rolling 30-day window. EU data stored exclusively in Frankfurt...',
    author: 'Legal Team',
    date: '2026-02-10',
  },
  {
    id: 7,
    title: 'Adopt TypeScript across backend',
    category: 'Decisions',
    source: 'slack',
    tags: ['engineering', 'typescript', 'backend'],
    snippet: 'Decision made in eng-all on March 15th: all new backend services will be written in TypeScript. Existing Node.js services to be migrated by Q3 2026...',
    author: 'Engineering Team',
    date: '2026-03-15',
  },
  {
    id: 8,
    title: 'Release Checklist — Mobile',
    category: 'Procedures',
    source: 'doc',
    tags: ['mobile', 'release', 'qa'],
    snippet: 'Before any mobile release: run full regression suite, verify push notification pipeline, check analytics events firing correctly, test deep links on iOS and Android...',
    author: 'Fatima Al-Hassan',
    date: '2026-04-05',
  },
  {
    id: 9,
    title: 'Vendor Approval Process',
    category: 'Policies',
    source: 'email',
    tags: ['procurement', 'finance', 'vendor'],
    snippet: 'All new vendors above $5,000/yr require finance sign-off and a security review. Contracts exceeding $50k need VP approval. Use the vendor intake form at...',
    author: 'Finance Team',
    date: '2026-01-22',
  },
  {
    id: 10,
    title: 'James Liu — AWS Solutions Architect',
    category: 'Contacts',
    source: 'email',
    tags: ['aws', 'vendor', 'cloud'],
    snippet: 'Our primary AWS account manager. Contact for enterprise support tier questions, reserved instance negotiations, and service limit increases. james.liu@aws.com...',
    author: 'System',
    date: '2026-03-01',
  },
  {
    id: 11,
    title: 'Kill password-based auth decision',
    category: 'Decisions',
    source: 'ticket',
    tags: ['security', 'auth', 'sso'],
    snippet: 'Following two security audits flagging password reuse, decision made to deprecate username/password login by EOY 2026. All users migrated to SSO via Okta...',
    author: 'Security Team',
    date: '2026-04-25',
  },
  {
    id: 12,
    title: 'Onboarding Checklist — Engineering',
    category: 'Procedures',
    source: 'doc',
    tags: ['hr', 'onboarding', 'engineering'],
    snippet: 'Day 1: laptop setup, GitHub org access, 1:1 with manager. Week 1: codebase walkthrough, deploy a small fix. Week 2: own a full feature ticket end-to-end...',
    author: 'People Team',
    date: '2026-02-14',
  },
]

const categoryColors: Record<KnowledgeEntry['category'], string> = {
  Procedures: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
  Policies: 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50',
  Decisions: 'bg-purple-900/60 text-purple-300 border-purple-700/50',
  Contacts: 'bg-green-900/60 text-green-300 border-green-700/50',
}

const sourceIcons: Record<KnowledgeEntry['source'], string> = {
  slack: '💬',
  email: '📧',
  doc: '📄',
  ticket: '🎫',
}

const sourceLabels: Record<KnowledgeEntry['source'], string> = {
  slack: 'Slack',
  email: 'Email',
  doc: 'Document',
  ticket: 'Ticket',
}

const categories: KnowledgeEntry['category'][] = ['Procedures', 'Policies', 'Decisions', 'Contacts']

interface Props {
  searchQuery: string
}

export default function KnowledgeMap({ searchQuery }: Props) {
  const filtered = entries.filter(e => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      e.title.toLowerCase().includes(q) ||
      e.snippet.toLowerCase().includes(q) ||
      e.tags.some(t => t.includes(q)) ||
      e.category.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Knowledge Map</h2>
          <p className="text-gray-400 text-sm mt-1">
            {filtered.length} entries across {categories.length} categories
          </p>
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <span key={cat} className={`text-xs px-3 py-1 rounded-full border font-medium ${categoryColors[cat]}`}>
              {cat}
            </span>
          ))}
        </div>
      </div>

      {categories.map(cat => {
        const catEntries = filtered.filter(e => e.category === cat)
        if (catEntries.length === 0) return null
        return (
          <div key={cat} className="mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                cat === 'Procedures' ? 'bg-blue-400' :
                cat === 'Policies' ? 'bg-yellow-400' :
                cat === 'Decisions' ? 'bg-purple-400' : 'bg-green-400'
              }`} />
              {cat}
              <span className="text-gray-600 font-normal">({catEntries.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {catEntries.map(entry => (
                <div
                  key={entry.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-700/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-gray-100 text-sm leading-tight group-hover:text-purple-300 transition-colors">
                      {entry.title}
                    </h4>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors[entry.category]}`}>
                      {entry.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">
                    {entry.snippet}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {entry.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      {sourceIcons[entry.source]}
                      <span>{sourceLabels[entry.source]}</span>
                    </span>
                    <span>{entry.author} · {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-lg">No entries matching "{searchQuery}"</div>
        </div>
      )}
    </div>
  )
}
