'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Department, AssessmentCycle } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

export function useIsAdmin() {
  const { user, loading } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) { setIsAdmin(false); setAdminLoading(false); return }
    const supabase = createClient()
    supabase.from('dept_departments').select('leader_email').eq('leader_email', 'kbrown@usdm.com').then(({ data }) => {
      // If user can see kbrown@usdm.com record, they might be admin
      // Check user email directly
      const adminEmails = ['kbrown@usdm.com', 'jmorgan@usdm.com']
      setIsAdmin(adminEmails.includes(user.email ?? ''))
      setAdminLoading(false)
    })
  }, [user, loading])

  return { isAdmin, loading: loading || adminLoading, user }
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('dept_departments').select('*').order('name').then(({ data, error }) => {
      if (data) setDepartments(data)
      setLoading(false)
    })
  }, [])

  return { departments, loading }
}

export function useCycles() {
  const [cycles, setCycles] = useState<AssessmentCycle[]>([])
  const [selectedCycle, setSelectedCycle] = useState<AssessmentCycle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchCycles = async () => {
      const { data: cycleData } = await supabase
        .from('dept_assessment_cycles')
        .select('*')
        .order('year', { ascending: false })
        .order('quarter', { ascending: false })

      if (!cycleData || cycleData.length === 0) {
        setLoading(false)
        return
      }

      setCycles(cycleData)

      // Try active cycle first
      const active = cycleData.find(c => c.status === 'active')
      if (active) {
        // Check if active cycle has scores
        const { count } = await supabase
          .from('dept_dimension_scores')
          .select('id', { count: 'exact', head: true })
          .eq('cycle_id', active.id)

        if (count && count > 0) {
          setSelectedCycle(active)
          setLoading(false)
          return
        }
      }

      // Active cycle empty — find most recent cycle with scores
      for (const cycle of cycleData) {
        const { count } = await supabase
          .from('dept_dimension_scores')
          .select('id', { count: 'exact', head: true })
          .eq('cycle_id', cycle.id)

        if (count && count > 0) {
          setSelectedCycle(cycle)
          setLoading(false)
          return
        }
      }

      // No scores anywhere — default to active or first
      setSelectedCycle(active || cycleData[0])
      setLoading(false)
    }

    fetchCycles()
  }, [])

  return { cycles, activeCycle: selectedCycle, setActiveCycle: setSelectedCycle, loading }
}
