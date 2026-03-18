'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIsAdmin, useCycles, useDepartments } from '@/lib/hooks'
import type { OKR, KeyResult, CheckIn, Department } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface CheckInFormData {
  value: number
  confidence: 'high' | 'medium' | 'low' | null
  blockers: string
  notes: string
}

export default function CheckInPage() {
  const { isAdmin, loading: adminLoading, user } = useIsAdmin()
  const { activeCycle, loading: cyclesLoading } = useCycles()
  const { departments, loading: deptsLoading } = useDepartments()

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [userDepartment, setUserDepartment] = useState<Department | null>(null)
  const [okrs, setOkrs] = useState<OKR[]>([])
  const [checkIns, setCheckIns] = useState<Record<string, CheckIn[]>>({})
  const [formData, setFormData] = useState<Record<string, CheckInFormData>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  // Resolve the user's department for non-admin
  useEffect(() => {
    if (adminLoading || !user) return
    if (isAdmin) return // admin picks from dropdown
    const supabase = createClient()
    supabase
      .from('dept_departments')
      .select('*')
      .eq('leader_email', user.email!)
      .single()
      .then(({ data }) => {
        if (data) {
          setUserDepartment(data)
          setSelectedDeptId(data.id)
        }
      })
  }, [user, adminLoading, isAdmin])

  // Set first dept for admin if none selected
  useEffect(() => {
    if (isAdmin && departments.length > 0 && !selectedDeptId) {
      setSelectedDeptId(departments[0].id)
    }
  }, [isAdmin, departments, selectedDeptId])

  const effectiveDeptId = selectedDeptId

  // Fetch OKRs and check-ins
  const fetchData = useCallback(async () => {
    if (!activeCycle || !effectiveDeptId) return
    setLoading(true)

    const supabase = createClient()

    // Fetch OKRs with key results
    const { data: okrData } = await supabase
      .from('dept_okrs')
      .select('*, key_results:dept_key_results(*)')
      .eq('cycle_id', activeCycle.id)
      .eq('department_id', effectiveDeptId)
      .or('status.eq.on_track,status.eq.at_risk,status.eq.behind')

    const fetchedOkrs = (okrData || []) as OKR[]
    setOkrs(fetchedOkrs)

    // Collect all KR ids
    const krIds = fetchedOkrs.flatMap(
      (okr) => okr.key_results?.map((kr) => kr.id) || []
    )

    // Initialize form data from current values
    const initialFormData: Record<string, CheckInFormData> = {}
    fetchedOkrs.forEach((okr) => {
      okr.key_results?.forEach((kr) => {
        initialFormData[kr.id] = {
          value: kr.current_value,
          confidence: null,
          blockers: '',
          notes: '',
        }
      })
    })
    setFormData(initialFormData)

    // Fetch recent check-ins
    if (krIds.length > 0) {
      const { data: checkInData } = await supabase
        .from('dept_check_ins')
        .select('*')
        .in('key_result_id', krIds)
        .order('submitted_at', { ascending: false })

      const grouped: Record<string, CheckIn[]> = {}
      ;(checkInData || []).forEach((ci: CheckIn) => {
        if (!grouped[ci.key_result_id]) grouped[ci.key_result_id] = []
        grouped[ci.key_result_id].push(ci)
      })
      setCheckIns(grouped)
    }

    setLoading(false)
  }, [activeCycle, effectiveDeptId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleValueChange = (krId: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [krId]: { ...prev[krId], value },
    }))
  }

  const handleConfidenceChange = (
    krId: string,
    confidence: 'high' | 'medium' | 'low'
  ) => {
    setFormData((prev) => ({
      ...prev,
      [krId]: {
        ...prev[krId],
        confidence: prev[krId]?.confidence === confidence ? null : confidence,
      },
    }))
  }

  const handleTextChange = (
    krId: string,
    field: 'blockers' | 'notes',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [krId]: { ...prev[krId], [field]: value },
    }))
  }

  const handleSubmit = async (krId: string) => {
    const data = formData[krId]
    if (!data) return

    setSubmitting((prev) => ({ ...prev, [krId]: true }))
    const supabase = createClient()

    try {
      // Insert check-in record
      const { error: checkInError } = await supabase
        .from('dept_check_ins')
        .insert({
          key_result_id: krId,
          value: data.value,
          confidence: data.confidence,
          blockers: data.blockers || null,
          notes: data.notes || null,
          submitted_by: user?.email || null,
        })

      if (checkInError) throw checkInError

      // Update key result current_value
      const { error: updateError } = await supabase
        .from('dept_key_results')
        .update({ current_value: data.value })
        .eq('id', krId)

      if (updateError) throw updateError

      toast.success('Check-in submitted successfully')
      await fetchData()
    } catch (err) {
      toast.error('Failed to submit check-in')
      console.error(err)
    } finally {
      setSubmitting((prev) => ({ ...prev, [krId]: false }))
    }
  }

  const handleSubmitAll = async () => {
    const krIds = okrs.flatMap(
      (okr) => okr.key_results?.map((kr) => kr.id) || []
    )
    for (const krId of krIds) {
      await handleSubmit(krId)
    }
  }

  const getProgressPercent = (kr: KeyResult, currentVal: number): number => {
    if (!kr.target_value || kr.target_value === 0) return 0
    return Math.min(100, Math.round((currentVal / kr.target_value) * 100))
  }

  const getProgressColor = (pct: number): string => {
    if (pct >= 70) return '#22C55E'
    if (pct >= 40) return '#F3CF4F'
    return '#DC2626'
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'behind':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const isPageLoading = adminLoading || cyclesLoading || deptsLoading || loading

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#64C4DD] border-t-transparent" />
          <p className="text-sm text-gray-500">Loading check-in data...</p>
        </div>
      </div>
    )
  }

  if (!activeCycle) {
    return (
      <div className="p-6 lg:p-10">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              No active assessment cycle found. Check-ins require an active cycle.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Check-in</h1>
        <p className="text-sm text-gray-500">
          {activeCycle.name} &middot; Update progress on your key results
        </p>
      </div>

      {/* Admin department selector */}
      {isAdmin && (
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium text-gray-700">
            Department
          </Label>
          <Select
            value={selectedDeptId || undefined}
            onValueChange={(val) => setSelectedDeptId(val as string)}
          >
            <SelectTrigger className="w-64">
              <SelectValue>
                {departments.find(d => d.id === selectedDeptId)?.name || 'Select department'}
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
        </div>
      )}

      {/* Non-admin department display */}
      {!isAdmin && userDepartment && (
        <p className="text-sm text-gray-600 font-medium">
          {userDepartment.name}
        </p>
      )}

      {/* No OKRs state */}
      {okrs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              No active OKRs found for this department in the current cycle.
            </p>
          </CardContent>
        </Card>
      )}

      {/* OKR groups */}
      {okrs.map((okr) => (
        <Card key={okr.id} className="overflow-visible">
          <CardHeader className="border-b pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-gray-900">
                  {okr.objective}
                </CardTitle>
                {okr.owner_name && (
                  <p className="text-xs text-gray-500">
                    Owner: {okr.owner_name}
                  </p>
                )}
              </div>
              <Badge
                className={`text-xs px-2 py-0.5 border ${getStatusBadgeColor(okr.status)}`}
              >
                {formatStatus(okr.status)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 pt-4">
            {okr.key_results?.map((kr) => {
              const form = formData[kr.id]
              const progressPct = form
                ? getProgressPercent(kr, form.value)
                : getProgressPercent(kr, kr.current_value)
              const progressColor = getProgressColor(progressPct)
              const recentCheckIns = checkIns[kr.id] || []

              return (
                <div key={kr.id} className="space-y-4">
                  {/* KR description */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">
                      {kr.description}
                    </p>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {form?.value ?? kr.current_value}
                          {kr.unit ? ` ${kr.unit}` : ''} / {kr.target_value}
                          {kr.unit ? ` ${kr.unit}` : ''}
                        </span>
                        <span style={{ color: progressColor }}>
                          {progressPct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor: progressColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Current value input */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">
                      Current Value
                    </Label>
                    <Input
                      type="number"
                      value={form?.value ?? kr.current_value}
                      onChange={(e) =>
                        handleValueChange(kr.id, parseFloat(e.target.value) || 0)
                      }
                      className="h-10 max-w-[200px]"
                      step="any"
                    />
                  </div>

                  {/* Confidence level - traffic light */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">
                      Confidence Level
                    </Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleConfidenceChange(kr.id, 'high')
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                          form?.confidence === 'high'
                            ? 'border-green-500 bg-green-50 text-green-800 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-green-300 hover:bg-green-50/50'
                        }`}
                      >
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            form?.confidence === 'high'
                              ? 'bg-green-500'
                              : 'bg-green-300'
                          }`}
                        />
                        High
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleConfidenceChange(kr.id, 'medium')
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                          form?.confidence === 'medium'
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-800 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-yellow-300 hover:bg-yellow-50/50'
                        }`}
                      >
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            form?.confidence === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-yellow-300'
                          }`}
                        />
                        Medium
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleConfidenceChange(kr.id, 'low')
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                          form?.confidence === 'low'
                            ? 'border-red-500 bg-red-50 text-red-800 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:bg-red-50/50'
                        }`}
                      >
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            form?.confidence === 'low'
                              ? 'bg-red-500'
                              : 'bg-red-300'
                          }`}
                        />
                        Low
                      </button>
                    </div>
                  </div>

                  {/* Blockers */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">
                      Blockers
                    </Label>
                    <Textarea
                      value={form?.blockers || ''}
                      onChange={(e) =>
                        handleTextChange(kr.id, 'blockers', e.target.value)
                      }
                      placeholder="Any blockers preventing progress?"
                      className="min-h-[60px] resize-none text-sm"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">
                      Notes
                    </Label>
                    <Textarea
                      value={form?.notes || ''}
                      onChange={(e) =>
                        handleTextChange(kr.id, 'notes', e.target.value)
                      }
                      placeholder="Additional context or updates..."
                      className="min-h-[60px] resize-none text-sm"
                    />
                  </div>

                  {/* Submit single KR */}
                  <Button
                    onClick={() => handleSubmit(kr.id)}
                    disabled={submitting[kr.id]}
                    className="text-sm font-medium text-white"
                    style={{ backgroundColor: '#64C4DD' }}
                  >
                    {submitting[kr.id] ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Submitting...
                      </span>
                    ) : (
                      'Submit Check-in'
                    )}
                  </Button>

                  {/* Previous check-in history */}
                  {recentCheckIns.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Previous Check-ins
                      </p>
                      <div className="space-y-2 max-h-[240px] overflow-y-auto">
                        {recentCheckIns.slice(0, 5).map((ci) => (
                          <div
                            key={ci.id}
                            className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-xs"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">
                                  Value: {ci.value}
                                  {kr.unit ? ` ${kr.unit}` : ''}
                                </span>
                                {ci.confidence && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                      ci.confidence === 'high'
                                        ? 'bg-green-100 text-green-700'
                                        : ci.confidence === 'medium'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        ci.confidence === 'high'
                                          ? 'bg-green-500'
                                          : ci.confidence === 'medium'
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                      }`}
                                    />
                                    {ci.confidence}
                                  </span>
                                )}
                              </div>
                              {ci.blockers && (
                                <p className="text-gray-500">
                                  <span className="font-medium text-gray-600">
                                    Blockers:
                                  </span>{' '}
                                  {ci.blockers}
                                </p>
                              )}
                              {ci.notes && (
                                <p className="text-gray-500">{ci.notes}</p>
                              )}
                            </div>
                            <span className="text-gray-400 whitespace-nowrap">
                              {new Date(ci.submitted_at).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Separator between KRs */}
                  {okr.key_results &&
                    kr.id !==
                      okr.key_results[okr.key_results.length - 1]?.id && (
                      <div className="border-t border-gray-100 pt-4" />
                    )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      {/* Submit all button */}
      {okrs.length > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <Button
            onClick={handleSubmitAll}
            size="lg"
            className="text-sm font-semibold text-white shadow-lg"
            style={{ backgroundColor: '#10193C' }}
          >
            Submit All Check-ins
          </Button>
        </div>
      )}
    </div>
  )
}
