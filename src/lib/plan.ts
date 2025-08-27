import { createServiceSupabaseClient } from '@/lib/supabase'
import { getUserIdFromRequest } from '@/lib/auth'

export type Plan = 'free' | 'pro' | 'plus'

export async function getUserPlanOrDefault(req: Request): Promise<Plan> {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return 'free'
  const supabase = createServiceSupabaseClient()
  if (!supabase) return 'free'
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .single()
  const plan = (data?.plan as Plan | undefined) || 'free'
  return plan
}

