/**
 * Department-type-specific scoring criteria for each maturity dimension.
 * These supplement (not replace) the generic definitions in dimensions.ts.
 * Loaded based on the department_type field from dept_departments.
 */

export interface DeptTypeDimensionCriteria {
  key_metrics: string[]
  l1: string
  l2: string
  l3: string
  l4: string
  l5: string
}

export type DeptTypeDimensions = Record<string, DeptTypeDimensionCriteria>
export type DeptTypeMatrix = Record<string, DeptTypeDimensions>

export const DEPT_TYPE_DIMENSIONS: DeptTypeMatrix = {
  // =========================================================================
  // DELIVERY
  // =========================================================================
  Delivery: {
    'HR & People Maturity': {
      key_metrics: [
        'Consultant retention rate',
        'Bench time (days between engagements)',
        'Skills matrix coverage',
        'Contractor-to-W2 conversion rate',
        'Team satisfaction / engagement scores',
      ],
      l1: 'High turnover, no skills tracking. Consultants are assigned ad hoc. No career paths defined. Bench time is not tracked.',
      l2: 'Basic skills inventory exists. Some retention tracking. Career levels defined but not actively managed. Bench time known but not optimized.',
      l3: 'Skills matrix maintained and used for staffing. Retention tracked and benchmarked. Career paths defined with promotion criteria. Bench time < 15 days avg.',
      l4: 'Predictive retention analytics. Proactive succession planning for key client accounts. Skills gap analysis drives hiring. Bench time < 7 days.',
      l5: 'Internal talent marketplace for project staffing. AI-driven skills matching. Industry-leading retention (>90%). Continuous learning culture with certification programs.',
    },
    'Process Maturity': {
      key_metrics: [
        'Project methodology adherence rate',
        'SOW compliance %',
        'Delivery quality score (client feedback)',
        'On-time delivery rate',
        'Change order management effectiveness',
      ],
      l1: 'No standard methodology. Each PM runs projects differently. No quality gates. SOW scope creep is common and untracked.',
      l2: 'Basic methodology exists (e.g., kickoff templates, status reports) but inconsistently followed. Some quality checkpoints. SOW tracking is manual.',
      l3: 'Documented delivery methodology consistently followed. Quality gates at key milestones. SOW compliance tracked. Change orders processed formally. On-time delivery >80%.',
      l4: 'Data-driven delivery optimization. Predictive risk scoring for projects. Automated milestone tracking. Continuous methodology improvement. On-time delivery >90%.',
      l5: 'Self-optimizing delivery. Real-time project health dashboards. AI-assisted risk mitigation. Zero SOW disputes. Industry benchmark for delivery quality.',
    },
    'Systems & Technology Maturity': {
      key_metrics: [
        'Project management tool adoption rate',
        'Time tracking compliance %',
        'Resource management system usage',
        'Client portal / collaboration tool maturity',
        'Integration between PM, finance, and HR systems',
      ],
      l1: 'Spreadsheets for project tracking. Manual timecards. No integrated project management system. Siloed data.',
      l2: 'PM tool in place but underutilized. Timecards entered but not validated systematically. Basic resource tracking.',
      l3: 'Integrated PM and time tracking. Resource management system actively used. Client collaboration portals. Regular data quality audits.',
      l4: 'Full integration between PM, finance, and HR. Real-time project dashboards. Automated resource matching. Mobile time entry with validation.',
      l5: 'AI-assisted project planning. Predictive resource allocation. Fully integrated tech stack from sale to delivery to billing. Zero manual data reconciliation.',
    },
    'AI & Intelligent Automation': {
      key_metrics: [
        'Automated resource matching %',
        'AI-assisted project risk detection',
        'Automated status reporting coverage',
        'Smart time entry / categorization',
        'Predictive capacity planning usage',
      ],
      l1: 'No automation in delivery operations. All resource allocation, reporting, and scheduling is manual.',
      l2: 'Basic automation: automated status report generation, template-based SOWs. Exploring AI for resource matching.',
      l3: 'AI-assisted resource matching in use. Automated risk flagging based on project patterns. Smart time categorization reduces admin burden.',
      l4: 'Predictive project analytics. AI recommends staffing changes based on project trajectory. Automated quality checks. 30%+ reduction in admin time.',
      l5: 'Autonomous project health management. AI handles routine staffing decisions. Generative AI assists in proposal and SOW creation. Delivery team focused on client value, not admin.',
    },
    'Scalability & Growth Readiness': {
      key_metrics: [
        'Revenue per consultant',
        'Contractor leverage ratio',
        'Utilization rate (billable hours / capacity)',
        'Time to staff new engagements',
        'Margin per headcount added',
      ],
      l1: 'Cannot take on new work without proportional hiring. Utilization unknown or <60%. No contractor model. Long time to staff.',
      l2: 'Some contractor leverage. Utilization tracked but variable (60-70%). Staffing takes 2-4 weeks. Growth requires significant management attention.',
      l3: 'Contractor model defined and working. Utilization 70-80%. Can staff engagements within 1-2 weeks. Margin positive on incremental hires.',
      l4: 'Elastic workforce model. Utilization optimized (80%+). Near-instant staffing from bench/contractor pool. Revenue per consultant growing year-over-year.',
      l5: 'Scale-free delivery. Technology multiplies consultant output. Partner ecosystem extends capacity. Industry-leading revenue per consultant. Growth without proportional cost.',
    },
    'Data & Analytics Maturity': {
      key_metrics: [
        'Project profitability visibility (real-time vs monthly)',
        'Utilization reporting cadence',
        'Client satisfaction measurement',
        'Resource forecasting accuracy',
        'Delivery quality metrics tracked',
      ],
      l1: 'No project profitability tracking. Utilization unknown until month-end. No client satisfaction measurement.',
      l2: 'Monthly utilization reports. Basic project P&L available but delayed. Client feedback collected informally.',
      l3: 'Weekly utilization dashboards. Project margin tracked per engagement. Client satisfaction surveys conducted quarterly. Resource demand forecasted.',
      l4: 'Real-time profitability by project, client, and consultant. Predictive utilization models. NPS tracked with action plans. Analytics drive staffing decisions.',
      l5: 'Prescriptive analytics. AI identifies at-risk projects before humans do. Real-time margin optimization. Data is a competitive advantage in client conversations.',
    },
    'Innovation & Continuous Improvement': {
      key_metrics: [
        'Process improvement initiatives per quarter',
        'New service offering development',
        'Client feedback integration rate',
        'Methodology evolution frequency',
        'Knowledge sharing / reuse rate',
      ],
      l1: 'No improvement culture. Same methodology for years. No knowledge sharing. Client feedback not systematically captured.',
      l2: 'Occasional improvements driven by project failures. Some lessons learned captured but not widely shared.',
      l3: 'Quarterly retrospectives with action items. Knowledge base maintained. Client feedback drives methodology updates. 2-3 improvement initiatives per quarter.',
      l4: 'Continuous improvement embedded. Innovation time allocated. New service offerings developed annually. Active experimentation with delivery models.',
      l5: 'Industry innovation leader. Delivery methodology is a competitive differentiator. Clients seek USDM for innovative approaches. Knowledge reuse drives efficiency gains.',
    },
    'Governance & Compliance': {
      key_metrics: [
        'Regulatory compliance adherence (life sciences)',
        'Audit readiness score',
        'Timecard compliance %',
        'SOW / contract compliance rate',
        'Data security compliance (client data handling)',
      ],
      l1: 'No formal compliance framework for delivery. Regulatory requirements handled ad hoc. Timecard compliance low.',
      l2: 'Basic compliance awareness. Timecard compliance tracked. Some delivery SOPs exist. Client data handling informal.',
      l3: 'Life sciences compliance embedded in delivery. Timecard compliance >95%. SOW compliance tracked. Client data handling policies documented and followed.',
      l4: 'Proactive compliance management. Automated compliance checks. Zero audit findings. Security certifications maintained. Risk-based engagement management.',
      l5: 'Compliance excellence. Real-time monitoring. Regulatory changes proactively incorporated. Zero material findings. Compliance is a selling point to clients.',
    },
  },

  // =========================================================================
  // SALES / GROWTH
  // =========================================================================
  'Sales/Growth': {
    'HR & People Maturity': {
      key_metrics: [
        'Sales rep retention rate',
        'Quota attainment distribution',
        'Ramp time for new hires',
        'Sales training hours per rep',
        'Pipeline per rep',
      ],
      l1: 'High sales turnover. No structured onboarding. Quota setting is arbitrary. No training program.',
      l2: 'Basic sales onboarding exists. Quotas set but based on limited data. Some training available. Ramp time >6 months.',
      l3: 'Structured onboarding with ramp plan. Quotas data-driven. Regular training and coaching. Ramp time 3-6 months. Retention tracked.',
      l4: 'Sales enablement program. Predictive quota modeling. Continuous coaching with analytics. Ramp time <3 months. Career paths defined.',
      l5: 'Best-in-class sales organization. AI-driven coaching. Top quartile retention. Reps consistently exceed quota. Employer of choice for sales talent.',
    },
    'Process Maturity': {
      key_metrics: [
        'Pipeline coverage ratio (3x+ target)',
        'Win rate by stage',
        'Sales cycle length (days)',
        'Deal progression velocity',
        'Forecast accuracy',
      ],
      l1: 'No defined sales process. Pipeline is a spreadsheet. Win/loss not tracked. Forecasting is guesswork.',
      l2: 'Basic sales stages defined in CRM. Pipeline reviewed weekly but inconsistently. Win rate tracked at macro level. Forecast accuracy <50%.',
      l3: 'Sales process documented with clear stage gates. Pipeline coverage >3x. Win/loss analysis conducted. Forecast accuracy 60-70%. Deal reviews structured.',
      l4: 'Data-driven sales process. Stage conversion rates optimize pipeline. Predictive forecasting (>80% accuracy). Automated deal scoring. Systematic win/loss reviews.',
      l5: 'Self-optimizing sales engine. AI-driven deal prioritization. Pipeline health is real-time. Forecast accuracy >90%. Process is a competitive advantage.',
    },
    'Systems & Technology Maturity': {
      key_metrics: [
        'CRM adoption rate',
        'Sales tool stack utilization',
        'Data quality in CRM (completeness %)',
        'Integration between CRM, marketing, and finance',
        'Mobile CRM usage',
      ],
      l1: 'No CRM or CRM unused. Sales data in spreadsheets and emails. No prospecting tools. Pipeline visibility is zero.',
      l2: 'CRM deployed but data quality poor (<50% completeness). Basic prospecting tools (ZoomInfo). Minimal integration with other systems.',
      l3: 'CRM actively used with >80% data quality. Prospecting, sequencing, and meeting tools integrated. Pipeline dashboards available. Mobile CRM used.',
      l4: 'Fully integrated revenue tech stack. CRM is single source of truth. Real-time dashboards. Automated data enrichment. Revenue operations function.',
      l5: 'AI-native sales tech. Conversation intelligence, predictive lead scoring, automated pipeline management. Technology multiplies rep productivity.',
    },
    'AI & Intelligent Automation': {
      key_metrics: [
        'AI-assisted lead scoring adoption',
        'Automated outreach / sequencing coverage',
        'Conversation intelligence usage',
        'Predictive deal scoring accuracy',
        'Admin time reduction from automation',
      ],
      l1: 'No AI in sales. All prospecting, outreach, and forecasting is manual. Reps spend >30% of time on admin.',
      l2: 'Basic automation: email sequences, meeting scheduling. Exploring AI for lead scoring. Reps still heavily manual.',
      l3: 'AI lead scoring in use. Automated outreach sequences. Meeting intelligence captures action items. Admin time reduced 20%.',
      l4: 'Predictive deal scoring drives prioritization. Conversation intelligence coaches reps. Automated CRM data entry. Admin time reduced 40%.',
      l5: 'AI-augmented selling. Autonomous prospecting for initial outreach. AI recommends next best actions. Reps focus purely on relationship and strategy.',
    },
    'Scalability & Growth Readiness': {
      key_metrics: [
        'Revenue per sales rep',
        'Partner / channel revenue %',
        'Cost of customer acquisition (CAC)',
        'Pipeline generation sources (inbound vs outbound vs partner)',
        'New logo vs expansion revenue mix',
      ],
      l1: 'Growth entirely dependent on individual reps. No partner channel. All revenue from direct outbound. CAC not tracked.',
      l2: 'Some partner relationships but minimal revenue. Heavy reliance on outbound. CAC tracked but high. Growth requires hiring.',
      l3: 'Partner channel contributing 10-20% of pipeline. Balanced inbound/outbound/partner mix. CAC benchmarked. Revenue per rep is stable.',
      l4: 'Diversified revenue sources. Partner channel >25% of pipeline. Expansion revenue >30%. Revenue per rep growing. Efficient growth model.',
      l5: 'Scale-free growth. Partner ecosystem drives significant revenue. Product-led or content-led growth supplements direct sales. Industry-leading efficiency.',
    },
    'Data & Analytics Maturity': {
      key_metrics: [
        'Pipeline-to-revenue conversion tracking',
        'Revenue attribution accuracy',
        'Sales activity tracking completeness',
        'Competitive win/loss intelligence',
        'Customer lifetime value (CLV) measurement',
      ],
      l1: 'No sales analytics. Revenue numbers known but pipeline, conversion, and activity data absent. No competitive intelligence.',
      l2: 'Basic pipeline reports. Revenue tracked by rep/quarter. Some activity metrics. Competitive info is anecdotal.',
      l3: 'Pipeline analytics with conversion rates by stage. Revenue attribution to marketing/sales/partner. Win/loss documented. Activity metrics drive coaching.',
      l4: 'Advanced analytics: cohort analysis, CLV tracking, predictive revenue models. Competitive intelligence is systematic. Data drives territory and quota planning.',
      l5: 'Prescriptive sales analytics. AI identifies revenue opportunities and risks before reps do. Real-time market intelligence. Data-driven everything.',
    },
    'Innovation & Continuous Improvement': {
      key_metrics: [
        'New sales play / motion development',
        'A/B testing in outreach',
        'Sales methodology evolution',
        'Cross-functional deal collaboration rate',
        'New market / vertical penetration',
      ],
      l1: 'Same sales approach for years. No experimentation. No new market development. Competitive positioning stale.',
      l2: 'Occasional new sales plays. Some A/B testing in outreach. New verticals explored but not systematically.',
      l3: 'Quarterly sales play development. Structured A/B testing. New vertical strategy with dedicated pursuit plans. Methodology refined annually.',
      l4: 'Continuous sales innovation. Rapid testing of new approaches. Cross-functional deal teams. New market entry is a structured capability.',
      l5: 'Sales innovation leader. New go-to-market models tested quarterly. Thought leadership drives inbound. Sales approach is a competitive differentiator.',
    },
    'Governance & Compliance': {
      key_metrics: [
        'Deal approval / discount governance',
        'Contract compliance rate',
        'Pricing consistency',
        'Revenue recognition compliance',
        'Data privacy in sales processes',
      ],
      l1: 'No deal governance. Discounts ad hoc. No pricing controls. Revenue recognition not considered in deal structure.',
      l2: 'Basic discount approval thresholds. Standard pricing exists but exceptions are common. Contract templates used inconsistently.',
      l3: 'Deal desk process with clear approval levels. Pricing governance enforced. Standard contracts with legal review. Revenue recognition considered in deal structure.',
      l4: 'Automated deal approval workflows. Pricing optimization models. Contract management system. Full compliance with revenue recognition standards.',
      l5: 'Zero-friction governance. Automated compliance checks. Dynamic pricing within guardrails. Perfect audit trail for every deal.',
    },
  },

  // =========================================================================
  // MARKETING
  // =========================================================================
  Marketing: {
    'HR & People Maturity': {
      key_metrics: [
        'Marketing team retention',
        'Skill coverage (content, digital, events, analytics)',
        'Agency / contractor leverage ratio',
        'Cross-training breadth',
        'Marketing certifications held',
      ],
      l1: 'Small team with single points of failure. No skill development plan. High dependency on individuals. No agency management.',
      l2: 'Roles defined but gaps exist. Some cross-training. Agency relationships exist but not optimized. Limited certifications.',
      l3: 'Balanced team with defined skill matrix. Regular training. Agency partnerships managed with SLAs. Key certifications maintained.',
      l4: 'Strategic talent management. Succession plans. Agency roster optimized by specialty. Team continuously upskilling. T-shaped marketers.',
      l5: 'Best-in-class marketing talent. Internal academy. Agency ecosystem is a competitive advantage. Team recognized as industry thought leaders.',
    },
    'Process Maturity': {
      key_metrics: [
        'Campaign execution repeatability',
        'Content production cycle time',
        'Lead-to-MQL conversion rate',
        'Pipeline contribution % (target: 30-40%)',
        'Marketing-sourced vs marketing-influenced revenue',
      ],
      l1: 'No campaign playbooks. Every campaign is built from scratch. No lead scoring. Pipeline contribution unknown.',
      l2: 'Some templates exist. Campaigns have basic structure but vary significantly. Lead handoff informal. Pipeline contribution <10%.',
      l3: 'Campaign playbooks documented and followed. Content calendar managed. Lead scoring and routing defined. Pipeline contribution 15-25%.',
      l4: 'Optimized campaign factory. Rapid campaign deployment. A/B testing embedded. Pipeline contribution 25-35%. Closed-loop reporting.',
      l5: 'Self-optimizing marketing engine. Pipeline contribution >35%. Campaigns auto-optimize based on performance. Industry benchmark for B2B marketing.',
    },
    'Systems & Technology Maturity': {
      key_metrics: [
        'Marketing automation platform maturity',
        'CRM-marketing integration depth',
        'Website / CMS capability',
        'Analytics tool coverage',
        'MarTech stack utilization rate',
      ],
      l1: 'No marketing automation. Manual email sends. Website is static. No analytics beyond basic page views.',
      l2: 'Marketing automation platform deployed but underutilized. Basic CRM sync. Website has CMS but limited functionality. Google Analytics only.',
      l3: 'Marketing automation fully operational with nurture flows. Bi-directional CRM sync. Website supports conversion optimization. Multi-touch attribution attempted.',
      l4: 'Integrated MarTech stack. Advanced automation with behavioral triggers. Personalized web experiences. Full multi-touch attribution. CDPs in use.',
      l5: 'AI-powered MarTech ecosystem. Predictive content delivery. Real-time personalization at scale. MarTech stack is a competitive advantage.',
    },
    'AI & Intelligent Automation': {
      key_metrics: [
        'AI content generation usage',
        'Predictive lead scoring adoption',
        'Automated campaign optimization',
        'AI-driven personalization coverage',
        'Time saved through AI tools (hrs/week)',
      ],
      l1: 'No AI in marketing. All content, targeting, and optimization is manual.',
      l2: 'Experimenting with AI content tools. Basic automated emails. No predictive capabilities.',
      l3: 'AI assists content creation (drafts, variants). Predictive lead scoring deployed. Automated A/B testing. Saves 5-10 hrs/week.',
      l4: 'AI deeply integrated. Predictive campaign targeting. Automated content personalization. Dynamic audience segmentation. Saves 15+ hrs/week.',
      l5: 'AI-native marketing. Autonomous campaign optimization. Generative AI produces most first-draft content. AI drives strategy, not just execution.',
    },
    'Scalability & Growth Readiness': {
      key_metrics: [
        'Pipeline generated per marketing dollar',
        'Cost per MQL / SQL',
        'Content leverage ratio (pieces per asset)',
        'Channel diversification',
        'Ability to support 2x pipeline target',
      ],
      l1: 'Marketing cannot scale. All efforts are one-off. No repeatable demand gen engine. Cost per lead unknown.',
      l2: 'Some repeatable channels (events, email). Cost per lead tracked but high. Content is mostly one-use. Limited channels.',
      l3: 'Repeatable demand gen engine. Cost per MQL benchmarked. Content repurposed across channels. 3-4 active channels. Could handle 50% more volume.',
      l4: 'Efficient marketing machine. Low cost per SQL. Content factory model. 5+ active channels. Can support 2x pipeline target without proportional spend.',
      l5: 'Scale-free marketing. Community and content flywheel generates organic demand. Marginal cost of next MQL approaches zero. Industry-leading efficiency.',
    },
    'Data & Analytics Maturity': {
      key_metrics: [
        'Pipeline attribution accuracy',
        'Campaign ROI measurement',
        'Lead source tracking completeness',
        'Marketing dashboard usage by leadership',
        'Data-driven decision making %',
      ],
      l1: 'No marketing analytics. Pipeline attribution absent. Campaign ROI unknown. Decisions based on gut feel.',
      l2: 'Basic metrics tracked (opens, clicks, attendees). First-touch attribution only. ROI estimated for major campaigns. Monthly reporting.',
      l3: 'Multi-touch attribution in place. Campaign ROI tracked for all programs. Weekly dashboards. Lead source quality analyzed. Data informs budget allocation.',
      l4: 'Advanced attribution models. Real-time marketing dashboards. Predictive pipeline models. Marketing mix optimization. Data drives all major decisions.',
      l5: 'Prescriptive marketing analytics. AI recommends budget reallocation in real-time. Perfect attribution. Marketing is the most data-driven function in the company.',
    },
    'Innovation & Continuous Improvement': {
      key_metrics: [
        'New channel / tactic experiments per quarter',
        'A/B test velocity',
        'Content format innovation',
        'Competitive differentiation in messaging',
        'Event / experience innovation',
      ],
      l1: 'No experimentation. Same tactics year after year. No A/B testing. Messaging unchanged despite market shifts.',
      l2: 'Occasional new tactic tried. Basic A/B testing on emails. Some new content formats explored. Events are formulaic.',
      l3: 'Quarterly experimentation plan. Systematic A/B testing. New formats (video, interactive, podcast) in rotation. Events evolve annually.',
      l4: 'Rapid experimentation culture. Weekly A/B tests. Multi-format content strategy. Innovative event experiences. Marketing drives thought leadership.',
      l5: 'Marketing innovation lab. Experiments drive competitive advantage. First-mover on new channels. Industry recognized for marketing innovation.',
    },
    'Governance & Compliance': {
      key_metrics: [
        'Brand compliance rate',
        'Regulatory compliance (life sciences marketing)',
        'Data privacy compliance (GDPR, CCPA)',
        'Spend approval process adherence',
        'Content review / approval workflow',
      ],
      l1: 'No brand governance. No content approval process. Data privacy not considered. Marketing spend uncontrolled.',
      l2: 'Brand guidelines exist but inconsistently followed. Basic content review process. Privacy basics addressed. Spend tracked retroactively.',
      l3: 'Brand compliance enforced. Content approval workflow in place. GDPR/CCPA compliant. Marketing budget managed with approval thresholds.',
      l4: 'Automated brand compliance checks. Streamlined approval workflows. Privacy-by-design in all campaigns. Real-time spend tracking against budget.',
      l5: 'Governance enables speed. Automated compliance frees creativity. Zero regulatory risk. Marketing governance is a competitive advantage.',
    },
  },

  // =========================================================================
  // IT
  // =========================================================================
  IT: {
    'HR & People Maturity': {
      key_metrics: [
        'IT staff retention',
        'Skills coverage vs requirements',
        'Certification maintenance rate',
        'Help desk staffing ratio',
        'Cross-training depth',
      ],
      l1: 'Understaffed IT. Key person dependencies. No skills development plan. Certifications lapsed.',
      l2: 'Roles defined but gaps exist. Some certifications maintained. Limited cross-training. Reactive hiring.',
      l3: 'Staffing model defined. Key certifications current. Cross-training for critical systems. Retention tracked and managed.',
      l4: 'Strategic IT workforce planning. All certifications current. Deep bench for critical systems. Career paths defined.',
      l5: 'IT talent is a competitive advantage. Industry-recognized team. Continuous learning culture. Zero key-person risk.',
    },
    'Process Maturity': {
      key_metrics: [
        'ITIL/ITSM adoption level',
        'Change management effectiveness',
        'Incident response time',
        'Problem management (root cause rate)',
        'Service catalog completeness',
      ],
      l1: 'No ITIL processes. Changes made without documentation. Incidents handled ad hoc. No service catalog.',
      l2: 'Basic ticketing system. Some change documentation. Incident response informal but tracked. Service catalog started.',
      l3: 'ITIL-aligned processes. Change advisory board active. Incident SLAs defined and tracked. Problem management with root cause analysis. Service catalog published.',
      l4: 'Mature ITSM. Automated change workflows. Incident response <15 min for P1. Proactive problem management. Service catalog self-service.',
      l5: 'Best-in-class IT operations. Self-healing systems. Near-zero unplanned downtime. Service experience rated excellent by users.',
    },
    'Systems & Technology Maturity': {
      key_metrics: [
        'System uptime / availability %',
        'Infrastructure modernization (cloud %)',
        'Security posture score',
        'Integration / API maturity',
        'Technical debt ratio',
      ],
      l1: 'Legacy infrastructure. Frequent outages. No cloud strategy. Security gaps. High technical debt.',
      l2: 'Mixed infrastructure. Uptime >95% but incidents common. Cloud migration started. Basic security controls. Technical debt recognized.',
      l3: 'Stable infrastructure. Uptime >99%. Cloud-first for new workloads. Security framework implemented. Technical debt managed.',
      l4: 'Modern infrastructure. Uptime >99.9%. Cloud-native operations. Advanced security (zero trust). Technical debt systematically reduced.',
      l5: 'State-of-the-art infrastructure. Uptime >99.99%. Fully cloud-optimized. Security is a differentiator. Near-zero technical debt.',
    },
    'AI & Intelligent Automation': {
      key_metrics: [
        'Automated provisioning %',
        'AI-assisted ticket resolution',
        'Infrastructure-as-code adoption',
        'Automated security monitoring',
        'Self-service automation coverage',
      ],
      l1: 'All IT operations manual. No automation. Provisioning takes days. No AI tools.',
      l2: 'Basic scripting for common tasks. Some automated monitoring. Provisioning partially automated. Exploring AI for ticket triage.',
      l3: 'Infrastructure-as-code for new deployments. Automated monitoring and alerting. AI-assisted ticket categorization. Self-service portal for common requests.',
      l4: 'Extensive automation. AI resolves L1 tickets automatically. Full IaC. Automated compliance scanning. Self-healing for common issues.',
      l5: 'AIOps platform. Predictive infrastructure management. Autonomous incident response for known patterns. >70% of requests self-service.',
    },
    'Scalability & Growth Readiness': {
      key_metrics: [
        'Cost per user / employee',
        'Time to provision new employee',
        'Infrastructure elasticity',
        'Support ticket volume per employee',
        'Technology cost as % of revenue',
      ],
      l1: 'IT cannot scale. Every new employee is a manual project. Infrastructure at capacity. Cost per user unknown.',
      l2: 'New employee setup takes 1-2 days. Infrastructure can grow but manually. Cost per user tracked but high.',
      l3: 'Automated onboarding (<4 hours). Cloud infrastructure scales on demand. Cost per user benchmarked. Can support 25% headcount growth.',
      l4: 'Near-instant provisioning. Elastic infrastructure. Cost per user declining year-over-year. Can support 50%+ growth without IT hiring.',
      l5: 'Scale-free IT. Zero-touch onboarding. Infrastructure auto-scales. IT cost per user is industry-leading. Technology enables rather than constrains growth.',
    },
    'Data & Analytics Maturity': {
      key_metrics: [
        'SLA reporting accuracy',
        'Asset inventory completeness',
        'Security incident tracking',
        'IT cost allocation accuracy',
        'User satisfaction measurement',
      ],
      l1: 'No IT analytics. SLA tracking absent. Asset inventory incomplete. No user satisfaction measurement.',
      l2: 'Basic SLA reports. Asset inventory exists but outdated. Security events logged. User satisfaction measured annually.',
      l3: 'Real-time SLA dashboards. Asset inventory current and automated. Security analytics in place. Quarterly user satisfaction surveys. IT costs allocated to departments.',
      l4: 'Advanced IT analytics. Predictive capacity planning. Automated asset lifecycle management. Continuous user feedback. Cost optimization analytics.',
      l5: 'Prescriptive IT analytics. AI predicts failures before they occur. Zero untracked assets. User experience scored in real-time. Data drives all IT decisions.',
    },
    'Innovation & Continuous Improvement': {
      key_metrics: [
        'New technology evaluations per quarter',
        'Innovation projects delivered',
        'Technology improvement suggestions implemented',
        'Proof-of-concept velocity',
        'Shadow IT reduction rate',
      ],
      l1: 'Purely reactive IT. No innovation capacity. Technology decisions made by default (renew whatever exists).',
      l2: 'Some technology evaluation. Occasional improvement projects. Shadow IT is common (users work around IT).',
      l3: 'Quarterly technology reviews. Structured POC process. Innovation time allocated. Shadow IT actively managed and reduced.',
      l4: 'IT drives technology innovation. Rapid POC-to-production. Internal tech advisory role. Proactive technology roadmap.',
      l5: 'IT is the innovation engine. Technology leadership recognized by business. Emerging tech evaluation continuous. IT shapes company strategy.',
    },
    'Governance & Compliance': {
      key_metrics: [
        'Security audit findings',
        'Compliance framework coverage (SOC2, HIPAA, etc.)',
        'Access control review frequency',
        'Disaster recovery test results',
        'Policy compliance rate',
      ],
      l1: 'No security framework. Audit findings common. No DR plan. Access controls informal. Policy documentation absent.',
      l2: 'Basic security policies. Annual access reviews. DR plan exists but untested. Some compliance awareness.',
      l3: 'Security framework implemented. Quarterly access reviews. DR tested annually. Compliance requirements mapped and tracked. Minimal audit findings.',
      l4: 'Advanced security posture. Continuous compliance monitoring. DR tested quarterly with <4hr RTO. Zero material audit findings.',
      l5: 'Security excellence. Real-time compliance. Automated DR with near-zero RTO/RPO. Zero audit findings. Certifications as competitive advantage.',
    },
  },

  // =========================================================================
  // HR ADMIN
  // =========================================================================
  'HR Admin': {
    'HR & People Maturity': {
      key_metrics: [
        'Company-wide retention rate',
        'Employee engagement score',
        'Time-to-fill open positions',
        'Training completion rate',
        'HR-to-employee ratio',
      ],
      l1: 'HR is purely administrative (payroll, paperwork). No strategic people function. Engagement not measured. High turnover unaddressed.',
      l2: 'Basic HR services functional. Some engagement measurement. Retention tracked but not actionable. Training is compliance-only.',
      l3: 'Strategic HR emerging. Engagement surveys with action plans. Retention strategies defined. Development programs in place. HR-to-employee ratio appropriate.',
      l4: 'HR is a strategic business partner. Predictive people analytics. Proactive retention programs. Leadership development. Culture actively managed.',
      l5: 'World-class people function. HR drives business strategy. Best-in-class engagement. Employer brand recognized. People analytics is a competitive advantage.',
    },
    'Process Maturity': {
      key_metrics: [
        'Onboarding completion time',
        'Benefits administration accuracy',
        'Performance review completion rate',
        'Policy compliance rate',
        'Employee lifecycle automation %',
      ],
      l1: 'Manual HR processes. Onboarding takes weeks. Benefits errors common. Performance reviews missed or inconsistent.',
      l2: 'Basic HRIS in place. Onboarding checklist exists. Benefits mostly accurate. Performance reviews happen annually but quality varies.',
      l3: 'Documented HR processes. Onboarding <5 days. Benefits administration accurate. Performance reviews structured with calibration. Policy handbook current.',
      l4: 'Optimized HR processes. Onboarding <3 days. Self-service benefits. Continuous performance management. Automated compliance tracking.',
      l5: 'Frictionless HR. Zero-touch onboarding. Employee self-service for all routine HR. Continuous feedback culture. HR processes are invisible (they just work).',
    },
    'Systems & Technology Maturity': {
      key_metrics: [
        'HRIS adoption and data quality',
        'Payroll accuracy rate',
        'Employee self-service adoption',
        'System integration (HRIS, payroll, benefits, LMS)',
        'Data reconciliation frequency',
      ],
      l1: 'Spreadsheet-based HR. HRIS absent or unused. Payroll errors common. No employee self-service.',
      l2: 'HRIS (Paylocity) in place but data quality issues. Payroll mostly accurate. Limited self-service. Manual data reconciliation needed.',
      l3: 'HRIS actively maintained with >95% data accuracy. Payroll error-free. Employee self-service for common requests. Key integrations working.',
      l4: 'Integrated HR tech stack. Real-time data across systems. Full self-service. Automated workflows for approvals, onboarding, offboarding.',
      l5: 'Best-in-class HR tech. AI-powered people insights. Zero manual data reconciliation. Employee experience platform. Technology enables strategic HR.',
    },
    'AI & Intelligent Automation': {
      key_metrics: [
        'Automated onboarding/offboarding steps',
        'AI-assisted resume screening',
        'Chatbot for employee HR queries',
        'Automated compliance alerts',
        'Predictive attrition models',
      ],
      l1: 'No HR automation. All processes manual. No AI tools in HR.',
      l2: 'Basic automation (offer letter generation, new hire provisioning triggers). Exploring AI for recruiting.',
      l3: 'Automated onboarding workflows. AI-assisted resume screening. Automated compliance reminders. Employee FAQ chatbot piloted.',
      l4: 'Predictive attrition models. AI-driven compensation benchmarking. Automated compliance monitoring. HR chatbot handling >50% of routine queries.',
      l5: 'AI-native HR. Autonomous handling of routine HR requests. Predictive people analytics drive strategy. AI ensures proactive retention interventions.',
    },
    'Scalability & Growth Readiness': {
      key_metrics: [
        'HR processes per employee (cost)',
        'Ability to support headcount growth',
        'Policy scalability across regions',
        'Onboarding capacity',
        'HR team leverage ratio',
      ],
      l1: 'HR cannot scale. Every new hire is a manual burden. Adding locations/regions requires starting from scratch.',
      l2: 'HR can handle current load but growth would strain capacity. Basic scalability through HRIS. Manual processes bottleneck.',
      l3: 'HR processes can support 25% headcount growth. Standardized across current operations. Onboarding capacity defined.',
      l4: 'Scalable HR. Can support 50%+ growth without proportional HR hiring. Multi-location capable. Self-service reduces HR load.',
      l5: 'Scale-free HR operations. Technology handles routine at any volume. HR team focused purely on strategic initiatives regardless of company size.',
    },
    'Data & Analytics Maturity': {
      key_metrics: [
        'People analytics capability',
        'Compensation benchmarking data quality',
        'Turnover analysis depth',
        'Workforce planning data',
        'HR reporting cadence and quality',
      ],
      l1: 'No people analytics. Headcount reported manually. Compensation data in spreadsheets. No workforce planning data.',
      l2: 'Basic HR reporting (headcount, turnover). Compensation data exists but not benchmarked. Manual reporting.',
      l3: 'Regular people analytics. Comp benchmarked to market. Turnover analyzed by department, tenure, role. Workforce planning supported by data.',
      l4: 'Advanced people analytics. Predictive models for attrition and engagement. Real-time workforce dashboards. Data drives all HR decisions.',
      l5: 'Prescriptive people analytics. AI identifies retention risks and recommends interventions. HR data is a strategic asset. Industry-recognized analytics.',
    },
    'Innovation & Continuous Improvement': {
      key_metrics: [
        'HR process improvement initiatives',
        'Employee experience innovations',
        'New program development',
        'Best practice adoption rate',
        'Employee feedback loop speed',
      ],
      l1: 'HR does what it has always done. No improvement initiatives. Employee feedback not systematically collected.',
      l2: 'Occasional process improvements. Annual employee surveys. Some best practices from industry events.',
      l3: 'Quarterly HR improvement reviews. Employee feedback drives changes. New programs developed annually. Best practices actively sought.',
      l4: 'Continuous HR innovation. Rapid response to employee feedback. Experimental programs piloted. HR leads organizational change.',
      l5: 'HR innovation leader. Programs are industry benchmarks. Employee experience is a competitive advantage. Continuous evolution of people practices.',
    },
    'Governance & Compliance': {
      key_metrics: [
        'Employment law compliance',
        'Policy documentation completeness',
        'Audit readiness',
        'Investigation response time',
        'Training compliance rate',
      ],
      l1: 'Compliance risks present. Policies outdated or missing. No systematic compliance training. Investigations ad hoc.',
      l2: 'Basic employment compliance. Key policies documented. Annual compliance training. Investigations handled but not systematically tracked.',
      l3: 'Comprehensive policy handbook. Regular compliance training. Investigations documented with proper process. Audit-ready for employment matters.',
      l4: 'Proactive compliance management. Automated training tracking. Legal risk proactively managed. Zero material compliance findings.',
      l5: 'Compliance excellence. Real-time policy compliance monitoring. Automated regulatory update tracking. Zero employment litigation risk. Model employer.',
    },
  },

  // =========================================================================
  // FINANCE
  // =========================================================================
  Finance: {
    'HR & People Maturity': {
      key_metrics: [
        'Finance team skill coverage',
        'CPA / certification rate',
        'Cross-training for key processes',
        'Finance team retention',
        'Succession readiness for controller/CFO',
      ],
      l1: 'Understaffed finance. Key person dependencies for month-end close. No certifications required. No succession plan.',
      l2: 'Roles defined but single points of failure exist. Some certifications maintained. Basic cross-training attempted.',
      l3: 'Finance team properly staffed. Key certifications current. Cross-training for critical close processes. Succession plan documented.',
      l4: 'Strategic finance talent. All critical roles have backups. Continuous professional development. Finance as business partner — team has operational context.',
      l5: 'Best-in-class finance team. Deep bench. Team drives strategic analysis beyond compliance. Recognized internally as trusted advisors.',
    },
    'Process Maturity': {
      key_metrics: [
        'Month-end close cycle time (days)',
        'Budget vs actual variance tracking',
        'Department budget process maturity',
        'AP/AR aging management',
        'Financial forecasting cadence',
      ],
      l1: 'No budget process. Month-end close >15 days. No variance tracking. AP/AR managed reactively. No departmental budgets.',
      l2: 'Month-end close 10-15 days. Basic P&L available. Budgets exist at company level only. AR collections inconsistent.',
      l3: 'Month-end close <10 days. Department budgets with variance tracking. AP/AR aging managed. Quarterly forecasting. Budget vs actual reviewed monthly.',
      l4: 'Month-end close <5 days. Rolling forecasts. Real-time budget vs actual. Working capital optimized. Automated reconciliations.',
      l5: 'Continuous close. Real-time financial visibility. Predictive forecasting. Zero manual reconciliation. Finance sets the pace for the business.',
    },
    'Systems & Technology Maturity': {
      key_metrics: [
        'ERP / GL system maturity',
        'Financial reporting automation',
        'Integration between GL, payroll, billing',
        'Data quality in financial systems',
        'Year-end close system readiness',
      ],
      l1: 'Manual bookkeeping. GL data quality poor. Year-end closing entries contaminate data. No system integration.',
      l2: 'GL system in place but data quality issues. Manual reconciliation between systems. Closing entries require manual cleanup.',
      l3: 'Integrated GL system. Automated data feeds from payroll and billing. Data quality >95%. Closing entry handling documented.',
      l4: 'Fully integrated financial systems. Real-time GL. Automated intercompany eliminations. Clean data throughout the year. Audit-ready always.',
      l5: 'Best-in-class financial systems. Real-time dashboarding. Zero reconciliation items. Continuous audit readiness. Technology enables strategic finance.',
    },
    'AI & Intelligent Automation': {
      key_metrics: [
        'Automated journal entries %',
        'AI-assisted anomaly detection',
        'Automated AP processing',
        'Predictive cash flow modeling',
        'Automated financial reporting',
      ],
      l1: 'No automation in finance. All journal entries, reports, and reconciliations manual.',
      l2: 'Basic automation: scheduled reports, some automated JEs. Exploring AP automation.',
      l3: 'Automated recurring JEs. AP automation deployed. Basic anomaly detection. Automated standard financial reports. Saves 10+ hours/month.',
      l4: 'AI-assisted anomaly detection in GL. Predictive cash flow models. Automated variance analysis. 50%+ reduction in manual finance work.',
      l5: 'AI-native finance. Autonomous close for routine items. Predictive financial planning. AI surfaces issues before month-end. Finance team focused on strategy.',
    },
    'Scalability & Growth Readiness': {
      key_metrics: [
        'Finance cost as % of revenue',
        'Transaction processing capacity',
        'Multi-entity readiness',
        'Scalability of reporting',
        'Finance headcount to company headcount ratio',
      ],
      l1: 'Finance processes cannot scale. Every new client/entity requires significant manual work. Reporting is not scalable.',
      l2: 'Finance handles current load but growth would strain capacity. Manual processes bottleneck scaling.',
      l3: 'Finance processes can support 25% revenue growth. Standard reporting templates. Entity structure manageable.',
      l4: 'Scalable finance. Can support 50%+ growth without proportional hiring. Multi-entity capable. Automated transaction processing.',
      l5: 'Scale-free finance. Technology handles volume at any size. Finance headcount ratio is industry-leading. Growth is unconstrained by finance capacity.',
    },
    'Data & Analytics Maturity': {
      key_metrics: [
        'Financial reporting accuracy',
        'Department cost visibility',
        'Project profitability tracking',
        'Cash flow forecasting accuracy',
        'Management reporting quality',
      ],
      l1: 'Financial reports late and inaccurate. No department cost visibility. Project profitability unknown. Cash flow reactive.',
      l2: 'Monthly financials available but delayed. Basic department cost allocation. Project profitability estimated. Cash flow tracked weekly.',
      l3: 'Accurate monthly financials within 10 days. Department P&Ls. Project profitability tracked. Cash flow forecasted 90 days. Management dashboards.',
      l4: 'Real-time financial analytics. Granular cost allocation. Real-time project margin. Cash flow forecasted 12 months. Scenario modeling.',
      l5: 'Prescriptive financial analytics. AI-driven margin optimization. Real-time cash flow predictions. Finance data drives operational decisions across the company.',
    },
    'Innovation & Continuous Improvement': {
      key_metrics: [
        'Process improvement initiatives',
        'Close cycle time reduction',
        'New analysis capabilities developed',
        'Finance automation adoption',
        'Business partnering effectiveness',
      ],
      l1: 'No improvement culture in finance. Same processes for years. Compliance-focused only.',
      l2: 'Occasional improvements, usually after audit findings. Some automation explored.',
      l3: 'Annual process improvement reviews. Close time actively optimized. New analytical capabilities developed. Finance proactively partners with operations.',
      l4: 'Continuous improvement embedded. Finance drives business insights. Process automation continuously expanded. Finance leads cost optimization initiatives.',
      l5: 'Finance innovation leader. Pioneering new analytical methods. Finance function is a strategic differentiator. Recognized externally for best practices.',
    },
    'Governance & Compliance': {
      key_metrics: [
        'Audit findings (material/immaterial)',
        'SOX / internal control effectiveness',
        'Revenue recognition compliance',
        'Tax compliance timeliness',
        'Financial policy adherence',
      ],
      l1: 'Material audit findings. Internal controls weak. Revenue recognition not formalized. Tax filings sometimes late.',
      l2: 'Some internal controls. Audit findings present but immaterial. Revenue recognition policies exist. Tax compliance current.',
      l3: 'Internal control framework documented. No material audit findings. Revenue recognition compliant. Tax filings timely. Financial policies enforced.',
      l4: 'Strong internal controls with testing. Continuous compliance monitoring. Zero audit findings. Proactive regulatory compliance.',
      l5: 'Governance excellence. Automated controls testing. Perfect audit history. Real-time compliance. Finance governance is a model for the industry.',
    },
  },

  // =========================================================================
  // STAFFING / TALENT ACQUISITION
  // =========================================================================
  'Staffing/TA': {
    'HR & People Maturity': {
      key_metrics: [
        'Recruiter capacity (reqs per recruiter)',
        'Recruiting team retention',
        'Sourcing skill diversity',
        'Hiring manager satisfaction',
        'Recruiter training investment',
      ],
      l1: 'Recruiting is ad hoc. No dedicated recruiters or over-burdened. Hiring manager satisfaction low.',
      l2: 'Dedicated recruiting function. Basic sourcing skills. Hiring managers involved but frustrated with process. Capacity strained.',
      l3: 'Right-sized recruiting team. Diverse sourcing skills (direct, agency, referral). Hiring manager satisfaction measured. Training provided.',
      l4: 'Strategic TA function. Recruiters are trusted advisors to hiring managers. Employer branding active. Recruiting drives workforce planning.',
      l5: 'Best-in-class TA. Recruiters drive talent strategy. Employer brand is a competitive advantage. Inbound talent pipeline exceeds needs.',
    },
    'Process Maturity': {
      key_metrics: [
        'Time-to-fill (days)',
        'Offer acceptance rate',
        'Quality of hire (90-day retention)',
        'Source effectiveness by channel',
        'Interview process consistency',
      ],
      l1: 'No structured hiring process. Time-to-fill unknown. Interview process varies by hiring manager. No quality tracking.',
      l2: 'Basic hiring process defined. Time-to-fill tracked but long (>60 days). Interviews somewhat structured. Offer acceptance >70%.',
      l3: 'Consistent hiring process. Time-to-fill <45 days. Structured interviews with scorecards. Quality of hire tracked. Source effectiveness analyzed.',
      l4: 'Optimized hiring. Time-to-fill <30 days. Interview process calibrated. Quality of hire >90% (90-day retention). Source ROI drives investment.',
      l5: 'World-class hiring. Time-to-fill <20 days. Candidates rate experience 9+/10. Quality of hire >95%. Process is a competitive advantage.',
    },
    'Systems & Technology Maturity': {
      key_metrics: [
        'ATS adoption and data quality',
        'Sourcing tool utilization',
        'Integration with HRIS/onboarding',
        'Career site effectiveness',
        'Recruiting analytics tool usage',
      ],
      l1: 'No ATS. Resumes in email/folders. No sourcing tools. Career page is static.',
      l2: 'ATS deployed but underutilized. Basic job boards. Career page exists. Manual handoff to onboarding.',
      l3: 'ATS actively used with >90% compliance. Sourcing tools (LinkedIn, boards) integrated. Career site optimized. Automated handoff to HRIS.',
      l4: 'Integrated recruiting tech stack. AI-powered sourcing. CRM for talent pipeline. Automated scheduling. Full analytics.',
      l5: 'AI-native recruiting platform. Predictive candidate matching. Automated nurture campaigns. Zero-friction candidate experience. Tech multiplies recruiter output.',
    },
    'AI & Intelligent Automation': {
      key_metrics: [
        'AI-assisted sourcing / matching',
        'Automated screening coverage',
        'Interview scheduling automation',
        'Predictive hiring success models',
        'Chatbot for candidate queries',
      ],
      l1: 'No AI or automation in recruiting. All sourcing, screening, and scheduling manual.',
      l2: 'Basic automation: automated job postings, template emails. Some AI sourcing explored.',
      l3: 'AI-assisted candidate matching. Automated screening for basic requirements. Automated scheduling. Candidate chatbot for FAQs.',
      l4: 'Predictive hiring models. AI surfaces best candidates. Automated reference checks. Video interview AI analysis. 40% time savings.',
      l5: 'AI-native recruiting. Autonomous sourcing for standard roles. AI predicts candidate success. Recruiters focus on relationship and closing.',
    },
    'Scalability & Growth Readiness': {
      key_metrics: [
        'Cost per hire',
        'Recruiting capacity vs demand',
        'Agency dependency %',
        'Talent pipeline depth',
        'Ability to support hiring surge',
      ],
      l1: 'Cannot support hiring surges. Fully agency-dependent for volume. Cost per hire unknown or very high.',
      l2: 'Some internal capacity. Agency used for 30%+ of hires. Cost per hire tracked but above benchmark. Pipeline shallow.',
      l3: 'Balanced sourcing model. Agency <20% of hires. Cost per hire benchmarked. Talent pipeline for key roles. Can handle 30% surge.',
      l4: 'Efficient TA. Internal sourcing drives >90% of hires. Cost per hire below benchmark. Deep pipeline. Can handle 2x surge.',
      l5: 'Scale-free recruiting. Talent community generates candidates. Near-zero agency dependency. Cost per hire industry-leading. Unlimited scale capacity.',
    },
    'Data & Analytics Maturity': {
      key_metrics: [
        'Recruiting funnel analytics',
        'Source-to-hire tracking',
        'Quality of hire measurement',
        'Diversity hiring metrics',
        'Recruiting ROI / cost analytics',
      ],
      l1: 'No recruiting analytics. Hires counted but funnel invisible. Source effectiveness unknown.',
      l2: 'Basic metrics: open reqs, time-to-fill, hires by source. Limited funnel visibility.',
      l3: 'Full funnel analytics. Source-to-hire tracked. Quality of hire measured. Diversity metrics reported. Recruiting dashboards.',
      l4: 'Advanced recruiting analytics. Predictive time-to-fill. Hiring manager effectiveness tracked. Cost optimization analytics. Data drives strategy.',
      l5: 'Prescriptive recruiting analytics. AI predicts sourcing ROI. Real-time labor market intelligence. Analytics drive all TA decisions.',
    },
    'Innovation & Continuous Improvement': {
      key_metrics: [
        'New sourcing channel experiments',
        'Employer brand initiatives',
        'Candidate experience improvements',
        'Process optimization frequency',
        'Industry practice adoption speed',
      ],
      l1: 'Same recruiting approach for years. No innovation. Candidate experience not considered.',
      l2: 'Occasional new sourcing channels tried. Some candidate experience improvements. Annual process review.',
      l3: 'Quarterly sourcing experiments. Candidate experience measured and improved. Employer brand actively managed. New practices adopted.',
      l4: 'Continuous recruiting innovation. Rapid adoption of new tools and methods. Employer brand drives inbound. Candidate experience is exceptional.',
      l5: 'TA innovation leader. First-mover on new recruiting methods. Employer brand is nationally recognized. Recruiting process is a competitive advantage.',
    },
    'Governance & Compliance': {
      key_metrics: [
        'EEO / OFCCP compliance',
        'Background check completion rate',
        'Offer letter accuracy',
        'I-9 compliance',
        'Recruiting audit readiness',
      ],
      l1: 'Compliance risks present. Background checks inconsistent. EEO tracking absent. I-9s not always timely.',
      l2: 'Basic compliance. Background checks standardized. EEO data collected. I-9 process documented. Some gaps.',
      l3: 'Full compliance. All background checks completed pre-start. EEO reporting current. I-9 100% compliant. Audit-ready.',
      l4: 'Proactive compliance. Automated compliance tracking. Adverse action process documented. Zero findings in audits.',
      l5: 'Compliance excellence. Automated end-to-end compliance. Zero risk. Compliance enables speed rather than slowing hiring.',
    },
  },

  // =========================================================================
  // QUALITY
  // =========================================================================
  Quality: {
    'HR & People Maturity': {
      key_metrics: ['QA/QC staff certification rate', 'Auditor qualification maintenance', 'Quality team retention', 'Regulatory training currency', 'Cross-functional quality skill transfer'],
      l1: 'Understaffed quality. Certifications lapsed. No dedicated quality professionals.',
      l2: 'Quality roles defined. Some certifications current. Limited cross-training.',
      l3: 'Qualified quality team. All certifications current. Cross-functional training. Retention managed.',
      l4: 'Strategic quality talent. Deep regulatory expertise. Quality team advises all departments.',
      l5: 'Industry-recognized quality professionals. Thought leadership. Quality team is a differentiator for client confidence.',
    },
    'Process Maturity': {
      key_metrics: ['SOP documentation coverage', 'CAPA effectiveness (close rate, recurrence)', 'Internal audit schedule adherence', 'Deviation management cycle time', 'Quality metrics tracking'],
      l1: 'No QMS. SOPs absent or outdated. No CAPA system. Quality is reactive to client complaints.',
      l2: 'Basic SOPs exist for some processes. CAPA tracked but slow to close. Internal audits sporadic.',
      l3: 'Documented QMS. SOPs current for all critical processes. CAPA system effective (<30 day close). Internal audits on schedule.',
      l4: 'Optimized QMS. CAPA prevents recurrence (RCA effective). Deviation cycle time <15 days. Quality metrics drive decisions.',
      l5: 'Best-in-class QMS. Proactive quality management. Near-zero recurring CAPAs. Quality process is a client selling point.',
    },
    'Systems & Technology Maturity': {
      key_metrics: ['QMS software maturity', 'Document control system', 'Audit management tool', 'Integration with delivery systems', 'Electronic signatures / 21 CFR Part 11'],
      l1: 'Paper-based quality system. No QMS software. Document control manual.',
      l2: 'Basic QMS tool. Electronic document control started. Some forms digitized.',
      l3: 'QMS software operational. Full electronic document control. Audit management tool. 21 CFR Part 11 compliant where required.',
      l4: 'Integrated QMS across all departments. Real-time quality dashboards. Automated workflows for CAPAs, deviations, change control.',
      l5: 'AI-enhanced QMS. Predictive quality analytics. Fully digital, paperless quality system. Industry model for life sciences QMS.',
    },
    'AI & Intelligent Automation': {
      key_metrics: ['Automated compliance checking', 'AI-assisted audit planning', 'Automated deviation detection', 'Predictive quality analytics', 'Document review automation'],
      l1: 'No automation in quality. All reviews, audits, and checks manual.',
      l2: 'Basic automation: automated reminders for training, expiring SOPs. Some templates.',
      l3: 'Automated CAPA workflows. AI-assisted document review. Automated compliance reminders. Saves 5+ hrs/week.',
      l4: 'Predictive quality analytics. AI identifies deviation patterns. Automated audit evidence collection. 30%+ time savings.',
      l5: 'AI-native quality. Autonomous compliance monitoring. Predictive risk identification. Quality team focuses on strategy, not paperwork.',
    },
    'Scalability & Growth Readiness': {
      key_metrics: ['Quality cost as % of revenue', 'Audit capacity vs requirements', 'Quality process replication speed', 'Client quality requirements handling capacity', 'Regulatory scope coverage'],
      l1: 'Quality cannot scale. Every new client or regulation requires significant manual effort.',
      l2: 'Quality handles current scope but growth would strain. Manual processes limit capacity.',
      l3: 'Quality processes scalable to 25% growth. Standard approaches replicated for new clients. Regulatory scope managed.',
      l4: 'Scalable quality. Can support 50%+ growth. Automated compliance for new regulations. Quality as a service model.',
      l5: 'Scale-free quality. Technology handles compliance at any volume. Quality team focuses on strategic risk, not routine compliance.',
    },
    'Data & Analytics Maturity': {
      key_metrics: ['Quality trend analysis capability', 'CAPA effectiveness metrics', 'Audit finding analytics', 'Client quality scorecard', 'Regulatory change tracking'],
      l1: 'No quality analytics. CAPAs counted but not analyzed. No trend identification.',
      l2: 'Basic quality reports. CAPA volume tracked. Audit findings summarized. Manual trend analysis.',
      l3: 'Quality dashboards. CAPA root cause analysis trends. Audit finding patterns identified. Client quality scorecards maintained.',
      l4: 'Advanced quality analytics. Predictive models for quality risks. Real-time quality KPIs. Data drives quality strategy.',
      l5: 'Prescriptive quality analytics. AI predicts quality issues before they occur. Real-time regulatory intelligence. Quality data is a competitive asset.',
    },
    'Innovation & Continuous Improvement': {
      key_metrics: ['Quality improvement projects', 'Best practice adoption', 'Regulatory anticipation', 'Quality methodology evolution', 'Industry benchmarking frequency'],
      l1: 'Quality is compliance-only. No improvement beyond minimum requirements.',
      l2: 'Some improvements driven by audit findings. Occasional best practice review.',
      l3: 'Structured quality improvement program. Annual benchmarking. Regulatory changes anticipated. Methodology reviewed regularly.',
      l4: 'Continuous quality improvement. Proactive regulatory compliance. Quality innovations piloted. Industry best practices rapidly adopted.',
      l5: 'Quality innovation leader. Ahead of regulatory curve. Quality methodology is an industry benchmark. Drives cross-functional improvement.',
    },
    'Governance & Compliance': {
      key_metrics: ['Regulatory inspection readiness', 'Client audit pass rate', 'Compliance gap closure time', 'Management review effectiveness', 'Regulatory correspondence timeliness'],
      l1: 'Not inspection-ready. Compliance gaps known but unaddressed. Regulatory correspondence reactive.',
      l2: 'Basic inspection readiness. Some compliance gaps. Client audits pass with findings.',
      l3: 'Inspection-ready at all times. Client audits pass with minimal findings. Compliance gaps closed within 30 days. Management reviews effective.',
      l4: 'Proactive compliance. Zero inspection findings. Client audits pass with zero findings. Real-time compliance status.',
      l5: 'Compliance excellence. Regulatory agencies view favorably. Perfect client audit record. Compliance is the primary brand differentiator.',
    },
  },

  // =========================================================================
  // RMO (Resource Management Office)
  // =========================================================================
  RMO: {
    'HR & People Maturity': {
      key_metrics: ['Resource manager skill level', 'Workforce planning capability', 'Stakeholder satisfaction', 'Cross-department coordination effectiveness', 'RMO team development'],
      l1: 'No formal resource management function. Staffing is ad hoc by individual PMs.',
      l2: 'Basic resource coordination exists. One person tracks allocations. Reactive to staffing requests.',
      l3: 'RMO function defined. Resource managers skilled in capacity planning. Stakeholders satisfied with response time.',
      l4: 'Strategic RMO. Workforce planning drives hiring. Resource managers are trusted partners to delivery and sales.',
      l5: 'Best-in-class RMO. Predictive workforce planning. RMO drives competitive advantage through optimal staffing.',
    },
    'Process Maturity': {
      key_metrics: ['Resource request-to-fill time', 'Demand forecasting accuracy', 'Bench management effectiveness', 'Conflict resolution process', 'Capacity planning cadence'],
      l1: 'No resource management process. Staffing conflicts resolved by escalation. No demand forecasting.',
      l2: 'Basic request process. Spreadsheet-based allocation. Bench known but not managed. Monthly capacity review.',
      l3: 'Defined resource management process. Request-to-fill <10 days. Bench actively managed. Weekly capacity planning. Demand forecasted 30 days.',
      l4: 'Optimized resource management. Request-to-fill <5 days. Bench <7 days. Demand forecasted 90 days. Conflict resolution fair and transparent.',
      l5: 'Self-optimizing resource management. AI-driven matching. Near-zero bench time. 6-month demand visibility. Perfect stakeholder alignment.',
    },
    'Systems & Technology Maturity': {
      key_metrics: ['Resource management tool maturity', 'Visibility into available resources', 'Skills database quality', 'Integration with PM and HR systems', 'Real-time allocation dashboard'],
      l1: 'Spreadsheets only. No resource management tool. Skills not tracked systematically.',
      l2: 'Basic tool or shared spreadsheet. Partial skills data. Limited integration with PM and HR.',
      l3: 'Resource management system in place. Skills database maintained. Integrated with PM for demand signals. Real-time allocation visibility.',
      l4: 'Integrated RMO platform. AI-powered skills matching. Real-time dashboards. Full integration with HR, PM, and finance.',
      l5: 'Best-in-class resource technology. Predictive allocation. AI matches skills to requirements. Zero manual allocation for standard requests.',
    },
    'AI & Intelligent Automation': {
      key_metrics: ['AI resource matching', 'Automated demand aggregation', 'Predictive capacity alerts', 'Skills gap auto-detection', 'Automated bench management'],
      l1: 'No automation. All resource allocation decisions manual.',
      l2: 'Basic automation: automated reports, email notifications for bench resources.',
      l3: 'Automated demand aggregation. AI-assisted matching for standard roles. Automated bench alerts.',
      l4: 'Predictive capacity planning. AI recommends resource allocation. Automated skills gap analysis. 30%+ efficiency gain.',
      l5: 'Autonomous resource management for standard allocations. AI predicts demand 6 months ahead. RMO focused on strategic workforce optimization.',
    },
    'Scalability & Growth Readiness': {
      key_metrics: ['Resources managed per RMO staff', 'Ability to absorb demand spikes', 'Multi-geography coordination', 'Contractor sourcing speed', 'Resource management cost per headcount'],
      l1: 'RMO cannot handle current load. Growth would overwhelm the function.',
      l2: 'RMO handles current load but demand spikes create chaos. Limited surge capacity.',
      l3: 'RMO can support 25% growth. Surge capacity through contractor acceleration. Process scales across current geography.',
      l4: 'Scalable RMO. Can support 50%+ growth. Multi-geography coordination. Technology multiplies RMO capacity.',
      l5: 'Scale-free resource management. Technology handles allocation at any volume. RMO focused on strategic optimization regardless of company size.',
    },
    'Data & Analytics Maturity': {
      key_metrics: ['Utilization analytics quality', 'Demand vs supply visibility', 'Skills inventory accuracy', 'Resource cost analytics', 'Predictive analytics maturity'],
      l1: 'No resource analytics. Utilization unknown. Supply vs demand not tracked.',
      l2: 'Basic utilization reports. Supply/demand tracked manually. Skills inventory incomplete.',
      l3: 'Utilization dashboards. Supply/demand forecasted. Skills inventory >90% accurate. Cost per resource tracked.',
      l4: 'Advanced resource analytics. Predictive demand modeling. Real-time utilization optimization. Data drives all allocation decisions.',
      l5: 'Prescriptive resource analytics. AI optimizes utilization in real-time. Perfect supply/demand alignment. Analytics drive workforce strategy.',
    },
    'Innovation & Continuous Improvement': {
      key_metrics: ['Matching algorithm improvements', 'New staffing model experiments', 'Process optimization frequency', 'Stakeholder feedback integration', 'Industry practice adoption'],
      l1: 'No improvement culture. Same manual staffing approach for years.',
      l2: 'Occasional process tweaks. Some feedback collected from hiring managers.',
      l3: 'Quarterly process reviews. Stakeholder feedback drives improvements. New staffing models explored.',
      l4: 'Continuous improvement. Rapid experimentation with new approaches. RMO drives workforce model innovation.',
      l5: 'RMO innovation leader. Staffing models are a competitive differentiator. Industry-recognized approach to resource management.',
    },
    'Governance & Compliance': {
      key_metrics: ['Allocation fairness / transparency', 'Contractor compliance', 'Conflict of interest management', 'Audit trail for staffing decisions', 'SLA adherence'],
      l1: 'No governance for staffing decisions. Allocation is political. No audit trail.',
      l2: 'Basic allocation rules. Some documentation. Contractor compliance basic.',
      l3: 'Transparent allocation criteria. Contractor compliance managed. Staffing decisions documented. SLAs defined and tracked.',
      l4: 'Full governance framework. Automated compliance. Perfect audit trail. Fair and transparent allocation recognized by stakeholders.',
      l5: 'Governance excellence. Zero allocation disputes. Automated compliance. Staffing governance is a model for the industry.',
    },
  },
}

// Map department names to department_type for lookup convenience
export const DEPT_NAME_TO_TYPE: Record<string, string> = {
  'Delivery Operations': 'Delivery',
  'Sales & Growth': 'Sales/Growth',
  'Marketing': 'Marketing',
  'IT / Infrastructure': 'IT',
  'HR Administration': 'HR Admin',
  'Finance & Accounting': 'Finance',
  'Staffing / Talent Acquisition': 'Staffing/TA',
  'Quality & Compliance': 'Quality',
  'Resource Management Office': 'RMO',
  'Partnerships': 'Sales/Growth',
}

export function getDeptTypeDimensions(departmentType: string): DeptTypeDimensions | undefined {
  return DEPT_TYPE_DIMENSIONS[departmentType]
}
