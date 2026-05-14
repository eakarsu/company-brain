import { useState } from 'react';
import { Sparkles, Search, Cpu, Layers, FileText, GitCompare, Tags, Users, Clock } from 'lucide-react';
import { apiFetch } from '../api';
import AIResponse from './AIResponse';

type TabKey =
  | 'extract'
  | 'query'
  | 'procedure'
  | 'gaps'
  | 'summarize'
  | 'similar'
  | 'entities'
  | 'autotag'
  | 'staleness';

export default function AICenter() {
  const [activeTab, setActiveTab] = useState<TabKey>('extract');

  // --- Original AICenter state ---
  const [extractContent, setExtractContent] = useState('');
  const [extractSource, setExtractSource] = useState('slack');
  const [extractResult, setExtractResult] = useState('');
  const [extractLoading, setExtractLoading] = useState(false);

  const [queryQuestion, setQueryQuestion] = useState('');
  const [queryContext, setQueryContext] = useState('');
  const [queryResult, setQueryResult] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  const [procName, setProcName] = useState('');
  const [procDept, setProcDept] = useState('');
  const [procContext, setProcContext] = useState('');
  const [procResult, setProcResult] = useState('');
  const [procLoading, setProcLoading] = useState(false);

  const [gapDept, setGapDept] = useState('');
  const [gapResult, setGapResult] = useState('');
  const [gapLoading, setGapLoading] = useState(false);

  // --- Migrated MoreAIPage state ---
  const [sumTitle, setSumTitle] = useState('');
  const [sumContent, setSumContent] = useState('');
  const [sumResult, setSumResult] = useState('');
  const [sumLoading, setSumLoading] = useState(false);

  const [simRef, setSimRef] = useState('');
  const [simCands, setSimCands] = useState('');
  const [simResult, setSimResult] = useState('');
  const [simLoading, setSimLoading] = useState(false);

  const [entContent, setEntContent] = useState('');
  const [entResult, setEntResult] = useState('');
  const [entLoading, setEntLoading] = useState(false);

  const [tagTitle, setTagTitle] = useState('');
  const [tagContent, setTagContent] = useState('');
  const [tagResult, setTagResult] = useState('');
  const [tagLoading, setTagLoading] = useState(false);

  const [staleDocs, setStaleDocs] = useState('');
  const [staleResult, setStaleResult] = useState('');
  const [staleLoading, setStaleLoading] = useState(false);

  // --- API calls ---
  async function runExtract() {
    setExtractLoading(true);
    setExtractResult('');
    try {
      const data = await apiFetch('/ai/extract-knowledge', { method: 'POST', body: JSON.stringify({ content: extractContent, source_type: extractSource }) });
      setExtractResult(data.result);
    } catch { setExtractResult('Failed to get AI response'); } finally { setExtractLoading(false); }
  }

  async function runQuery() {
    setQueryLoading(true);
    setQueryResult('');
    try {
      const data = await apiFetch('/ai/answer-query', { method: 'POST', body: JSON.stringify({ question: queryQuestion, relevant_entries: queryContext }) });
      setQueryResult(data.result);
    } catch { setQueryResult('Failed to get AI response'); } finally { setQueryLoading(false); }
  }

  async function runProc() {
    setProcLoading(true);
    setProcResult('');
    try {
      const data = await apiFetch('/ai/generate-procedure', { method: 'POST', body: JSON.stringify({ process_name: procName, department: procDept, context: procContext }) });
      setProcResult(data.result);
    } catch { setProcResult('Failed to get AI response'); } finally { setProcLoading(false); }
  }

  async function runGaps() {
    setGapLoading(true);
    setGapResult('');
    try {
      const data = await apiFetch('/ai/knowledge-gaps', { method: 'POST', body: JSON.stringify({ department: gapDept }) });
      setGapResult(data.result);
    } catch { setGapResult('Failed to get AI response'); } finally { setGapLoading(false); }
  }

  async function runSummarize() {
    setSumLoading(true); setSumResult('');
    try {
      const data = await apiFetch('/ai/summarize-document', { method: 'POST', body: JSON.stringify({ title: sumTitle, content: sumContent }) });
      setSumResult(data.result);
    } catch (e: any) { setSumResult('Failed: ' + (e?.message || 'unknown')); } finally { setSumLoading(false); }
  }

  async function runSimilar() {
    setSimLoading(true); setSimResult('');
    try {
      const candidates = simCands
        .split(/\n---\n/)
        .map(s => s.trim())
        .filter(Boolean)
        .map((block, idx) => {
          const firstLine = block.split('\n')[0] || `Candidate ${idx + 1}`;
          const rest = block.split('\n').slice(1).join('\n') || block;
          return { title: firstLine.slice(0, 200), content: rest };
        });
      const data = await apiFetch('/ai/find-similar', { method: 'POST', body: JSON.stringify({ reference: simRef, candidates }) });
      setSimResult(data.result);
    } catch (e: any) { setSimResult('Failed: ' + (e?.message || 'unknown')); } finally { setSimLoading(false); }
  }

  async function runEntities() {
    setEntLoading(true); setEntResult('');
    try {
      const data = await apiFetch('/ai/extract-entities', { method: 'POST', body: JSON.stringify({ content: entContent }) });
      setEntResult(data.result);
    } catch (e: any) { setEntResult('Failed: ' + (e?.message || 'unknown')); } finally { setEntLoading(false); }
  }

  async function runAutoTag() {
    setTagLoading(true); setTagResult('');
    try {
      const data = await apiFetch('/ai/auto-tag', { method: 'POST', body: JSON.stringify({ title: tagTitle, content: tagContent }) });
      setTagResult(data.result);
    } catch (e: any) { setTagResult('Failed: ' + (e?.message || 'unknown')); } finally { setTagLoading(false); }
  }

  async function runStaleness() {
    setStaleLoading(true); setStaleResult('');
    try {
      const documents = staleDocs
        .split(/\n---\n/)
        .map(s => s.trim())
        .filter(Boolean)
        .map((block) => {
          const lines = block.split('\n');
          const titleLine = lines[0] || 'Untitled';
          const meta: any = { title: titleLine };
          const dateMatch = block.match(/last[_ ]updated:\s*(\S+)/i);
          if (dateMatch) meta.last_updated = dateMatch[1];
          const statusMatch = block.match(/status:\s*(\S+)/i);
          if (statusMatch) meta.status = statusMatch[1];
          meta.content = lines.slice(1).join('\n');
          return meta;
        });
      const data = await apiFetch('/ai/staleness-rank', { method: 'POST', body: JSON.stringify({ documents }) });
      setStaleResult(data.result);
    } catch (e: any) { setStaleResult('Failed: ' + (e?.message || 'unknown')); } finally { setStaleLoading(false); }
  }

  // --- Sample prefill data ---
  const extractSamples = [
    {
      label: 'Slack incident',
      source: 'slack',
      content: '#prod-incidents 14:02 @sarah: Stripe webhooks are failing in production, getting 401s\n14:03 @mike: Confirmed — rotated the webhook signing secret yesterday but never updated STRIPE_WEBHOOK_SECRET in the prod env.\n14:05 @sarah: Pushed the new secret to AWS Secrets Manager and restarted the billing-service pods. Webhooks recovering.\n14:08 @mike: We should add the webhook secret rotation to the Incident Response Runbook.',
    },
    {
      label: 'Customer ticket',
      source: 'ticket',
      content: 'Ticket #4827 — Customer: Acme Corp (Enterprise plan)\nIssue: SSO via Okta intermittently fails for ~10% of logins after we upgraded to passport-saml 4.x.\nResolution: Rolled back to 3.2.4 in hotfix v2.14.1 and pinned in package.json. Long-term fix tracked in JIRA-2189.\nCustomer Success owner: Priya. Engineering owner: Daniel.',
    },
    {
      label: 'Meeting notes',
      source: 'meeting',
      content: 'Q3 Engineering Roadmap planning — attendees: Daniel (VP Eng), Priya (CS), Mike (Platform), Sarah (Billing).\nDecisions: (1) Migrate auth service to Auth0 by Sep 30. (2) Freeze new feature work for Billing during PCI audit window Aug 12–26. (3) Adopt Datadog APM company-wide; sunset NewRelic by Oct 1.',
    },
  ];
  const querySamples = [
    {
      label: 'Refund policy',
      question: 'How do we handle customer refund requests for annual Enterprise contracts?',
      context: 'Refund policy v3.2 — Enterprise annual contracts are non-refundable after day 30 except for documented platform SLA breaches. Customer Success must escalate to Finance (refunds@) within 5 business days.',
    },
    {
      label: 'On-call rotation',
      question: 'Who is on-call for the Billing service this week and what is the escalation path?',
      context: 'PagerDuty schedule "billing-primary" rotates weekly Mon 09:00 PT. Escalation: primary -> secondary (15min) -> Mike (Platform Lead, 30min) -> Daniel (VP Eng).',
    },
    {
      label: 'PTO request',
      question: 'What is the process for requesting more than 2 weeks of PTO?',
      context: '',
    },
  ];
  const procSamples = [
    {
      label: 'Customer onboarding',
      name: 'Customer onboarding for Enterprise accounts',
      dept: 'Customer Success',
      context: 'New Enterprise customer signs MSA, needs SSO setup, sandbox tenant provisioned, kickoff call scheduled within 5 business days. Customer Success owns until day 90.',
    },
    {
      label: 'Incident response',
      name: 'Production incident response',
      dept: 'Engineering',
      context: 'Sev1 outage: page on-call via PagerDuty, open #incident-<id> Slack channel, declare Incident Commander, post status to status.example.com within 15 min, write postmortem within 5 business days.',
    },
    {
      label: 'Expense reimburse',
      name: 'Employee expense reimbursement',
      dept: 'Finance',
      context: 'Expenses submitted via Expensify within 30 days. Manager approval required above $250. Finance batch-pays every Friday via ACH.',
    },
  ];
  const gapSamples = [
    { label: 'Engineering', dept: 'Engineering' },
    { label: 'Customer Success', dept: 'Customer Success' },
    { label: 'Finance', dept: 'Finance' },
  ];
  const sumSamples = [
    {
      label: 'Q3 Eng Roadmap',
      title: 'Q3 Engineering Roadmap',
      content: 'Q3 Engineering Roadmap (Jul–Sep)\n\nThemes: Reliability, Auth modernization, Cost.\n\n1. Reliability — reduce p99 API latency from 740ms to <400ms by Sep 30. Owner: Mike (Platform). Adopt Datadog APM company-wide; sunset NewRelic by Oct 1.\n2. Auth modernization — migrate auth-service from custom JWT to Auth0 by Sep 30. Owner: Daniel. Required for SOC2 Type II in Q4.\n3. Cost — cut AWS bill by 18% via Graviton migration of 12 services + S3 lifecycle policies. Owner: Mike.\n\nFreezes: PCI audit Aug 12–26 — no Billing service deploys.\nRisks: auth-service migration is on the critical path; if it slips, SOC2 audit slips.',
    },
    {
      label: 'Onboarding playbook',
      title: 'Customer Onboarding Playbook',
      content: 'Customer Onboarding Playbook v4.1\n\nApplies to: Enterprise customers (>$50k ACV).\n\nDay 0 — MSA & order form signed. Customer Success Manager assigned within 4 business hours.\nDay 1–3 — Kickoff call with customer admin. Provision sandbox tenant. Send SSO config kit (SAML metadata, group mappings).\nDay 4–14 — Production tenant provisioned. SSO go-live. Import historical data via /api/import.\nDay 15–30 — Admin & end-user training (2 sessions). Success criteria signed off.\nDay 30–90 — Weekly checkpoints. QBR scheduled at day 90.\n\nEscalation: blockers >24h escalate to VP CS (Priya). Tech blockers escalate to on-call Solutions Engineer.',
    },
    {
      label: 'Incident runbook',
      title: 'Incident Response Runbook',
      content: 'Incident Response Runbook (Sev1)\n\n1. Detection — PagerDuty alert or customer report.\n2. Acknowledge within 5 min. Page secondary if no ack in 15.\n3. Open #incident-<yyyymmdd-N> Slack channel; invite on-call + Incident Commander.\n4. Post initial status to status.example.com within 15 min.\n5. Updates every 30 min until resolved.\n6. Resolution — confirm with customer-facing teams; post all-clear.\n7. Postmortem doc within 5 business days using the blameless template; review in weekly Eng staff.',
    },
  ];
  const simSamples = [
    {
      label: 'Refund policies',
      ref: 'Refund Policy v3.2 — Enterprise annual contracts are non-refundable after day 30 except for documented platform SLA breaches. Customer Success must escalate to Finance within 5 business days of the request.',
      cands: 'Cancellation Policy v2.0\nMonth-to-month plans may be cancelled at any time before the next billing cycle. No refunds for partial months. Self-service via the Billing settings page.\n---\nSLA Credit Schedule\nAvailability below 99.9% in a calendar month entitles Enterprise customers to service credits on a sliding scale (10% credit at 99.0–99.9%, 25% credit below 99.0%). Credits are applied to the next invoice.\n---\nQ3 Engineering Roadmap\nThemes: reliability, auth modernization, cost. Migrate auth-service to Auth0 by Sep 30.',
    },
    {
      label: 'On-call procedures',
      ref: 'Production Incident Response Runbook — Sev1: page on-call via PagerDuty, open #incident channel within 5 min, declare an Incident Commander, post status updates every 30 min, write a blameless postmortem within 5 business days.',
      cands: 'On-call Handoff Checklist\nOutgoing on-call posts a handoff message in #platform-oncall: open incidents, recent deploys, known-flaky alerts. Incoming on-call acks within 30 min of shift start.\n---\nPagerDuty Escalation Policies\nbilling-primary -> billing-secondary (15 min) -> Mike (Platform Lead, 30 min) -> Daniel (VP Eng, 60 min). Same shape for auth and api services.\n---\nExpense Reimbursement Policy\nSubmit via Expensify within 30 days; manager approval required above $250.',
    },
  ];
  const entSamples = [
    {
      label: 'Postmortem',
      content: 'Postmortem 2026-04-18 — Stripe webhook outage. Sarah (Billing) discovered failing webhooks at 14:02 PT after Mike rotated the Stripe webhook signing secret on Apr 17 without updating STRIPE_WEBHOOK_SECRET in the AWS Secrets Manager prod entry. Impact: 2,140 invoices delayed across 318 customers including Acme Corp and Globex Inc. Resolved 14:31 PT. Action items assigned to Mike and Sarah, due May 1.',
    },
    {
      label: 'Sales kickoff',
      content: 'FY26 Sales Kickoff — Las Vegas, Feb 3–5, 2026. Keynote by CEO Jordan Park. Top deals announced: Northwind Trading ($1.2M ACV, closed by Lena Ortiz), Initech ($840k ACV, closed by Marcus Chen). New product line "BrainConnect" launches Mar 15 — pricing tier US$2,500/seat/year. Quota for AEs raised 12% YoY.',
    },
    {
      label: 'Vendor contract',
      content: 'Master Services Agreement between Example Inc. and Datadog, Inc., effective 2026-01-15, term 24 months, total contract value $480,000 USD, billed annually. Primary contact: Priya Shah (VP Customer Success). Datadog account exec: Tom Reilly. Includes APM, Logs, and RUM modules for up to 200 hosts.',
    },
  ];
  const tagSamples = [
    {
      label: 'Eng roadmap',
      title: 'Q3 Engineering Roadmap',
      content: 'Themes: reliability (p99 latency <400ms), auth modernization (migrate to Auth0 by Sep 30), cost (Graviton migration, S3 lifecycle). PCI audit freeze Aug 12–26.',
    },
    {
      label: 'Expense policy',
      title: 'Travel & Expense Policy',
      content: 'All employees may book travel via TripActions. Per diem $75 domestic, $110 international. Receipts required above $25. Submit reimbursement via Expensify within 30 days. Manager approval required above $250. Finance pays ACH every Friday.',
    },
    {
      label: 'CS onboarding',
      title: 'Customer Onboarding Playbook',
      content: 'Enterprise onboarding sequence: MSA day 0, kickoff day 1–3, sandbox provisioned, SSO go-live by day 14, training day 15–30, QBR at day 90. CSM owns the relationship through day 90.',
    },
  ];
  const staleSamples = [
    {
      label: 'Mixed docs',
      docs: 'Onboarding Runbook v1\nlast_updated: 2021-03-12\nstatus: active\nLegacy onboarding flow with manual database seeding and SSH bastion access. References our old Heroku stack.\n---\nQ3 Engineering Roadmap\nlast_updated: 2026-04-02\nstatus: active\nThemes: reliability, auth modernization (Auth0 by Sep 30), cost (Graviton migration).\n---\nSlack Channel Etiquette\nlast_updated: 2019-08-04\nstatus: active\nUse /remind, prefer threads, no @channel without a manager approval.',
    },
    {
      label: 'Policies set',
      docs: 'SOC2 Access Control Policy\nlast_updated: 2025-11-12\nstatus: active\nProduction access requires MFA and is logged via CloudTrail. Quarterly access review owned by Security.\n---\nExpense Reimbursement Policy\nlast_updated: 2022-01-10\nstatus: active\nSubmit via Expensify within 30 days. Manager approval above $250.\n---\nIncident Response Runbook\nlast_updated: 2020-06-01\nstatus: deprecated\nReferences old PagerDuty schedules and the deprecated #incidents channel naming scheme.',
    },
  ];

  function loadExtract(s: typeof extractSamples[number]) { setExtractSource(s.source); setExtractContent(s.content); }
  function loadQuery(s: typeof querySamples[number]) { setQueryQuestion(s.question); setQueryContext(s.context); }
  function loadProc(s: typeof procSamples[number]) { setProcName(s.name); setProcDept(s.dept); setProcContext(s.context); }
  function loadGap(s: typeof gapSamples[number]) { setGapDept(s.dept); }
  function loadSum(s: typeof sumSamples[number]) { setSumTitle(s.title); setSumContent(s.content); }
  function loadSim(s: typeof simSamples[number]) { setSimRef(s.ref); setSimCands(s.cands); }
  function loadEnt(s: typeof entSamples[number]) { setEntContent(s.content); }
  function loadTag(s: typeof tagSamples[number]) { setTagTitle(s.title); setTagContent(s.content); }
  function loadStale(s: typeof staleSamples[number]) { setStaleDocs(s.docs); }

  const sampleBtn = 'text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-2.5 py-1 rounded-md';

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'extract',    label: 'Extract Knowledge', icon: Layers },
    { key: 'query',      label: 'Answer Query',      icon: Search },
    { key: 'procedure',  label: 'Generate Procedure',icon: Cpu },
    { key: 'gaps',       label: 'Knowledge Gaps',    icon: Layers },
    { key: 'summarize',  label: 'Summarize',         icon: FileText },
    { key: 'similar',    label: 'Find Similar',      icon: GitCompare },
    { key: 'entities',   label: 'Extract Entities',  icon: Users },
    { key: 'autotag',    label: 'Auto-Tag',          icon: Tags },
    { key: 'staleness',  label: 'Staleness Rank',    icon: Clock },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Sparkles size={28} className="text-violet-400" />
        <h1 className="text-2xl font-bold text-white">AI Center</h1>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-3">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-violet-600 text-white'
                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Extract Knowledge */}
      {activeTab === 'extract' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={20} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Extract Knowledge</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Paste content from any source and extract structured knowledge entries.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Try a sample:</span>
            {extractSamples.map(s => (
              <button key={s.label} type="button" onClick={() => loadExtract(s)} className={sampleBtn}>{s.label}</button>
            ))}
          </div>
          <div className="space-y-3">
            <select value={extractSource} onChange={e => setExtractSource(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              {['slack','email','document','ticket','meeting','wiki'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea value={extractContent} onChange={e => setExtractContent(e.target.value)}
              placeholder="Paste text content here..."
              rows={5} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <button onClick={runExtract} disabled={extractLoading || !extractContent.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> {extractLoading ? 'Extracting...' : 'Extract Knowledge'}
            </button>
          </div>
          <div className="mt-4"><AIResponse title="Extracted Knowledge" content={extractResult} loading={extractLoading} /></div>
        </div>
      )}

      {/* Answer Query */}
      {activeTab === 'query' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Answer Company Query</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Ask any question about company processes and get AI-powered answers.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Try a sample:</span>
            {querySamples.map(s => (
              <button key={s.label} type="button" onClick={() => loadQuery(s)} className={sampleBtn}>{s.label}</button>
            ))}
          </div>
          <div className="space-y-3">
            <input value={queryQuestion} onChange={e => setQueryQuestion(e.target.value)}
              placeholder="e.g. How do we handle customer refunds?"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <textarea value={queryContext} onChange={e => setQueryContext(e.target.value)}
              placeholder="Optional: paste relevant knowledge entries as context..."
              rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <button onClick={runQuery} disabled={queryLoading || !queryQuestion.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> {queryLoading ? 'Answering...' : 'Answer Query'}
            </button>
          </div>
          <div className="mt-4"><AIResponse title="Query Answer" content={queryResult} loading={queryLoading} /></div>
        </div>
      )}

      {/* Generate Procedure */}
      {activeTab === 'procedure' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={20} className="text-green-400" />
            <h2 className="text-lg font-semibold text-white">Generate Procedure</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Generate a step-by-step procedure for any business process.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Try a sample:</span>
            {procSamples.map(s => (
              <button key={s.label} type="button" onClick={() => loadProc(s)} className={sampleBtn}>{s.label}</button>
            ))}
          </div>
          <div className="space-y-3">
            <input value={procName} onChange={e => setProcName(e.target.value)}
              placeholder="Process name, e.g. Customer onboarding"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <input value={procDept} onChange={e => setProcDept(e.target.value)}
              placeholder="Department, e.g. Customer Success"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <textarea value={procContext} onChange={e => setProcContext(e.target.value)}
              placeholder="Additional context..."
              rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <button onClick={runProc} disabled={procLoading || !procName.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> {procLoading ? 'Generating...' : 'Generate Procedure'}
            </button>
          </div>
          <div className="mt-4"><AIResponse title="Generated Procedure" content={procResult} loading={procLoading} /></div>
        </div>
      )}

      {/* Knowledge Gaps */}
      {activeTab === 'gaps' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={20} className="text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Identify Knowledge Gaps</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Discover undocumented processes and tribal knowledge risks in any department.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Try a sample:</span>
            {gapSamples.map(s => (
              <button key={s.label} type="button" onClick={() => loadGap(s)} className={sampleBtn}>{s.label}</button>
            ))}
          </div>
          <div className="space-y-3">
            <input value={gapDept} onChange={e => setGapDept(e.target.value)}
              placeholder="Department, e.g. Engineering"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <button onClick={runGaps} disabled={gapLoading || !gapDept.trim()}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> {gapLoading ? 'Analyzing...' : 'Find Knowledge Gaps'}
            </button>
          </div>
          <div className="mt-4"><AIResponse title="Knowledge Gaps Analysis" content={gapResult} loading={gapLoading} /></div>
        </div>
      )}

      {/* Summarize Document */}
      {activeTab === 'summarize' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Summarize Document</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Generate an executive summary, key points, and action items from any document.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Try a sample:</span>
            {sumSamples.map(s => (
              <button key={s.label} type="button" onClick={() => loadSum(s)} className={sampleBtn}>{s.label}</button>
            ))}
          </div>
          <div className="space-y-3">
            <input value={sumTitle} onChange={e => setSumTitle(e.target.value)} placeholder="Document title (optional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <textarea value={sumContent} onChange={e => setSumContent(e.target.value)} placeholder="Paste document content..."
              rows={6} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <button onClick={runSummarize} disabled={sumLoading || !sumContent.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> {sumLoading ? 'Summarizing...' : 'Summarize'}
            </button>
          </div>
          <div className="mt-4"><AIResponse title="Document Summary" content={sumResult} loading={sumLoading} /></div>
        </div>
      )}

      {/* Find Similar */}
      {activeTab === 'similar' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <GitCompare size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Find Semantically Similar</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Rank candidate documents by similarity to a reference. Separate candidates with <code className="text-blue-300">---</code> on its own line.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Try a sample:</span>
            {simSamples.map(s => (
              <button key={s.label} type="button" onClick={() => loadSim(s)} className={sampleBtn}>{s.label}</button>
            ))}
          </div>
          <div className="space-y-3">
            <textarea value={simRef} onChange={e => setSimRef(e.target.value)} placeholder="Reference document text..."
              rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <textarea value={simCands} onChange={e => setSimCands(e.target.value)} placeholder={'Candidate 1 title\nbody...\n---\nCandidate 2 title\nbody...'}
              rows={6} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <button onClick={runSimilar} disabled={simLoading || !simRef.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> {simLoading ? 'Comparing...' : 'Find Similar'}
            </button>
          </div>
          <div className="mt-4"><AIResponse title="Similarity Ranking" content={simResult} loading={simLoading} /></div>
        </div>
      )}

      {/* Extract Entities */}
      {activeTab === 'entities' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-green-400" />
            <h2 className="text-lg font-semibold text-white">Extract Entities</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Pull people, organizations, locations, dates, products, and metrics from any text.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Try a sample:</span>
            {entSamples.map(s => (
              <button key={s.label} type="button" onClick={() => loadEnt(s)} className={sampleBtn}>{s.label}</button>
            ))}
          </div>
          <div className="space-y-3">
            <textarea value={entContent} onChange={e => setEntContent(e.target.value)} placeholder="Paste text..."
              rows={5} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <button onClick={runEntities} disabled={entLoading || !entContent.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> {entLoading ? 'Extracting...' : 'Extract Entities'}
            </button>
          </div>
          <div className="mt-4"><AIResponse title="Entities" content={entResult} loading={entLoading} /></div>
        </div>
      )}

      {/* Auto-tag */}
      {activeTab === 'autotag' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Tags size={20} className="text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Auto-Tag</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Suggest a primary category, tags, and department for a new document.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Try a sample:</span>
            {tagSamples.map(s => (
              <button key={s.label} type="button" onClick={() => loadTag(s)} className={sampleBtn}>{s.label}</button>
            ))}
          </div>
          <div className="space-y-3">
            <input value={tagTitle} onChange={e => setTagTitle(e.target.value)} placeholder="Document title (optional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <textarea value={tagContent} onChange={e => setTagContent(e.target.value)} placeholder="Document content..."
              rows={5} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <button onClick={runAutoTag} disabled={tagLoading || !tagContent.trim()}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> {tagLoading ? 'Tagging...' : 'Auto-Tag'}
            </button>
          </div>
          <div className="mt-4"><AIResponse title="Suggested Tags" content={tagResult} loading={tagLoading} /></div>
        </div>
      )}

      {/* Staleness Rank */}
      {activeTab === 'staleness' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-pink-400" />
            <h2 className="text-lg font-semibold text-white">Knowledge-Staleness Ranker</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Rank documents by how out-of-date they appear. Separate documents with <code className="text-blue-300">---</code> on its own line. Optional metadata: <code className="text-blue-300">last_updated: YYYY-MM-DD</code>, <code className="text-blue-300">status: ...</code>.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">Try a sample:</span>
            {staleSamples.map(s => (
              <button key={s.label} type="button" onClick={() => loadStale(s)} className={sampleBtn}>{s.label}</button>
            ))}
          </div>
          <div className="space-y-3">
            <textarea value={staleDocs} onChange={e => setStaleDocs(e.target.value)} placeholder={'Onboarding Runbook\nlast_updated: 2021-03-12\nstatus: active\nbody...\n---\nQ4 OKRs\nlast_updated: 2024-10-01\nbody...'}
              rows={8} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            <button onClick={runStaleness} disabled={staleLoading || !staleDocs.trim()}
              className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> {staleLoading ? 'Analyzing...' : 'Rank Staleness'}
            </button>
          </div>
          <div className="mt-4"><AIResponse title="Staleness Ranking" content={staleResult} loading={staleLoading} /></div>
        </div>
      )}
    </div>
  );
}
