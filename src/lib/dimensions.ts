import { DIMENSIONS, DIMENSION_SHORT } from './types'

export interface DimensionDefinition {
  name: string
  short: string
  description: string
  what_it_measures: string
  scoring_guide: {
    l1: string
    l2: string
    l3: string
    l4: string
    l5: string
  }
}

export const DIMENSION_DEFINITIONS: Record<string, DimensionDefinition> = {
  'HR & People Maturity': {
    name: 'HR & People Maturity',
    short: 'HR & People',
    description:
      'Measures the department\'s ability to attract, retain, develop, and engage talent. Covers succession planning, employee engagement, training programs, and workforce stability.',
    what_it_measures:
      'Talent management, retention rates, development pathways, succession planning, engagement scores, and workforce stability.',
    scoring_guide: {
      l1: 'No formal people processes. High turnover, no development plans. Hiring is reactive and ad hoc. No engagement measurement.',
      l2: 'Basic HR processes exist but are inconsistent. Some training happens but is not planned. Turnover is tracked but not addressed systematically.',
      l3: 'Defined talent management processes. Regular performance reviews, documented development plans, consistent onboarding. Turnover tracked and benchmarked.',
      l4: 'Proactive talent management. Succession plans for key roles, predictive retention analytics, structured career paths, regular engagement surveys with action plans.',
      l5: 'Industry-leading people practices. Internal talent marketplace, AI-driven skills matching, top-quartile retention, recognized employer brand.',
    },
  },
  'Process Maturity': {
    name: 'Process Maturity',
    short: 'Process',
    description:
      'Measures how well the department\'s core workflows are defined, documented, repeatable, and continuously improved. The foundation for consistency and quality.',
    what_it_measures:
      'Process documentation, standardization, repeatability, quality controls, SOP adherence, and cycle time efficiency.',
    scoring_guide: {
      l1: 'Processes are ad hoc and person-dependent. No documentation. Outcomes vary based on who performs the work. No quality controls.',
      l2: 'Some processes are documented but inconsistently followed. Basic checklists exist. Quality is checked reactively (after problems arise).',
      l3: 'Core processes are documented, standardized, and consistently followed. Quality gates exist at key steps. Cycle times are measured.',
      l4: 'Processes are data-driven and optimized. Continuous improvement is systematic. Automation removes manual steps. Process metrics drive decisions.',
      l5: 'Self-optimizing processes. Real-time process mining, predictive quality controls, zero-touch automation for routine work, industry benchmark leader.',
    },
  },
  'Systems & Technology Maturity': {
    name: 'Systems & Technology Maturity',
    short: 'Systems & Tech',
    description:
      'Measures the department\'s technology adoption, system integration, and data architecture. How effectively technology enables the department\'s mission.',
    what_it_measures:
      'Tool adoption rates, system integration level, data architecture quality, technical debt, and technology-enabled efficiency.',
    scoring_guide: {
      l1: 'Spreadsheet-driven. No purpose-built systems. Manual data entry and transfers. Siloed tools with no integration.',
      l2: 'Some purpose-built tools adopted but underutilized. Basic integrations exist. Data still requires manual reconciliation across systems.',
      l3: 'Core systems in place and actively used. Key integrations automated. Single source of truth for critical data. Regular system maintenance.',
      l4: 'Integrated technology ecosystem. APIs connecting all core systems. Real-time data flows. Mobile-enabled. Proactive system monitoring and optimization.',
      l5: 'Best-in-class tech stack. Full API-first architecture, real-time dashboards, predictive systems, technology enables competitive advantage.',
    },
  },
  'AI & Intelligent Automation': {
    name: 'AI & Intelligent Automation',
    short: 'AI & Automation',
    description:
      'Measures the department\'s adoption and effective use of AI, machine learning, and intelligent automation to augment decision-making and automate routine work.',
    what_it_measures:
      'AI tool adoption, automation coverage of routine tasks, decision support quality, and ROI on AI investments.',
    scoring_guide: {
      l1: 'No AI or automation. All decisions manual. No awareness of AI applicability to department functions.',
      l2: 'Exploring AI. Pilot projects or proof-of-concepts underway. Basic automation (rules-based) for some tasks. Team is AI-curious.',
      l3: 'AI tools deployed for specific use cases. Measurable time savings from automation. Team trained on AI tools. Decision support systems in use.',
      l4: 'AI integrated into core workflows. Predictive analytics inform planning. Significant automation of routine tasks. AI governance in place.',
      l5: 'AI-native operations. Autonomous decision-making for routine items. Generative AI augments all knowledge work. Continuous AI experimentation culture.',
    },
  },
  'Scalability & Growth Readiness': {
    name: 'Scalability & Growth Readiness',
    short: 'Scalability',
    description:
      'Measures whether the department can handle increased volume, complexity, or scope without proportional headcount growth. The ability to scale efficiently.',
    what_it_measures:
      'Capacity planning maturity, output-per-person trends, ability to absorb growth without linear cost increases, and flexible workforce models.',
    scoring_guide: {
      l1: 'Department cannot scale. Every volume increase requires proportional hiring. No capacity planning. Overwhelmed by current workload.',
      l2: 'Some scaling mechanisms exist (contractors, overtime). Growth requires significant manual intervention. Basic capacity awareness.',
      l3: 'Defined capacity model. Mix of permanent and flexible resources. Processes can absorb 20-30% volume increase. Growth planning happens quarterly.',
      l4: 'Elastic capacity. Automated scaling mechanisms. Can absorb 50%+ volume increase with minimal cost growth. Proactive demand forecasting.',
      l5: 'Scale-free operations. Technology handles volume increases. Department output grows faster than costs. Industry benchmark for efficiency.',
    },
  },
  'Data & Analytics Maturity': {
    name: 'Data & Analytics Maturity',
    short: 'Data & Analytics',
    description:
      'Measures the department\'s ability to collect, analyze, and act on data. Covers data quality, reporting capabilities, insight generation, and data-driven decision making.',
    what_it_measures:
      'Data quality and completeness, reporting cadence, analytical capabilities, insight-to-action speed, and data literacy of team members.',
    scoring_guide: {
      l1: 'No data strategy. Decisions based on gut feel. Reports are manual and infrequent. Data quality is unknown or poor.',
      l2: 'Basic reporting exists but is reactive. Some KPIs defined but not consistently tracked. Data quality issues known but unaddressed.',
      l3: 'Regular reporting cadence. Key metrics tracked and reviewed. Data quality managed. Basic analytics inform decisions. Dashboards exist.',
      l4: 'Advanced analytics in use. Predictive models inform planning. Real-time dashboards. High data literacy across team. Self-service analytics.',
      l5: 'Data-native culture. Prescriptive analytics, real-time decision support, ML-driven insights, industry-leading data practices. Data is a competitive asset.',
    },
  },
  'Innovation & Continuous Improvement': {
    name: 'Innovation & Continuous Improvement',
    short: 'Innovation',
    description:
      'Measures the department\'s culture and practice of experimentation, improvement velocity, and willingness to challenge the status quo.',
    what_it_measures:
      'Number of improvement initiatives, experimentation velocity, ideas-to-implementation rate, failure tolerance, and improvement impact.',
    scoring_guide: {
      l1: 'No improvement culture. "We\'ve always done it this way." No experimentation. Change is feared or resisted.',
      l2: 'Occasional improvements happen, usually driven by pain. No structured improvement process. Ideas are discussed but rarely implemented.',
      l3: 'Regular improvement cycles (retrospectives, reviews). Structured idea capture. Some experiments run quarterly. Improvement results are measured.',
      l4: 'Continuous improvement embedded in operations. Rapid experimentation culture. Failure is a learning opportunity. Innovation time allocated.',
      l5: 'Innovation leader. Department drives cross-functional innovation. Structured innovation pipeline. Measurable competitive advantage from improvements.',
    },
  },
  'Governance & Compliance': {
    name: 'Governance & Compliance',
    short: 'Governance',
    description:
      'Measures the department\'s risk management, regulatory adherence, audit readiness, and policy compliance. Especially critical in life sciences.',
    what_it_measures:
      'Policy adherence, audit readiness, risk identification and mitigation, regulatory compliance, and control effectiveness.',
    scoring_guide: {
      l1: 'No formal governance. Compliance is reactive (only when caught). Policies exist on paper but are not followed. Audit-ready: no.',
      l2: 'Basic compliance processes. Some policies enforced. Risk awareness exists but is informal. Audit findings are common.',
      l3: 'Governance framework defined. Regular compliance reviews. Risk register maintained. Audit-ready for most areas. Training conducted annually.',
      l4: 'Proactive governance. Automated compliance monitoring. Risk-based decision making. Minimal audit findings. Continuous training and certification.',
      l5: 'Governance excellence. Real-time compliance monitoring, predictive risk management, zero material audit findings, industry model for compliance.',
    },
  },
}

export function getDimensionDefinition(dimension: string): DimensionDefinition | undefined {
  return DIMENSION_DEFINITIONS[dimension]
}
