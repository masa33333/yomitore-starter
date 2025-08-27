import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { getUserIdFromRequest } from '@/lib/auth'

function getLocalDateString(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  // en-CA -> YYYY-MM-DD
  return fmt.format(date)
}

export async function POST(req: Request) {
  const supabase = createServiceSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const body = await req.json().catch(() => ({}))
  const userId = await getUserIdFromRequest(req)
  const { read_id, article_id, level, seconds, words_read } = body

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const lvl = Number(level)
  if (!article_id || ![1, 2, 3].includes(lvl)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const sec = Math.max(1, Number(seconds) || 1)
  const words = Math.max(0, Number(words_read) || 0)
  const wpm = Math.round((words / sec) * 60)

  // Upsert read record
  let finalReadId = read_id
  if (!finalReadId) {
    const ins = await supabase
      .from('user_reads')
      .insert({ user_id: userId, article_id, level: lvl, words_read: words, wpm, finished_at: new Date().toISOString() })
      .select('id')
      .single()
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })
    finalReadId = ins.data.id
  } else {
    const upd = await supabase
      .from('user_reads')
      .update({ words_read: words, wpm, finished_at: new Date().toISOString(), level: lvl })
      .eq('id', finalReadId)
    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 })
  }

  // Update streak based on finished_at in TIMEZONE
  const tz = process.env.TIMEZONE || 'Asia/Tokyo'
  const now = new Date()
  const todayLocal = getLocalDateString(now, tz)
  const yesterdayLocal = getLocalDateString(new Date(now.getTime() - 24 * 60 * 60 * 1000), tz)

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!streak) {
    await supabase
      .from('user_streaks')
      .upsert({ user_id: userId, current_streak: 1, longest_streak: 1, last_read_date: todayLocal })
  } else {
    const last: string | null = streak.last_read_date
    let current = streak.current_streak || 0
    if (last === todayLocal) {
      // same-day completion: keep streak
      current = streak.current_streak || 1
    } else if (last === yesterdayLocal) {
      // contiguous day
      current = (streak.current_streak || 0) + 1
    } else {
      // broken streak
      current = 1
    }
    const longest = Math.max(streak.longest_streak || 0, current)
    await supabase
      .from('user_streaks')
      .upsert({ user_id: userId, current_streak: current, longest_streak: longest, last_read_date: todayLocal })
  }

  return NextResponse.json({ read_id: finalReadId, wpm })
}
