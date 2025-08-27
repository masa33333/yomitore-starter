export type Category = 'lifehack' | 'health' | 'psychology' | 'business'

export interface Article {
  id: string
  slug: string
  title: string
  category: Category
  tags: string[]
  published_at: string | null
  status: 'draft' | 'scheduled' | 'published'
  hero_image_url?: string
  source_refs: any[]
}

export interface ArticleLevel {
  id: string
  article_id: string
  level: 1 | 2 | 3
  word_count: number
  reading_time_sec: number
  body_md: string
  audio_url?: string | null
  glossary?: any
}

export interface DailyTodayResponse {
  article: Article | null
  levels: Record<'1' | '2' | '3', ArticleLevel | null>
  userRead?: { started_at: string; finished_at?: string; level?: 1 | 2 | 3 }
}

