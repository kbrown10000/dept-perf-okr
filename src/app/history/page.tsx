'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIsAdmin, useCycles, useDepartments } from '@/lib/hooks'
import type {
  OKR,
  KeyResult,
  DimensionScore,
  AssessmentCycle,
} from '@/lib/types'
import {
  DIMENSIONS,
  DIMENSION_SHORT,
  getScoreColor,
} from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

// 8 visually distinct line colors for dimensions
const DIMENSION_COLORS = [
  '#64C4DD',
  '#F3CF4F',
  '#22C55E',
  '#DC2626',
  '#A855F7',
  '#F97316',
  '#EC4899',
  '#06B6D4',
]

interface ScoreWithCycle extends DimensionScore {
  cycle?: AssessmentCycle
}

interface OKRWithKRs extends OKR {
  key_results?: KeyResult[]
}

export default function HistoryPage() {
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const { cycles, loading: cyclesLoading } = useCycles()
  const { departments, loading: deptsLoading } = useDepartments()

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [allScores, setAllScores] = useState<ScoreWithCycle[]>([])
  const [allOkrs, setAllOkrs] = useState<OKRWithKRs[]>([])
  const [loading, setLoading] = useState(true)

  // Comparison state
  const [compareA, setCompareA] = useState<string | null>(null)
  const [compareB, setCompareB] = useState<string | null>(null)

  // Set initial department
  useEffect(() => {
    if (deptsLoading || adminLoading) return
    if (!isAdmin && departments.length > 0) {
      // Non-admin: attempt to find their dept (handled below)
    }
    if (departments.length > 0 && !selectedDeptId) {
      setSelectedDeptId(departments[0].id)
    }
  }, [departments, deptsLoading, adminLoading, isAdmin, selectedDeptId])

  // Auto-select comparison quarters
  useEffect(() => {
    if (cycles.length >= 2 && !compareA && !compareB) {
      setCompareA(cycles[1]?.id || null)
      setCompareB(cycles[0]?.id || null)
    } else if (cycles.length === 1 && !compareA) {
      setCompareA(cycles[0].id)
    }
  }, [cycles, compareA, compareB])

  // Fetch data
  useEffect(() => {
    if (!selectedDeptId && !isAdmin) return
    setLoading(true)
    const supabase = createClient()

    const fetchScores = async () => {
      let query = supabase
        .from('dept_dimension_scores')
        .select('*, cycle:dept_assessment_cycles(*)')

      if (!isAdmin && selectedDeptId) {
        query = query.eq('department_id', selectedDeptId)
      }

      const { data } = await query
      setAllScores((data as ScoreWithCycle[]) || [])
    }

    const fetchOkrs = async () => {
      let query = supabase
        .from('dept_okrs')
        .select('*, key_results:dept_key_results(*)')

      if (!isAdmin && selectedDeptId) {
        query = query.eq('department_id', selectedDeptId)
      }

      const { data } = await query
      setAllOkrs((data as OKRWithKRs[]) || [])
    }

    Promise.all([fetchScores(), fetchOkrs()]).then(() => setLoading(false))
  }, [selectedDeptId, isAdmin])

  // Filter scores by selected dept for admin
  const filteredScores = useMemo(() => {
    if (!isAdmin || !selectedDeptId) return allScores
    return allScores.filter((s) => s.department_id === selectedDeptId)
  }, [allScores, selectedDeptId, isAdmin])

  const filteredOkrs = useMemo(() => {
    if (!isAdmin || !selectedDeptId) return allOkrs
    return allOkrs.filter((o) => o.department_id === selectedDeptId)
  }, [allOkrs, selectedDeptId, isAdmin])

  // Build dimension trend data for line chart
  const dimensionTrendData = useMemo(() => {
    const cycleMap = new Map(cycles.map((c) => [c.id, c]))
    const byCycle: Record<string, Record<string, number>> = {}

    filteredScores.forEach((score) => {
      const cycle = cycleMap.get(score.cycle_id)
      if (!cycle) return
      const label = `Q${cycle.quarter} ${cycle.year}`
      if (!byCycle[label]) byCycle[label] = {}
      byCycle[label][score.dimension] = score.score
    })

    // Sort by year/quarter
    return Object.entries(byCycle)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, dims]) => ({
        quarter: label,
        ...dims,
      }))
  }, [filteredScores, cycles])

  // Build OKR completion data for bar chart
  const okrCompletionData = useMemo(() => {
    const cycleMap = new Map(cycles.map((c) => [c.id, c]))
    const byCycle: Record<
      string,
      { total: number; achieved: number; label: string }
    > = {}

    filteredOkrs.forEach((okr) => {
      const cycle = cycleMap.get(okr.cycle_id)
      if (!cycle) return
      const label = `Q${cycle.quarter} ${cycle.year}`
      if (!byCycle[label]) byCycle[label] = { total: 0, achieved: 0, label }
      byCycle[label].total += 1
      if (okr.status === 'achieved') byCycle[label].achieved += 1
    })

    return Object.values(byCycle)
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((d) => ({
        quarter: d.label,
        rate: d.total > 0 ? Math.round((d.achieved / d.total) * 100) : 0,
        achieved: d.achieved,
        total: d.total,
      }))
  }, [filteredOkrs, cycles])

  // Comparison data
  const comparisonData = useMemo(() => {
    if (!compareA || !compareB) return null

    const cycleMap = new Map(cycles.map((c) => [c.id, c]))
    const cycleALabel = cycleMap.get(compareA)
      ? `Q${cycleMap.get(compareA)!.quarter} ${cycleMap.get(compareA)!.year}`
      : ''
    const cycleBLabel = cycleMap.get(compareB)
      ? `Q${cycleMap.get(compareB)!.quarter} ${cycleMap.get(compareB)!.year}`
      : ''

    const scoresA: Record<string, number> = {}
    const scoresB: Record<string, number> = {}

    filteredScores.forEach((s) => {
      if (s.cycle_id === compareA) scoresA[s.dimension] = s.score
      if (s.cycle_id === compareB) scoresB[s.dimension] = s.score
    })

    const dimensions = DIMENSIONS.map((dim) => ({
      dimension: dim,
      short: DIMENSION_SHORT[dim],
      scoreA: scoresA[dim] ?? 0,
      scoreB: scoresB[dim] ?? 0,
      delta: (scoresB[dim] ?? 0) - (scoresA[dim] ?? 0),
    }))

    // OKR rates
    const okrsA = filteredOkrs.filter((o) => o.cycle_id === compareA)
    const okrsB = filteredOkrs.filter((o) => o.cycle_id === compareB)
    const rateA =
      okrsA.length > 0
        ? Math.round(
            (okrsA.filter((o) => o.status === 'achieved').length /
              okrsA.length) *
              100
          )
        : 0
    const rateB =
      okrsB.length > 0
        ? Math.round(
            (okrsB.filter((o) => o.status === 'achieved').length /
              okrsB.length) *
              100
          )
        : 0

    return {
      cycleALabel,
      cycleBLabel,
      dimensions,
      okrRateA: rateA,
      okrRateB: rateB,
      okrRateDelta: rateB - rateA,
    }
  }, [compareA, compareB, filteredScores, filteredOkrs, cycles])

  const isPageLoading = adminLoading || cyclesLoading || deptsLoading || loading

  // Theme
  const bg = isAdmin ? '#10193C' : '#FFFFFF'
  const textPrimary = isAdmin ? '#FFFFFF' : '#1E293B'
  const textSecondary = isAdmin ? 'rgba(255,255,255,0.6)' : '#64748B'
  const cardBg = isAdmin ? 'rgba(255,255,255,0.05)' : '#FFFFFF'
  const cardBorder = isAdmin ? 'rgba(255,255,255,0.1)' : undefined
  const gridColor = isAdmin ? 'rgba(255,255,255,0.08)' : '#E2E8F0'
  const axisColor = isAdmin ? 'rgba(255,255,255,0.4)' : '#94A3B8'
  const barColor = isAdmin ? '#64C4DD' : '#10193C'
  const highlightColor = '#F3CF4F'

  if (isPageLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        style={{ backgroundColor: bg }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: '#64C4DD', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: textSecondary }}>
            Loading history...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen p-4 lg:p-10 space-y-6"
      style={{ backgroundColor: bg }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>
            History &amp; Trends
          </h1>
          <p className="text-sm" style={{ color: textSecondary }}>
            Track performance across quarters
          </p>
        </div>

        {/* Department selector for admin */}
        {isAdmin && (
          <Select
            value={selectedDeptId || undefined}
            onValueChange={(val) => setSelectedDeptId(val as string)}
          >
            <SelectTrigger
              className="w-56"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
              }}
            >
              <SelectValue>
                {departments.find(d => d.id === selectedDeptId)?.name || 'All Departments'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs defaultValue="trends">
        <TabsList
          variant="line"
          style={
            isAdmin
              ? { borderColor: 'rgba(255,255,255,0.1)' }
              : undefined
          }
        >
          <TabsTrigger
            value="trends"
            style={isAdmin ? { color: textSecondary } : undefined}
          >
            Dimension Trends
          </TabsTrigger>
          <TabsTrigger
            value="okrs"
            style={isAdmin ? { color: textSecondary } : undefined}
          >
            OKR Completion
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            style={isAdmin ? { color: textSecondary } : undefined}
          >
            Compare Quarters
          </TabsTrigger>
        </TabsList>

        {/* DIMENSION TRENDS TAB */}
        <TabsContent value="trends">
          <Card
            className="mt-4"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: textPrimary }}>
                Dimension Scores Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dimensionTrendData.length === 0 ? (
                <p
                  className="text-sm py-12 text-center"
                  style={{ color: textSecondary }}
                >
                  No dimension score data available yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart data={dimensionTrendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridColor}
                    />
                    <XAxis
                      dataKey="quarter"
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={{ stroke: gridColor }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={{ stroke: gridColor }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isAdmin ? '#1A2548' : '#FFFFFF',
                        border: `1px solid ${isAdmin ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                        borderRadius: 8,
                        color: textPrimary,
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: textSecondary }}
                    />
                    {DIMENSIONS.map((dim, i) => (
                      <Line
                        key={dim}
                        type="monotone"
                        dataKey={dim}
                        name={DIMENSION_SHORT[dim]}
                        stroke={DIMENSION_COLORS[i]}
                        strokeWidth={2}
                        dot={{ r: 3, fill: DIMENSION_COLORS[i] }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* OKR COMPLETION TAB */}
        <TabsContent value="okrs">
          <Card
            className="mt-4"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: textPrimary }}>
                OKR Completion Rate by Quarter
              </CardTitle>
            </CardHeader>
            <CardContent>
              {okrCompletionData.length === 0 ? (
                <p
                  className="text-sm py-12 text-center"
                  style={{ color: textSecondary }}
                >
                  No OKR data available yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={okrCompletionData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridColor}
                    />
                    <XAxis
                      dataKey="quarter"
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={{ stroke: gridColor }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={{ stroke: gridColor }}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isAdmin ? '#1A2548' : '#FFFFFF',
                        border: `1px solid ${isAdmin ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                        borderRadius: 8,
                        color: textPrimary,
                        fontSize: 12,
                      }}
                      formatter={(value: unknown, _name: unknown, entry: unknown) => {
                        const v = value as number
                        const e = entry as { payload: { achieved: number; total: number } }
                        return [`${v}% (${e.payload.achieved}/${e.payload.total})`, 'Completion Rate']
                      }}
                    />
                    <Bar
                      dataKey="rate"
                      name="Completion Rate"
                      fill={barColor}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPARISON TAB */}
        <TabsContent value="compare">
          <div className="mt-4 space-y-6">
            {/* Quarter selectors */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: textSecondary }}
                >
                  From
                </span>
                <Select
                  value={compareA || undefined}
                  onValueChange={(val) => setCompareA(val as string)}
                >
                  <SelectTrigger
                    className="w-40"
                    style={
                      isAdmin
                        ? {
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderColor: 'rgba(255,255,255,0.2)',
                            color: '#FFFFFF',
                          }
                        : undefined
                    }
                  >
                    <SelectValue>
                      {cycles.find(c => c.id === compareA)?.name || 'Select quarter'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: textSecondary }}
                >
                  To
                </span>
                <Select
                  value={compareB || undefined}
                  onValueChange={(val) => setCompareB(val as string)}
                >
                  <SelectTrigger
                    className="w-40"
                    style={
                      isAdmin
                        ? {
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderColor: 'rgba(255,255,255,0.2)',
                            color: '#FFFFFF',
                          }
                        : undefined
                    }
                  >
                    <SelectValue>
                      {cycles.find(c => c.id === compareB)?.name || 'Select quarter'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {comparisonData && (
              <>
                {/* Dimension comparison */}
                <Card
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  }}
                >
                  <CardHeader>
                    <CardTitle style={{ color: textPrimary }}>
                      Dimension Score Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {/* Column headers */}
                      <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-xs font-medium uppercase tracking-wide pb-2 border-b"
                        style={{ color: textSecondary, borderColor: gridColor }}
                      >
                        <span>Dimension</span>
                        <span className="text-right">
                          {comparisonData.cycleALabel}
                        </span>
                        <span className="text-right">
                          {comparisonData.cycleBLabel}
                        </span>
                        <span className="text-right">Delta</span>
                      </div>

                      {comparisonData.dimensions.map((d) => (
                        <div
                          key={d.dimension}
                          className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center py-2 border-b"
                          style={{ borderColor: gridColor }}
                        >
                          <span
                            className="text-sm font-medium"
                            style={{ color: textPrimary }}
                          >
                            {d.short}
                          </span>
                          <span
                            className="text-sm text-right tabular-nums"
                            style={{ color: getScoreColor(d.scoreA) }}
                          >
                            {d.scoreA.toFixed(1)}
                          </span>
                          <span
                            className="text-sm text-right tabular-nums"
                            style={{ color: getScoreColor(d.scoreB) }}
                          >
                            {d.scoreB.toFixed(1)}
                          </span>
                          <div className="flex items-center justify-end gap-1">
                            {d.delta !== 0 && (
                              <span
                                className="text-xs"
                                style={{
                                  color:
                                    d.delta > 0
                                      ? '#22C55E'
                                      : '#DC2626',
                                }}
                              >
                                {d.delta > 0 ? '\u25B2' : '\u25BC'}
                              </span>
                            )}
                            <span
                              className="text-sm font-semibold tabular-nums"
                              style={{
                                color:
                                  d.delta > 0
                                    ? '#22C55E'
                                    : d.delta < 0
                                      ? '#DC2626'
                                      : textSecondary,
                              }}
                            >
                              {d.delta > 0 ? '+' : ''}
                              {d.delta.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* OKR completion comparison */}
                <Card
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  }}
                >
                  <CardHeader>
                    <CardTitle style={{ color: textPrimary }}>
                      OKR Completion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-6 items-center justify-center py-6">
                      {/* Quarter A */}
                      <div className="text-center space-y-1">
                        <p
                          className="text-xs font-medium uppercase tracking-wide"
                          style={{ color: textSecondary }}
                        >
                          {comparisonData.cycleALabel}
                        </p>
                        <p
                          className="text-4xl font-bold tabular-nums"
                          style={{ color: barColor }}
                        >
                          {comparisonData.okrRateA}%
                        </p>
                      </div>

                      {/* Arrow + delta */}
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="text-2xl"
                          style={{ color: textSecondary }}
                        >
                          {'\u2192'}
                        </span>
                        <Badge
                          className="text-xs font-semibold px-2 py-0.5"
                          style={{
                            backgroundColor:
                              comparisonData.okrRateDelta > 0
                                ? 'rgba(34,197,94,0.15)'
                                : comparisonData.okrRateDelta < 0
                                  ? 'rgba(220,38,38,0.15)'
                                  : 'rgba(100,116,139,0.15)',
                            color:
                              comparisonData.okrRateDelta > 0
                                ? '#22C55E'
                                : comparisonData.okrRateDelta < 0
                                  ? '#DC2626'
                                  : textSecondary,
                          }}
                        >
                          {comparisonData.okrRateDelta > 0 ? '+' : ''}
                          {comparisonData.okrRateDelta}pp
                        </Badge>
                      </div>

                      {/* Quarter B */}
                      <div className="text-center space-y-1">
                        <p
                          className="text-xs font-medium uppercase tracking-wide"
                          style={{ color: textSecondary }}
                        >
                          {comparisonData.cycleBLabel}
                        </p>
                        <p
                          className="text-4xl font-bold tabular-nums"
                          style={{ color: highlightColor }}
                        >
                          {comparisonData.okrRateB}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
