import { NextResponse } from 'next/server'
import { createSafeSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase'

export async function GET(
  req: Request,
  context: { params: Promise<Record<string, string | string[] | undefined>> }
) {
  const { slug, level } = (await context.params) as { slug: string; level: string }
  const anon = createSafeSupabaseClient()
  const supabase = anon ?? createServiceSupabaseClient()
  if (!supabase) {
    if (process.env.NODE_ENV !== 'production') {
      const lvl = Number(level)
      const table: Record<number, any> = {
        1: { id: 'lvl-1', article_id: 'sample-1', level: 1, word_count: 100, reading_time_sec: 150, body_md: '# Morning Focus at a Café (L1)\nI go to a small café in the morning. I order hot tea and sit by the window. I put my phone in my bag. I choose one simple task. I write a short plan on paper. I work for twenty minutes. When new ideas appear, I write them on a note and keep working. After the timer rings, I stand, stretch, and take a short break. I look at my plan and check one small box. Then I start the next block. The same tea, the same seat, and the same steps help my mind stay calm and focused.' },
        2: { id: 'lvl-2', article_id: 'sample-1', level: 2, word_count: 150, reading_time_sec: 210, body_md: '## Morning Focus at a Café (L2)\nEach morning, I visit a quiet café and create a small ritual to enter focus: the same seat, a cup of hot tea, and a paper checklist. Before working, I write one clear outcome for the next twenty-five minutes. During the block, I remove extra choices: the phone stays in my bag, extra tabs are closed, and only one file is on screen. When new ideas appear, I park them on a sticky note and return to the task. After the timer rings, I stretch and review: What moved forward? What slowed me down? If the task still feels heavy, I reduce its scope or lower the difficulty. Repeating this routine builds trust in myself and keeps my attention steady.' },
        3: { id: 'lvl-3', article_id: 'sample-1', level: 3, word_count: 200, reading_time_sec: 270, body_md: '## Morning Focus at a Café (L3)\nTo sustain attention, I design a repeatable system around a familiar place—a quiet café. The ritual is simple but precise: the same corner table, a cup of tea without sugar, and a single-sheet checklist. Before starting, I define one outcome that would make the next block a win. This clarity reduces decision load, which is a common source of drift. During the twenty-five–minute block, I constrain options on purpose: the phone stays zipped in my bag, notifications are off, only one document is visible. When ideas or worries surface, I label them and capture them on a parking note. Labeling names the distraction and lowers its pull. After the timer, I stand, breathe, and debrief for one minute: What helped momentum? What tiny change could remove friction in the next block? If the task resists progress, I deliberately shrink its scope or add a concrete first sentence to unstick it. Over weeks, this consistent loop increases endurance, lowers stress, and makes deep work feel natural.' },
      }
      return NextResponse.json({ level: table[lvl] || null })
    }
    return NextResponse.json({ level: null })
  }

  const lvl = Number(level)
  if (![1, 2, 3].includes(lvl)) return NextResponse.json({ level: null })

  // No plan-based gating for now

  const { data: articles, error: artErr } = await supabase
    .from('articles')
    .select('id')
    .eq('slug', slug)
    .limit(1)

  if (artErr) {
    if (process.env.NODE_ENV !== 'production') {
      const lvl = Number(level)
      const table: Record<number, any> = {
        1: { id: 'lvl-1', article_id: 'sample-1', level: 1, word_count: 100, reading_time_sec: 150, body_md: '# Morning Focus at a Café (L1)\nI go to a small café in the morning. I order hot tea and sit by the window. I put my phone in my bag. I choose one simple task. I write a short plan on paper. I work for twenty minutes. When new ideas appear, I write them on a note and keep working. After the timer rings, I stand, stretch, and take a short break. I look at my plan and check one small box. Then I start the next block. The same tea, the same seat, and the same steps help my mind stay calm and focused.' },
        2: { id: 'lvl-2', article_id: 'sample-1', level: 2, word_count: 150, reading_time_sec: 210, body_md: '## Morning Focus at a Café (L2)\nEach morning, I visit a quiet café and create a small ritual to enter focus: the same seat, a cup of hot tea, and a paper checklist. Before working, I write one clear outcome for the next twenty-five minutes. During the block, I remove extra choices: the phone stays in my bag, extra tabs are closed, and only one file is on screen. When new ideas appear, I park them on a sticky note and return to the task. After the timer rings, I stretch and review: What moved forward? What slowed me down? If the task still feels heavy, I reduce its scope or lower the difficulty. Repeating this routine builds trust in myself and keeps my attention steady.' },
        3: { id: 'lvl-3', article_id: 'sample-1', level: 3, word_count: 200, reading_time_sec: 270, body_md: '## Morning Focus at a Café (L3)\nTo sustain attention, I design a repeatable system around a familiar place—a quiet café. The ritual is simple but precise: the same corner table, a cup of tea without sugar, and a single-sheet checklist. Before starting, I define one outcome that would make the next block a win. This clarity reduces decision load, which is a common source of drift. During the twenty-five–minute block, I constrain options on purpose: the phone stays zipped in my bag, notifications are off, only one document is visible. When ideas or worries surface, I label them and capture them on a parking note. Labeling names the distraction and lowers its pull. After the timer, I stand, breathe, and debrief for one minute: What helped momentum? What tiny change could remove friction in the next block? If the task resists progress, I deliberately shrink its scope or add a concrete first sentence to unstick it. Over weeks, this consistent loop increases endurance, lowers stress, and makes deep work feel natural.' },
      }
      return NextResponse.json({ level: table[lvl] || null })
    }
    return NextResponse.json({ level: null })
  }
  if (!articles || articles.length === 0) return NextResponse.json({ level: null })

  const articleId = articles[0].id
  const { data: levels, error: lvlErr } = await supabase
    .from('article_levels')
    .select('*')
    .eq('article_id', articleId)
    .eq('level', lvl)
    .limit(1)

  if (lvlErr) {
    if (process.env.NODE_ENV !== 'production') {
      const lvl = Number(level)
      const table: Record<number, any> = {
        1: { id: 'lvl-1', article_id: 'sample-1', level: 1, word_count: 80, reading_time_sec: 120, body_md: '# Focus Better\n- Keep your phone away.\n- Work in short blocks.\nTry it today.' },
        2: { id: 'lvl-2', article_id: 'sample-1', level: 2, word_count: 105, reading_time_sec: 150, body_md: '## Improve Focus\nBecause our attention is limited, short breaks help. However, deep work needs quiet time.\nTherefore, plan 25 minutes and one clear goal.' },
        3: { id: 'lvl-3', article_id: 'sample-1', level: 3, word_count: 125, reading_time_sec: 180, body_md: '## Sustain Attention\nAttention drifts when tasks lack challenge or meaning. Consider adjusting the difficulty, adding a personal reason, and reflecting briefly at the end. Ask: What improved today?' },
      }
      return NextResponse.json({ level: table[lvl] || null })
    }
    return NextResponse.json({ level: null })
  }
  if (!levels || levels.length === 0) return NextResponse.json({ level: null })

  return NextResponse.json({ level: levels[0] })
}
