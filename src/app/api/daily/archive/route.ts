import { NextResponse } from 'next/server'
import { createSafeSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase'

function getOffsetMinutes(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    timeZoneName: 'shortOffset',
  })
  const parts = dtf.formatToParts(date)
  const name = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+0'
  const m = name.match(/GMT([+\-])(\d{1,2})(?::?(\d{2}))?/)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  const hh = parseInt(m[2] || '0', 10)
  const mm = parseInt(m[3] || '0', 10)
  return sign * (hh * 60 + mm)
}

// GET /api/daily/archive?limit=20&offset=0&category=&level=&query=&month=YYYY-MM
export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit') ?? 20)
  const offset = Number(url.searchParams.get('offset') ?? 0)
  const category = url.searchParams.get('category') || undefined
  const level = url.searchParams.get('level') as string | null
  const query = url.searchParams.get('query') || undefined
  const month = url.searchParams.get('month') || undefined // YYYY-MM

  const anon = createSafeSupabaseClient()
  const supabase = anon ?? createServiceSupabaseClient()
  if (!supabase) {
    // Graceful fallback without DB
    if (process.env.NODE_ENV !== 'production') {
      const item = { id: 'sample-1', slug: 'sample-daily', title: 'Sample Daily Title', category: 'lifehack', published_at: new Date().toISOString() }
      return NextResponse.json({ items: [item], total: 1 })
    }
    return NextResponse.json({ items: [], total: 0 })
  }

  const select = level && ['1', '2', '3'].includes(level as string)
    ? '*, article_levels!inner(level, word_count)'
    : '*, article_levels(level, word_count)'

  // Base query: published articles
  let q = supabase
    .from('articles')
    .select(select as any, { count: 'exact' })
    .eq('status', 'published')

  if (category) q = q.eq('category', category)
  if (query) q = q.ilike('title', `%${query}%`)

  // Month filter (YYYY-MM) using timestamptz range; we do UTC range for simplicity here.
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const TZ = process.env.TIMEZONE || 'Asia/Tokyo'
    const [y, m] = month.split('-').map(Number)
    const firstLocal = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0))
    const lastLocal = new Date(Date.UTC(y, m, 0, 0, 0, 0, 0))
    const offStart = getOffsetMinutes(firstLocal, TZ)
    const offEnd = getOffsetMinutes(lastLocal, TZ)
    const startUtc = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0) - offStart * 60 * 1000).toISOString()
    const endUtc = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999) - offEnd * 60 * 1000).toISOString()
    q = q.gte('published_at', startUtc).lte('published_at', endUtc)
  }

  // Level filter
  if (level && ['1', '2', '3'].includes(level as string)) {
    q = q.eq('article_levels.level', Number(level))
  }

  q = q.order('published_at', { ascending: false })
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      const item = { id: 'sample-1', slug: 'sample-daily', title: 'Sample Daily Title', category: 'lifehack', published_at: new Date().toISOString() }
      return NextResponse.json({ items: [item], total: 1 })
    }
    return NextResponse.json({ items: [], total: 0 })
  }

  return NextResponse.json({ items: data ?? [], total: count ?? 0 })
}
