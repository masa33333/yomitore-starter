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
TTS_VOICE 環境変数が読み込まれているか？	🔲
next.config.mjs に TTS_VOICE を明記	🔲
tts.ts に voice の fallbackがあるか？	🔲
APIエラーレスポンスの内容をログで出しているか？	🔲

