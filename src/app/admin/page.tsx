'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAdmin, useDepartments, useCycles } from '@/lib/hooks'
import { createClient } from '@/lib/supabase/client'
import { DIMENSIONS, type Department, type AssessmentCycle } from '@/lib/types'
import { toast } from 'sonner'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// ─── Styles ─────────────────────────────────────────────────────────────────
const navy = '#10193C'
const teal = '#64C4DD'

const cardStyle = { backgroundColor: navy, borderColor: `${teal}33` }
const headerCellClass = 'text-[#64C4DD] font-semibold text-xs uppercase tracking-wider'
const cellClass = 'text-white/90'

// ─── Departments Tab ────────────────────────────────────────────────────────
function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const [editDept, setEditDept] = useState<Department | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('')
  const [formLeaderName, setFormLeaderName] = useState('')
  const [formLeaderEmail, setFormLeaderEmail] = useState('')
  const [formLeaderUserId, setFormLeaderUserId] = useState('')

  const fetchDepartments = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from('dept_departments').select('*').order('name')
    if (error) { toast.error('Failed to load departments'); return }
    setDepartments(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDepartments() }, [fetchDepartments])

  function openEdit(dept: Department) {
    setEditDept(dept)
    setFormLeaderName(dept.leader_name ?? '')
    setFormLeaderEmail(dept.leader_email ?? '')
    setFormLeaderUserId(dept.leader_user_id ?? '')
    setEditOpen(true)
  }

  function openAdd() {
    setFormName('')
    setFormType('service')
    setFormLeaderName('')
    setFormLeaderEmail('')
    setFormLeaderUserId('')
    setAddOpen(true)
  }

  async function handleUpdate() {
    if (!editDept) return
    const supabase = createClient()
    const { error } = await supabase.from('dept_departments').update({
      leader_name: formLeaderName || null,
      leader_email: formLeaderEmail || null,
      leader_user_id: formLeaderUserId || null,
    }).eq('id', editDept.id)

    if (error) { toast.error('Failed to update department'); return }
    toast.success('Department updated')
    setEditOpen(false)
    fetchDepartments()
  }

  async function handleAdd() {
    if (!formName.trim()) { toast.error('Name is required'); return }
    const supabase = createClient()
    const { error } = await supabase.from('dept_departments').insert({
      name: formName.trim(),
      department_type: formType || 'service',
      leader_name: formLeaderName || null,
      leader_email: formLeaderEmail || null,
      leader_user_id: formLeaderUserId || null,
    })
    if (error) { toast.error('Failed to add department'); return }
    toast.success('Department added')
    setAddOpen(false)
    fetchDepartments()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const supabase = createClient()
    const { error } = await supabase.from('dept_departments').delete().eq('id', deleteTarget.id)
    if (error) { toast.error('Failed to delete department'); return }
    toast.success('Department deleted')
    setDeleteTarget(null)
    fetchDepartments()
  }

  return (
    <Card className="border" style={cardStyle}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Departments</CardTitle>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button size="sm" className="text-white" style={{ backgroundColor: teal }} />}>
            + Add Department
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" style={{ backgroundColor: navy, borderColor: `${teal}55` }}>
            <DialogHeader>
              <DialogTitle className="text-white">Add Department</DialogTitle>
              <DialogDescription className="text-white/60">Create a new department record.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label className="text-white/80">Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} className="bg-white/5 text-white border-white/10" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/80">Type</Label>
                <Select value={formType} onValueChange={(v) => v && setFormType(v)}>
                  <SelectTrigger className="bg-white/5 text-white border-white/10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/80">Leader Name</Label>
                <Input value={formLeaderName} onChange={e => setFormLeaderName(e.target.value)} className="bg-white/5 text-white border-white/10" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/80">Leader Email</Label>
                <Input value={formLeaderEmail} onChange={e => setFormLeaderEmail(e.target.value)} className="bg-white/5 text-white border-white/10" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" className="text-white/70 border-white/20" />}>Cancel</DialogClose>
              <Button onClick={handleAdd} className="text-white" style={{ backgroundColor: teal }}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-white/50 text-center py-8">Loading departments...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className={headerCellClass}>Name</TableHead>
                <TableHead className={headerCellClass}>Type</TableHead>
                <TableHead className={headerCellClass}>Leader</TableHead>
                <TableHead className={headerCellClass}>Email</TableHead>
                <TableHead className={headerCellClass}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map(dept => (
                <TableRow key={dept.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className={cellClass}>{dept.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs" style={{ backgroundColor: `${teal}22`, color: teal }}>
                      {dept.department_type}
                    </Badge>
                  </TableCell>
                  <TableCell className={cellClass}>{dept.leader_name ?? '--'}</TableCell>
                  <TableCell className="text-white/60 text-xs">{dept.leader_email ?? '--'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="xs" variant="ghost" className="text-[#64C4DD] hover:text-white" onClick={() => openEdit(dept)}>
                        Edit
                      </Button>
                      <AlertDialog open={deleteTarget?.id === dept.id} onOpenChange={open => !open && setDeleteTarget(null)}>
                        <AlertDialogTrigger render={<Button size="xs" variant="destructive" />} onClick={() => setDeleteTarget(dept)}>
                          Delete
                        </AlertDialogTrigger>
                        <AlertDialogContent style={{ backgroundColor: navy, borderColor: '#DC262655' }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Department</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60">
                              Are you sure you want to delete &quot;{dept.name}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-white/70 border-white/20">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-white/40 py-8">No departments found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: navy, borderColor: `${teal}55` }}>
          <DialogHeader>
            <DialogTitle className="text-white">Edit Department: {editDept?.name}</DialogTitle>
            <DialogDescription className="text-white/60">Update department leader information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label className="text-white/80">Leader Name</Label>
              <Input value={formLeaderName} onChange={e => setFormLeaderName(e.target.value)} className="bg-white/5 text-white border-white/10" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-white/80">Leader Email</Label>
              <Input value={formLeaderEmail} onChange={e => setFormLeaderEmail(e.target.value)} className="bg-white/5 text-white border-white/10" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-white/80">Leader User ID</Label>
              <Input value={formLeaderUserId} onChange={e => setFormLeaderUserId(e.target.value)} placeholder="Supabase Auth UUID" className="bg-white/5 text-white border-white/10" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="text-white/70 border-white/20" />}>Cancel</DialogClose>
            <Button onClick={handleUpdate} className="text-white" style={{ backgroundColor: teal }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ─── Assessment Cycles Tab ──────────────────────────────────────────────────
function CyclesTab() {
  const [cycles, setCycles] = useState<AssessmentCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formQuarter, setFormQuarter] = useState('1')
  const [formYear, setFormYear] = useState('2025')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')

  const fetchCycles = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('dept_assessment_cycles').select('*')
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })
    if (error) { toast.error('Failed to load cycles'); return }
    setCycles(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCycles() }, [fetchCycles])

  async function handleCreate() {
    if (!formName.trim()) { toast.error('Name is required'); return }
    if (!formStart || !formEnd) { toast.error('Date range is required'); return }
    const supabase = createClient()
    const { error } = await supabase.from('dept_assessment_cycles').insert({
      name: formName.trim(),
      quarter: parseInt(formQuarter),
      year: parseInt(formYear),
      status: 'draft',
      starts_at: formStart,
      ends_at: formEnd,
    })
    if (error) { toast.error('Failed to create cycle'); return }
    toast.success('Cycle created')
    setAddOpen(false)
    fetchCycles()
  }

  async function toggleStatus(cycle: AssessmentCycle) {
    const supabase = createClient()
    const nextStatus = cycle.status === 'draft' ? 'active' : cycle.status === 'active' ? 'closed' : 'draft'

    // If activating, deactivate all other cycles first
    if (nextStatus === 'active') {
      const { error: deactErr } = await supabase
        .from('dept_assessment_cycles')
        .update({ status: 'closed' })
        .eq('status', 'active')
      if (deactErr) { toast.error('Failed to deactivate other cycles'); return }
    }

    const { error } = await supabase
      .from('dept_assessment_cycles')
      .update({ status: nextStatus })
      .eq('id', cycle.id)

    if (error) { toast.error('Failed to update status'); return }
    toast.success(`Cycle status changed to ${nextStatus}`)
    fetchCycles()
  }

  function statusBadge(status: string) {
    const colors: Record<string, { bg: string; text: string }> = {
      draft: { bg: '#F3CF4F22', text: '#F3CF4F' },
      active: { bg: '#22C55E22', text: '#22C55E' },
      closed: { bg: '#DC262622', text: '#DC2626' },
    }
    const c = colors[status] ?? colors.draft
    return <Badge variant="secondary" style={{ backgroundColor: c.bg, color: c.text }}>{status}</Badge>
  }

  return (
    <Card className="border" style={cardStyle}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Assessment Cycles</CardTitle>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button size="sm" className="text-white" style={{ backgroundColor: teal }} />}>
            + New Cycle
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" style={{ backgroundColor: navy, borderColor: `${teal}55` }}>
            <DialogHeader>
              <DialogTitle className="text-white">Create Assessment Cycle</DialogTitle>
              <DialogDescription className="text-white/60">Define a new assessment cycle.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label className="text-white/80">Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Q1 2025 Assessment" className="bg-white/5 text-white border-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-white/80">Quarter</Label>
                  <Select value={formQuarter} onValueChange={(v) => v && setFormQuarter(v)}>
                    <SelectTrigger className="bg-white/5 text-white border-white/10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Q1</SelectItem>
                      <SelectItem value="2">Q2</SelectItem>
                      <SelectItem value="3">Q3</SelectItem>
                      <SelectItem value="4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-white/80">Year</Label>
                  <Input type="number" value={formYear} onChange={e => setFormYear(e.target.value)} className="bg-white/5 text-white border-white/10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-white/80">Start Date</Label>
                  <Input type="date" value={formStart} onChange={e => setFormStart(e.target.value)} className="bg-white/5 text-white border-white/10" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-white/80">End Date</Label>
                  <Input type="date" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="bg-white/5 text-white border-white/10" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" className="text-white/70 border-white/20" />}>Cancel</DialogClose>
              <Button onClick={handleCreate} className="text-white" style={{ backgroundColor: teal }}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-white/50 text-center py-8">Loading cycles...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className={headerCellClass}>Name</TableHead>
                <TableHead className={headerCellClass}>Quarter</TableHead>
                <TableHead className={headerCellClass}>Year</TableHead>
                <TableHead className={headerCellClass}>Status</TableHead>
                <TableHead className={headerCellClass}>Date Range</TableHead>
                <TableHead className={headerCellClass}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map(cycle => (
                <TableRow key={cycle.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className={cellClass}>{cycle.name}</TableCell>
                  <TableCell className={cellClass}>Q{cycle.quarter}</TableCell>
                  <TableCell className={cellClass}>{cycle.year}</TableCell>
                  <TableCell>{statusBadge(cycle.status)}</TableCell>
                  <TableCell className="text-white/60 text-xs">
                    {new Date(cycle.starts_at).toLocaleDateString()} - {new Date(cycle.ends_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="xs" variant="ghost" className="text-[#64C4DD] hover:text-white" onClick={() => toggleStatus(cycle)}>
                      {cycle.status === 'draft' ? 'Activate' : cycle.status === 'active' ? 'Close' : 'Reopen as Draft'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {cycles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white/40 py-8">No cycles found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Backfill Scores Tab ────────────────────────────────────────────────────
function BackfillTab() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [cycles, setCycles] = useState<AssessmentCycle[]>([])
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedCycle, setSelectedCycle] = useState('')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [deptRes, cycleRes] = await Promise.all([
        supabase.from('dept_departments').select('*').order('name'),
        supabase.from('dept_assessment_cycles').select('*').order('year', { ascending: false }).order('quarter', { ascending: false }),
      ])
      setDepartments(deptRes.data ?? [])
      setCycles(cycleRes.data ?? [])
      setLoadingData(false)
    }
    load()
  }, [])

  // Load existing scores when selection changes
  useEffect(() => {
    if (!selectedDept || !selectedCycle) return
    async function loadScores() {
      const supabase = createClient()
      const { data } = await supabase
        .from('dept_dimension_scores')
        .select('dimension, score')
        .eq('department_id', selectedDept)
        .eq('cycle_id', selectedCycle)
      const scoreMap: Record<string, number> = {}
      DIMENSIONS.forEach(d => { scoreMap[d] = 0 })
      data?.forEach(row => { scoreMap[row.dimension] = row.score })
      setScores(scoreMap)
    }
    loadScores()
  }, [selectedDept, selectedCycle])

  async function handleSave() {
    if (!selectedDept || !selectedCycle) { toast.error('Select department and cycle'); return }
    setSaving(true)

    const records = DIMENSIONS.map(dim => ({
      department_id: selectedDept,
      cycle_id: selectedCycle,
      dimension: dim,
      score: scores[dim] ?? 0,
      assessor: 'executive' as const,
    }))

    const supabase = createClient()
    const { error } = await supabase.from('dept_dimension_scores').upsert(records, {
      onConflict: 'department_id,cycle_id,dimension,assessor',
    })

    setSaving(false)
    if (error) { toast.error('Failed to save scores'); return }
    toast.success('Scores saved successfully')
  }

  return (
    <Card className="border" style={cardStyle}>
      <CardHeader>
        <CardTitle className="text-white">Backfill Scores</CardTitle>
        <p className="text-white/50 text-xs">Quick-enter dimension scores for historical data (e.g. 2025 quarters).</p>
      </CardHeader>
      <CardContent>
        {loadingData ? (
          <p className="text-white/50 text-center py-8">Loading...</p>
        ) : (
          <div className="space-y-6">
            {/* Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-white/80">Department</Label>
                <Select value={selectedDept} onValueChange={(v) => v && setSelectedDept(v)}>
                  <SelectTrigger className="bg-white/5 text-white border-white/10 w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/80">Cycle</Label>
                <Select value={selectedCycle} onValueChange={(v) => v && setSelectedCycle(v)}>
                  <SelectTrigger className="bg-white/5 text-white border-white/10 w-full">
                    <SelectValue placeholder="Select cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} (Q{c.quarter} {c.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Score Grid */}
            {selectedDept && selectedCycle && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  {DIMENSIONS.map(dim => (
                    <div key={dim} className="grid grid-cols-[1fr_120px] gap-4 items-center py-1.5 px-3 rounded-lg" style={{ backgroundColor: `${navy}CC`, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-white/90 text-sm">{dim}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          step={0.5}
                          value={scores[dim] ?? 0}
                          onChange={e => setScores(prev => ({ ...prev, [dim]: parseFloat(e.target.value) || 0 }))}
                          className="bg-white/5 text-white border-white/10 text-center h-8 w-20"
                        />
                        <span className="text-white/30 text-xs">/5</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={saving} className="text-white px-6" style={{ backgroundColor: teal }}>
                    {saving ? 'Saving...' : 'Save Scores'}
                  </Button>
                </div>
              </div>
            )}

            {(!selectedDept || !selectedCycle) && (
              <p className="text-white/30 text-center py-8">Select a department and cycle to enter scores.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Users Tab ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('dept_departments').select('*').order('name')
      setDepartments(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Card className="border" style={cardStyle}>
      <CardHeader>
        <CardTitle className="text-white">Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: `${teal}11`, border: `1px solid ${teal}33` }}>
          <p className="text-white/70 text-sm">
            User management is handled via Supabase Auth. Link users to departments by updating <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: `${teal}22`, color: teal }}>leader_user_id</code> in the Departments tab.
          </p>
        </div>
        {loading ? (
          <p className="text-white/50 text-center py-8">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className={headerCellClass}>Department</TableHead>
                <TableHead className={headerCellClass}>Type</TableHead>
                <TableHead className={headerCellClass}>Leader Name</TableHead>
                <TableHead className={headerCellClass}>Leader Email</TableHead>
                <TableHead className={headerCellClass}>Auth User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map(dept => (
                <TableRow key={dept.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className={cellClass}>{dept.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs" style={{ backgroundColor: `${teal}22`, color: teal }}>
                      {dept.department_type}
                    </Badge>
                  </TableCell>
                  <TableCell className={cellClass}>{dept.leader_name ?? '--'}</TableCell>
                  <TableCell className="text-white/60 text-xs">{dept.leader_email ?? '--'}</TableCell>
                  <TableCell className="text-white/40 text-xs font-mono">
                    {dept.leader_user_id ? dept.leader_user_id.slice(0, 8) + '...' : '--'}
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-white/40 py-8">No departments found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Admin Page ────────────────────────────────────────────────────────
export default function AdminPage() {
  const { isAdmin, loading } = useIsAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/')
    }
  }, [isAdmin, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0F1E' }}>
        <div className="text-white/50 text-sm">Verifying admin access...</div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0A0F1E' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Panel</h1>
            <p className="text-white/40 text-sm mt-1">Department Performance & OKR Management</p>
          </div>
          <Badge variant="secondary" className="text-xs px-3 py-1" style={{ backgroundColor: `${teal}22`, color: teal }}>
            kbrown@usdm.com
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="departments">
          <TabsList className="bg-transparent border rounded-lg gap-0" style={{ borderColor: `${teal}33` }}>
            <TabsTrigger
              value="departments"
              className="data-active:text-white text-white/50 data-active:bg-[#64C4DD]/15 rounded-lg"
            >
              Departments
            </TabsTrigger>
            <TabsTrigger
              value="cycles"
              className="data-active:text-white text-white/50 data-active:bg-[#64C4DD]/15 rounded-lg"
            >
              Assessment Cycles
            </TabsTrigger>
            <TabsTrigger
              value="backfill"
              className="data-active:text-white text-white/50 data-active:bg-[#64C4DD]/15 rounded-lg"
            >
              Backfill Scores
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-active:text-white text-white/50 data-active:bg-[#64C4DD]/15 rounded-lg"
            >
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departments">
            <DepartmentsTab />
          </TabsContent>
          <TabsContent value="cycles">
            <CyclesTab />
          </TabsContent>
          <TabsContent value="backfill">
            <BackfillTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
