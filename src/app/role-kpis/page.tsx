'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RoleKpi {
  id: number
  person_name: string
  role_category: string
  role_title: string
  kpi_number: number
  kpi_name: string
  kpi_description: string
  measurement_source: string
  target_value: string
  weight_pct: number
}

const PILLARS = [
  {
    name: 'Revenue & Profitability',
    color: '#22C55E',
    keywords: ['utilization', 'gp', 'gross profit', 'revenue', 'pipeline', 'margin', 'billable', 'sales', 'forecast', 'budget', 'cost', 'financial', 'pricing', 'profitability', 'backlog'],
  },
  {
    name: 'Delivery Quality',
    color: '#64C4DD',
    keywords: ['client satisfaction', 'delivery', 'compliance', 'accuracy', 'quality', 'sla', 'nps', 'csat', 'on-time', 'defect', 'audit', 'regulatory', 'risk', 'escalation', 'standard'],
  },
  {
    name: 'Growth & Innovation',
    color: '#F3CF4F',
    keywords: ['practice', 'play', 'strategic', 'innovation', 'process improvement', 'maturity', 'capability', 'framework', 'thought leadership', 'methodology', 'automation', 'tool', 'offering', 'market'],
  },
  {
    name: 'People & Organization',
    color: '#A78BFA',
    keywords: ['team', 'retention', 'engagement', 'talent', 'hire', 'hiring', 'mentor', 'coaching', 'development', 'training', 'culture', 'onboarding', 'succession', 'performance review', 'feedback', 'morale', 'attrition'],
  },
]

function classifyPillar(kpiName: string, kpiDesc: string): string {
  const text = `${kpiName} ${kpiDesc}`.toLowerCase()
  for (const pillar of PILLARS) {
    if (pillar.keywords.some(kw => text.includes(kw))) return pillar.name
  }
  return 'Revenue & Profitability'
}

export default function RoleKpisPage() {
  const [kpis, setKpis] = useState<RoleKpi[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('mosaic_role_kpis_2025')
        .select('*')
        .order('role_category')
        .order('person_name')
        .order('kpi_number')
      if (!error && data) setKpis(data)
      setLoading(false)
    }
    load()
  }, [])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(kpis.map(k => k.role_category))).sort()
    return ['All', ...cats]
  }, [kpis])

  const filtered = useMemo(() => {
    return kpis.filter(k => {
      if (selectedCategory !== 'All' && k.role_category !== selectedCategory) return false
      if (search && !k.person_name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [kpis, selectedCategory, search])

  const grouped = useMemo(() => {
    const map: Record<string, RoleKpi[]> = {}
    for (const k of filtered) {
      if (!map[k.role_category]) map[k.role_category] = []
      map[k.role_category].push(k)
    }
    return map
  }, [filtered])

  const pillarCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of PILLARS) counts[p.name] = 0
    for (const k of filtered) {
      const pillar = classifyPillar(k.kpi_name, k.kpi_description)
      counts[pillar] = (counts[pillar] || 0) + 1
    }
    return counts
  }, [filtered])

  const toggleCategory = (cat: string) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  // Group KPIs by person within a category
  const groupByPerson = (items: RoleKpi[]) => {
    const map: Record<string, RoleKpi[]> = {}
    for (const k of items) {
      const key = k.person_name
      if (!map[key]) map[key] = []
      map[key].push(k)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a101e] flex items-center justify-center">
        <div className="text-[#64C4DD] text-lg animate-pulse">Loading Role KPIs...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a101e] text-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Role-Specific KPIs</h1>
        <p className="text-gray-400 mt-1">2025 KPI framework by role category and pillar</p>
      </div>

      {/* Info Block */}
      <div className="mb-6 rounded-lg border border-[#64C4DD]/30 bg-[#0B1228]">
        <button
          onClick={() => setInfoOpen(!infoOpen)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-[#64C4DD]">ℹ</span>
            <span className="text-sm font-medium text-[#64C4DD]">About Role-Specific KPIs</span>
          </div>
          <span className="text-gray-400 text-sm">{infoOpen ? '▲' : '▼'}</span>
        </button>
        {infoOpen && (
          <div className="px-4 pb-4 text-sm text-gray-300 space-y-3 border-t border-[#64C4DD]/10 pt-3">
            <p>
              <strong className="text-white">What are Role-Specific KPIs?</strong> These are measurable performance indicators
              tailored to each role category at USDM. Unlike department-level KPIs that measure team or organizational outcomes,
              role-specific KPIs define what success looks like for an individual in a given role.
            </p>
            <p>
              <strong className="text-white">How do they differ from Department KPIs?</strong> Department KPIs measure collective
              outcomes (e.g., department utilization, overall client satisfaction). Role-specific KPIs measure individual contribution
              aligned to their job description — what each person is directly accountable for.
            </p>
            <p>
              <strong className="text-white">The 4-Pillar Framework:</strong> All KPIs map to one of four strategic pillars:
            </p>
            <ul className="list-none space-y-1 ml-2">
              {PILLARS.map(p => (
                <li key={p.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span style={{ color: p.color }} className="font-medium">{p.name}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-400 text-xs mt-2">
              Built from job description analysis with Joe Morgan, VP People.
            </p>
          </div>
        )}
      </div>

      {/* Pillar Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {PILLARS.map(pillar => (
          <div
            key={pillar.name}
            className="rounded-lg border bg-[#0B1228] p-4"
            style={{ borderColor: `${pillar.color}30` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pillar.color }} />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{pillar.name}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: pillar.color }}>
              {pillarCounts[pillar.name] || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">KPIs mapped</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by person name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#64C4DD] w-full sm:w-72"
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#64C4DD]"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'All' ? 'All Role Categories' : cat}</option>
          ))}
        </select>
        <div className="text-sm text-gray-500 flex items-center ml-auto">
          {filtered.length} KPIs across {Object.keys(grouped).length} categories
        </div>
      </div>

      {/* Grouped KPI Table */}
      <div className="space-y-4">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
          <div key={category} className="rounded-lg border border-slate-700/50 bg-[#0B1228] overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-5 py-3 bg-[#0B1228] hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{collapsed[category] ? '▶' : '▼'}</span>
                <span className="text-base font-semibold text-[#64C4DD]">{category}</span>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  {groupByPerson(items).length} people · {items.length} KPIs
                </span>
              </div>
            </button>

            {/* People and KPIs */}
            {!collapsed[category] && (
              <div className="border-t border-slate-700/30">
                {groupByPerson(items).map(([personName, personKpis]) => (
                  <div key={personName} className="border-b border-slate-800/40 last:border-b-0">
                    {/* Person Header */}
                    <div className="px-5 py-3 bg-[#0a101e]/50 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <span className="font-medium text-white">{personName}</span>
                      <span className="text-xs text-gray-400">{personKpis[0].role_title}</span>
                    </div>
                    {/* KPI Table */}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 uppercase border-b border-slate-800/30">
                          <th className="px-5 py-2 text-left w-8">#</th>
                          <th className="px-3 py-2 text-left">KPI</th>
                          <th className="px-3 py-2 text-left hidden lg:table-cell">Description</th>
                          <th className="px-3 py-2 text-left hidden md:table-cell">Measurement Source</th>
                          <th className="px-3 py-2 text-left hidden md:table-cell">Target</th>
                          <th className="px-3 py-2 text-right w-16">Weight</th>
                          <th className="px-3 py-2 text-left w-20">Pillar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {personKpis.map(kpi => {
                          const pillar = classifyPillar(kpi.kpi_name, kpi.kpi_description)
                          const pillarDef = PILLARS.find(p => p.name === pillar)
                          return (
                            <tr key={kpi.id} className="border-b border-slate-800/20 hover:bg-white/[0.02]">
                              <td className="px-5 py-2 text-gray-500">{kpi.kpi_number}</td>
                              <td className="px-3 py-2 text-gray-200 font-medium">{kpi.kpi_name}</td>
                              <td className="px-3 py-2 text-gray-400 hidden lg:table-cell">{kpi.kpi_description}</td>
                              <td className="px-3 py-2 text-gray-400 hidden md:table-cell">{kpi.measurement_source}</td>
                              <td className="px-3 py-2 text-gray-400 hidden md:table-cell">{kpi.target_value}</td>
                              <td className="px-3 py-2 text-right text-gray-300">{kpi.weight_pct}%</td>
                              <td className="px-3 py-2">
                                <span
                                  className="inline-block w-2 h-2 rounded-full"
                                  style={{ backgroundColor: pillarDef?.color }}
                                  title={pillar}
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-gray-500 py-12">No KPIs match your filters.</div>
      )}
    </div>
  )
}
