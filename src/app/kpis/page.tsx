'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIsAdmin, useCycles, useDepartments } from '@/lib/hooks'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface KpiScore {
  department_id: string
  cycle_id: string
  kpi_name: string
  kpi_value: number
  kpi_unit: string
  kpi_display: string
  benchmark_rating: 'low' | 'mid' | 'high'
  data_source: string
  notes: string | null
  measurable: boolean
  gap_system: string | null
  gap_description: string | null
}

// ---------------------------------------------------------------------------
// KPI Helper Functions
// ---------------------------------------------------------------------------
function getKpiDisplayColor(rating: 'low' | 'mid' | 'high'): string {
  switch (rating) {
    case 'low':
      return '#DC2626' // Red
    case 'mid':
      return '#F3CF4F' // Gold
    case 'high':
      return '#22C55E' // Green
    default:
      return '#94a3b8' // Gray
  }
}

function getKpiBadgeClasses(rating: 'low' | 'mid' | 'high'): string {
  switch (rating) {
    case 'low':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'mid':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'high':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function KpisPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin()
  const { departments, loading: deptsLoading } = useDepartments()
  const { cycles, activeCycle, setActiveCycle, loading: cyclesLoading } = useCycles()

  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [kpiScores, setKpiScores] = useState<KpiScore[]>([])
  const [loadingKpis, setLoadingKpis] = useState(true)

  // Initialize selected department
  useEffect(() => {
    if (!authLoading && !deptsLoading && departments.length > 0 && !selectedDeptId) {
      if (isAdmin) {
        setSelectedDeptId(departments[0].id) // Select first department for admin
      } else {
        // For non-admin, ideally filter by user's department, but task implies admin view
        // For now, if not admin, also pick first or keep empty if no department for user
        // This logic needs to align with how departments are displayed to non-admins
        setSelectedDeptId(departments[0].id); // Default to first for simplicity
      }
    }
  }, [isAdmin, authLoading, deptsLoading, departments, selectedDeptId])

  const currentCycleId = activeCycle?.id

  // Fetch KPI data
  useEffect(() => {
    const fetchKpiScores = async () => {
      if (!currentCycleId || !selectedDeptId) {
        setKpiScores([])
        setLoadingKpis(false)
        return
      }

      setLoadingKpis(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('dept_kpi_scores')
        .select('*')
        .eq('cycle_id', currentCycleId)
        .eq('department_id', selectedDeptId)

      if (error) {
        console.error('Error fetching KPI scores:', error)
        setKpiScores([])
      } else {
        setKpiScores(data || [])
      }
      setLoadingKpis(false)
    }

    fetchKpiScores()
  }, [currentCycleId, selectedDeptId])

  // Memoized KPI data for display
  const { scoredKpis, unmeasurableKpis, summary } = useMemo(() => {
    const scored = kpiScores.filter(kpi => kpi.measurable)
    const unmeasurable = kpiScores.filter(kpi => !kpi.measurable)

    const totalKpis = kpiScores.length
    const scoredCount = scored.length
    const gapCount = unmeasurable.length
    const coverage = totalKpis > 0 ? (scoredCount / totalKpis) * 100 : 0

    const groupedGaps: { [key: string]: KpiScore[] } = unmeasurable.reduce((acc, kpi) => {
      const system = kpi.gap_system || 'Unknown System'
      if (!acc[system]) acc[system] = []
      acc[system].push(kpi)
      return acc
    }, {} as { [key: string]: KpiScore[] })


    return {
      scoredKpis: scored,
      unmeasurableKpis: groupedGaps,
      summary: {
        totalKpis,
        scoredCount,
        gapCount,
        coverage: coverage.toFixed(1),
      },
    }
  }, [kpiScores])

  const isLoading = authLoading || deptsLoading || cyclesLoading || loadingKpis

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#10193C]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: '#64C4DD', borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-slate-400">Loading KPIs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#10193C] text-white p-4 lg:p-6">
      {/* Header and Selectors */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#64C4DD]">
            Department KPIs
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Overview of department Key Performance Indicators
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Department Selector */}
          {departments.length > 0 && (
            <Select
              value={selectedDeptId}
              onValueChange={(val) => setSelectedDeptId(val as string)}
            >
              <SelectTrigger className="w-[200px] border-slate-600 bg-[#0B1228] text-slate-200 hover:border-[#64C4DD]">
                <SelectValue>
                  {departments.find(d => d.id === selectedDeptId)?.name || 'Select Department'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-[#0B1228] text-slate-200">
                {departments.map((dept) => (
                  <SelectItem
                    key={dept.id}
                    value={dept.id}
                    className="text-slate-200 focus:bg-slate-700 focus:text-white"
                  >
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Cycle Selector */}
          {cycles.length > 0 && activeCycle && (
            <Select
              value={activeCycle.id}
              onValueChange={(id) => {
                const cycle = cycles.find((c) => c.id === id)
                if (cycle) setActiveCycle(cycle)
              }}
            >
              <SelectTrigger className="w-[200px] border-slate-600 bg-[#0B1228] text-slate-200 hover:border-[#64C4DD]">
                <SelectValue>
                  {activeCycle.name}{activeCycle.status === 'active' ? ' ●' : ''}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-[#0B1228] text-slate-200">
                {cycles.map((cycle) => (
                  <SelectItem
                    key={cycle.id}
                    value={cycle.id}
                    className="text-slate-200 focus:bg-slate-700 focus:text-white"
                  >
                    {cycle.name}
                    {cycle.status === 'active' ? ' ●' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-700/50 bg-[#0B1228] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total KPIs</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-slate-500"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F3CF4F]">{summary.totalKpis}</div>
            <p className="text-xs text-slate-500">Total KPIs tracked</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700/50 bg-[#0B1228] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Scored KPIs</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-slate-500"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#64C4DD]">{summary.scoredCount}</div>
            <p className="text-xs text-slate-500">KPIs with current scores</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700/50 bg-[#0B1228] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Data Gaps</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-slate-500"
            >
              <rect width="20" height="14" x="2" y="6" rx="2" />
              <path d="M22 10H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#DC2626]">{summary.gapCount}</div>
            <p className="text-xs text-slate-500">Unmeasurable KPIs</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700/50 bg-[#0B1228] text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Coverage</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-slate-500"
            >
              <path d="M5 12s2.5-4 7-4 7 4 7 4" />
              <path d="M12 8v10" />
              <path d="M12 18h.01" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#22C55E]">{summary.coverage}%</div>
            <p className="text-xs text-slate-500">KPIs with data available</p>
          </CardContent>
        </Card>
      </div>

      {/* Scored KPIs Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold tracking-tight text-[#F3CF4F] mb-4">Scored KPIs</h2>
        {scoredKpis.length === 0 ? (
          <p className="text-slate-400">No scored KPIs for this selection.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {scoredKpis.map((kpi) => (
              <Card key={kpi.kpi_name} className="border-slate-700/50 bg-[#0B1228] text-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-slate-100 mb-1">
                        {kpi.kpi_name}
                      </CardTitle>
                      <div
                        className="text-4xl font-extrabold mb-2"
                        style={{ color: getKpiDisplayColor(kpi.benchmark_rating) }}
                      >
                        {kpi.kpi_display}
                      </div>
                      <Badge className={getKpiBadgeClasses(kpi.benchmark_rating)}>
                        {kpi.benchmark_rating.charAt(0).toUpperCase() + kpi.benchmark_rating.slice(1)}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-2">Source: {kpi.data_source}</p>
                    </div>
                  </div>
                  {kpi.notes && (
                    <p className="text-sm text-slate-300 mt-4 p-2 border-t border-slate-700/50">
                      {kpi.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Data Gaps Section */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-red-400 mb-4">Data Gaps</h2>
        {Object.keys(unmeasurableKpis).length === 0 ? (
          <p className="text-slate-400">No data gaps for this selection. All KPIs are measurable!</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(unmeasurableKpis).map(([system, kpis]) => (
              <div key={system} className="rounded-lg border border-slate-700/50 bg-[#0B1228]">
                <div className="border-b border-slate-700/50 px-4 py-3">
                  <h3 className="text-lg font-semibold text-[#64C4DD]">{system}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/30">
                        <th className="px-4 py-2 text-left font-medium text-slate-400">KPI Name</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-400">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.map((kpi, index) => (
                        <tr key={index} className="border-b border-slate-800/40 last:border-b-0">
                          <td className="px-4 py-2.5 font-medium text-slate-200">{kpi.kpi_name}</td>
                          <td className="px-4 py-2.5 text-slate-300">
                            {kpi.gap_description || 'No description provided.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
