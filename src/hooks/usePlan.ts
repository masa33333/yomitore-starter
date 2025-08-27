import { useEffect, useState } from 'react'
import { createSafeSupabaseClient } from '@/lib/supabase'

export type Plan = 'free' | 'pro' | 'plus'

export function usePlan() {
  const [plan, setPlan] = useState<Plan>('free')
  const [loading, setLoading] = useState(false)
  const supabase = createSafeSupabaseClient()

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const { data } = (await supabase?.auth.getSession()) || { data: null }
        const accessToken = data?.session?.access_token
        const res = await fetch('/api/settings/subscription', {
          cache: 'no-store',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        })
        const j = await res.json()
        if (!cancelled && j?.plan) setPlan(j.plan)
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { plan, loading }
}
