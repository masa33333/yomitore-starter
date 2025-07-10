import { createClient } from '@supabase/supabase-js'

// Supabaseクライアントを安全に作成する関数
export function createSafeSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found - client will be null')
    return null
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

// レガシー対応: 既存コード用の export（使用時にnullチェック必要）
export const supabase = createSafeSupabaseClient()

// サーバーサイド用のサービスロールクライアント
export const createServiceSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase service environment variables not found - client will be null')
    return null
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}