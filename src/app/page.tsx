'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIsAdmin, useCycles, useDepartments } from '@/lib/hooks'
import {
  getScoreColor,
  getScoreLabel,
  getScoreBg,
  DIMENSIONS,
  DIMENSION_SHORT,
  REVENUE_WEIGHTS,
} from '@/lib/types'
import type { DimensionScore, OKR, Department, AssessmentCycle } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ScoreMap {
  [departmentId: string]: {
    [dimension: string]: DimensionScore
  }
}

interface PrevScoreMap {
  [departmentId: string]: {
    [dimension: string]: number
  }
}

interface PriorityItem {
  department: Department
  dimension: string
  gap: number
  weightedGap: number
  score: number
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-300/30 ${className ?? ''}`}
    />
  )
}

function DashboardSkeleton({ dark }: { dark: boolean }) {
  const bg = dark ? 'bg-[#10193C]' : 'bg-white'
  const bar = dark ? 'bg-slate-700' : 'bg-gray-200'
  return (
    <div className={`min-h-screen ${bg} p-6`}>
      <div className="mb-8 flex items-center gap-4">
        <Skeleton className={`h-8 w-64 ${bar}`} />
        <Skeleton className={`h-6 w-32 ${bar}`} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className={`h-16 w-full ${bar}`} />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className={`h-12 w-full ${bar}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Trend arrow helper
// ---------------------------------------------------------------------------
function trendArrow(current: number, previous: number | undefined) {
  if (previous === undefined) return <span className="text-slate-500 text-xs">--</span>
  const diff = current - previous
  if (diff > 0.2) return <span className="text-emerald-400 font-bold">&#8593;</span>
  if (diff < -0.2) return <span className="text-red-400 font-bold">&#8595;</span>
  return <span className="text-slate-400">&rarr;</span>
}

// ---------------------------------------------------------------------------
// Admin Dashboard (Bloomberg terminal)
// ---------------------------------------------------------------------------
function AdminDashboard({
  departments,
  scores,
  prevScores,
  activeCycle,
  cycles,
}: {
  departments: Department[]
  scores: ScoreMap
  prevScores: PrevScoreMap
  activeCycle: AssessmentCycle
  cycles: AssessmentCycle[]
}) {
  // Priority ranker: top 5 improvement opportunities
  const priorities = useMemo<PriorityItem[]>(() => {
    const items: PriorityItem[] = []
    departments.forEach((dept) => {
      DIMENSIONS.forEach((dim) => {
        const s = scores[dept.id]?.[dim]?.score ?? 0
        if (s === 0) return
        const gap = 5.0 - s
        const weight = REVENUE_WEIGHTS[dim] ?? 1
        items.push({
          department: dept,
          dimension: dim,
          gap,
          weightedGap: gap * weight,
          score: s,
        })
      })
    })
    items.sort((a, b) => b.weightedGap - a.weightedGap)
    return items.slice(0, 5)
  }, [departments, scores])

  // Regression alerts
  const regressions = useMemo(() => {
    const alerts: { department: Department; dimension: string; current: number; previous: number }[] = []
    departments.forEach((dept) => {
      DIMENSIONS.forEach((dim) => {
        const curr = scores[dept.id]?.[dim]?.score
        const prev = prevScores[dept.id]?.[dim]
        if (curr !== undefined && prev !== undefined && curr < prev) {
          alerts.push({ department: dept, dimension: dim, current: curr, previous: prev })
        }
      })
    })
    alerts.sort((a, b) => (b.previous - b.current) - (a.previous - a.current))
    return alerts
  }, [departments, scores, prevScores])

  // Compute portfolio-level averages per dimension
  const portfolioAvg = useMemo(() => {
    return DIMENSIONS.map((dim) => {
      let total = 0
      let count = 0
      departments.forEach((dept) => {
        const s = scores[dept.id]?.[dim]?.score
        if (s !== undefined) { total += s; count++ }
      })
      return { dimension: DIMENSION_SHORT[dim], score: count > 0 ? total / count : 0 }
    })
  }, [departments, scores])

  return (
    <div className="min-h-screen bg-[#10193C] text-white p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#64C4DD]">
            USDM Portfolio Command Center
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {activeCycle.name} &middot; {activeCycle.status.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#DC2626' }} /> L1-2
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#F3CF4F' }} /> L3
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#22C55E' }} /> L4
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#64C4DD' }} /> L5
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Heatmap */}
        <div className="xl:col-span-3 overflow-x-auto">
          <div className="rounded-lg border border-slate-700/50 bg-[#0B1228]">
            <div className="border-b border-slate-700/50 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-wider text-[#F3CF4F] uppercase">
                Portfolio Heatmap
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/30">
                    <th className="sticky left-0 z-10 bg-[#0B1228] px-4 py-3 text-left font-medium text-slate-400 min-w-[180px]">
                      Department
                    </th>
                    {DIMENSIONS.map((dim) => (
                      <th
                        key={dim}
                        className="px-2 py-3 text-center font-medium text-slate-400 min-w-[90px]"
                      >
                        {DIMENSION_SHORT[dim]}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center font-medium text-[#F3CF4F] min-w-[60px]">
                      AVG
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => {
                    const deptScores = scores[dept.id] ?? {}
                    const scoreValues = DIMENSIONS.map((d) => deptScores[d]?.score).filter(
                      (v): v is number => v !== undefined
                    )
                    const avg = scoreValues.length > 0 ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : 0
                    return (
                      <tr
                        key={dept.id}
                        className="border-b border-slate-800/40 transition-colors hover:bg-slate-800/30"
                      >
                        <td className="sticky left-0 z-10 bg-[#0B1228] px-4 py-2.5 font-medium text-slate-200 whitespace-nowrap">
                          {dept.name}
                        </td>
                        {DIMENSIONS.map((dim) => {
                          const s = deptScores[dim]?.score
                          const prev = prevScores[dept.id]?.[dim]
                          return (
                            <td key={dim} className="px-1 py-1.5 text-center">
                              {s !== undefined ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div
                                    className="flex h-8 w-16 items-center justify-center rounded font-mono text-sm font-bold"
                                    style={{
                                      backgroundColor: getScoreColor(s) + '20',
                                      color: getScoreColor(s),
                                      border: `1px solid ${getScoreColor(s)}40`,
                                    }}
                                  >
                                    {s.toFixed(1)}
                                  </div>
                                  <div className="text-[10px]">{trendArrow(s, prev)}</div>
                                </div>
                              ) : (
                                <span className="text-slate-600">--</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className="font-mono text-sm font-bold"
                            style={{ color: avg > 0 ? getScoreColor(avg) : '#475569' }}
                          >
                            {avg > 0 ? avg.toFixed(1) : '--'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {/* Portfolio average row */}
                  <tr className="border-t-2 border-[#F3CF4F]/30 bg-[#0B1228]">
                    <td className="sticky left-0 z-10 bg-[#0B1228] px-4 py-3 text-xs font-bold tracking-wider text-[#F3CF4F] uppercase">
                      Portfolio Avg
                    </td>
                    {portfolioAvg.map((item) => (
                      <td key={item.dimension} className="px-1 py-2 text-center">
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: item.score > 0 ? getScoreColor(item.score) : '#475569' }}
                        >
                          {item.score > 0 ? item.score.toFixed(1) : '--'}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      <span className="font-mono text-sm font-bold text-[#F3CF4F]">
                        {portfolioAvg.length > 0
                          ? (
                              portfolioAvg.reduce((a, b) => a + b.score, 0) /
                              portfolioAvg.filter((p) => p.score > 0).length || 0
                            ).toFixed(1)
                          : '--'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Priority Ranker */}
          <div className="rounded-lg border border-slate-700/50 bg-[#0B1228]">
            <div className="border-b border-slate-700/50 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-wider text-[#F3CF4F] uppercase">
                Priority Ranker
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-500">Top 5 by weighted gap-to-target</p>
            </div>
            <div className="divide-y divide-slate-800/50">
              {priorities.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-slate-500">No data available</div>
              )}
              {priorities.map((p, i) => (
                <div key={`${p.department.id}-${p.dimension}`} className="px-4 py-3 transition-colors hover:bg-slate-800/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F3CF4F]/20 text-[10px] font-bold text-[#F3CF4F]">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-slate-200">{p.department.name}</p>
                        <p className="text-[10px] text-slate-400">{DIMENSION_SHORT[p.dimension as keyof typeof DIMENSION_SHORT]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold" style={{ color: getScoreColor(p.score) }}>
                        {p.score.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        gap {p.weightedGap.toFixed(1)}w
                      </p>
                    </div>
                  </div>
                  {/* Gap bar */}
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(p.score / 5) * 100}%`,
                        backgroundColor: getScoreColor(p.score),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regression Alerts */}
          <div className="rounded-lg border border-slate-700/50 bg-[#0B1228]">
            <div className="border-b border-slate-700/50 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-wider text-red-400 uppercase">
                Regression Alerts
              </h2>
            </div>
            <div className="divide-y divide-slate-800/50">
              {regressions.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-slate-500">
                  No regressions detected
                </div>
              )}
              {regressions.slice(0, 8).map((r) => (
                <div
                  key={`${r.department.id}-${r.dimension}`}
                  className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-slate-800/20"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-200">{r.department.name}</p>
                    <p className="text-[10px] text-slate-400">{DIMENSION_SHORT[r.dimension as keyof typeof DIMENSION_SHORT]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-red-600/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-400 border border-red-600/30">
                      {r.previous.toFixed(1)} &rarr; {r.current.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio radar */}
          <div className="rounded-lg border border-slate-700/50 bg-[#0B1228]">
            <div className="border-b border-slate-700/50 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-wider text-[#64C4DD] uppercase">
                Portfolio Radar
              </h2>
            </div>
            <div className="p-2">
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={portfolioAvg} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 5]}
                    tick={{ fill: '#475569', fontSize: 8 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#64C4DD"
                    fill="#64C4DD"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Department Leader Dashboard (light theme)
// ---------------------------------------------------------------------------
function LeaderDashboard({
  department,
  scores,
  prevScores,
  okrs,
  activeCycle,
  cycles,
  allScoresByCycle,
}: {
  department: Department
  scores: ScoreMap
  prevScores: PrevScoreMap
  okrs: OKR[]
  activeCycle: AssessmentCycle
  cycles: AssessmentCycle[]
  allScoresByCycle: { [cycleId: string]: { [dimension: string]: number } }
}) {
  const deptScores = scores[department.id] ?? {}

  // Radar chart data
  const radarData = DIMENSIONS.map((dim) => ({
    dimension: DIMENSION_SHORT[dim],
    score: deptScores[dim]?.score ?? 0,
    fullMark: 5,
  }))

  // Trend line chart data: scores over cycles
  const trendData = useMemo(() => {
    return cycles
      .slice()
      .reverse()
      .map((cycle) => {
        const cycleScores = allScoresByCycle[cycle.id] ?? {}
        const vals = DIMENSIONS.map((d) => cycleScores[d]).filter(
          (v): v is number => v !== undefined
        )
        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
        return {
          name: `Q${cycle.quarter} ${cycle.year}`,
          average: Number(avg.toFixed(2)),
          ...DIMENSIONS.reduce(
            (acc, dim) => {
              acc[DIMENSION_SHORT[dim]] = cycleScores[dim] ?? 0
              return acc
            },
            {} as Record<string, number>
          ),
        }
      })
  }, [cycles, allScoresByCycle])

  const deptOkrs = okrs.filter((o) => o.department_id === department.id && o.cycle_id === activeCycle.id)

  // Overall average score
  const dimScoreValues = DIMENSIONS.map((d) => deptScores[d]?.score).filter(
    (v): v is number => v !== undefined
  )
  const overallAvg =
    dimScoreValues.length > 0
      ? dimScoreValues.reduce((a, b) => a + b, 0) / dimScoreValues.length
      : 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#10193C]">{department.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {activeCycle.name} &middot; {getScoreLabel(overallAvg)} ({overallAvg.toFixed(1)}/5.0)
        </p>
      </div>

      {/* Score cards summary */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DIMENSIONS.map((dim) => {
          const s = deptScores[dim]?.score
          const prev = prevScores[department.id]?.[dim]
          return (
            <Card key={dim} className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500">
                  {DIMENSION_SHORT[dim]}
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: s !== undefined ? getScoreColor(s) : '#94a3b8' }}
                  >
                    {s !== undefined ? s.toFixed(1) : '--'}
                  </span>
                  {s !== undefined && <span className="text-sm">{trendArrow(s, prev)}</span>}
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  {s !== undefined ? getScoreLabel(s) : 'Not assessed'}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-[#10193C]">Maturity Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#475569', fontSize: 11 }}
                />
                <PolarRadiusAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#10193C"
                  fill="#64C4DD"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trend Line Chart */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-[#10193C]">Quarter-over-Quarter Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData}>
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  name="Overall Average"
                  stroke="#10193C"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10193C' }}
                />
                {DIMENSIONS.map((dim, i) => {
                  const colors = ['#DC2626', '#F3CF4F', '#22C55E', '#64C4DD', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4']
                  return (
                    <Line
                      key={dim}
                      type="monotone"
                      dataKey={DIMENSION_SHORT[dim]}
                      name={DIMENSION_SHORT[dim]}
                      stroke={colors[i]}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={false}
                      hide
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* OKRs */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#10193C]">Current OKRs</h2>
          <a href="/check-in">
            <Button className="bg-[#10193C] text-white hover:bg-[#1a2a5c]">
              Submit Check-in
            </Button>
          </a>
        </div>

        {deptOkrs.length === 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="py-10 text-center text-sm text-slate-400">
              No OKRs defined for this cycle yet.
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {deptOkrs.map((okr) => {
            const krs = okr.key_results ?? []
            const completedKRs = krs.filter((kr) => kr.status === 'achieved').length
            const totalProgress =
              krs.length > 0
                ? krs.reduce((sum, kr) => {
                    if (kr.target_value === null || kr.target_value === 0) return sum
                    return sum + Math.min((kr.current_value / kr.target_value) * 100, 100)
                  }, 0) / krs.length
                : 0

            const statusColors: Record<string, string> = {
              on_track: 'bg-green-100 text-green-700 border-green-200',
              at_risk: 'bg-yellow-100 text-yellow-700 border-yellow-200',
              behind: 'bg-red-100 text-red-700 border-red-200',
              achieved: 'bg-blue-100 text-blue-700 border-blue-200',
              cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
            }

            return (
              <Card key={okr.id} className="border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#10193C]">{okr.objective}</h3>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[okr.status] ?? statusColors.cancelled}`}
                        >
                          {okr.status.replace('_', ' ')}
                        </span>
                      </div>
                      {okr.owner_name && (
                        <p className="mt-0.5 text-xs text-slate-400">Owner: {okr.owner_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#10193C]">{Math.round(totalProgress)}%</p>
                      <p className="text-[10px] text-slate-400">
                        {completedKRs}/{krs.length} KRs done
                      </p>
                    </div>
                  </div>

                  {/* Overall progress bar */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(totalProgress, 100)}%`,
                        backgroundColor:
                          totalProgress >= 100
                            ? '#64C4DD'
                            : totalProgress >= 70
                              ? '#22C55E'
                              : totalProgress >= 40
                                ? '#F3CF4F'
                                : '#DC2626',
                      }}
                    />
                  </div>

                  {/* Key Results */}
                  {krs.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {krs.map((kr) => {
                        const krProgress =
                          kr.target_value !== null && kr.target_value > 0
                            ? Math.min((kr.current_value / kr.target_value) * 100, 100)
                            : 0
                        return (
                          <div key={kr.id} className="rounded-lg bg-slate-50 p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-slate-700">{kr.description}</p>
                              <span className="ml-2 whitespace-nowrap text-xs font-medium text-slate-500">
                                {kr.current_value}
                                {kr.unit ? ` ${kr.unit}` : ''} / {kr.target_value ?? '?'}
                                {kr.unit ? ` ${kr.unit}` : ''}
                              </span>
                            </div>
                            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${krProgress}%`,
                                  backgroundColor:
                                    kr.status === 'achieved'
                                      ? '#64C4DD'
                                      : kr.status === 'on_track'
                                        ? '#22C55E'
                                        : kr.status === 'at_risk'
                                          ? '#F3CF4F'
                                          : '#DC2626',
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { isAdmin, loading: authLoading, user } = useIsAdmin()
  const { departments, loading: deptsLoading } = useDepartments()
  const { cycles, activeCycle, loading: cyclesLoading } = useCycles()

  const [scores, setScores] = useState<DimensionScore[]>([])
  const [prevCycleScores, setPrevCycleScores] = useState<DimensionScore[]>([])
  const [okrs, setOkrs] = useState<OKR[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Determine previous cycle
  const prevCycle = useMemo(() => {
    if (!activeCycle || cycles.length < 2) return null
    const idx = cycles.findIndex((c) => c.id === activeCycle.id)
    return idx >= 0 && idx < cycles.length - 1 ? cycles[idx + 1] : null
  }, [cycles, activeCycle])

  // Fetch data when active cycle is available
  useEffect(() => {
    if (!activeCycle) return
    const supabase = createClient()

    const fetchAll = async () => {
      setDataLoading(true)

      const [scoresRes, okrsRes, prevRes] = await Promise.all([
        supabase.from('dept_dimension_scores').select('*').eq('cycle_id', activeCycle.id),
        supabase
          .from('dept_okrs')
          .select('*, key_results:dept_key_results(*)')
          .eq('cycle_id', activeCycle.id),
        prevCycle
          ? supabase.from('dept_dimension_scores').select('*').eq('cycle_id', prevCycle.id)
          : Promise.resolve({ data: [] as DimensionScore[], error: null }),
      ])

      if (scoresRes.data) setScores(scoresRes.data)
      if (okrsRes.data) setOkrs(okrsRes.data as OKR[])
      if (prevRes.data) setPrevCycleScores(prevRes.data as DimensionScore[])

      setDataLoading(false)
    }

    fetchAll()
  }, [activeCycle, prevCycle])

  // Build score maps
  const scoreMap = useMemo<ScoreMap>(() => {
    const map: ScoreMap = {}
    scores.forEach((s) => {
      if (!map[s.department_id]) map[s.department_id] = {}
      // If multiple assessors, prefer 'executive' over 'self'
      const existing = map[s.department_id][s.dimension]
      if (!existing || (s.assessor === 'executive' && existing.assessor !== 'executive')) {
        map[s.department_id][s.dimension] = s
      }
    })
    return map
  }, [scores])

  const prevScoreMap = useMemo<PrevScoreMap>(() => {
    const map: PrevScoreMap = {}
    prevCycleScores.forEach((s) => {
      if (!map[s.department_id]) map[s.department_id] = {}
      const existing = map[s.department_id][s.dimension]
      if (existing === undefined || s.assessor === 'executive') {
        map[s.department_id][s.dimension] = s.score
      }
    })
    return map
  }, [prevCycleScores])

  // All scores by cycle for trend chart (leader view)
  const [allScores, setAllScores] = useState<DimensionScore[]>([])

  useEffect(() => {
    if (isAdmin || !user) return
    const supabase = createClient()
    supabase.from('dept_dimension_scores').select('*').then(({ data }) => {
      if (data) setAllScores(data)
    })
  }, [isAdmin, user])

  const allScoresByCycle = useMemo(() => {
    const userDept = departments.find(
      (d) => d.leader_email === user?.email || d.leader_user_id === user?.id
    )
    if (!userDept) return {}

    const map: { [cycleId: string]: { [dimension: string]: number } } = {}
    allScores
      .filter((s) => s.department_id === userDept.id)
      .forEach((s) => {
        if (!map[s.cycle_id]) map[s.cycle_id] = {}
        const existing = map[s.cycle_id][s.dimension]
        if (existing === undefined || s.assessor === 'executive') {
          map[s.cycle_id][s.dimension] = s.score
        }
      })
    return map
  }, [allScores, departments, user])

  // Loading
  const loading = authLoading || deptsLoading || cyclesLoading || dataLoading

  if (loading) {
    return <DashboardSkeleton dark={isAdmin} />
  }

  if (!activeCycle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-700">No Active Cycle</h2>
          <p className="mt-2 text-sm text-slate-400">
            There are no assessment cycles configured yet.
          </p>
        </div>
      </div>
    )
  }

  // Admin view
  if (isAdmin) {
    return (
      <AdminDashboard
        departments={departments}
        scores={scoreMap}
        prevScores={prevScoreMap}
        activeCycle={activeCycle}
        cycles={cycles}
      />
    )
  }

  // Leader view: find their department
  const userDept = departments.find(
    (d) => d.leader_email === user?.email || d.leader_user_id === user?.id
  )

  if (!userDept) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-700">Welcome</h2>
          <p className="mt-2 text-sm text-slate-400">
            You are not assigned as a department leader. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <LeaderDashboard
      department={userDept}
      scores={scoreMap}
      prevScores={prevScoreMap}
      okrs={okrs}
      activeCycle={activeCycle}
      cycles={cycles}
      allScoresByCycle={allScoresByCycle}
    />
  )
}
