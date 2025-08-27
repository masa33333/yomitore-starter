import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_SECRET
  const headerKey = req.headers.get('x-admin-key') || ''
  if (!adminKey || headerKey !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const slug = 'sample-daily'
  const nowIso = new Date().toISOString()

  // Upsert article
  const { data: art, error: artErr } = await supabase
    .from('articles')
    .upsert({ slug, title: 'Sample Daily Title', category: 'lifehack', tags: ['focus','productivity'], published_at: nowIso, status: 'published' }, { onConflict: 'slug' })
    .select('*')
    .single()

  if (artErr) return NextResponse.json({ error: artErr.message }, { status: 500 })

  const articleId = art.id

  // Ensure levels 1/2/3 exist
  const levels = [
    { level: 1, word_count: 80, reading_time_sec: 120, body_md: '# Focus Better\n- Keep your phone away.\n- Work in short blocks.\nTry it today.' },
    { level: 2, word_count: 105, reading_time_sec: 150, body_md: '## Improve Focus\nBecause our attention is limited, short breaks help. However, deep work needs quiet time.\nTherefore, plan 25 minutes and one clear goal.' },
    { level: 3, word_count: 125, reading_time_sec: 180, body_md: '## Sustain Attention\nAttention drifts when tasks lack challenge or meaning. Consider adjusting the difficulty, adding a personal reason, and reflecting briefly at the end. Ask: What improved today?' },
  ]

  for (const l of levels) {
    const { error: upErr } = await supabase
      .from('article_levels')
      .upsert({ article_id: articleId, level: l.level, word_count: l.word_count, reading_time_sec: l.reading_time_sec, body_md: l.body_md }, { onConflict: 'article_id,level' })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, slug, article_id: articleId })
}

