'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIsAdmin, useCycles, useDepartments } from '@/lib/hooks'
import {
  DIMENSIONS,
  getScoreColor,
  getScoreLabel,
  DIMENSION_SHORT,
  type Dimension,
  type DimensionScore,
} from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DIMENSION_DEFINITIONS } from '@/lib/dimensions'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const SCORE_OPTIONS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]

interface ScoreEntry {
  score: number
  evidence: string
  comments: string
}

type ScoreMap = Record<string, ScoreEntry>

function ScoreSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (score: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SCORE_OPTIONS.map((s) => {
        const isSelected = value === s
        const color = getScoreColor(s)
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border-2 text-xs font-semibold transition-all hover:scale-110 sm:h-10 sm:w-10 sm:text-sm"
            style={{
              borderColor: isSelected ? color : '#e5e7eb',
              backgroundColor: isSelected ? color : 'transparent',
              color: isSelected ? '#fff' : '#6b7280',
              boxShadow: isSelected ? `0 0 0 2px ${color}40` : 'none',
            }}
          >
            {s}
          </button>
        )
      })}
    </div>
  )
}

export default function AssessPage() {
  const { isAdmin, loading: adminLoading, user } = useIsAdmin()
  const { activeCycle, loading: cyclesLoading } = useCycles()
  const { departments, loading: deptsLoading } = useDepartments()

  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [assessor, setAssessor] = useState<'self' | 'executive'>('self')
  const [scores, setScores] = useState<ScoreMap>({})
  const [loadingScores, setLoadingScores] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Auto-detect department for non-admin users
  useEffect(() => {
    if (adminLoading || deptsLoading || !user) return
    if (!isAdmin && departments.length > 0) {
      const userDept = departments.find(
        (d) => d.leader_email === user.email
      )
      if (userDept) {
        setSelectedDeptId(userDept.id)
      }
    }
  }, [isAdmin, adminLoading, deptsLoading, user, departments])

  // Load existing scores when department/cycle/assessor changes
  const loadScores = useCallback(async () => {
    if (!selectedDeptId || !activeCycle) return
    setLoadingScores(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('dept_dimension_scores')
        .select('*')
        .eq('department_id', selectedDeptId)
        .eq('cycle_id', activeCycle.id)
        .eq('assessor', assessor)

      if (error) throw error

      const loaded: ScoreMap = {}
      DIMENSIONS.forEach((dim) => {
        const existing = data?.find(
          (s: DimensionScore) => s.dimension === dim
        )
        loaded[dim] = {
          score: existing?.score ?? 1.0,
          evidence: existing?.evidence ?? '',
          comments: existing?.comments ?? '',
        }
      })
      setScores(loaded)
    } catch {
      toast.error('Failed to load existing scores')
    } finally {
      setLoadingScores(false)
    }
  }, [selectedDeptId, activeCycle, assessor])

  useEffect(() => {
    loadScores()
  }, [loadScores])

  // Initialize default scores if none loaded
  useEffect(() => {
    if (Object.keys(scores).length === 0 && !loadingScores) {
      const initial: ScoreMap = {}
      DIMENSIONS.forEach((dim) => {
        initial[dim] = { score: 1.0, evidence: '', comments: '' }
      })
      setScores(initial)
    }
  }, [scores, loadingScores])

  const updateScore = (dimension: string, field: keyof ScoreEntry, value: string | number) => {
    setScores((prev) => ({
      ...prev,
      [dimension]: {
        ...prev[dimension],
        [field]: value,
      },
    }))
  }

  const handleSave = async (isFinal: boolean) => {
    if (!selectedDeptId || !activeCycle) {
      toast.error('Please select a department and ensure an active cycle exists')
      return
    }

    const setter = isFinal ? setSubmitting : setSaving
    setter(true)

    try {
      const supabase = createClient()
      const payload = DIMENSIONS.map((dim) => ({
        department_id: selectedDeptId,
        cycle_id: activeCycle.id,
        dimension: dim,
        score: scores[dim]?.score ?? 1.0,
        evidence: scores[dim]?.evidence || null,
        comments: scores[dim]?.comments || null,
        assessor,
        updated_at: new Date().toISOString(),
      }))

      const { error } = await supabase
        .from('dept_dimension_scores')
        .upsert(payload, {
          onConflict: 'department_id,cycle_id,dimension,assessor',
        })

      if (error) throw error

      toast.success(
        isFinal
          ? 'Assessment submitted successfully'
          : 'Draft saved successfully'
      )
    } catch {
      toast.error('Failed to save assessment. Please try again.')
    } finally {
      setter(false)
    }
  }

  const isLoading = adminLoading || cyclesLoading || deptsLoading

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#64C4DD] border-t-transparent" />
          <p className="text-sm text-gray-500">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (!activeCycle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-[#10193C]">
              No Active Assessment Cycle
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              There is no active assessment cycle. Please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedDept = departments.find((d) => d.id === selectedDeptId)
  const averageScore =
    Object.values(scores).length > 0
      ? Object.values(scores).reduce((sum, s) => sum + (s.score || 0), 0) /
        Object.values(scores).length
      : 0

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#10193C] sm:text-3xl">
            Maturity Assessment
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {activeCycle.name} &mdash; Q{activeCycle.quarter} {activeCycle.year}
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:p-6">
            {/* Department Selector (admin) or display (leader) */}
            <div className="flex-1">
              <Label className="mb-1.5 block text-sm font-medium text-[#10193C]">
                Department
              </Label>
              {isAdmin ? (
                <Select
                  value={selectedDeptId}
                  onValueChange={(v) => v && setSelectedDeptId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {departments.find(d => d.id === selectedDeptId)?.name || 'Select department...'}
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
              ) : (
                <p className="text-sm font-medium text-gray-700">
                  {selectedDept?.name ?? 'No department assigned'}
                </p>
              )}
            </div>

            {/* Assessor mode toggle (admin only) */}
            {isAdmin && (
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-[#10193C]">
                  Assessment Mode
                </Label>
                <Select
                  value={assessor}
                  onValueChange={(v) => setAssessor(v as 'self' | 'executive')}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self-Assessment</SelectItem>
                    <SelectItem value="executive">Executive Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Summary badge */}
            {selectedDeptId && (
              <div className="flex items-center gap-2">
                <Badge
                  className="text-white"
                  style={{ backgroundColor: getScoreColor(averageScore) }}
                >
                  Avg: {averageScore.toFixed(1)}
                </Badge>
                <span className="text-xs text-gray-500">
                  {getScoreLabel(averageScore)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading state for scores */}
        {loadingScores && (
          <div className="mb-6 flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#64C4DD] border-t-transparent" />
            <span className="ml-2 text-sm text-gray-500">
              Loading scores...
            </span>
          </div>
        )}

        {/* Dimension Cards */}
        {!loadingScores && selectedDeptId && (
          <div className="space-y-4">
            {DIMENSIONS.map((dimension, index) => {
              const entry = scores[dimension] ?? {
                score: 1.0,
                evidence: '',
                comments: '',
              }
              const scoreColor = getScoreColor(entry.score)
              const scoreLabel = getScoreLabel(entry.score)

              return (
                <Card key={dimension} className="overflow-hidden">
                  {/* Color bar */}
                  <div
                    className="h-1.5"
                    style={{ backgroundColor: scoreColor }}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="text-base font-semibold text-[#10193C] sm:text-lg">
                        <span className="mr-2 text-[#64C4DD]">
                          {index + 1}.
                        </span>
                        {dimension}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          className="text-white"
                          style={{ backgroundColor: scoreColor }}
                        >
                          {entry.score.toFixed(1)}
                        </Badge>
                        <span className="text-xs font-medium text-gray-500">
                          {scoreLabel}
                        </span>
                      </div>
                    </div>
                    {/* Dimension definition */}
                    {DIMENSION_DEFINITIONS[dimension] && (
                      <details className="mt-2 rounded-md bg-slate-50 border border-slate-200">
                        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800">
                          ℹ️ What this measures &amp; scoring guide
                        </summary>
                        <div className="px-3 pb-3 space-y-2">
                          <p className="text-xs text-slate-600">
                            {DIMENSION_DEFINITIONS[dimension].description}
                          </p>
                          <p className="text-xs text-slate-500">
                            <strong>Measures:</strong> {DIMENSION_DEFINITIONS[dimension].what_it_measures}
                          </p>
                          <div className="space-y-1 mt-2">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Scoring Guide</p>
                            <div className="grid gap-1.5">
                              {Object.entries(DIMENSION_DEFINITIONS[dimension].scoring_guide).map(([level, desc]) => (
                                <div key={level} className="flex gap-2 text-[11px]">
                                  <span
                                    className="shrink-0 inline-flex items-center justify-center rounded px-1.5 py-0.5 font-bold text-white text-[10px]"
                                    style={{
                                      backgroundColor:
                                        level === 'l1' ? '#DC2626' :
                                        level === 'l2' ? '#DC2626' :
                                        level === 'l3' ? '#F3CF4F' :
                                        level === 'l4' ? '#22C55E' : '#64C4DD',
                                      color: level === 'l3' ? '#10193C' : '#FFFFFF',
                                    }}
                                  >
                                    {level.toUpperCase()}
                                  </span>
                                  <span className="text-slate-600">{desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </details>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {/* Score selector */}
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-[#10193C]">
                        Score
                      </Label>
                      <ScoreSelector
                        value={entry.score}
                        onChange={(s) =>
                          updateScore(dimension, 'score', s)
                        }
                      />
                      <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                        <span>Ad Hoc</span>
                        <span>Developing</span>
                        <span>Defined</span>
                        <span>Managed</span>
                        <span>Optimizing</span>
                      </div>
                    </div>

                    {/* Evidence */}
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-[#10193C]">
                        What justifies this score?
                      </Label>
                      <Textarea
                        placeholder="Provide evidence for the selected score level..."
                        value={entry.evidence}
                        onChange={(e) =>
                          updateScore(dimension, 'evidence', e.target.value)
                        }
                        className="min-h-[80px] resize-y text-sm"
                      />
                    </div>

                    {/* Comments */}
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium text-[#10193C]">
                        Comments
                      </Label>
                      <Textarea
                        placeholder="Additional notes or observations..."
                        value={entry.comments}
                        onChange={(e) =>
                          updateScore(dimension, 'comments', e.target.value)
                        }
                        className="min-h-[60px] resize-y text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Action buttons */}
        {!loadingScores && selectedDeptId && (
          <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving || submitting}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#64C4DD] border-t-transparent" />
                  Saving...
                </span>
              ) : (
                'Save Draft'
              )}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving || submitting}
              className="w-full bg-[#10193C] text-white hover:bg-[#1a2a54] sm:w-auto"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </span>
              ) : (
                'Submit Final'
              )}
            </Button>
          </div>
        )}

        {/* No department selected prompt */}
        {!loadingScores && !selectedDeptId && isAdmin && (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">
                Select a department above to begin the assessment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
