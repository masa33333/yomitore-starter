import { NextResponse } from 'next/server'
import { createSafeSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase'
import type { DailyTodayResponse, Article, ArticleLevel } from '@/types/daily'

function getTZParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortOffset',
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  // en-CA order: YYYY-MM-DD, parse integers
  const [year, month, day] = (map.year + '-' + map.month + '-' + map.day).split('-').map(Number)
  // timeZoneName like GMT+9
  const offStr = map.timeZoneName || 'GMT+0'
  const m = offStr.match(/GMT([+\-])(\d{1,2})(?::?(\d{2}))?/)
  let offsetMinutes = 0
  if (m) {
    const sign = m[1] === '-' ? -1 : 1
    const hh = parseInt(m[2] || '0', 10)
    const mm = parseInt(m[3] || '0', 10)
    offsetMinutes = sign * (hh * 60 + mm)
  } else if (timeZone === 'Asia/Tokyo') {
    offsetMinutes = 9 * 60
  }
  return { year, month, day, offsetMinutes }
}

// Fetch today's article (latest published) and its levels.
// Note: For initial implementation, we select the latest published article.
// If strict timezone-window filtering is required, we can extend this to
// compute start/end of "today" in TIMEZONE and filter by published_at.

export async function GET(request: Request) {
  // Prefer anon client for public reads; fallback to service if needed.
  const anon = createSafeSupabaseClient()
  const supabase = anon ?? createServiceSupabaseClient()

  if (!supabase) {
    // Graceful fallback with mock content in dev
    if (process.env.NODE_ENV !== 'production') {
      const mockArticle = {
        id: 'sample-1',
        slug: 'sample-daily',
        title: 'Sample Daily Title',
        category: 'lifehack',
        tags: ['focus','productivity'],
        published_at: new Date().toISOString(),
        status: 'published',
        hero_image_url: null,
        source_refs: [],
      }
      const mk = (lvl: 1|2|3, wc: number, secs: number, md: string) => ({ id: `lvl-${lvl}`, article_id: 'sample-1', level: lvl, word_count: wc, reading_time_sec: secs, body_md: md, audio_url: null })
      return NextResponse.json({
        article: mockArticle,
        levels: {
          '1': mk(1, 100, 150, '# Focus Better (L1)\nToday, try a simple focus plan. Put your phone in another room. Choose one small task you can finish. Work for twenty minutes, then take a short break. Use paper to note ideas so you do not check apps. Keep your desk clear. When your mind wanders, gently come back to the task. After the break, check your progress and start another small block. These short wins build confidence and help your brain stay calm. If a task feels big, split it into two or three steps. Celebrate small steps. Focus is a habit you grow every day.'),
          '2': mk(2, 150, 210, '## Improve Focus (L2)\nMany people struggle to focus because they mix planning and doing. To improve, separate the two. Spend five minutes to plan a single clear outcome. Then protect a focused block of twenty-five minutes. During the block, remove choices: silence your phone, close extra tabs, and keep only one file open. When new ideas appear, write them on a sticky note and return to the task. After the block, take a short walk or stretch. Review: What moved forward? What blocked you? If the task still feels heavy, lower the difficulty or reduce the scope. Repeating this cycle grows self-trust, and self-trust reduces stress, which further improves focus.'),
          '3': mk(3, 200, 270, '## Sustain Attention (L3)\nSustained attention is not a fixed talent but a system you design. First, define a why: a personal reason that makes the work meaningful right now. Meaning acts like fuel, keeping the engine running when friction appears. Next, design a small ritual to enter focus: the same seat, the same cup of tea, the same song without lyrics. Your brain learns these signals and begins to switch modes more quickly. Then, set a challenge that is just above your comfort level. Too easy invites boredom; too hard invites avoidance. During work, expect distractions; when they arise, label them and gently return. Finally, add a short reflection: What helped today? What tiny change could make the next block easier? Over weeks, this loop builds endurance and a calmer mind.'),
        }
      })
    }
    return NextResponse.json({ article: null, levels: { '1': null, '2': null, '3': null } })
  }

  // Determine today's window in configured TIMEZONE
  const TZ = process.env.TIMEZONE || 'Asia/Tokyo'
  const now = new Date()
  const { year, month, day, offsetMinutes } = getTZParts(now, TZ)
  const startUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMinutes * 60 * 1000)
  const endUtc = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0) - 1 - offsetMinutes * 60 * 1000)

  // Get today's published article (latest within window)
  let { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .gte('published_at', startUtc.toISOString())
    .lte('published_at', endUtc.toISOString())
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(1)

  // Fallback: if none found (e.g., no article today), return latest published overall
  if (!articlesError && (!articles || articles.length === 0)) {
    const fallback = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(1)
    articles = fallback.data || null
    articlesError = fallback.error || null
  }

  if (articlesError) {
    if (process.env.NODE_ENV !== 'production') {
      // return mock as above
      const mockArticle = {
        id: 'sample-1', slug: 'sample-daily', title: 'Sample Daily Title', category: 'lifehack',
        tags: ['focus','productivity'], published_at: new Date().toISOString(), status: 'published', hero_image_url: null, source_refs: [],
      }
      const mk = (lvl: 1|2|3, wc: number, secs: number, md: string) => ({ id: `lvl-${lvl}`, article_id: 'sample-1', level: lvl, word_count: wc, reading_time_sec: secs, body_md: md, audio_url: null })
      return NextResponse.json({
        article: mockArticle,
        levels: {
          '1': mk(1, 100, 150, '# Focus Better (L1)\nToday, try a simple focus plan. Put your phone in another room. Choose one small task you can finish. Work for twenty minutes, then take a short break. Use paper to note ideas so you do not check apps. Keep your desk clear. When your mind wanders, gently come back to the task. After the break, check your progress and start another small block. These short wins build confidence and help your brain stay calm. If a task feels big, split it into two or three steps. Celebrate small steps. Focus is a habit you grow every day.'),
          '2': mk(2, 150, 210, '## Improve Focus (L2)\nMany people struggle to focus because they mix planning and doing. To improve, separate the two. Spend five minutes to plan a single clear outcome. Then protect a focused block of twenty-five minutes. During the block, remove choices: silence your phone, close extra tabs, and keep only one file open. When new ideas appear, write them on a sticky note and return to the task. After the block, take a short walk or stretch. Review: What moved forward? What blocked you? If the task still feels heavy, lower the difficulty or reduce the scope. Repeating this cycle grows self-trust, and self-trust reduces stress, which further improves focus.'),
          '3': mk(3, 200, 270, '## Sustain Attention (L3)\nSustained attention is not a fixed talent but a system you design. First, define a why: a personal reason that makes the work meaningful right now. Meaning acts like fuel, keeping the engine running when friction appears. Next, design a small ritual to enter focus: the same seat, the same cup of tea, the same song without lyrics. Your brain learns these signals and begins to switch modes more quickly. Then, set a challenge that is just above your comfort level. Too easy invites boredom; too hard invites avoidance. During work, expect distractions; when they arise, label them and gently return. Finally, add a short reflection: What helped today? What tiny change could make the next block easier? Over weeks, this loop builds endurance and a calmer mind.'),
        }
      })
    }
    return NextResponse.json({ article: null, levels: { '1': null, '2': null, '3': null } })
  }

  if (!articles || articles.length === 0) {
    const empty: DailyTodayResponse = {
      article: null,
      levels: { '1': null, '2': null, '3': null }
    }
    return NextResponse.json(empty)
  }

  const article = articles[0] as Article

  const { data: levels, error: levelsError } = await supabase
    .from('article_levels')
    .select('*')
    .eq('article_id', article.id)

  if (levelsError) {
    return NextResponse.json({ article, levels: { '1': null, '2': null, '3': null } })
  }

  const grouped: Record<'1' | '2' | '3', ArticleLevel | null> = {
    '1': null,
    '2': null,
    '3': null,
  }
  levels?.forEach((l: any) => {
    const key = String(l.level) as '1' | '2' | '3'
    grouped[key] = l as ArticleLevel
  })

  const response: DailyTodayResponse = { article, levels: grouped }

  return NextResponse.json(response)
}
