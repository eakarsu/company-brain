-- Authentication identities are provisioned through scripts/provision-local-admin.cjs.
INSERT INTO knowledge_entries (title, category, content, source_type, author, department, tags, views, helpful_votes) VALUES
('How to handle customer refunds', 'procedure', 'To process a refund: 1. Verify purchase in CRM. 2. Check refund eligibility within 30 days. 3. Issue refund via original payment method. 4. Send confirmation email. 5. Log in support ticket.', 'document', 'Sarah Johnson', 'Customer Support', 'refund,customer,payment', 142, 38),
('Remote work policy 2024', 'policy', 'Employees may work remotely up to 3 days per week. Core hours are 10am-3pm local time. VPN required for all internal systems. Home office equipment stipend: $500/year.', 'document', 'HR Team', 'Human Resources', 'remote,wfh,policy', 89, 27),
('Incident response procedure', 'procedure', 'SEV1: Page on-call immediately, create incident channel, update status page within 15 min. SEV2: Notify team lead, update within 30 min. SEV3: Create ticket, address in next sprint.', 'slack', 'DevOps Team', 'Engineering', 'incident,oncall,sev1', 203, 67),
('Sales pricing exceptions approval', 'decision', 'Discounts above 20% require VP Sales approval. Above 35% require CEO sign-off. All exceptions must be logged in Salesforce with justification.', 'email', 'Marcus Chen', 'Sales', 'pricing,discount,approval', 76, 19),
('Onboarding checklist for new engineers', 'process', 'Week 1: Setup dev environment, access provisioning, team introductions. Week 2: First PR merged. Week 3: Assigned to feature team. Week 4: Solo task completed.', 'wiki', 'Engineering Manager', 'Engineering', 'onboarding,engineer,new-hire', 118, 44),
('Data breach response protocol', 'guideline', 'Immediate: Isolate affected systems. Within 1hr: Notify CISO and Legal. Within 24hr: Assess scope, notify affected customers. Within 72hr: File regulatory reports as required.', 'document', 'Security Team', 'Security', 'breach,security,compliance', 56, 21),
('Vendor contract review process', 'procedure', '1. Legal reviews all contracts >$10k. 2. Finance approves budget allocation. 3. Procurement checks vendor compliance. 4. Sign-off matrix: <$50k Manager, <$200k Director, >$200k VP.', 'document', 'Procurement', 'Finance', 'vendor,contract,procurement', 34, 12),
('Customer escalation handling', 'process', 'Tier 1: Support agent handles. Tier 2: Senior support or technical lead. Tier 3: Account manager involvement. Executive escalation: VP Customer Success notified immediately.', 'ticket', 'Customer Success', 'Customer Support', 'escalation,customer,support', 97, 31),
('Engineering deployment process', 'procedure', 'All deployments require: passing CI/CD, code review approval, staging verification. Production deploys Monday-Thursday only. Rollback plan documented before deploy.', 'wiki', 'Platform Team', 'Engineering', 'deployment,ci-cd,release', 167, 52),
('Expense reimbursement policy', 'policy', 'Submit expenses within 30 days of purchase. Meals: up to $75/day. Hotels: up to $250/night. Flights: economy class. Manager approval required for all expenses.', 'document', 'Finance', 'Finance', 'expense,reimbursement,travel', 112, 29),
('How to request PTO', 'procedure', '1. Submit request in Workday 2 weeks in advance. 2. Manager approves within 48 hours. 3. Coverage plan required for >5 days. 4. Max 10 days consecutive without director approval.', 'slack', 'HR Team', 'Human Resources', 'pto,vacation,time-off', 188, 71),
('Product roadmap prioritization framework', 'decision', 'Features scored on: Customer impact (40%), Revenue potential (30%), Engineering effort inverse (20%), Strategic alignment (10%). Monthly roadmap review with stakeholders.', 'meeting', 'Product Team', 'Product', 'roadmap,prioritization,product', 45, 15),
('Interview process for engineers', 'process', '1. Recruiter screen (30 min). 2. Technical phone screen (60 min). 3. Take-home exercise (4 hours max). 4. Onsite: 2 technical, 1 system design, 1 culture. Offer within 5 days.', 'document', 'Engineering Manager', 'Engineering', 'hiring,interview,recruiting', 83, 26),
('Customer data handling guidelines', 'guideline', 'PII must be encrypted at rest and in transit. No customer data in logs. Data retention: 7 years financial, 3 years operational. GDPR deletion requests processed within 30 days.', 'document', 'Legal & Compliance', 'Legal', 'data,privacy,gdpr,compliance', 61, 22),
('Quarterly planning OKR process', 'process', 'Month 3: Team leads draft OKRs. Week 1 new quarter: Leadership review and alignment. Week 2: Company-wide OKR share. Monthly check-ins, end-of-quarter retrospective scoring.', 'meeting', 'Strategy Team', 'Executive', 'okr,planning,quarterly', 39, 11),
('Bug severity classification', 'guideline', 'P0: Data loss or security breach - fix immediately. P1: Core feature broken - fix within 24hrs. P2: Major feature degraded - fix within 1 week. P3: Minor issue - next sprint.', 'wiki', 'QA Team', 'Engineering', 'bug,severity,qa', 94, 33)
ON CONFLICT DO NOTHING;

INSERT INTO documents (title, source_url, content, department, doc_type, status, last_updated, word_count, indexed) VALUES
('Employee Handbook 2024', 'https://docs.company.com/handbook', 'Comprehensive guide covering all company policies, benefits, and procedures for employees.', 'Human Resources', 'handbook', 'active', '2024-01-15', 15420, true),
('Engineering Architecture Overview', 'https://docs.company.com/architecture', 'System architecture diagrams and technical documentation for all core services.', 'Engineering', 'technical', 'active', '2024-11-20', 8930, true),
('Sales Playbook Q4 2024', 'https://docs.company.com/sales-playbook', 'Sales strategies, objection handling, and deal-closing techniques for Q4.', 'Sales', 'playbook', 'active', '2024-10-01', 5670, true),
('Security Policy Framework', 'https://docs.company.com/security', 'Information security policies, controls, and compliance requirements.', 'Security', 'policy', 'active', '2024-09-15', 12200, true),
('Customer Onboarding Guide', 'https://docs.company.com/onboarding', 'Step-by-step guide for onboarding new enterprise customers.', 'Customer Success', 'guide', 'active', '2024-12-01', 3450, false),
('Financial Controls Manual', 'https://docs.company.com/finance', 'Internal controls, approval workflows, and financial procedures.', 'Finance', 'manual', 'active', '2024-08-30', 9870, true),
('Product Requirements Template', 'https://docs.company.com/prd-template', 'Standard template for writing product requirements documents.', 'Product', 'template', 'active', '2024-07-10', 2100, false),
('API Documentation v3.2', 'https://api.company.com/docs', 'Complete REST API reference documentation for external integrations.', 'Engineering', 'technical', 'active', '2024-12-15', 18750, true),
('Marketing Brand Guidelines', 'https://docs.company.com/brand', 'Brand voice, visual identity standards, and messaging guidelines.', 'Marketing', 'guideline', 'active', '2024-06-20', 4320, false),
('Legal Terms of Service', 'https://company.com/tos', 'Customer-facing terms of service and acceptable use policy.', 'Legal', 'legal', 'active', '2024-11-01', 7800, true),
('Data Processing Agreement', 'https://docs.company.com/dpa', 'GDPR-compliant data processing agreement for EU customers.', 'Legal', 'legal', 'active', '2024-10-15', 5400, true),
('Incident Post-Mortem Template', 'https://docs.company.com/postmortem', 'Standard template for documenting and reviewing production incidents.', 'Engineering', 'template', 'active', '2024-09-05', 1200, false),
('Competitive Analysis Q4 2024', 'https://docs.company.com/competitive', 'Analysis of key competitors, market positioning, and differentiation.', 'Product', 'analysis', 'active', '2024-11-28', 6700, false),
('Board Presentation December 2024', 'https://docs.company.com/board', 'Quarterly board update including financials, metrics, and strategy.', 'Executive', 'presentation', 'confidential', '2024-12-10', 3200, false),
('Vendor Assessment Checklist', 'https://docs.company.com/vendor-checklist', 'Security and compliance checklist for evaluating new vendors.', 'Procurement', 'checklist', 'active', '2024-08-15', 2800, true)
ON CONFLICT DO NOTHING;

INSERT INTO queries (question, answer, confidence, user_id, helpful, sources, created_at) VALUES
('What is the refund policy for SaaS subscriptions?', 'Refunds are available within 30 days of purchase. Contact support with your order ID to initiate.', 0.92, 1, true, 'Customer refund procedure, Terms of Service', NOW() - INTERVAL '2 days'),
('How do I escalate a P0 incident?', 'Page the on-call engineer immediately, create a dedicated Slack incident channel, and update the status page within 15 minutes.', 0.95, 1, true, 'Incident response procedure', NOW() - INTERVAL '3 days'),
('What are the remote work guidelines?', 'Employees can work remotely up to 3 days per week with core hours 10am-3pm local time.', 0.88, 1, true, 'Remote work policy 2024', NOW() - INTERVAL '5 days'),
('How much discount can I offer a customer?', 'You can offer up to 20% discount independently. Above 20% requires VP Sales approval, above 35% needs CEO sign-off.', 0.91, 1, true, 'Sales pricing exceptions approval', NOW() - INTERVAL '6 days'),
('What is the process for requesting a new vendor contract?', 'Submit to Procurement with budget allocation. Legal reviews all contracts over $10k. Approval matrix depends on contract value.', 0.87, 1, false, 'Vendor contract review process', NOW() - INTERVAL '8 days'),
('How do I report a data breach?', 'Immediately isolate affected systems, notify CISO and Legal within 1 hour, assess scope and notify customers within 24 hours.', 0.96, 1, true, 'Data breach response protocol', NOW() - INTERVAL '10 days'),
('What is the engineering deployment freeze period?', 'Production deployments are only allowed Monday through Thursday. No deploys on Fridays or weekends.', 0.83, 1, true, 'Engineering deployment process', NOW() - INTERVAL '12 days'),
('How does the OKR process work?', 'Teams draft OKRs in month 3 of the current quarter. Leadership reviews in week 1 of new quarter, company-wide share in week 2.', 0.89, 1, true, 'Quarterly planning OKR process', NOW() - INTERVAL '15 days'),
('What is the maximum hotel expense per night?', 'Hotel expenses are reimbursed up to $250 per night when traveling for business.', 0.97, 1, true, 'Expense reimbursement policy', NOW() - INTERVAL '18 days'),
('How long does it take to receive an offer after interviews?', 'Offers are extended within 5 business days of completing the final interview round.', 0.84, 1, true, 'Interview process for engineers', NOW() - INTERVAL '20 days'),
('What is our data retention policy?', 'Financial data is retained for 7 years, operational data for 3 years. GDPR deletion requests must be processed within 30 days.', 0.93, 1, true, 'Customer data handling guidelines', NOW() - INTERVAL '22 days'),
('How are bugs classified by severity?', 'P0 is immediate fix for data loss/security. P1 is 24hr fix for broken core features. P2 is 1 week for major degradation. P3 is next sprint.', 0.94, 1, true, 'Bug severity classification', NOW() - INTERVAL '25 days'),
('What is the PTO request lead time?', 'PTO should be submitted at least 2 weeks in advance through Workday. Manager must approve within 48 hours.', 0.96, 1, true, 'How to request PTO', NOW() - INTERVAL '28 days'),
('How are product features prioritized?', 'Features are scored on customer impact (40%), revenue potential (30%), engineering effort inverse (20%), and strategic alignment (10%).', 0.88, 1, true, 'Product roadmap prioritization framework', NOW() - INTERVAL '30 days'),
('What happens during new engineer onboarding?', 'Week 1 is environment setup and introductions. First PR by end of week 2. Assigned to feature team week 3. Solo task by week 4.', 0.91, 1, true, 'Onboarding checklist for new engineers', NOW() - INTERVAL '35 days')
ON CONFLICT DO NOTHING;

INSERT INTO procedures (name, department, steps_json, version, owner, last_updated, status, usage_count) VALUES
('Customer Refund Processing', 'Customer Support', '[{"step":1,"action":"Verify purchase in CRM system"},{"step":2,"action":"Check 30-day refund eligibility"},{"step":3,"action":"Issue refund via original payment method"},{"step":4,"action":"Send confirmation email to customer"},{"step":5,"action":"Log refund in support ticket"}]', '2.1', 'Sarah Johnson', '2024-11-15', 'active', 234),
('Production Incident Response', 'Engineering', '[{"step":1,"action":"Assess incident severity (P0-P3)"},{"step":2,"action":"Page on-call engineer for P0/P1"},{"step":3,"action":"Create incident Slack channel"},{"step":4,"action":"Update status page"},{"step":5,"action":"Identify root cause"},{"step":6,"action":"Implement fix and verify"},{"step":7,"action":"Write post-mortem"}]', '3.0', 'DevOps Team', '2024-12-01', 'active', 89),
('New Employee Onboarding', 'Human Resources', '[{"step":1,"action":"Send welcome email and first-day instructions"},{"step":2,"action":"Provision accounts and equipment"},{"step":3,"action":"Schedule orientation meetings"},{"step":4,"action":"Assign onboarding buddy"},{"step":5,"action":"30/60/90 day check-ins"}]', '1.5', 'HR Manager', '2024-10-20', 'active', 67),
('Software Deployment to Production', 'Engineering', '[{"step":1,"action":"Ensure all CI/CD checks pass"},{"step":2,"action":"Get code review approval"},{"step":3,"action":"Deploy to staging and verify"},{"step":4,"action":"Document rollback plan"},{"step":5,"action":"Execute production deployment Mon-Thu only"},{"step":6,"action":"Monitor for 30 minutes post-deploy"}]', '4.2', 'Platform Team', '2024-12-10', 'active', 312),
('Vendor Contract Onboarding', 'Procurement', '[{"step":1,"action":"Collect vendor information and SOC2 report"},{"step":2,"action":"Security team vendor assessment"},{"step":3,"action":"Legal review of contract terms"},{"step":4,"action":"Finance budget approval"},{"step":5,"action":"Execute contract per approval matrix"},{"step":6,"action":"Add vendor to approved list"}]', '1.8', 'Procurement Manager', '2024-09-30', 'active', 45),
('Quarterly Business Review', 'Executive', '[{"step":1,"action":"Compile metrics from all departments"},{"step":2,"action":"Financial performance summary"},{"step":3,"action":"Product roadmap update"},{"step":4,"action":"Customer success highlights"},{"step":5,"action":"Board presentation preparation"}]', '2.0', 'COO Office', '2024-11-01', 'active', 12),
('Data Breach Response', 'Security', '[{"step":1,"action":"Isolate affected systems immediately"},{"step":2,"action":"Notify CISO and Legal within 1 hour"},{"step":3,"action":"Assess scope of breach"},{"step":4,"action":"Preserve forensic evidence"},{"step":5,"action":"Notify affected customers within 24 hours"},{"step":6,"action":"File regulatory reports within 72 hours"}]', '2.3', 'Security Team', '2024-10-05', 'active', 8),
('Sales Deal Approval Process', 'Sales', '[{"step":1,"action":"Sales rep calculates discount amount"},{"step":2,"action":"Under 20%: proceed independently"},{"step":3,"action":"20-35%: submit to VP Sales for approval"},{"step":4,"action":"Above 35%: escalate to CEO"},{"step":5,"action":"Log all exceptions in Salesforce"}]', '1.3', 'VP Sales', '2024-08-15', 'active', 156),
('Employee Performance Review', 'Human Resources', '[{"step":1,"action":"Self-assessment by employee"},{"step":2,"action":"Manager writes performance summary"},{"step":3,"action":"360 feedback collection"},{"step":4,"action":"Compensation review meeting"},{"step":5,"action":"Goal setting for next period"}]', '3.1', 'HR Director', '2024-06-01', 'active', 78),
('Bug Triage and Classification', 'Engineering', '[{"step":1,"action":"Reproduce the bug"},{"step":2,"action":"Classify severity P0-P3"},{"step":3,"action":"Assign to appropriate engineer"},{"step":4,"action":"Set SLA based on severity"},{"step":5,"action":"Track until resolution"},{"step":6,"action":"Verify fix in production"}]', '2.0', 'QA Lead', '2024-11-20', 'active', 445),
('Customer Account Closure', 'Customer Success', '[{"step":1,"action":"Receive cancellation request"},{"step":2,"action":"Attempt save conversation"},{"step":3,"action":"Confirm cancellation reason"},{"step":4,"action":"Process data export if requested"},{"step":5,"action":"Deactivate account per retention policy"},{"step":6,"action":"Send final invoice and confirmation"}]', '1.6', 'Customer Success', '2024-09-10', 'active', 34),
('New Feature Launch', 'Product', '[{"step":1,"action":"Product spec finalized and approved"},{"step":2,"action":"Engineering estimate and sprint planning"},{"step":3,"action":"Development and QA testing"},{"step":4,"action":"Beta release to select customers"},{"step":5,"action":"Marketing materials prepared"},{"step":6,"action":"General availability announcement"}]', '2.4', 'Product Manager', '2024-12-05', 'active', 23),
('Interview and Hiring', 'Human Resources', '[{"step":1,"action":"Recruiter screen (30 min)"},{"step":2,"action":"Technical phone screen (60 min)"},{"step":3,"action":"Take-home exercise (4 hours max)"},{"step":4,"action":"Onsite interviews (4 rounds)"},{"step":5,"action":"Debrief and hiring decision"},{"step":6,"action":"Offer extended within 5 days"}]', '3.2', 'Recruiting', '2024-10-15', 'active', 91),
('Monthly Financial Close', 'Finance', '[{"step":1,"action":"Collect all expense reports by 5th of month"},{"step":2,"action":"Reconcile bank statements"},{"step":3,"action":"Review and approve journal entries"},{"step":4,"action":"Generate financial statements"},{"step":5,"action":"Finance review meeting"},{"step":6,"action":"Submit to CFO for approval"}]', '1.9', 'Controller', '2024-11-30', 'active', 24),
('Security Access Review', 'Security', '[{"step":1,"action":"Export all user access list"},{"step":2,"action":"Review access vs job requirements"},{"step":3,"action":"Identify over-provisioned accounts"},{"step":4,"action":"Remove unnecessary access"},{"step":5,"action":"Document review completion"},{"step":6,"action":"Repeat quarterly"}]', '1.4', 'Security Manager', '2024-09-20', 'active', 16)
ON CONFLICT DO NOTHING;

INSERT INTO policies (name, category, content, effective_date, owner, approved_by, review_date, status) VALUES
('Remote Work Policy', 'Employment', 'Employees may work remotely up to 3 days per week. Core hours 10am-3pm required. VPN mandatory for internal systems. $500/year home office stipend provided.', '2024-01-01', 'HR Director', 'CEO', '2025-01-01', 'active'),
('Expense Reimbursement Policy', 'Finance', 'Submit expenses within 30 days. Meals: $75/day max. Hotels: $250/night max. Flights: economy class. Manager approval required.', '2024-01-01', 'CFO', 'CEO', '2025-01-01', 'active'),
('Information Security Policy', 'Security', 'All company data must be encrypted. MFA required for all systems. Security training mandatory annually. Incident reporting within 24 hours.', '2024-03-01', 'CISO', 'CTO', '2025-03-01', 'active'),
('Code of Conduct', 'HR', 'All employees must treat colleagues with respect, maintain confidentiality, avoid conflicts of interest, and comply with all laws and regulations.', '2024-01-01', 'Chief People Officer', 'Board', '2025-01-01', 'active'),
('Data Privacy Policy', 'Legal', 'Customer data handled per GDPR and CCPA. Data minimization principle applied. Retention: 7yr financial, 3yr operational. Breach notification within 72 hours.', '2024-02-01', 'General Counsel', 'CEO', '2025-02-01', 'active'),
('Acceptable Use Policy', 'Security', 'Company systems for business use only. No unauthorized software installation. Personal devices need MDM enrollment. Prohibited: illegal content, data exfiltration.', '2024-01-01', 'CISO', 'CTO', '2025-01-01', 'active'),
('Conflict of Interest Policy', 'Legal', 'Disclose any personal financial interest in company vendors or competitors. Board approval required for outside employment. Annual disclosure forms required.', '2023-07-01', 'General Counsel', 'Board', '2024-07-01', 'active'),
('Parental Leave Policy', 'HR', 'Primary caregivers: 16 weeks fully paid. Secondary caregivers: 6 weeks fully paid. Applies from day 1 of employment. Available for birth, adoption, and foster care.', '2024-04-01', 'Chief People Officer', 'CEO', '2025-04-01', 'active'),
('Software License Policy', 'IT', 'All software must be properly licensed. Open-source usage requires legal review for copyleft licenses. License inventory maintained by IT. Annual audit conducted.', '2024-01-01', 'CTO', 'Legal', '2025-01-01', 'active'),
('Social Media Policy', 'Marketing', 'Employees may discuss employment but cannot share confidential information. Company announcements must be approved by Marketing. Crisis communications protocol for negative press.', '2024-06-01', 'CMO', 'CEO', '2025-06-01', 'active'),
('Travel Policy', 'Finance', 'Book travel 14+ days in advance when possible. Preferred vendors must be used. Personal travel days permitted if airfare cost unchanged. Receipts required for all expenses.', '2024-01-01', 'CFO', 'COO', '2025-01-01', 'active'),
('Whistleblower Policy', 'Legal', 'Employees may report unethical behavior anonymously via ethics hotline. No retaliation permitted. Reports investigated within 30 days. Board Audit Committee oversight.', '2023-01-01', 'General Counsel', 'Board', '2024-01-01', 'active'),
('Diversity and Inclusion Policy', 'HR', 'Equal opportunity employer. No discrimination based on protected characteristics. Annual D&I training required. Diverse candidate slates for all senior positions.', '2024-01-01', 'Chief People Officer', 'CEO', '2025-01-01', 'active'),
('Vendor Management Policy', 'Procurement', 'All vendors >$10k require security review. SOC2 reports required for data processors. Annual vendor performance reviews. Right to audit clause in all contracts.', '2024-02-01', 'Chief Procurement Officer', 'CFO', '2025-02-01', 'active'),
('AI Usage Policy', 'Technology', 'AI tools approved for: drafting, summarization, code assistance. Prohibited: entering customer PII into AI tools. All AI outputs must be human-reviewed. Log AI tool usage.', '2024-09-01', 'CTO', 'CEO', '2025-09-01', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO decisions (title, context, decision_made, rationale, made_by, decision_date, impact_level, tags, reversible) VALUES
('Migrate to AWS from on-premise', 'Legacy on-premise infrastructure causing scaling bottlenecks and high maintenance costs', 'Full migration to AWS over 18 months starting Q1 2024', 'Cost savings of 40%, improved scalability, better disaster recovery, access to managed services', 'CTO', '2023-12-15', 'high', 'infrastructure,aws,cloud', false),
('Adopt React for all frontend development', 'Multiple frontend frameworks in use causing context switching and skill fragmentation', 'Standardize on React 18 with TypeScript across all products', 'Largest ecosystem, team expertise, strong TypeScript support, component reusability', 'VP Engineering', '2024-01-10', 'medium', 'frontend,react,engineering', true),
('Switch to usage-based pricing model', 'Flat subscription pricing limiting expansion revenue and misaligning with customer value', 'Implement usage-based pricing for API calls and storage effective Q2 2024', 'Better aligns price with value, reduces churn for low-usage customers, increases NRR', 'CEO', '2024-02-20', 'high', 'pricing,business-model,revenue', false),
('Hire VP of Marketing', 'Company at Series B stage lacks dedicated marketing leadership', 'Hire experienced VP of Marketing with PLG background by Q3 2024', 'Need to build brand, demand gen, and product marketing to hit growth targets', 'CEO', '2024-03-05', 'high', 'hiring,executive,marketing', true),
('Implement SOC2 Type II compliance', 'Enterprise customers increasingly requiring SOC2 for procurement approval', 'Achieve SOC2 Type II certification by Q4 2024 using Vanta', 'Required for enterprise sales, reduces security questionnaire burden, builds customer trust', 'CISO', '2024-04-01', 'high', 'security,compliance,soc2', false),
('Discontinue legacy API v1', 'Maintaining two API versions creating significant engineering overhead', 'Deprecate API v1 effective December 2024 with 6-month migration window', 'Engineering cost savings, simplified codebase, customers have had 18+ months notice', 'VP Engineering', '2024-06-01', 'medium', 'api,deprecation,engineering', false),
('Expand to European market', 'Growing inbound demand from EU customers, strong product-market fit signals', 'Open London office and hire EU sales team starting Q4 2024', 'EU is 35% of total addressable market, weak direct competition, strong demand signals', 'CEO', '2024-07-15', 'high', 'expansion,europe,growth', true),
('Use Anthropic Claude for AI features', 'Evaluating AI providers for in-product AI features', 'Standardize on Claude API with fallback to GPT-4', 'Best performance on our use cases, competitive pricing, strong safety practices', 'CTO', '2024-08-20', 'medium', 'ai,claude,technical', true),
('Implement 4-day work week pilot', 'Employee survey showed work-life balance as top concern, competitors offering similar benefits', 'Run 3-month pilot of 4-day work week for engineering team Q3 2024', 'Improve retention, attract talent, test productivity impact before full rollout', 'Chief People Officer', '2024-09-01', 'medium', 'hr,benefits,productivity', true),
('Acquire DataSync startup', 'Strategic opportunity to acquire complementary data integration capabilities', 'Acquire DataSync for $8M to accelerate data connector roadmap by 18 months', 'Build vs buy analysis favors acquisition, team retention negotiated, technology validated', 'CEO', '2024-09-30', 'high', 'acquisition,m&a,strategy', false),
('Move to monorepo structure', 'Multiple repositories causing dependency management issues and slow CI', 'Migrate all services to Turborepo monorepo by Q1 2025', 'Faster builds, unified tooling, easier code sharing, reduced CI/CD complexity', 'VP Engineering', '2024-10-15', 'medium', 'engineering,monorepo,tooling', true),
('Partner with Salesforce AppExchange', 'Salesforce customers represent 40% of ICP, native integration increases stickiness', 'Build Salesforce AppExchange integration, launch by Q2 2025', 'Access to Salesforce customer base, reduces sales friction, competitive differentiation', 'VP Sales', '2024-11-01', 'medium', 'partnership,salesforce,integration', true),
('Reduce AWS spend by 30%', 'AWS costs growing faster than revenue at 2.3x, impacting gross margins', 'Reserved instances purchase, right-sizing initiative, and cost tagging program', 'Gross margin improvement from 68% to 72%, payback period under 6 months', 'CFO', '2024-11-15', 'medium', 'infrastructure,cost,aws', true),
('Launch self-serve tier', 'Large number of small-team prospects unable to afford enterprise pricing', 'Launch freemium tier capped at 3 users and 1000 API calls/month', 'PLG motion, builds brand, creates upsell pipeline, competitive with new entrants', 'CEO', '2024-12-01', 'high', 'pricing,freemium,growth', true),
('Adopt AI coding assistant company-wide', 'Individual engineers using various AI coding tools without policy or budget', 'Standardize on GitHub Copilot with enterprise license for all engineers', '15-20% productivity improvement, unified security policy, volume discount', 'CTO', '2024-12-10', 'medium', 'ai,productivity,engineering', true)
ON CONFLICT DO NOTHING;

-- Tenants
INSERT INTO tenants (slug, name, plan, region, daily_query_quota) VALUES
('acme', 'Acme Corp', 'enterprise', 'us-east-1', 50000),
('northwind', 'Northwind Traders', 'business', 'us-west-2', 20000),
('contoso-eu', 'Contoso EU', 'enterprise', 'eu-west-1', 50000),
('fabrikam', 'Fabrikam Robotics', 'team', 'us-east-1', 5000)
ON CONFLICT DO NOTHING;

-- Embedding models (real specs as of 2026-Q1)
INSERT INTO embedding_models (model_id, provider, dimension, max_tokens, cost_per_million_tokens_usd, mteb_avg, retrieval_avg, released_on, description, is_default) VALUES
('text-embedding-3-large', 'openai', 3072, 8191, 0.1300, 64.59, 55.44, '2024-01-25', 'OpenAI 3rd-gen large embedding; supports dimension reduction to 1024/256.', TRUE),
('text-embedding-3-small', 'openai', 1536, 8191, 0.0200, 62.26, 51.68, '2024-01-25', 'OpenAI 3rd-gen small; great cost/perf tradeoff.', FALSE),
('voyage-3', 'voyage', 1024, 32000, 0.0600, 65.10, 56.30, '2024-09-18', 'Voyage AI v3, long context, retrieval-optimized.', FALSE),
('voyage-3-large', 'voyage', 2048, 32000, 0.1800, 66.20, 58.10, '2025-01-21', 'Voyage AI v3 large; SOTA on MTEB retrieval.', FALSE),
('voyage-code-3', 'voyage', 1024, 32000, 0.0600, 60.50, 53.80, '2024-12-04', 'Code-specialized; outperforms others on CodeSearchNet.', FALSE),
('embed-english-v3.0', 'cohere', 1024, 512, 0.1000, 64.47, 55.00, '2023-11-02', 'Cohere v3 English; strong reranker pairing.', FALSE),
('embed-multilingual-v3.0', 'cohere', 1024, 512, 0.1000, 64.01, 54.65, '2023-11-02', 'Cohere v3 multilingual; 100+ languages.', FALSE),
('bge-m3', 'baai', 1024, 8192, 0.0000, 66.40, 56.84, '2024-01-30', 'BAAI BGE-M3 dense+sparse+multi-vec; self-hostable, free.', FALSE),
('bge-large-en-v1.5', 'baai', 1024, 512, 0.0000, 64.23, 54.29, '2023-09-12', 'BAAI BGE large EN; widely used baseline.', FALSE),
('mxbai-embed-large-v1', 'mixedbread', 1024, 512, 0.0000, 64.68, 54.39, '2024-03-07', 'Mixedbread large v1; open-weights.', FALSE),
('nomic-embed-text-v1.5', 'nomic', 768, 8192, 0.0000, 62.28, 53.01, '2024-02-14', 'Open-weights long-context Matryoshka embedding.', FALSE),
('mistral-embed', 'mistral', 1024, 8192, 0.1000, 59.45, 50.76, '2024-05-09', 'Mistral managed embedding endpoint.', FALSE)
ON CONFLICT DO NOTHING;

-- Source connectors
INSERT INTO source_connectors (name, provider, workspace, auth_type, scopes, status, sync_interval_minutes, last_sync_at, items_synced, bytes_synced, enabled_for_rag, owner_email) VALUES
('Notion - Engineering', 'notion', 'acme.notion.so', 'oauth2', 'read_content,read_user', 'active', 30, NOW() - INTERVAL '12 minutes', 2840, 184320000, TRUE, 'erica@acme.com'),
('Notion - Product', 'notion', 'acme.notion.so', 'oauth2', 'read_content', 'active', 60, NOW() - INTERVAL '47 minutes', 1230, 89400000, TRUE, 'pm-leads@acme.com'),
('Confluence - HR Wiki', 'confluence', 'acme.atlassian.net', 'oauth2', 'read:confluence-content.all', 'active', 60, NOW() - INTERVAL '21 minutes', 540, 42100000, TRUE, 'hr-ops@acme.com'),
('Confluence - Architecture', 'confluence', 'acme.atlassian.net', 'oauth2', 'read:confluence-content.all,read:confluence-space.summary', 'active', 120, NOW() - INTERVAL '3 hours', 982, 110200000, TRUE, 'arch@acme.com'),
('Google Drive - Sales', 'gdrive', 'acme.com', 'service_account', 'drive.readonly', 'active', 60, NOW() - INTERVAL '34 minutes', 4120, 1240000000, TRUE, 'rev-ops@acme.com'),
('Google Drive - Finance', 'gdrive', 'acme.com', 'service_account', 'drive.readonly', 'paused', 240, NOW() - INTERVAL '2 days', 1890, 540000000, FALSE, 'cfo-office@acme.com'),
('Slack - #engineering', 'slack', 'acme.slack.com', 'oauth2', 'channels:history,channels:read,users:read', 'active', 15, NOW() - INTERVAL '4 minutes', 18420, 78400000, TRUE, 'eng-platform@acme.com'),
('Slack - #incidents', 'slack', 'acme.slack.com', 'oauth2', 'channels:history,channels:read', 'active', 10, NOW() - INTERVAL '6 minutes', 3210, 12400000, TRUE, 'sre@acme.com'),
('Slack - #customer-escalations', 'slack', 'acme.slack.com', 'oauth2', 'channels:history', 'active', 20, NOW() - INTERVAL '11 minutes', 2870, 9800000, TRUE, 'cs-leads@acme.com'),
('GitHub - acme/monorepo', 'github', 'github.com/acme', 'pat', 'repo,read:org', 'active', 60, NOW() - INTERVAL '28 minutes', 9840, 423000000, TRUE, 'platform@acme.com'),
('GitHub - acme/docs', 'github', 'github.com/acme', 'pat', 'repo', 'active', 120, NOW() - INTERVAL '1 hour', 412, 18900000, TRUE, 'docs-team@acme.com'),
('Gmail - support@', 'gmail', 'acme.com', 'oauth2', 'gmail.readonly', 'active', 30, NOW() - INTERVAL '8 minutes', 14230, 187000000, TRUE, 'support-lead@acme.com'),
('Linear - Engineering', 'linear', 'linear.app/acme', 'oauth2', 'read', 'active', 30, NOW() - INTERVAL '17 minutes', 5870, 23400000, TRUE, 'eng-pm@acme.com'),
('Linear - Product', 'linear', 'linear.app/acme', 'oauth2', 'read', 'syncing', 60, NOW() - INTERVAL '2 minutes', 2210, 8400000, TRUE, 'product@acme.com'),
('Zendesk - Tickets', 'zendesk', 'acme.zendesk.com', 'api_key', 'tickets:read,users:read', 'active', 30, NOW() - INTERVAL '14 minutes', 22310, 412000000, TRUE, 'cx-ops@acme.com'),
('Salesforce - Opportunities', 'salesforce', 'acme.my.salesforce.com', 'oauth2', 'api,refresh_token', 'active', 60, NOW() - INTERVAL '52 minutes', 8120, 84000000, FALSE, 'rev-ops@acme.com'),
('Notion - HR Handbook (EU)', 'notion', 'contoso-eu.notion.so', 'oauth2', 'read_content', 'active', 60, NOW() - INTERVAL '38 minutes', 320, 14200000, TRUE, 'hr-eu@contoso.com'),
('Confluence - SRE Runbooks', 'confluence', 'northwind.atlassian.net', 'oauth2', 'read:confluence-content.all', 'error', 60, NOW() - INTERVAL '6 hours', 0, 0, TRUE, 'sre@northwind.com'),
('GitHub - fabrikam/firmware', 'github', 'github.com/fabrikam', 'pat', 'repo', 'active', 240, NOW() - INTERVAL '4 hours', 280, 32100000, TRUE, 'firmware@fabrikam.com'),
('Slack - #design-system', 'slack', 'acme.slack.com', 'oauth2', 'channels:history', 'paused', 60, NOW() - INTERVAL '3 days', 1820, 5400000, FALSE, 'design@acme.com')
ON CONFLICT DO NOTHING;

-- Update last_error for the failing connector
UPDATE source_connectors SET last_error = '401 from Atlassian: refresh token expired; reauthorize at /api/source-connectors/:id/reauth' WHERE name = 'Confluence - SRE Runbooks';

-- Ingestion jobs (mix of statuses across documents 1..15)
INSERT INTO ingestion_jobs (document_id, connector_id, model_id, status, chunks_total, chunks_done, tokens_consumed, cost_usd, chunk_strategy, started_at, finished_at) VALUES
(1,  3, 1, 'complete', 312, 312, 1284800, 0.1670, 'recursive_512_50', NOW() - INTERVAL '3 days',     NOW() - INTERVAL '3 days' + INTERVAL '4 minutes'),
(2,  10,1, 'complete', 178, 178, 720400,  0.0937, 'recursive_512_50', NOW() - INTERVAL '5 days',     NOW() - INTERVAL '5 days' + INTERVAL '2 minutes'),
(3,  5, 1, 'complete', 114, 114, 451200,  0.0587, 'sentence_window',  NOW() - INTERVAL '12 days',    NOW() - INTERVAL '12 days' + INTERVAL '2 minutes'),
(4,  3, 8, 'complete', 244, 244, 985000,  0.0000, 'recursive_512_50', NOW() - INTERVAL '20 days',    NOW() - INTERVAL '20 days' + INTERVAL '6 minutes'),
(5,  3, 3, 'complete', 70,  70,  279300,  0.0168, 'recursive_768_75', NOW() - INTERVAL '2 days',     NOW() - INTERVAL '2 days' + INTERVAL '1 minute'),
(6,  6, 1, 'failed',   197, 38,  150100,  0.0195, 'recursive_512_50', NOW() - INTERVAL '1 day',      NULL),
(7,  10,1, 'complete', 42,  42,  168000,  0.0218, 'recursive_512_50', NOW() - INTERVAL '8 days',     NOW() - INTERVAL '8 days' + INTERVAL '1 minute'),
(8,  10,3, 'complete', 376, 376, 1502000, 0.0901, 'recursive_512_50', NOW() - INTERVAL '6 hours',    NOW() - INTERVAL '6 hours' + INTERVAL '8 minutes'),
(9,  5, 1, 'embedding',86,  41,  164200,  0.0214, 'recursive_512_50', NOW() - INTERVAL '4 minutes',  NULL),
(10, 3, 1, 'complete', 156, 156, 626400,  0.0814, 'recursive_512_50', NOW() - INTERVAL '14 days',    NOW() - INTERVAL '14 days' + INTERVAL '3 minutes'),
(11, 3, 7, 'complete', 108, 108, 432100,  0.0432, 'recursive_512_50', NOW() - INTERVAL '11 days',    NOW() - INTERVAL '11 days' + INTERVAL '2 minutes'),
(12, 10,1, 'complete', 24,  24,  96100,   0.0125, 'sentence_window',  NOW() - INTERVAL '23 days',    NOW() - INTERVAL '23 days' + INTERVAL '1 minute'),
(13, 5, 1, 'complete', 134, 134, 538200,  0.0700, 'recursive_512_50', NOW() - INTERVAL '7 days',     NOW() - INTERVAL '7 days' + INTERVAL '2 minutes'),
(14, 5, 1, 'queued',   0,   0,   0,       0,      'recursive_512_50', NOW() - INTERVAL '2 minutes',  NULL),
(15, 6, 1, 'complete', 56,  56,  224600,  0.0292, 'recursive_512_50', NOW() - INTERVAL '9 days',     NOW() - INTERVAL '9 days' + INTERVAL '1 minute')
ON CONFLICT DO NOTHING;

UPDATE ingestion_jobs SET error = 'Embedding API 429 — rate limited; retry queued at +15min' WHERE document_id = 6 AND status = 'failed';

-- Sample document chunks (representative — 20 rows across multiple docs)
INSERT INTO document_chunks (document_id, job_id, chunk_index, text, token_count, embedding_vector_id, section_path) VALUES
(1, 1,  0, 'Employee Handbook 2024 — covers PTO, benefits, code of conduct, and the remote work program.', 22, 'vec-eh-2024-0000', 'Handbook > Introduction'),
(1, 1,  1, 'Remote work: up to 3 days per week, core hours 10am-3pm local time, VPN required for internal systems.', 27, 'vec-eh-2024-0001', 'Handbook > Remote Work'),
(1, 1,  2, 'PTO: submit at least 2 weeks in advance via Workday; manager approves within 48 hours.', 22, 'vec-eh-2024-0002', 'Handbook > PTO'),
(2, 2,  0, 'Engineering Architecture Overview — multi-region AWS, primary in us-east-1, DR in us-west-2.', 24, 'vec-arch-0000', 'Architecture > Overview'),
(2, 2,  1, 'Core services: auth, billing, ingestion, search, orchestration. All exposed via gRPC + REST.', 24, 'vec-arch-0001', 'Architecture > Services'),
(4, 4,  0, 'Information security policy: MFA mandatory for all systems; quarterly access review per SOC2 CC6.', 26, 'vec-sec-0000', 'Security > Access Control'),
(4, 4,  1, 'Incident reporting within 24 hours; CISO and Legal must be notified for any suspected breach.', 22, 'vec-sec-0001', 'Security > Incident Response'),
(5, 5,  0, 'Customer onboarding playbook — kickoff within 5 business days; success criteria signed within 2 weeks.', 25, 'vec-onb-0000', 'Onboarding > Kickoff'),
(8, 8,  0, 'API v3.2 endpoints: /v3/documents POST creates a document and triggers an ingestion job.', 24, 'vec-api-0000', 'API > Documents'),
(8, 8,  1, 'Rate limits: 1000 req/min per token; burst 2000 for 30 seconds; 429 returns Retry-After header.', 26, 'vec-api-0001', 'API > Rate limits'),
(8, 8,  2, 'Authentication: bearer tokens scoped to org; refresh tokens rotate every 24 hours.', 21, 'vec-api-0002', 'API > Auth'),
(10,10, 0, 'Terms of Service — service availability target 99.9%; credits issued per SLA appendix.', 21, 'vec-tos-0000', 'ToS > Availability'),
(11,11, 0, 'DPA — GDPR Article 28 compliant processor terms; sub-processors listed at /legal/subprocessors.', 22, 'vec-dpa-0000', 'DPA > Sub-processors'),
(13,13, 0, 'Competitive analysis Q4 — top three competitors are Sigma, Talos, and Verity; Sigma leads in EU.', 26, 'vec-cmp-0000', 'Competitive > Landscape'),
(13,13, 1, 'Differentiation: native graph extraction + retrieval evaluation tooling; competitors lack eval suite.', 23, 'vec-cmp-0001', 'Competitive > Differentiation'),
(3, 3,  0, 'Sales playbook Q4 — discovery, qualification (MEDDPICC), pricing, and objection handling.', 21, 'vec-sp-0000', 'Sales > Process'),
(3, 3,  1, 'Pricing exceptions: under 20% rep-approved, 20-35% VP Sales, above 35% CEO sign-off required.', 24, 'vec-sp-0001', 'Sales > Pricing'),
(7, 7,  0, 'PRD template — problem, users, success metric, scope, non-goals, milestones.', 19, 'vec-prd-0000', 'PRD > Template'),
(9, 9,  0, 'Brand guidelines — tone is confident, plain-language, no jargon; primary palette violet/blue.', 22, 'vec-brand-0000', 'Brand > Tone'),
(15,15, 0, 'Vendor assessment — SOC2 Type II report required for any data processor; review annually.', 22, 'vec-vendor-0000', 'Vendor > Assessment')
ON CONFLICT DO NOTHING;

-- Search indexes (hybrid configurations per corpus)
INSERT INTO search_indexes (name, corpus, model_id, bm25_enabled, dense_enabled, reranker, hybrid_alpha, top_k, rerank_top_n, total_chunks, status, last_built_at) VALUES
('handbook-prod',          'handbook',          1,  TRUE, TRUE, 'cohere-rerank-3',     0.55, 50, 10, 312, 'ready',    NOW() - INTERVAL '2 days'),
('engineering-wiki',       'engineering-wiki',  4,  TRUE, TRUE, 'bge-reranker-v2-m3',  0.65, 80, 12, 1844,'ready',    NOW() - INTERVAL '1 day'),
('slack-engineering',      'slack-eng',         3,  TRUE, TRUE, 'cohere-rerank-3',     0.40, 100,15, 18420,'ready',   NOW() - INTERVAL '3 hours'),
('zendesk-support',        'support-tickets',   8,  TRUE, TRUE, 'bge-reranker-v2-m3',  0.50, 60, 10, 22310,'ready',   NOW() - INTERVAL '12 hours'),
('linear-issues',          'linear',            3,  TRUE, TRUE, 'none',                0.60, 50, 10, 5870, 'ready',   NOW() - INTERVAL '4 hours'),
('sales-playbook',         'sales',             1,  TRUE, TRUE, 'cohere-rerank-3',     0.55, 50, 10, 412,  'ready',   NOW() - INTERVAL '6 days'),
('legal-corpus',           'legal',             6,  TRUE, FALSE,'none',                0.20, 30, 10, 184,  'ready',   NOW() - INTERVAL '8 days'),
('code-search',            'code',              5,  TRUE, TRUE, 'none',                0.70, 80, 12, 9840, 'building',NOW() - INTERVAL '4 hours'),
('hr-eu-handbook',         'hr-eu',             7,  TRUE, TRUE, 'cohere-rerank-3',     0.50, 50, 10, 320,  'ready',   NOW() - INTERVAL '14 hours'),
('decisions-and-policies', 'governance',        1,  TRUE, TRUE, 'cohere-rerank-3',     0.60, 50, 10, 248,  'stale',   NOW() - INTERVAL '21 days')
ON CONFLICT DO NOTHING;

-- KG entities
INSERT INTO kg_entities (name, type, aliases, confidence, occurrences, first_seen_doc_id) VALUES
('Sarah Johnson',        'person',     'S. Johnson,Sarah J.', 0.98, 14, 1),
('Marcus Chen',          'person',     'M. Chen',             0.97,  9, 3),
('CTO',                  'role',       'Chief Technology Officer', 0.99, 22, 2),
('CISO',                 'role',       'Chief Information Security Officer', 0.99, 12, 4),
('Customer Support',     'team',       'CS Team,Support',     0.96, 31, 1),
('Engineering',          'team',       'Eng,Platform Team',   0.98, 48, 2),
('AWS',                  'system',     'Amazon Web Services', 0.99, 19, 2),
('PostgreSQL',           'system',     'Postgres',            0.96, 11, 2),
('Stripe',               'vendor',     '',                    0.95,  8, 1),
('PagerDuty',            'vendor',     'PD',                  0.95,  6, 4),
('SOC2 Type II',         'policy_ref', 'SOC2',                0.97, 14, 4),
('GDPR',                 'policy_ref', '',                    0.99, 18, 11),
('Migrate to AWS',       'decision_ref','AWS migration',      0.94,  5, 2),
('Use Anthropic Claude', 'decision_ref','Claude rollout',     0.93,  7, 8),
('CompanyBrain',         'project',    'Brain',               1.00, 27, 2),
('OKR',                  'concept',    'Objectives and Key Results', 0.97, 9, 1),
('MEDDPICC',             'concept',    '',                    0.96,  4, 3),
('Salesforce',           'system',     'SFDC',                0.97, 11, 1),
('Notion',               'system',     '',                    0.95,  6, 1),
('Vanta',                'vendor',     '',                    0.93,  4, 4)
ON CONFLICT DO NOTHING;

-- KG relations
INSERT INTO kg_relations (src_entity_id, dst_entity_id, relation, confidence, evidence_doc_id, evidence_snippet) VALUES
(1,  5,  'owns',         0.96, 1,  'Sarah Johnson owns the customer refund procedure.'),
(2,  6,  'reports_to',   0.92, 3,  'Marcus Chen reports to the VP Sales (Engineering org chart).'),
(6,  7,  'uses',         0.98, 2,  'Engineering uses AWS for all production workloads.'),
(6,  8,  'uses',         0.95, 2,  'Engineering uses PostgreSQL as the primary OLTP datastore.'),
(5,  9,  'uses',         0.93, 1,  'Customer Support uses Stripe to process refunds.'),
(6,  10, 'uses',         0.94, 2,  'Engineering uses PagerDuty for on-call paging.'),
(3,  11, 'approves',     0.96, 4,  'CTO approves SOC2 Type II audit scope annually.'),
(4,  11, 'owns',         0.98, 4,  'CISO owns the SOC2 Type II compliance program.'),
(4,  12, 'owns',         0.97, 11, 'CISO owns GDPR processor obligations under Article 28.'),
(15, 7,  'depends_on',   0.97, 2,  'CompanyBrain depends on AWS for compute and storage.'),
(15, 19, 'depends_on',   0.92, 1,  'CompanyBrain ingests from Notion via the official API.'),
(13, 7,  'replaces',     0.91, 2,  'AWS migration replaces on-premise infra.'),
(14, 15, 'enables',      0.95, 8,  'Use Anthropic Claude enables CompanyBrain natural language answers.'),
(20, 11, 'enables',      0.93, 4,  'Vanta enables SOC2 Type II evidence collection.'),
(18, 6,  'used_by',      0.92, 3,  'Salesforce is used by the revenue org including Engineering for opps lookups.'),
(17, 6,  'used_by',      0.95, 1,  'OKR framework is used by Engineering and Product.'),
(16, 6,  'used_by',      0.94, 1,  'OKR process is used by Engineering for quarterly planning.'),
(11, 12, 'similar_to',   0.88, 4,  'SOC2 Type II controls overlap with GDPR Article 32 security measures.')
ON CONFLICT DO NOTHING;

-- ACL rules
INSERT INTO acl_rules (tenant_id, connector_id, principal, principal_type, permission, resource_filter) VALUES
(1, 1, 'eng@acme.com',          'group', 'read',  '{"path":"engineering/*"}'),
(1, 1, 'product@acme.com',      'group', 'read',  '{"path":"product/*"}'),
(1, 2, 'product@acme.com',      'group', 'read',  NULL),
(1, 3, 'hr@acme.com',           'group', 'read',  NULL),
(1, 3, 'managers@acme.com',     'group', 'read',  '{"path":"public/*"}'),
(1, 4, 'eng@acme.com',          'group', 'read',  NULL),
(1, 5, 'sales@acme.com',        'group', 'read',  NULL),
(1, 6, 'finance@acme.com',      'group', 'read',  NULL),
(1, 7, 'eng@acme.com',          'group', 'read',  NULL),
(1, 8, 'sre@acme.com',          'group', 'read',  NULL),
(1, 9, 'cs@acme.com',           'group', 'read',  NULL),
(1, 10,'eng@acme.com',          'group', 'read',  '{"branch":"main"}'),
(1, 13,'eng@acme.com',          'group', 'read',  NULL),
(1, 15,'cs@acme.com',           'group', 'read',  NULL),
(1, 16,'sales@acme.com',        'group', 'read',  NULL),
(3, 17,'hr-eu@contoso.com',     'group', 'read',  NULL),
(2, 18,'sre@northwind.com',     'group', 'read',  NULL),
(4, 19,'firmware@fabrikam.com', 'group', 'read',  NULL),
(1, 5, 'erica@acme.com',        'email', 'admin', NULL),
(1, 7, 'eng-platform@acme.com', 'email', 'admin', NULL)
ON CONFLICT DO NOTHING;

-- Eval runs (MTEB-style)
INSERT INTO eval_runs (name, index_id, model_id, benchmark, num_queries, ndcg_at_10, recall_at_10, recall_at_50, mrr, latency_p50_ms, latency_p95_ms, notes) VALUES
('handbook-prod / OpenAI-3-large / 2026-05-12', 1,  1, 'internal-handbook', 200, 0.7842, 0.8410, 0.9260, 0.7321, 84,  198, 'Cohere reranker on top of hybrid; gold labels from HR team.'),
('handbook-prod / Voyage-3 / 2026-05-12',       1,  3, 'internal-handbook', 200, 0.8011, 0.8550, 0.9320, 0.7510, 91,  211, 'Voyage-3 dense leg; same gold set.'),
('engineering-wiki / Voyage-3-large / 2026-05-10', 2, 4, 'internal-engwiki', 350, 0.7610, 0.8120, 0.9050, 0.7102, 102, 247, 'Engineering Q&A gold set; 350 queries.'),
('engineering-wiki / BGE-M3 / 2026-05-10',      2,  8, 'internal-engwiki',  350, 0.7480, 0.7980, 0.8980, 0.6985, 88,  214, 'Self-hosted BGE-M3 on a g5.2xlarge.'),
('slack-eng / Voyage-3 / 2026-05-11',           3,  3, 'internal-slack',    180, 0.6520, 0.7280, 0.8520, 0.5980, 72,  168, 'Short noisy texts; reranker helps a lot.'),
('zendesk-support / BGE-M3 / 2026-05-09',       4,  8, 'support-tickets',   500, 0.7140, 0.7820, 0.8910, 0.6610, 79,  189, 'Tickets dataset; tag-based gold labels.'),
('sales-playbook / OpenAI-3-large / 2026-05-08',6,  1, 'internal-sales',    120, 0.7920, 0.8480, 0.9180, 0.7440, 71,  162, 'Sales reps annotated 120 queries.'),
('legal-corpus / Cohere-v3 / 2026-05-07',       7,  6, 'internal-legal',    90,  0.6710, 0.7340, 0.8420, 0.6210, 64,  152, 'BM25 only; small dense gain because policies are exact-match heavy.'),
('mteb-msmarco / Voyage-3 / 2026-05-06',        2,  3, 'mteb-msmarco',      6980,0.4310, 0.6240, 0.8650, 0.3920, 110, 268, 'Public benchmark; sanity check.'),
('mteb-fiqa / OpenAI-3-large / 2026-05-06',     2,  1, 'mteb-fiqa',         648, 0.4520, 0.5910, 0.8210, 0.3850, 96,  221, 'Financial QA benchmark; under-performs internal corpus.'),
('mteb-hotpotqa / BGE-M3 / 2026-05-05',         2,  8, 'mteb-hotpotqa',     7405,0.6810, 0.7820, 0.9020, 0.6240, 119, 285, 'Multi-hop QA; reranker disabled.'),
('handbook-prod / OpenAI-3-large / 2026-05-01', 1,  1, 'internal-handbook', 200, 0.7710, 0.8290, 0.9210, 0.7190, 86,  201, 'Pre-reindex baseline; lower scores expected.')
ON CONFLICT DO NOTHING;

-- Eval results (sample 25 rows from runs 1 and 2)
INSERT INTO eval_results (run_id, query, expected_doc_ids, retrieved_doc_ids, hit_rank, reciprocal_rank) VALUES
(1, 'How much PTO can I take consecutively without approval?',          '1,11',     '1,10,11,3,5',     1, 1.0000),
(1, 'What is the remote work expectation for core hours?',              '1',        '1,11,4,3,5',      1, 1.0000),
(1, 'How are hotel expenses reimbursed?',                                '10,1',     '10,1,3,11,5',     1, 1.0000),
(1, 'What is the SOC2 evidence collection process?',                    '4',        '11,4,1,5,3',      2, 0.5000),
(1, 'Who approves discounts above 35%?',                                  '3,1',      '3,1,5,11,10',     1, 1.0000),
(1, 'What is the bug severity classification?',                          '1',        '3,1,11,5,10',     2, 0.5000),
(1, 'Where are the brand voice guidelines documented?',                  '9',        '9,1,11,3,5',      1, 1.0000),
(1, 'How long do we retain customer financial data?',                    '11,1',     '11,1,5,3,10',     1, 1.0000),
(1, 'What is the API rate limit per token?',                             '8',        '8,1,3,11,5',      1, 1.0000),
(1, 'Who owns the vendor assessment checklist?',                         '15',       '15,11,1,5,3',     1, 1.0000),
(2, 'How much PTO can I take consecutively without approval?',          '1,11',     '1,11,10,3,5',     1, 1.0000),
(2, 'What is the remote work expectation for core hours?',              '1',        '1,11,3,5,4',      1, 1.0000),
(2, 'How are hotel expenses reimbursed?',                                '10,1',     '10,1,11,3,5',     1, 1.0000),
(2, 'What is the SOC2 evidence collection process?',                    '4',        '4,11,1,5,3',      1, 1.0000),
(2, 'Who approves discounts above 35%?',                                  '3,1',      '3,1,11,5,10',     1, 1.0000),
(2, 'What is the bug severity classification?',                          '1',        '1,3,11,5,10',     1, 1.0000),
(2, 'Where are the brand voice guidelines documented?',                  '9',        '9,11,1,3,5',      1, 1.0000),
(2, 'How long do we retain customer financial data?',                    '11,1',     '11,1,3,5,10',     1, 1.0000),
(2, 'What is the API rate limit per token?',                             '8',        '8,11,1,3,5',      1, 1.0000),
(2, 'Who owns the vendor assessment checklist?',                         '15',       '15,1,11,5,3',     1, 1.0000),
(3, 'Where is the multi-region failover documented?',                    '2',        '2,8,11,15,3',     1, 1.0000),
(3, 'How is auth implemented in core services?',                         '2,8',      '2,8,11,3,15',     1, 1.0000),
(5, 'What channel do we use for sev1 incidents?',                        '4',        '11,1,4,15,5',     3, 0.3333),
(7, 'What is the MEDDPICC qualification framework?',                     '3',        '3,15,1,11,5',     1, 1.0000),
(8, 'Which clause governs sub-processor disclosure?',                    '11',       '11,10,4,1,5',     1, 1.0000)
ON CONFLICT DO NOTHING;
