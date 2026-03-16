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
      setIsAdmin(user.email === 'kbrown@usdm.com')
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
  const [activeCycle, setActiveCycle] = useState<AssessmentCycle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('dept_assessment_cycles').select('*').order('year', { ascending: false }).order('quarter', { ascending: false }).then(({ data, error }) => {
      if (data) {
        setCycles(data)
        const active = data.find(c => c.status === 'active')
        setActiveCycle(active || data[0] || null)
      }
      setLoading(false)
    })
  }, [])

  return { cycles, activeCycle, loading }
}
