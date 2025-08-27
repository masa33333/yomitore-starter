'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { DailyTodayResponse } from '@/types/daily'
import { simpleMarkdownToHtml, markdownToPlainText } from '@/lib/markdown'
import { formatInTimeZone } from '@/lib/datetime'
import { track } from '@/lib/analytics'

type Tab = 'today' | 'archive'

export default function DailyPage() {
  const [tab, setTab] = useState<Tab>('today')
  const [today, setToday] = useState<DailyTodayResponse | null>(null)
  const [archive, setArchive] = useState<{ items: any[]; total: number }>({ items: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [levelKey, setLevelKey] = useState<'1' | '2' | '3'>('1')
  const [category, setCategory] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [month, setMonth] = useState('') // YYYY-MM
  const [query, setQuery] = useState('')
  const [ttsLoading, setTtsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const archiveItems = archive?.items ?? []
  const archiveTotal = archive?.total ?? 0
  
  // Small inline component for load-more
  function ArchiveLoadMore({ currentCount, total, onLoad }: { currentCount: number; total: number; onLoad: () => Promise<void> }) {
    if (currentCount >= total) return null
    return (
      <div className="mt-2">
        <button className="px-3 py-1 rounded border" onClick={onLoad}>もっとみる</button>
        <span className="ml-2 text-sm text-gray-600">{currentCount} / {total}</span>
      </div>
    )
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', '10')
        if (category) params.set('category', category)
        if (levelFilter) params.set('level', levelFilter)
        if (month) params.set('month', month)
        if (query) params.set('query', query)

        const [tRes, aRes] = await Promise.all([
          fetch('/api/daily/today', { cache: 'no-store' }),
          fetch(`/api/daily/archive?${params.toString()}`, { cache: 'no-store' }),
        ])
        if (!cancelled) {
          const t = (await tRes.json()) as DailyTodayResponse
          const a = (await aRes.json()) as { items: any[]; total: number }
          setToday(t)
          setArchive(a)
          if (t?.article) track('daily_opened', { from: 'home', article_id: t.article.id })
          if (category || levelFilter || month || query) {
            track('archive_filter_used', { category, level: levelFilter, month, query })
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [category, levelFilter, month, query])

  const currentLevel = useMemo(() => today?.levels?.[levelKey] ?? null, [today, levelKey])

  async function handleTTS() {
    if (!currentLevel || !today?.article) return
    // no plan gating during initial testing
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }
    try {
      setTtsLoading(true)
      const text = markdownToPlainText(currentLevel.body_md).slice(0, 4000)
      const contentId = `${today.article.id}_L${levelKey}`
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
      <h1 className="text-2xl font-semibold mb-4">Daily Reading</h1>

      <div className="mb-4 flex gap-2">
        <button
          className={`px-3 py-1 rounded ${tab === 'today' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('today')}
        >
          今日
        </button>
        <button
          className={`px-3 py-1 rounded ${tab === 'archive' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('archive')}
        >
          アーカイブ
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading…</p>}

      {!loading && tab === 'today' && (
        <div>
          {today?.article ? (
            <div>
              <h2 className="text-xl font-medium">{today.article.title}</h2>
              <p className="text-sm text-gray-600 mb-3">Category: {today.article.category}</p>

              <div className="mb-3 flex gap-2">
                {(['1', '2', '3'] as const).map(k => (
                  <button
                    key={k}
                    className={`px-3 py-1 rounded border ${levelKey === k ? 'bg-blue-600 text-white' : 'bg-white'}`}
                    onClick={() => setLevelKey(k)}
                  >
                    L{k}
                  </button>
                ))}
              </div>

              {/* レベル選択のみ表示（本文は非表示） */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600">レベルを選んでから読むボタンを押してください。</p>
                <div className="flex gap-2">
                  <a
                    className="px-3 py-1 rounded bg-black text-white"
                    href={`/reading?mode=daily&slug=${today.article.slug}&level=${levelKey}`}
                  >
                    このレベルで読む
                  </a>
                  <a className="px-3 py-1 rounded border" href={`/daily/${today.article.slug}`}>
                    詳細を見る
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-500">本日の記事はまだ公開されていません（毎朝 07:00 JST 公開）。</p>
              {archiveItems.length > 0 && (
                <a
                  className="inline-block px-3 py-1 rounded border bg-white hover:bg-gray-50"
                  href={`/daily/${archiveItems[0].slug}`}
                >
                  最新のアーカイブを読む
                </a>
              )}
              <div className="text-xs text-gray-600">
                朝のメール通知を受け取りたい方は{' '}
                <a href="/settings/subscription" className="text-blue-600 underline">設定</a>
                から有効化してください。
              </div>
              <div className="pt-1">
                <button
                  className="px-3 py-1 rounded border text-sm"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/admin/seed-daily-local', { method: 'POST' })
                      const j = await res.json()
                      if (!res.ok) {
                        alert('シードに失敗しました: ' + (j?.error || res.status))
                        return
                      }
                      // re-fetch
                      const tRes = await fetch('/api/daily/today', { cache: 'no-store' })
                      const aRes = await fetch('/api/daily/archive?limit=10', { cache: 'no-store' })
                      const t = await tRes.json()
                      const a = await aRes.json()
                      setToday(t)
                      setArchive(a)
                    } catch (e) {
                      alert('シード呼び出しでエラーが発生しました')
                    }
                  }}
                >
                  （開発）サンプル記事を投入して読む
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'archive' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">カテゴリ</label>
              <select className="border rounded px-2 py-1" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">All</option>
                <option value="lifehack">lifehack</option>
                <option value="health">health</option>
                <option value="psychology">psychology</option>
                <option value="business">business</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">レベル</label>
              <select className="border rounded px-2 py-1" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
                <option value="">All</option>
                <option value="1">L1</option>
                <option value="2">L2</option>
                <option value="3">L3</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">月</label>
              <input type="month" className="border rounded px-2 py-1" value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-gray-600 mb-1">検索</label>
              <input
                type="search"
                className="w-full border rounded px-2 py-1"
                placeholder="タイトル検索"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          {archiveItems.length === 0 && <p className="text-gray-500">アーカイブがありません。</p>}
          {archiveItems.map((a: any) => (
            <a key={a.id} href={`/daily/${a.slug}`} className="block rounded border p-3 hover:bg-gray-50">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-gray-600">{a.category}</div>
              <div className="text-xs text-gray-500">
                {formatInTimeZone(a.published_at, process.env.TIMEZONE || 'Asia/Tokyo')}
              </div>
            </a>
          ))}
          <ArchiveLoadMore
            currentCount={archiveItems.length}
            onLoad={async () => {
              const params = new URLSearchParams()
              params.set('limit', '10')
              params.set('offset', String(archiveItems.length))
              if (category) params.set('category', category)
              if (levelFilter) params.set('level', levelFilter)
              if (month) params.set('month', month)
              if (query) params.set('query', query)
              const res = await fetch(`/api/daily/archive?${params.toString()}`, { cache: 'no-store' })
              const more = (await res.json()) as { items: any[]; total: number }
              setArchive(prev => ({ items: [...(prev?.items ?? []), ...(more.items ?? [])], total: more.total ?? 0 }))
            }}
            total={archiveTotal}
          />
        </div>
      )}
    </div>
  )
}
