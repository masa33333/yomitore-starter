'use client'

import { use, useEffect, useMemo, useRef, useState } from 'react'

type LevelKey = '1' | '2' | '3'

import { simpleMarkdownToHtml, markdownToPlainText } from '@/lib/markdown'
import { track } from '@/lib/analytics'

export default function DailyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [meta, setMeta] = useState<any | null>(null)
  const [levelKey, setLevelKey] = useState<LevelKey>('1')
  const [levelData, setLevelData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ttsLoading, setTtsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/articles/${slug}`, { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        setMeta(json.article)
        if (json.article?.id) track('daily_opened', { from: 'daily', article_id: json.article.id })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    let cancelled = false
    const loadLevel = async () => {
      if (!meta) return
      const res = await fetch(`/api/articles/${slug}/level/${levelKey}`, { cache: 'no-store' })
      const json = await res.json()
      if (!cancelled) setLevelData(json.level || null)
    }
    loadLevel()
    return () => {
      cancelled = true
    }
  }, [meta, levelKey, slug])

  const words = useMemo(() => levelData?.word_count ?? 0, [levelData])

  const onStart = () => {
    startRef.current = Date.now()
  }

  const onFinish = async () => {
    const start = startRef.current
    const seconds = start ? Math.max(1, Math.round((Date.now() - start) / 1000)) : 60
    const wpm = Math.round((words / seconds) * 60)
    setSaving(true)
    try {
      // Try to persist; if API returns 401, ignore gracefully
      const body = {
        article_id: meta?.id,
        level: Number(levelKey),
        seconds,
        words_read: words,
      }
      // Include access token if available for authenticated save
      let headers: Record<string, string> = { 'Content-Type': 'application/json' }
      try {
        const { createSafeSupabaseClient } = await import('@/lib/supabase')
        const supabase = createSafeSupabaseClient()
        const { data } = await supabase?.auth.getSession()!
        const token = data?.session?.access_token
        if (token) headers = { ...headers, Authorization: `Bearer ${token}` }
      } catch {}
      const res = await fetch('/api/reads/finish', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        console.warn('Finish not saved (likely unauthenticated).')
      }
      track('daily_completed', { article_id: meta?.id, level: Number(levelKey), seconds, wpm })
      alert(`完了！WPM: ${wpm}`)
    } finally {
      setSaving(false)
    }
  }

  const onTts = async () => {
    if (!levelData || !meta) return
    if (audioRef.current && isPlaying) { audioRef.current.pause(); setIsPlaying(false); return }
    try {
      setTtsLoading(true)
      const text = markdownToPlainText(levelData.body_md).slice(0, 4000)
      const contentId = `${meta.id}_L${levelKey}`
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, contentId }),
      })
      const json = await res.json()
      if (json.audioUrl) {
        if (!audioRef.current) audioRef.current = new Audio()
        audioRef.current.src = json.audioUrl
        await audioRef.current.play()
        setIsPlaying(true)
        audioRef.current.onended = () => setIsPlaying(false)
      }
    } finally {
      setTtsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <a href="/daily" className="text-sm text-blue-600 hover:underline">← Daily</a>
      {loading && <p className="text-gray-500">Loading…</p>}
      {!loading && meta && (
        <div>
          <h1 className="text-2xl font-semibold mb-1">{meta.title}</h1>
          <p className="text-sm text-gray-600 mb-3">Category: {meta.category}</p>

          <div className="mb-3 flex gap-2">
            {(['1', '2', '3'] as const).map(k => (
              <button
                key={k}
                className={`px-3 py-1 rounded border ${levelKey === k ? 'bg-blue-600 text-white' : 'bg-white'}`}
                onClick={() => { setLevelKey(k); track('daily_level_switched', { from_level: levelKey, to_level: k }) }}
              >
                L{k}
              </button>
            ))}
          </div>

          {levelData ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Words: {levelData.word_count}</div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(levelData.body_md) }}
              />
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded bg-gray-200" onClick={onStart}>
                  Start
                </button>
                <button
                  className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
                  onClick={onFinish}
                  disabled={saving}
                >
                  Finish
                </button>
                <a
                  className="px-3 py-1 rounded border"
                  href={`/reading?mode=daily&slug=${slug}&level=${levelKey}`}
                >
                  /readingで読む
                </a>
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                  onClick={onTts}
                  disabled={ttsLoading}
                >
                  {ttsLoading ? 'TTS生成中…' : isPlaying ? '停止する' : '読み上げる'}
                </button>
              </div>
              {/* plan gating disabled */}
            </div>
          ) : (
            <p className="text-gray-500">このレベルの本文は未準備です。</p>
          )}
        </div>
      )}
      {!loading && !meta && <p className="text-gray-500">記事が見つかりませんでした。</p>}
    </div>
  )
}
