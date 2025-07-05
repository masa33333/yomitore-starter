# Vercel 環境変数設定手順

## 方法1: Vercel Dashboard (推奨)

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクト「yomitore-starter」を選択
3. 「Settings」タブを選択
4. 「Environment Variables」を選択
5. 以下の環境変数を追加：

### 追加する環境変数

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_KEY=[YOUR_SUPABASE_SERVICE_KEY]

# OpenAI
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]

# Claude
CLAUDE_API_KEY=[YOUR_CLAUDE_API_KEY]

# Gemini
GEMINI_API_KEY=[YOUR_GEMINI_API_KEY]

# TTS設定
TTS_VOICE=alloy
```

## 方法2: Vercel CLI

```bash
# Vercel CLIをインストール
npm install -g vercel

# プロジェクトディレクトリで環境変数を設定
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_KEY production
vercel env add OPENAI_API_KEY production
vercel env add CLAUDE_API_KEY production
vercel env add GEMINI_API_KEY production
vercel env add TTS_VOICE production
```

## 設定後の確認

1. 環境変数設定後、Vercelで再デプロイ
2. `/api/debug/env` エンドポイントで環境変数確認
3. モバイルでTTS機能をテスト
4. 「Debug Info」でAPI Responseが200になることを確認

## 注意事項

- 環境変数設定後は必ず再デプロイが必要
- `NEXT_PUBLIC_`から始まる変数はクライアントサイドでも利用可能
- 他の変数はサーバーサイドのみで利用可能
- 環境変数は Production, Preview, Development すべてのスコープに設定すること