import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { getUserIdFromRequest } from '@/lib/auth'

export async function POST(req: Request) {
  const supabase = createServiceSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const body = await req.json().catch(() => ({}))
  const userId = await getUserIdFromRequest(req)
  const { article_id, level } = body

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!article_id || ![1, 2, 3].includes(Number(level))) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_reads')
    .insert({ user_id: userId, article_id, level: Number(level) })
    .select('id, started_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ read_id: data.id, started_at: data.started_at })
}
