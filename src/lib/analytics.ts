type EventName =
  | 'daily_opened'
  | 'daily_level_switched'
  | 'daily_completed'
  | 'archive_filter_used'
  | 'streak_updated'

function getDistinctId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const KEY = '__analytics_id__'
    let id = localStorage.getItem(KEY)
    if (!id) {
      // Use Crypto API if available
      // @ts-ignore
      id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2)
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return null
  }
}

export function track(name: EventName, props?: Record<string, any>) {
  const payload = props || {}
  // If PostHog keys are present and we're in the browser, send there; otherwise console
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  if (typeof window !== 'undefined' && key) {
    const distinctId = getDistinctId() || 'anonymous'
    const body = JSON.stringify({
      api_key: key,
      event: name,
      distinct_id: distinctId,
      properties: { ...payload, $lib: 'custom', $lib_version: '0.1.0' },
      timestamp: new Date().toISOString(),
    })
    try {
      const url = host.replace(/\/$/, '') + '/capture/'
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' })
        navigator.sendBeacon(url, blob)
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.info('[analytics-fallback]', name, payload, e)
    }
    return
  }

  try {
    // eslint-disable-next-line no-console
    console.info('[analytics]', name, payload)
  } catch {}
}
