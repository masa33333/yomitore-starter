import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function GET(req: Request) {
  const adminKey = process.env.ADMIN_SECRET
  const headerKey = req.headers.get('x-admin-key') || ''
  if (!adminKey || headerKey !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  // Promote scheduled → published if time has come
  const { error } = await supabase.rpc('publish_due_articles')
  if (error) {
    // Fallback if RPC not present: do plain update
    const upd = await supabase
      .from('articles')
      .update({ status: 'published' })
      .eq('status', 'scheduled')
      .lte('published_at', new Date().toISOString())
    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 })
  }

  try {
    revalidatePath('/')
    revalidatePath('/daily')
  } catch {}

  return NextResponse.json({ ok: true })
}

