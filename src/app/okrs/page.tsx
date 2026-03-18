'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIsAdmin, useCycles, useDepartments } from '@/lib/hooks'
import { DIMENSIONS, DIMENSION_SHORT, type OKR, type KeyResult } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

// --- Constants ---

const STATUS_OPTIONS = ['on_track', 'at_risk', 'behind', 'achieved', 'cancelled'] as const
type OKRStatus = (typeof STATUS_OPTIONS)[number]

const STATUS_CONFIG: Record<OKRStatus, { label: string; bg: string; text: string }> = {
  on_track: { label: 'On Track', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  at_risk: { label: 'At Risk', bg: 'bg-amber-100', text: 'text-amber-800' },
  behind: { label: 'Behind', bg: 'bg-red-100', text: 'text-red-800' },
  achieved: { label: 'Achieved', bg: 'bg-blue-100', text: 'text-blue-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600' },
}

const KR_STATUS_OPTIONS = ['not_started', 'on_track', 'at_risk', 'behind', 'achieved'] as const

const KR_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: '#94a3b8' },
  on_track: { label: 'On Track', color: '#22c55e' },
  at_risk: { label: 'At Risk', color: '#f59e0b' },
  behind: { label: 'Behind', color: '#ef4444' },
  achieved: { label: 'Achieved', color: '#3b82f6' },
}

const METRIC_TYPES = ['percentage', 'number', 'currency', 'boolean', 'milestone'] as const

const REVENUE_IMPACT_OPTIONS = ['direct', 'indirect', 'operational'] as const

const REVENUE_IMPACT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  direct: { label: 'Direct Revenue', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  indirect: { label: 'Indirect Revenue', bg: 'bg-sky-50', text: 'text-sky-700' },
  operational: { label: 'Operational', bg: 'bg-violet-50', text: 'text-violet-700' },
}

// --- Helpers ---

function calculateHealthScore(keyResults: KeyResult[]): number {
  if (!keyResults || keyResults.length === 0) return 0
  const confidenceWeights: Record<string, number> = {
    achieved: 1.0,
    on_track: 0.85,
    at_risk: 0.5,
    behind: 0.2,
    not_started: 0.1,
  }
  const totalWeight = keyResults.reduce((sum, kr) => {
    return sum + (confidenceWeights[kr.status] ?? 0.1)
  }, 0)
  return Math.round((totalWeight / keyResults.length) * 100)
}

function getProgressPercent(kr: KeyResult): number {
  if (kr.metric_type === 'boolean') {
    return kr.current_value >= 1 ? 100 : 0
  }
  if (kr.metric_type === 'milestone') {
    return kr.target_value ? Math.min(100, Math.round((kr.current_value / kr.target_value) * 100)) : 0
  }
  if (!kr.target_value || kr.target_value === 0) return 0
  return Math.min(100, Math.round((kr.current_value / kr.target_value) * 100))
}

function formatKRValue(kr: KeyResult, value: number): string {
  if (kr.metric_type === 'boolean') return value >= 1 ? 'Yes' : 'No'
  if (kr.metric_type === 'currency') return `$${value.toLocaleString()}`
  if (kr.metric_type === 'percentage') return `${value}%`
  if (kr.unit) return `${value.toLocaleString()} ${kr.unit}`
  return value.toLocaleString()
}

// --- Empty OKR/KR factories ---

function emptyOKRForm() {
  return {
    objective: '',
    owner_name: '',
    priority: 1,
    status: 'on_track' as OKRStatus,
    linked_dimension: '' as string,
    revenue_impact: '' as string,
  }
}

function emptyKRForm() {
  return {
    description: '',
    metric_type: 'number' as KeyResult['metric_type'],
    target_value: 0,
    unit: '',
  }
}

// --- Main Page ---

export default function OKRsPage() {
  const { isAdmin, loading: adminLoading, user } = useIsAdmin()
  const { cycles, activeCycle, loading: cyclesLoading } = useCycles()
  const { departments, loading: deptsLoading } = useDepartments()

  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [okrs, setOkrs] = useState<OKR[]>([])
  const [loadingOkrs, setLoadingOkrs] = useState(false)

  // OKR form
  const [okrDialogOpen, setOkrDialogOpen] = useState(false)
  const [okrForm, setOkrForm] = useState(emptyOKRForm())
  const [editingOkrId, setEditingOkrId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // KR form
  const [krDialogOpen, setKrDialogOpen] = useState(false)
  const [krForm, setKrForm] = useState(emptyKRForm())
  const [krTargetOkrId, setKrTargetOkrId] = useState<string | null>(null)
  const [editingKrId, setEditingKrId] = useState<string | null>(null)
  const [savingKr, setSavingKr] = useState(false)

  // Delete state
  const [deleteOkrId, setDeleteOkrId] = useState<string | null>(null)
  const [deleteKrId, setDeleteKrId] = useState<string | null>(null)
  const [deleteOkrOpen, setDeleteOkrOpen] = useState(false)
  const [deleteKrOpen, setDeleteKrOpen] = useState(false)

  // Determine the user's department if not admin
  useEffect(() => {
    if (adminLoading || deptsLoading) return
    if (isAdmin) {
      if (departments.length > 0 && !selectedDeptId) {
        setSelectedDeptId(departments[0].id)
      }
    } else if (user) {
      const myDept = departments.find((d) => d.leader_email === user.email)
      if (myDept) setSelectedDeptId(myDept.id)
    }
  }, [isAdmin, adminLoading, deptsLoading, departments, user, selectedDeptId])

  const cycleId = activeCycle?.id

  // Fetch OKRs
  const fetchOkrs = useCallback(async () => {
    if (!cycleId || !selectedDeptId) return
    setLoadingOkrs(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('dept_okrs')
      .select('*, key_results:dept_key_results(*)')
      .eq('cycle_id', cycleId)
      .eq('department_id', selectedDeptId)
      .order('priority', { ascending: true })
    if (error) {
      toast.error('Failed to load OKRs')
    } else {
      setOkrs(data ?? [])
    }
    setLoadingOkrs(false)
  }, [cycleId, selectedDeptId])

  useEffect(() => {
    fetchOkrs()
  }, [fetchOkrs])

  // --- OKR CRUD ---

  const openNewOkrDialog = () => {
    setEditingOkrId(null)
    setOkrForm(emptyOKRForm())
    setOkrDialogOpen(true)
  }

  const openEditOkrDialog = (okr: OKR) => {
    setEditingOkrId(okr.id)
    setOkrForm({
      objective: okr.objective,
      owner_name: okr.owner_name ?? '',
      priority: okr.priority,
      status: okr.status,
      linked_dimension: okr.linked_dimension ?? '',
      revenue_impact: okr.revenue_impact ?? '',
    })
    setOkrDialogOpen(true)
  }

  const saveOkr = async () => {
    if (!okrForm.objective.trim()) {
      toast.error('Objective text is required')
      return
    }
    if (!cycleId || !selectedDeptId) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      objective: okrForm.objective.trim(),
      owner_name: okrForm.owner_name.trim() || null,
      priority: okrForm.priority,
      status: okrForm.status,
      linked_dimension: okrForm.linked_dimension || null,
      revenue_impact: okrForm.revenue_impact || null,
      department_id: selectedDeptId,
      cycle_id: cycleId,
    }

    if (editingOkrId) {
      const { error } = await supabase.from('dept_okrs').update(payload).eq('id', editingOkrId)
      if (error) {
        toast.error('Failed to update OKR')
      } else {
        toast.success('OKR updated')
        setOkrDialogOpen(false)
        fetchOkrs()
      }
    } else {
      const { error } = await supabase.from('dept_okrs').insert(payload)
      if (error) {
        toast.error('Failed to create OKR')
      } else {
        toast.success('OKR created')
        setOkrDialogOpen(false)
        fetchOkrs()
      }
    }
    setSaving(false)
  }

  const confirmDeleteOkr = async () => {
    if (!deleteOkrId) return
    const supabase = createClient()
    const { error } = await supabase.from('dept_okrs').delete().eq('id', deleteOkrId)
    if (error) {
      toast.error('Failed to delete OKR')
    } else {
      toast.success('OKR deleted')
      fetchOkrs()
    }
    setDeleteOkrId(null)
    setDeleteOkrOpen(false)
  }

  // --- KR CRUD ---

  const openNewKrDialog = (okrId: string) => {
    setEditingKrId(null)
    setKrTargetOkrId(okrId)
    setKrForm(emptyKRForm())
    setKrDialogOpen(true)
  }

  const openEditKrDialog = (kr: KeyResult) => {
    setEditingKrId(kr.id)
    setKrTargetOkrId(kr.okr_id)
    setKrForm({
      description: kr.description,
      metric_type: kr.metric_type,
      target_value: kr.target_value ?? 0,
      unit: kr.unit ?? '',
    })
    setKrDialogOpen(true)
  }

  const saveKr = async () => {
    if (!krForm.description.trim()) {
      toast.error('Description is required')
      return
    }
    if (!krTargetOkrId) return
    setSavingKr(true)
    const supabase = createClient()
    const payload = {
      description: krForm.description.trim(),
      metric_type: krForm.metric_type,
      target_value: krForm.target_value,
      unit: krForm.unit.trim() || null,
      okr_id: krTargetOkrId,
    }

    if (editingKrId) {
      const { error } = await supabase
        .from('dept_key_results')
        .update(payload)
        .eq('id', editingKrId)
      if (error) {
        toast.error('Failed to update Key Result')
      } else {
        toast.success('Key Result updated')
        setKrDialogOpen(false)
        fetchOkrs()
      }
    } else {
      const { error } = await supabase.from('dept_key_results').insert({
        ...payload,
        current_value: 0,
        status: 'not_started',
      })
      if (error) {
        toast.error('Failed to create Key Result')
      } else {
        toast.success('Key Result created')
        setKrDialogOpen(false)
        fetchOkrs()
      }
    }
    setSavingKr(false)
  }

  const confirmDeleteKr = async () => {
    if (!deleteKrId) return
    const supabase = createClient()
    const { error } = await supabase.from('dept_key_results').delete().eq('id', deleteKrId)
    if (error) {
      toast.error('Failed to delete Key Result')
    } else {
      toast.success('Key Result deleted')
      fetchOkrs()
    }
    setDeleteKrId(null)
    setDeleteKrOpen(false)
  }

  // --- Sorted OKRs ---
  const sortedOkrs = useMemo(() => {
    return [...okrs].sort((a, b) => a.priority - b.priority)
  }, [okrs])

  // --- Loading state ---
  const isLoading = adminLoading || cyclesLoading || deptsLoading

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: '#64C4DD', borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-gray-500">Loading OKRs...</p>
        </div>
      </div>
    )
  }

  const selectedDept = departments.find((d) => d.id === selectedDeptId)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: '#10193C' }}
              >
                OKR Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {activeCycle
                  ? `Q${activeCycle.quarter} ${activeCycle.year} - ${activeCycle.name}`
                  : 'No active cycle'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && departments.length > 0 && (
                <Select
                  value={selectedDeptId}
                  onValueChange={(val) => setSelectedDeptId(val as string)}
                >
                  <SelectTrigger className="w-[220px]">
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
              )}
              <Button
                onClick={openNewOkrDialog}
                className="text-white"
                style={{ backgroundColor: '#64C4DD' }}
                disabled={!cycleId || !selectedDeptId}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1.5 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add OKR
              </Button>
            </div>
          </div>
          {!isAdmin && selectedDept && (
            <p className="mt-2 text-sm font-medium" style={{ color: '#10193C' }}>
              {selectedDept.name}
            </p>
          )}
        </div>
      </div>

      {/* OKR List */}
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {loadingOkrs ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: '#64C4DD', borderTopColor: 'transparent' }}
            />
          </div>
        ) : sortedOkrs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: '#64C4DD15' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#64C4DD"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-base font-medium" style={{ color: '#10193C' }}>
              No OKRs yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Create your first objective to get started
            </p>
            <Button
              onClick={openNewOkrDialog}
              className="mt-4 text-white"
              style={{ backgroundColor: '#64C4DD' }}
              disabled={!cycleId || !selectedDeptId}
            >
              Add OKR
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedOkrs.map((okr) => (
              <OKRCard
                key={okr.id}
                okr={okr}
                onEdit={() => openEditOkrDialog(okr)}
                onDelete={() => {
                  setDeleteOkrId(okr.id)
                  setDeleteOkrOpen(true)
                }}
                onAddKr={() => openNewKrDialog(okr.id)}
                onEditKr={openEditKrDialog}
                onDeleteKr={(krId) => {
                  setDeleteKrId(krId)
                  setDeleteKrOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* OKR Dialog */}
      <Dialog open={okrDialogOpen} onOpenChange={setOkrDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: '#10193C' }}>
              {editingOkrId ? 'Edit Objective' : 'New Objective'}
            </DialogTitle>
            <DialogDescription>
              {editingOkrId
                ? 'Update the objective details below.'
                : 'Define a new objective for this quarter.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="objective" style={{ color: '#10193C' }}>
                Objective
              </Label>
              <Textarea
                id="objective"
                placeholder="What do you want to achieve?"
                value={okrForm.objective}
                onChange={(e) => setOkrForm((f) => ({ ...f, objective: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="owner" style={{ color: '#10193C' }}>
                  Owner
                </Label>
                <Input
                  id="owner"
                  placeholder="Owner name"
                  value={okrForm.owner_name}
                  onChange={(e) => setOkrForm((f) => ({ ...f, owner_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priority" style={{ color: '#10193C' }}>
                  Priority
                </Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  value={okrForm.priority}
                  onChange={(e) =>
                    setOkrForm((f) => ({ ...f, priority: parseInt(e.target.value) || 1 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label style={{ color: '#10193C' }}>Status</Label>
              <Select
                value={okrForm.status}
                onValueChange={(val) => setOkrForm((f) => ({ ...f, status: val as OKRStatus }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label style={{ color: '#10193C' }}>Linked Dimension</Label>
              <Select
                value={okrForm.linked_dimension}
                onValueChange={(val) =>
                  setOkrForm((f) => ({ ...f, linked_dimension: val as string }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select dimension" />
                </SelectTrigger>
                <SelectContent>
                  {DIMENSIONS.map((dim) => (
                    <SelectItem key={dim} value={dim}>
                      {dim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label style={{ color: '#10193C' }}>Revenue Impact</Label>
              <Select
                value={okrForm.revenue_impact}
                onValueChange={(val) =>
                  setOkrForm((f) => ({ ...f, revenue_impact: val as string }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select revenue impact" />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_IMPACT_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {REVENUE_IMPACT_CONFIG[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              onClick={saveOkr}
              disabled={saving}
              className="text-white"
              style={{ backgroundColor: '#64C4DD' }}
            >
              {saving ? 'Saving...' : editingOkrId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KR Dialog */}
      <Dialog open={krDialogOpen} onOpenChange={setKrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#10193C' }}>
              {editingKrId ? 'Edit Key Result' : 'New Key Result'}
            </DialogTitle>
            <DialogDescription>
              {editingKrId
                ? 'Update the key result details.'
                : 'Add a measurable key result.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="kr-description" style={{ color: '#10193C' }}>
                Description
              </Label>
              <Textarea
                id="kr-description"
                placeholder="What measurable result will indicate success?"
                value={krForm.description}
                onChange={(e) => setKrForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label style={{ color: '#10193C' }}>Metric Type</Label>
              <Select
                value={krForm.metric_type}
                onValueChange={(val) =>
                  setKrForm((f) => ({ ...f, metric_type: val as KeyResult['metric_type'] }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_TYPES.map((mt) => (
                    <SelectItem key={mt} value={mt}>
                      {mt.charAt(0).toUpperCase() + mt.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="kr-target" style={{ color: '#10193C' }}>
                  Target Value
                </Label>
                <Input
                  id="kr-target"
                  type="number"
                  value={krForm.target_value}
                  onChange={(e) =>
                    setKrForm((f) => ({ ...f, target_value: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kr-unit" style={{ color: '#10193C' }}>
                  Unit
                </Label>
                <Input
                  id="kr-unit"
                  placeholder="e.g. users, deals"
                  value={krForm.unit}
                  onChange={(e) => setKrForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              onClick={saveKr}
              disabled={savingKr}
              className="text-white"
              style={{ backgroundColor: '#64C4DD' }}
            >
              {savingKr ? 'Saving...' : editingKrId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete OKR Confirmation */}
      <AlertDialog open={deleteOkrOpen} onOpenChange={setDeleteOkrOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Objective</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this objective and all its key results. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteOkrId(null)
                setDeleteOkrOpen(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOkr}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete KR Confirmation */}
      <AlertDialog open={deleteKrOpen} onOpenChange={setDeleteKrOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Key Result</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this key result. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteKrId(null)
                setDeleteKrOpen(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteKr}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// --- OKR Card Component ---

function OKRCard({
  okr,
  onEdit,
  onDelete,
  onAddKr,
  onEditKr,
  onDeleteKr,
}: {
  okr: OKR
  onEdit: () => void
  onDelete: () => void
  onAddKr: () => void
  onEditKr: (kr: KeyResult) => void
  onDeleteKr: (krId: string) => void
}) {
  const keyResults = okr.key_results ?? []
  const healthScore = calculateHealthScore(keyResults)
  const statusCfg = STATUS_CONFIG[okr.status]
  const dimensionShort = okr.linked_dimension
    ? DIMENSION_SHORT[okr.linked_dimension as keyof typeof DIMENSION_SHORT] ??
      okr.linked_dimension
    : null
  const revenueCfg = okr.revenue_impact ? REVENUE_IMPACT_CONFIG[okr.revenue_impact] : null

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Priority + Objective */}
            <div className="flex items-start gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                style={{ backgroundColor: '#F3CF4F20', color: '#B8960A' }}
              >
                {okr.priority}
              </span>
              <div className="min-w-0 flex-1">
                <CardTitle
                  className="text-base font-semibold leading-snug"
                  style={{ color: '#10193C' }}
                >
                  {okr.objective}
                </CardTitle>
                {okr.owner_name && (
                  <p className="mt-0.5 text-xs text-gray-500">{okr.owner_name}</p>
                )}
              </div>
            </div>

            {/* Badges row */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
              >
                {statusCfg.label}
              </span>
              {dimensionShort && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {dimensionShort}
                </span>
              )}
              {revenueCfg && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${revenueCfg.bg} ${revenueCfg.text}`}
                >
                  {revenueCfg.label}
                </span>
              )}
              {/* Health score */}
              <span
                className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: '#10193C' }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      healthScore >= 70
                        ? '#22c55e'
                        : healthScore >= 40
                          ? '#f59e0b'
                          : '#ef4444',
                  }}
                />
                Health: {healthScore}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <CardAction>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={onEdit}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onDelete}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            </div>
          </CardAction>
        </div>
      </CardHeader>

      {/* Key Results */}
      <CardContent>
        {keyResults.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#64C4DD' }}
              >
                Key Results
              </p>
              <Button variant="ghost" size="xs" onClick={onAddKr}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add
              </Button>
            </div>
            <div className="space-y-2.5">
              {keyResults.map((kr) => (
                <KeyResultRow
                  key={kr.id}
                  kr={kr}
                  onEdit={() => onEditKr(kr)}
                  onDelete={() => onDeleteKr(kr.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <p className="text-xs text-gray-400">No key results yet</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddKr}
              className="mt-2"
              style={{ color: '#64C4DD' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Key Result
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- Key Result Row ---

function KeyResultRow({
  kr,
  onEdit,
  onDelete,
}: {
  kr: KeyResult
  onEdit: () => void
  onDelete: () => void
}) {
  const progress = getProgressPercent(kr)
  const krStatus = KR_STATUS_CONFIG[kr.status] ?? KR_STATUS_CONFIG.not_started

  return (
    <div className="group rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5 transition-colors hover:bg-gray-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium" style={{ color: '#10193C' }}>
              {kr.description}
            </p>
            <span
              className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: krStatus.color + '18', color: krStatus.color }}
            >
              {krStatus.label}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: krStatus.color,
                  }}
                />
              </div>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-gray-500">
              {kr.metric_type === 'boolean' ? (
                kr.current_value >= 1 ? 'Complete' : 'Incomplete'
              ) : (
                <>
                  {formatKRValue(kr, kr.current_value)} / {formatKRValue(kr, kr.target_value ?? 0)}
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon-xs" onClick={onEdit}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onDelete}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
