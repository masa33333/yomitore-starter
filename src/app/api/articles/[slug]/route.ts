import { NextResponse } from 'next/server'
import { createSafeSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase'

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const anon = createSafeSupabaseClient()
  const supabase = anon ?? createServiceSupabaseClient()
  if (!supabase) {
    if (process.env.NODE_ENV !== 'production') {
      const article: any = {
        id: 'sample-1', slug: 'sample-daily', title: 'Sample Daily Title', category: 'lifehack', published_at: new Date().toISOString(), status: 'published',
        article_levels: [
          { id: 'lvl-1', level: 1, word_count: 100 },
          { id: 'lvl-2', level: 2, word_count: 150 },
          { id: 'lvl-3', level: 3, word_count: 200 },
        ],
      }
      return NextResponse.json({ article })
    }
    return NextResponse.json({ article: null })
  }

  const { data: articles, error } = await supabase
    .from('articles')
    .select('*, article_levels(level, word_count, id)')
    .eq('slug', params.slug)
    .limit(1)

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      const article: any = {
        id: 'sample-1', slug: 'sample-daily', title: 'Sample Daily Title', category: 'lifehack', published_at: new Date().toISOString(), status: 'published',
        article_levels: [
          { id: 'lvl-1', level: 1, word_count: 100 },
          { id: 'lvl-2', level: 2, word_count: 150 },
          { id: 'lvl-3', level: 3, word_count: 200 },
        ],
      }
      return NextResponse.json({ article })
    }
    return NextResponse.json({ article: null })
  }
  if (!articles || articles.length === 0) return NextResponse.json({ article: null }, { status: 200 })

  const article = articles[0]
  return NextResponse.json({ article })
}
