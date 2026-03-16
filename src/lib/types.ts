export interface Department {
  id: string
  name: string
  department_type: string
  leader_name: string | null
  leader_email: string | null
  leader_user_id: string | null
  created_at: string
  updated_at: string
}

export interface AssessmentCycle {
  id: string
  name: string
  quarter: number
  year: number
  status: 'draft' | 'active' | 'closed'
  starts_at: string
  ends_at: string
  created_at: string
}

export interface DimensionScore {
  id: string
  department_id: string
  cycle_id: string
  dimension: string
  score: number
  evidence: string | null
  assessor: 'self' | 'executive'
  comments: string | null
  created_at: string
  updated_at: string
}

export interface OKR {
  id: string
  department_id: string
  cycle_id: string
  objective: string
  owner_name: string | null
  priority: number
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved' | 'cancelled'
  linked_dimension: string | null
  revenue_impact: 'direct' | 'indirect' | 'operational' | null
  created_at: string
  updated_at: string
  key_results?: KeyResult[]
}

export interface KeyResult {
  id: string
  okr_id: string
  description: string
  metric_type: 'percentage' | 'number' | 'currency' | 'boolean' | 'milestone'
  target_value: number | null
  current_value: number
  unit: string | null
  status: 'not_started' | 'on_track' | 'at_risk' | 'behind' | 'achieved'
  owner_name: string | null
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: string
  key_result_id: string
  value: number
  notes: string | null
  confidence: 'high' | 'medium' | 'low' | null
  blockers: string | null
  submitted_by: string | null
  submitted_at: string
}

export const DIMENSIONS = [
  'HR & People Maturity',
  'Process Maturity',
  'Systems & Technology Maturity',
  'AI & Intelligent Automation',
  'Scalability & Growth Readiness',
  'Data & Analytics Maturity',
  'Innovation & Continuous Improvement',
  'Governance & Compliance',
] as const

export type Dimension = typeof DIMENSIONS[number]

export const DIMENSION_SHORT = {
  'HR & People Maturity': 'HR & People',
  'Process Maturity': 'Process',
  'Systems & Technology Maturity': 'Systems & Tech',
  'AI & Intelligent Automation': 'AI & Automation',
  'Scalability & Growth Readiness': 'Scalability',
  'Data & Analytics Maturity': 'Data & Analytics',
  'Innovation & Continuous Improvement': 'Innovation',
  'Governance & Compliance': 'Governance',
} as const

export function getScoreColor(score: number): string {
  if (score <= 2) return '#DC2626'  // Red
  if (score <= 3) return '#F3CF4F'  // Amber
  if (score <= 4) return '#22C55E'  // Green
  return '#64C4DD'                   // Blue
}

export function getScoreLabel(score: number): string {
  if (score <= 1) return 'Ad Hoc'
  if (score <= 2) return 'Developing'
  if (score <= 3) return 'Defined'
  if (score <= 4) return 'Managed'
  return 'Optimizing'
}

export function getScoreBg(score: number): string {
  if (score <= 2) return 'bg-red-600'
  if (score <= 3) return 'bg-yellow-500'
  if (score <= 4) return 'bg-green-500'
  return 'bg-cyan-500'
}

export const REVENUE_WEIGHTS: Record<string, number> = {
  'Process Maturity': 3,
  'Scalability & Growth Readiness': 3,
  'Systems & Technology Maturity': 2,
  'AI & Intelligent Automation': 2,
  'Data & Analytics Maturity': 2,
  'HR & People Maturity': 1,
  'Governance & Compliance': 1,
  'Innovation & Continuous Improvement': 1,
}
