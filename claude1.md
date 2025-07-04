✅ 1. OpenAI TTS サーバーエラー（APIキーはOKだがレスポンスに失敗）
エラーメッセージ：

r
コードをコピーする
TTS service temporarily unavailable - missing configuration
これは voice の指定が undefined または null になっているときにも出ます。

🔧 確認すべきこと：
🔸 tts/api.ts または lib/tts.ts にて：
ts
コードをコピーする
const voice = process.env.TTS_VOICE ?? 'alloy'; // ← alloy が明示されているか
TTS_VOICE が読み込まれているか？

console.log("TTS Voice:", voice) を追加し、ログに出るか？

🔸 next.config.mjs にこうなっているか？
js
コードをコピーする
const nextConfig = {
  env: {
    TTS_VOICE: process.env.TTS_VOICE,
    TTS_PROVIDER: process.env.TTS_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
};

export default nextConfig;
🧪 テスト方法（確認用の簡易テスト）
以下のコードを仮で /api/test-tts に置いて、Vercel上でTTSが動いているかチェックしてみましょう：

ts
コードをコピーする
// /pages/api/test-tts.ts
export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: process.env.TTS_VOICE ?? "alloy",
        input: "This is a test of OpenAI text to speech.",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
成功すればMP3音声が再生されます。

✅ 最後に：最短のチェックリスト
チェック項目	状態
TTS_VOICE 環境変数が読み込まれているか？	✅
next.config.mjs に TTS_VOICE を明記	✅
tts.ts に voice の fallbackがあるか？	✅
APIエラーレスポンスの内容をログで出しているか？	✅

---

## 📋 Work Session Summary (2025-07-04)

### 🚨 現在の状況（継続タスク）

**TTSテストページ vs 読み物ページの不整合問題**

#### ✅ 動作確認済み
- `/test-tts-simple` - TTSテストページ: **完全動作**
- 環境変数設定: **完全**
- OpenAI TTS API: **正常動作**
- Supabase Storage: **正常動作**

#### ❌ 問題発生箇所
- **読み物生成ページ**: TTSボタンで「missing configuration」エラー
- **症状**: 同じTTS API (`/api/tts`) を呼び出すが、読み物ページからのリクエストのみ失敗

#### 🔍 調査すべきポイント

1. **読み物ページのTTSButton呼び出し**
   - `src/app/reading/ReadingClient.tsx` の TTSButton 実装
   - contentId の渡し方
   - text の内容・長さ

2. **API呼び出しの差異**
   - テストページ: `/api/test-tts` (直接MP3返却)
   - 読み物ページ: `/api/tts` (JSON + audioUrl返却)

3. **環境変数の差異**
   - サーバーサイドでの環境変数アクセス
   - リクエストコンテキストでの環境変数読み込み

#### 🛠 次回セッション開始タスク

1. **読み物ページのTTSButton実装確認**
   ```
   src/app/reading/ReadingClient.tsx:
   - TTSButton に渡している props 確認
   - contentId と text の内容確認
   ```

2. **API呼び出しの詳細ログ確認**
   ```
   /api/tts エンドポイント:
   - 読み物ページからのリクエスト内容
   - 環境変数の読み込み状況
   - エラーログの詳細
   ```

3. **実際のリクエスト内容比較**
   ```
   テストページ vs 読み物ページ:
   - リクエストボディの差異
   - ヘッダーの差異
   - 実行コンテキストの差異
   ```

### 🎯 明日の優先タスク

1. **読み物ページのTTSButton実装デバッグ**
2. **API呼び出しの実際の差異を特定**
3. **missing configuration エラーの根本原因特定**
4. **修正実装・テスト**

### 📁 関連ファイル

```
src/app/reading/ReadingClient.tsx     - 読み物ページTTSButton実装
src/app/test-tts-simple/page.tsx      - 動作確認済みテストページ
src/app/api/tts/route.ts              - 共通TTS APIエンドポイント
src/app/api/test-tts/route.ts         - テスト用直接TTS API
src/components/TTSButton.tsx          - TTS再生ボタンコンポーネント
```

### 💡 推定原因

- 読み物ページから渡される `text` または `contentId` の形式問題
- 長いテキストでの環境変数読み込み失敗
- リクエストタイムアウト・メモリ不足
- サーバーサイドコンテキストでの環境変数アクセス問題

---

