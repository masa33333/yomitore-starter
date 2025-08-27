import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { getUserIdFromRequest } from '@/lib/auth'

// GET current user's subscription (plan + email prefs)
export async function GET(req: Request) {
  const userId = (await getUserIdFromRequest(req)) || ''
  if (!userId) {
    return NextResponse.json({ plan: 'free', email_opt_in: false, preferred_time: null, level_pref: [1] })
  }

  const supabase = createServiceSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ plan: 'free', email_opt_in: false, preferred_time: null, level_pref: [1] })
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, email_opt_in, preferred_time, level_pref')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return NextResponse.json({ plan: 'free', email_opt_in: false, preferred_time: null, level_pref: [1] })
  }
  return NextResponse.json(data)
}

// POST upsert current user's subscription
export async function POST(req: Request) {
  const userId = (await getUserIdFromRequest(req)) || ''
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const plan = body.plan as string | undefined
  const email_opt_in = !!body.email_opt_in
  const preferred_time = body.preferred_time || null
  const level_pref = Array.isArray(body.level_pref) ? body.level_pref : null

  const allowedPlans = ['free', 'pro', 'plus']
  const finalPlan = allowedPlans.includes(plan || '') ? plan : 'free'

  const supabase = createServiceSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const { error } = await supabase
    .from('subscriptions')
    .upsert({ user_id: userId, plan: finalPlan, email_opt_in, preferred_time, level_pref }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, saved: true })
}
