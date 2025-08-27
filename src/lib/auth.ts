import { createClient } from '@supabase/supabase-js'

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  header.split(/;\s*/).forEach((part) => {
    const idx = part.indexOf('=')
    if (idx === -1) return
    const k = part.slice(0, idx).trim()
    const v = decodeURIComponent(part.slice(idx + 1))
    out[k] = v
  })
  return out
}

export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  // Dev override via header
  const devHeader = req.headers.get('x-user-id')
  if (devHeader) return devHeader

  // Authorization: Bearer <token>
  const authz = req.headers.get('authorization') || req.headers.get('Authorization')
  let bearerToken: string | null = null
  if (authz && /^Bearer\s+/.test(authz)) {
    bearerToken = authz.replace(/^Bearer\s+/i, '').trim()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  const cookies = parseCookies(req.headers.get('cookie'))
  // Common cookie names used by auth-helpers
  let accessToken = bearerToken || cookies['sb-access-token']

  if (!accessToken) {
    // Some setups store a JSON token object in `sb:token`
    const jsonCookie = cookies['sb:token']
    if (jsonCookie) {
      try {
        const parsed = JSON.parse(jsonCookie)
        accessToken = parsed?.access_token || parsed?.currentSession?.access_token || null
      } catch {
        // ignore
      }
    }
  }

  if (!accessToken) return null

  // Create a client that forwards the access token in headers
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return data.user?.id ?? null
  } catch {
    return null
  }
}
