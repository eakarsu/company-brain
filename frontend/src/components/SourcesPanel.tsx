interface Source {
  id: number
  name: string
  type: string
  icon: string
  docCount: number
  lastSync: string
  status: 'connected' | 'syncing' | 'error' | 'disconnected'
  statusDetail: string
}

const sources: Source[] = [
  {
    id: 1,
    name: 'Slack Workspace',
    type: 'Team Messaging',
    icon: '💬',
    docCount: 1247,
    lastSync: '3 minutes ago',
    status: 'connected',
    statusDetail: 'Syncing all public channels + DMs with permission',
  },
  {
    id: 2,
    name: 'Google Workspace',
    type: 'Documents & Email',
    icon: '📧',
    docCount: 834,
    lastSync: '12 minutes ago',
    status: 'connected',
    statusDetail: 'Gmail + Google Docs, Sheets shared with brain@company.com',
  },
  {
    id: 3,
    name: 'Notion',
    type: 'Wiki & Docs',
    icon: '📄',
    docCount: 612,
    lastSync: '1 hour ago',
    status: 'syncing',
    statusDetail: 'Currently indexing Engineering workspace (47% complete)',
  },
  {
    id: 4,
    name: 'Jira',
    type: 'Issue Tracker',
    icon: '🎫',
    docCount: 154,
    lastSync: '2 hours ago',
    status: 'connected',
    statusDetail: 'Ingesting resolved tickets with resolution notes and retrospectives',
  },
  {
    id: 5,
    name: 'Confluence',
    type: 'Knowledge Base',
    icon: '📚',
    docCount: 0,
    lastSync: 'Never',
    status: 'disconnected',
    statusDetail: 'Not yet connected — requires admin OAuth approval',
  },
  {
    id: 6,
    name: 'GitHub',
    type: 'Code & Discussions',
    icon: '🐙',
    docCount: 0,
    lastSync: '6 hours ago',
    status: 'error',
    statusDetail: 'OAuth token expired — please reconnect via Settings',
  },
]

const statusColors: Record<Source['status'], string> = {
  connected: 'bg-green-500',
  syncing: 'bg-yellow-500 animate-pulse',
  error: 'bg-red-500',
  disconnected: 'bg-gray-600',
}

const statusLabels: Record<Source['status'], string> = {
  connected: 'Connected',
  syncing: 'Syncing',
  error: 'Error',
  disconnected: 'Disconnected',
}

const statusTextColors: Record<Source['status'], string> = {
  connected: 'text-green-400',
  syncing: 'text-yellow-400',
  error: 'text-red-400',
  disconnected: 'text-gray-500',
}

export default function SourcesPanel() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Connected Sources</h2>
          <p className="text-gray-400 text-sm mt-1">Manage the knowledge feeds that power Company Brain</p>
        </div>
        <button className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add Source
        </button>
      </div>

      <div className="space-y-3">
        {sources.map(source => (
          <div
            key={source.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start gap-4 hover:border-gray-700 transition-all"
          >
            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-2xl shrink-0">
              {source.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-gray-100">{source.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{source.type}</span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className={`w-2 h-2 rounded-full ${statusColors[source.status]}`} />
                  <span className={`text-xs font-medium ${statusTextColors[source.status]}`}>
                    {statusLabels[source.status]}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-3">{source.statusDetail}</p>

              <div className="flex items-center gap-6 text-xs text-gray-600">
                <span>
                  <span className="text-gray-300 font-medium">{source.docCount.toLocaleString()}</span> documents
                </span>
                <span>Last sync: {source.lastSync}</span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {source.status === 'error' && (
                <button className="text-xs px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 rounded-lg transition-colors">
                  Reconnect
                </button>
              )}
              {source.status === 'disconnected' && (
                <button className="text-xs px-3 py-1.5 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/50 text-purple-300 rounded-lg transition-colors">
                  Connect
                </button>
              )}
              {(source.status === 'connected' || source.status === 'syncing') && (
                <button className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 rounded-lg transition-colors">
                  Sync Now
                </button>
              )}
              <button className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 rounded-lg transition-colors">
                Settings
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {sources.filter(s => s.status === 'connected' || s.status === 'syncing').length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Active Sources</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {sources.reduce((a, s) => a + s.docCount, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Documents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">2,847</div>
            <div className="text-xs text-gray-500 mt-1">Knowledge Entries</div>
          </div>
        </div>
      </div>
    </div>
  )
}
