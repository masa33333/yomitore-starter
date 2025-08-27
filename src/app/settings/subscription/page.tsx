'use client'

import { useEffect, useState } from 'react'
import { createSafeSupabaseClient } from '@/lib/supabase'

type Plan = 'free' | 'pro' | 'plus'

export default function SubscriptionSettingsPage() {
  const supabase = createSafeSupabaseClient()
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<Plan>('free')
  const [emailOptIn, setEmailOptIn] = useState(false)
  const [preferredTime, setPreferredTime] = useState<string>('07:00')
  const [levelPref, setLevelPref] = useState<number[]>([1])
  const [sessionInfo, setSessionInfo] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const accessToken = await getAccessToken()
        const res = await fetch('/api/settings/subscription', {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          cache: 'no-store',
        })
        const json = await res.json()
        if (cancelled) return
        if (json?.plan) setPlan(json.plan)
        if (typeof json?.email_opt_in === 'boolean') setEmailOptIn(json.email_opt_in)
        if (json?.preferred_time) setPreferredTime(json.preferred_time)
        if (Array.isArray(json?.level_pref)) setLevelPref(json.level_pref)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function getAccessToken(): Promise<string | null> {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token || null
    setSessionInfo(token ? 'ログイン中' : '未ログイン')
    return token
  }

  async function handleLogin(provider: 'google' | 'github') {
    if (!supabase) return alert('Supabase未設定です')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider })
    if (error) alert(`ログイン失敗: ${error.message}`)
    setLoading(false)
  }

  async function handleLogout() {
    if (!supabase) return
    await supabase.auth.signOut()
    setSessionInfo('未ログイン')
  }

  async function save() {
    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      const res = await fetch('/api/settings/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ plan, email_opt_in: emailOptIn, preferred_time: preferredTime, level_pref: levelPref }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert('保存に失敗しました: ' + (j.error || res.status))
      } else {
        alert('保存しました')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">通知・購読設定</h1>
        <a href="/daily" className="text-sm text-blue-600 hover:underline">← 今日の1本へ戻る</a>
      </div>
      <div className="text-sm text-gray-600">状態: {sessionInfo}</div>

      <div className="flex gap-2">
        <button className="px-3 py-1 rounded border" onClick={() => handleLogin('google')} disabled={loading}>Googleでログイン</button>
        <button className="px-3 py-1 rounded border" onClick={() => handleLogin('github')} disabled={loading}>GitHubでログイン</button>
        <button className="px-3 py-1 rounded border" onClick={handleLogout}>ログアウト</button>
      </div>

      <div>
        <label className="block text-sm mb-1">プラン</label>
        <select className="border rounded px-2 py-1" value={plan} onChange={e => setPlan(e.target.value as Plan)}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="plus">Plus</option>
        </select>
        <ul className="mt-2 text-xs text-gray-600 list-disc pl-4 space-y-1">
          <li>Free: 最新L1 + 直近3件L1、TTSなし</li>
          <li>Pro: L1-L3無制限、TTS、バッジ</li>
          <li>Plus: Pro + メール配信 + 月次レポート + 特別レター</li>
        </ul>
      </div>

      <div className="flex items-center gap-2">
        <input id="emailOpt" type="checkbox" className="border" checked={emailOptIn} onChange={e => setEmailOptIn(e.target.checked)} />
        <label htmlFor="emailOpt">メール配信を受け取る</label>
      </div>

      <div>
        <label className="block text-sm mb-1">配信時刻</label>
        <input type="time" className="border rounded px-2 py-1" value={preferredTime} onChange={e => setPreferredTime(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm mb-1">希望レベル</label>
        <div className="flex gap-3">
          {[1,2,3].map(lv => (
            <label key={lv} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={levelPref.includes(lv)}
                onChange={(e) => {
                  setLevelPref(prev => e.target.checked ? [...prev, lv] : prev.filter(v => v !== lv))
                }}
              />
              L{lv}
            </label>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button className="px-3 py-1 rounded bg-black text-white disabled:opacity-50" onClick={save} disabled={loading}>保存</button>
      </div>
    </div>
  )
}
