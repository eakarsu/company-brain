const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// Domain-realistic sample rows for each entity (skipping users + audit_log).
// Each generator returns an array of 5-10 row objects.

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const SAMPLES = {
  knowledge: () => ([
    { title: 'Onboarding: First Week Checklist', category: 'HR', content: 'Day 1: laptop pickup, badge, IT setup. Day 2: org overview. Day 3: tooling deep-dive. End of week: 1:1 with manager, intro to mentor.', source_type: 'wiki', author: 'Priya Shah', department: 'People Ops', tags: 'onboarding,checklist,new-hire' },
    { title: 'Q3 Engineering Roadmap', category: 'Engineering', content: 'Three pillars for Q3: latency reduction (p95 <250ms), self-serve admin tooling, and SOC2 readiness. OKRs tracked weekly in eng-leads.', source_type: 'doc', author: 'Marcus Chen', department: 'Engineering', tags: 'roadmap,q3,okr,engineering' },
    { title: 'Customer Onboarding Playbook', category: 'Customer Success', content: 'Kickoff call within 48h of contract sign. Provision tenant, schedule training, assign CSM. 30/60/90 milestones tracked in Gainsight.', source_type: 'playbook', author: 'Lena Ortiz', department: 'Customer Success', tags: 'playbook,onboarding,csm' },
    { title: 'Incident Response — Sev1 Pager Runbook', category: 'Engineering', content: 'On page: ack within 5 min, open #inc-room, declare IC, status page within 15 min. Post-mortem due 48h after resolution.', source_type: 'runbook', author: 'Marcus Chen', department: 'Engineering', tags: 'incident,sev1,oncall,runbook' },
    { title: 'Sales Discovery Question Bank', category: 'Sales', content: 'Top 12 discovery questions covering pain, urgency, budget, decision process. Use BANT+CHAMP hybrid in Salesforce notes.', source_type: 'guide', author: 'Daniel Whitcombe', department: 'Sales', tags: 'sales,discovery,bant,champ' },
    { title: 'Brand Voice Guidelines v3', category: 'Marketing', content: 'Tone: confident, direct, never jargon-heavy. Avoid superlatives. Always lead with customer outcome, not feature list.', source_type: 'guide', author: 'Sasha Rivers', department: 'Marketing', tags: 'brand,voice,style,marketing' },
    { title: 'Expense Reimbursement FAQ', category: 'Finance', content: 'Submit in Expensify within 30 days. Receipts required >$25. T&E policy capped at $75/day domestic, $125 intl.', source_type: 'faq', author: 'Henry Okafor', department: 'Finance', tags: 'expense,reimbursement,finance,faq' },
    { title: 'How We Run Sprint Retros', category: 'Engineering', content: 'Bi-weekly, 60 min, async pre-write 24h prior. Format: glad/sad/mad + 1 action item per theme. Owner + due date mandatory.', source_type: 'wiki', author: 'Aoife Brennan', department: 'Engineering', tags: 'agile,retro,sprint,process' },
  ]),

  documents: () => ([
    { title: 'Master Services Agreement (Template v4.2)', source_url: 'https://drive.example.com/d/msa-v4-2', content: 'Standard MSA covering term, payment, IP assignment, liability cap (12mo fees), confidentiality, termination for convenience with 60d notice.', department: 'Legal', doc_type: 'contract', status: 'active', last_updated: today(-12), word_count: 4820, indexed: true },
    { title: 'Q3 Engineering Roadmap', source_url: 'https://notion.example.com/eng/q3-roadmap', content: 'Detailed breakdown of Q3 engineering investments: latency, self-serve, SOC2, plus staffing plan and dependency map.', department: 'Engineering', doc_type: 'roadmap', status: 'active', last_updated: today(-3), word_count: 2740, indexed: true },
    { title: 'Customer Onboarding Playbook', source_url: 'https://notion.example.com/cs/onboarding-playbook', content: 'Step-by-step onboarding flow for new customers: kickoff, provisioning, training, 30/60/90 review cadence.', department: 'Customer Success', doc_type: 'playbook', status: 'active', last_updated: today(-8), word_count: 3120, indexed: true },
    { title: 'SOC2 Readiness Assessment 2026', source_url: 'https://drive.example.com/d/soc2-readiness-2026', content: 'Gap analysis against Trust Services Criteria. 38 controls in place, 11 in progress, 4 pending vendor decisions.', department: 'Security', doc_type: 'report', status: 'draft', last_updated: today(-1), word_count: 5410, indexed: false },
    { title: 'Sales Compensation Plan FY2026', source_url: 'https://drive.example.com/d/comp-plan-fy26', content: 'AE quotas, accelerators above 100%, SPIFs, clawback rules, territory assignments. Effective Feb 1.', department: 'Sales', doc_type: 'policy', status: 'active', last_updated: today(-30), word_count: 1980, indexed: true },
    { title: 'Brand Voice Guidelines v3', source_url: 'https://drive.example.com/d/brand-voice-v3', content: 'Voice attributes, do/dont examples, sample headlines, case studies of rewrites from v2 to v3.', department: 'Marketing', doc_type: 'guide', status: 'active', last_updated: today(-21), word_count: 2210, indexed: true },
    { title: 'Postmortem — March 14 Database Outage', source_url: 'https://wiki.example.com/postmortems/2026-03-14', content: 'Root cause: stale connection pool config after pgbouncer upgrade. 38 minute customer impact. Action items: add canary, alert on idle conn ratio.', department: 'Engineering', doc_type: 'postmortem', status: 'active', last_updated: today(-54), word_count: 1640, indexed: true },
  ]),

  queries: () => ([
    { question: 'What is our PTO carryover policy?', answer: 'Up to 5 days carry over to the next calendar year; the rest is forfeited unless local law requires otherwise.', confidence: 0.92, helpful: true, sources: 'policy:HR-PTO-2025' },
    { question: 'How do I request access to the data warehouse?', answer: 'Open a ticket in #it-help with your manager tagged. Access is granted via Okta group dwh-readonly within 1 business day.', confidence: 0.88, helpful: true, sources: 'wiki:data-access' },
    { question: 'Who owns the brand voice guidelines?', answer: 'Sasha Rivers (Marketing). Latest version is v3, updated three weeks ago.', confidence: 0.95, helpful: true, sources: 'doc:brand-voice-v3' },
    { question: 'What is the SLA for Sev2 incidents?', answer: 'Acknowledge within 30 minutes, mitigation within 4 hours, full resolution within 1 business day.', confidence: 0.9, helpful: true, sources: 'runbook:incident-response' },
    { question: 'Can I expense a coworking day?', answer: 'Only if pre-approved by your manager and you have no assigned office. Cap is $40/day, submit in Expensify.', confidence: 0.78, helpful: false, sources: 'faq:expense' },
    { question: 'How long does customer onboarding usually take?', answer: 'Standard onboarding is 30 days from kickoff. Enterprise tier averages 45-60 days due to SSO and custom integrations.', confidence: 0.83, helpful: true, sources: 'playbook:customer-onboarding' },
    { question: 'What model do we use for the AI Center by default?', answer: 'anthropic/claude-haiku-4.5 via OpenRouter. Set OPENROUTER_API_KEY in env to enable.', confidence: 0.97, helpful: true, sources: 'wiki:ai-center' },
  ]),

  procedures: () => ([
    { name: 'New Employee Onboarding', department: 'People Ops', steps_json: JSON.stringify(['Send offer letter','Provision laptop + Okta','Schedule day-1 orientation','Assign onboarding buddy','30-day check-in']), version: '2.1', owner: 'Priya Shah', last_updated: today(-15), status: 'active', usage_count: 47 },
    { name: 'Vendor Security Review', department: 'Security', steps_json: JSON.stringify(['Submit vendor intake form','SOC2 / ISO27001 review','DPA + data flow mapping','Risk score','CISO sign-off']), version: '1.4', owner: 'Tomas Whelan', last_updated: today(-22), status: 'active', usage_count: 18 },
    { name: 'Sev1 Incident Response', department: 'Engineering', steps_json: JSON.stringify(['Pager ack within 5 min','Open #inc-room','Declare IC','Status page update','Mitigate','Post-mortem within 48h']), version: '3.0', owner: 'Marcus Chen', last_updated: today(-7), status: 'active', usage_count: 12 },
    { name: 'Customer Kickoff Call', department: 'Customer Success', steps_json: JSON.stringify(['Schedule within 48h of contract','Send pre-read deck','Run 60-min kickoff','Capture goals + KPIs','Open Gainsight project']), version: '2.0', owner: 'Lena Ortiz', last_updated: today(-9), status: 'active', usage_count: 64 },
    { name: 'Expense Report Submission', department: 'Finance', steps_json: JSON.stringify(['Snap receipt in Expensify','Categorize + tag project','Submit for manager approval','Finance review','Reimbursement next pay cycle']), version: '1.2', owner: 'Henry Okafor', last_updated: today(-40), status: 'active', usage_count: 312 },
    { name: 'Production Deploy', department: 'Engineering', steps_json: JSON.stringify(['Open release PR','Run CI','Deploy to staging','Smoke test','Promote to prod','Monitor 30 min']), version: '4.3', owner: 'Aoife Brennan', last_updated: today(-2), status: 'active', usage_count: 540 },
    { name: 'Quarterly Access Review', department: 'Security', steps_json: JSON.stringify(['Pull Okta access report','Distribute to managers','Collect approvals','Revoke stale access','File evidence pack']), version: '1.1', owner: 'Tomas Whelan', last_updated: today(-90), status: 'draft', usage_count: 4 },
  ]),

  policies: () => ([
    { name: 'Acceptable Use Policy', category: 'Security', content: 'Company devices and accounts are for business use. No installation of unapproved software. MFA required on all SaaS apps.', effective_date: today(-180), owner: 'Tomas Whelan', approved_by: 'CISO', review_date: today(185), status: 'active' },
    { name: 'PTO and Time-Off Policy', category: 'HR', content: 'Salaried employees: 20 days PTO + 10 holidays. 5-day carryover cap. Sick leave separate and uncapped within reason.', effective_date: today(-365), owner: 'Priya Shah', approved_by: 'CHRO', review_date: today(0), status: 'active' },
    { name: 'Data Classification Policy', category: 'Security', content: 'Four tiers: Public, Internal, Confidential, Restricted. Restricted data requires encryption at rest + in transit and access logging.', effective_date: today(-120), owner: 'Tomas Whelan', approved_by: 'CISO', review_date: today(245), status: 'active' },
    { name: 'Travel & Expense Policy', category: 'Finance', content: '$75/day domestic, $125 international. Economy flights under 6h. Hotel cap $250/night major metros, $175 elsewhere.', effective_date: today(-200), owner: 'Henry Okafor', approved_by: 'CFO', review_date: today(165), status: 'active' },
    { name: 'Code of Conduct', category: 'HR', content: 'Standards for respectful behavior, conflict of interest, anti-harassment, reporting channels, and non-retaliation.', effective_date: today(-400), owner: 'Priya Shah', approved_by: 'CEO', review_date: today(-35), status: 'active' },
    { name: 'AI Tooling Usage Policy', category: 'Engineering', content: 'No customer PII in third-party LLM prompts unless under signed DPA. Approved providers: OpenAI, Anthropic, OpenRouter (with redaction).', effective_date: today(-60), owner: 'Marcus Chen', approved_by: 'CTO', review_date: today(305), status: 'active' },
    { name: 'Vendor Risk Management Policy', category: 'Security', content: 'All new vendors handling Confidential+ data require a security review and DPA before contract signing.', effective_date: today(-90), owner: 'Tomas Whelan', approved_by: 'CISO', review_date: today(275), status: 'active' },
  ]),

  decisions: () => ([
    { title: 'Adopt Postgres over MySQL for new services', context: 'Need richer JSONB + extensions + better indexing for analytics workloads.', decision_made: 'All new services default to Postgres 16. MySQL allowed only for legacy interop.', rationale: 'JSONB, partial indexes, mature ecosystem, team familiarity.', made_by: 'Marcus Chen', decision_date: today(-95), impact_level: 'high', tags: 'database,architecture,postgres', reversible: false },
    { title: 'Standardize on Claude Haiku 4.5 for AI Center', context: 'Evaluating cost/quality tradeoffs across LLM providers for in-product AI features.', decision_made: 'Default model: anthropic/claude-haiku-4.5 via OpenRouter. Fallback: gpt-4o-mini.', rationale: 'Best price/perf for our extraction + summarization workloads in benchmarks.', made_by: 'Marcus Chen', decision_date: today(-45), impact_level: 'medium', tags: 'ai,llm,vendor', reversible: true },
    { title: 'Move from Heroku to AWS ECS', context: 'Heroku costs scaling poorly and limited region options.', decision_made: 'Migrate all production workloads to AWS ECS Fargate by end of Q4.', rationale: '40% cost reduction projected, multi-region, better security tooling.', made_by: 'Aoife Brennan', decision_date: today(-30), impact_level: 'high', tags: 'infra,aws,migration', reversible: false },
    { title: 'Pause India market expansion', context: 'Sales pipeline weaker than projected; localization cost higher than modeled.', decision_made: 'Pause net-new India GTM investment. Maintain existing customers.', rationale: 'Reallocate budget to EMEA where conversion is 2.3x better.', made_by: 'Daniel Whitcombe', decision_date: today(-14), impact_level: 'high', tags: 'gtm,strategy,emea,india', reversible: true },
    { title: 'Adopt Linear over Jira', context: 'Engineering frustration with Jira; Linear pilot showed 30% faster issue creation.', decision_made: 'Migrate engineering issues to Linear. Product still uses Jira for cross-team programs.', rationale: 'Speed, modern UX, strong API. Migration tooling acceptable.', made_by: 'Marcus Chen', decision_date: today(-60), impact_level: 'medium', tags: 'tooling,linear,jira', reversible: true },
    { title: 'Mandatory async-first communication', context: 'Distributed team across 6 time zones reporting meeting fatigue.', decision_made: 'Default to written updates. Sync meetings require an agenda + named decision.', rationale: 'Higher leverage for async-friendly time zones; better artifact trail.', made_by: 'Priya Shah', decision_date: today(-110), impact_level: 'medium', tags: 'culture,remote,async', reversible: true },
    { title: 'Free tier pricing change', context: 'Free tier driving low conversion and high support load.', decision_made: 'Cap free tier at 1k events/mo (down from 10k). Existing users grandfathered for 90 days.', rationale: 'Improves activation funnel, reduces infra waste on non-paying accounts.', made_by: 'Daniel Whitcombe', decision_date: today(-7), impact_level: 'high', tags: 'pricing,free-tier,gtm', reversible: true },
  ]),
};

const ENTITY_INSERTS = {
  knowledge: async (row) => pool.query(
    'INSERT INTO knowledge_entries (title, category, content, source_type, author, department, tags) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [row.title, row.category, row.content, row.source_type, row.author, row.department, row.tags]
  ),
  documents: async (row) => pool.query(
    'INSERT INTO documents (title, source_url, content, department, doc_type, status, last_updated, word_count, indexed) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [row.title, row.source_url, row.content, row.department, row.doc_type, row.status, row.last_updated, row.word_count, row.indexed]
  ),
  queries: async (row, userId) => pool.query(
    'INSERT INTO queries (question, answer, confidence, user_id, helpful, sources) VALUES ($1,$2,$3,$4,$5,$6)',
    [row.question, row.answer, row.confidence, userId || null, row.helpful, row.sources]
  ),
  procedures: async (row) => pool.query(
    'INSERT INTO procedures (name, department, steps_json, version, owner, last_updated, status, usage_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [row.name, row.department, row.steps_json, row.version, row.owner, row.last_updated, row.status, row.usage_count]
  ),
  policies: async (row) => pool.query(
    'INSERT INTO policies (name, category, content, effective_date, owner, approved_by, review_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [row.name, row.category, row.content, row.effective_date, row.owner, row.approved_by, row.review_date, row.status]
  ),
  decisions: async (row) => pool.query(
    'INSERT INTO decisions (title, context, decision_made, rationale, made_by, decision_date, impact_level, tags, reversible) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [row.title, row.context, row.decision_made, row.rationale, row.made_by, row.decision_date, row.impact_level, row.tags, row.reversible]
  ),
};

router.get('/sample-data', verifyToken, (req, res) => {
  res.json({ entities: Object.keys(SAMPLES) });
});

router.post('/sample-data/:entity', verifyToken, async (req, res) => {
  const entity = req.params.entity;
  if (!SAMPLES[entity] || !ENTITY_INSERTS[entity]) {
    return res.status(400).json({ error: `Unknown entity: ${entity}` });
  }
  try {
    const rows = SAMPLES[entity]();
    let inserted = 0;
    for (const row of rows) {
      await ENTITY_INSERTS[entity](row, req.user && req.user.id);
      inserted += 1;
    }
    res.json({ inserted, entity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
