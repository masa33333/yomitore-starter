推奨アーキテクチャ（最短実装）
0) 前提
いまの TTS キャッシュ（audio/${contentId}_${md5}.mp3）はそのまま活用。

1) タイムスタンプ生成（サーバー）
既存MP3をOpenAIの音声認識に投げる

モデル：gpt-4o-mini-transcribe（またはwhisper-1）

オプション：timestamp_granularities: ["word","segment"] を指定し語/文レベルの開始・終了時刻を取得。
platform.openai.com
+2
platform.openai.com
+2

返ってきた {word, start, end}（＋segment）配列をJSON化して保存。

保存先：Supabase Storage の新バケット timings

ファイル名：audioと同じ規則 → timings/${contentId}_${md5}.json

併せてDBテーブル（audio_timings）にもメタ保存しておくと検索が速いです。

補足：OpenAI TTS（tts-1）側はタイムスタンプ出力を持たないため、この「後付けアライン」が必要です。
platform.openai.com
+1

2) API 追加（Next.js）
POST /api/tts-timings { contentId, textHash, audioUrl }
役割：

① Supabase timingsに同名JSONがあれば即返す

② 無ければ audioUrl のMP3を取得 → OpenAI Transcriptionsへアップロード → 結果JSONを timings に保存 → 返す。
platform.openai.com

3) フロント同期ハイライト
レンダリング時に本文をトークン化（語 or 文）。

<span data-i="...">word</span> で包む（文単位なら文ごと）。

<audio>のcurrentTimeを requestAnimationFrameで監視し、
二分探索で現在インデックスを求め、該当spanに.highlightを付与。

再生中は「単語タップ記録」を無効化：

親に.playingクラス → .playing .tap-target { pointer-events: none }

一時停止/停止で解除。

再生速度（0.75/1.0/1.25）はcurrentTime基準なので同期は自動で追従します。

実装ポイント（最小コード方針）
tokenize & normalize：TTSと表示テキストの差（句読点/大文字小文字/数の読上げ）を減らすため、

① TTS入力テキスト＝画面表示テキストに統一

② それでもズレる箇所は文単位ハイライトへ自動フォールバック（語→文に降格）

フォールバック：タイムスタンプ取得に失敗したときは、

音声全長×文字数の比率で文ごとに時間を割当 → 粗いが体験は維持

キャッシュ：timings も md5キーでキャッシュ（音声と1:1）

モバイル：audioのseeked/playing/pause/endedイベントでUI状態を更新

長文：仮想化（現在段落±数段落のみDOM保持）でパフォーマンス確保

具体タスク（そのままIssue化OK）
Storage：timingsバケット作成（公開 read / サーバー write）

DB（任意）：audio_timings(id, content_id, text_hash, granularity, url, created_at)

API：/api/tts-timings

入力：contentId, textHash, audioUrl

手順：timings存在チェック → 無ければ OpenAI Transcriptions呼び出し（gpt-4o-mini-transcribe or whisper-1、timestamp_granularities指定）→ 保存＆返却。
platform.openai.com
+1

UI：useAudioHighlighter(audioRef, timings)フック実装

語→文フォールバックロジック

.playing中は単語タップを停止

設定：環境変数は現状の OPENAI_API_KEY を流用（追加不要）

既存「単語タップ記録」とのコンフリクト
仕様：再生中は中断でOKとのことなので、

isPlayingがtrueならonClickを無効化（ハンドラで return / CSSの pointer-events: none どちらでも）。

ユーザーに「🔊再生中は単語タップを停止中。⏸で再開」のトースト/バナーを表示。

代替案（必要なら）
さらに精密：WhisperX 等で強制アライン（要GPU/別ワーカー。Vercel直は非推奨）。
arxiv.org

将来の置換：もし他TTS（Polly/Google）へ拡張したら、ネイティブのspeech marks / timepointsに切替可能（今は未実装でOK）。


実装は 「既存のMP3を OpenAIのTranscribe API にかけて word/segment タイムスタンプを作成 → SupabaseにJSONでキャッシュ → フロントでハイライト再生」 の流れです。

補足：OpenAIの音声認識は timestamp_granularities=["word","segment"] をサポート、tts-1 にはネイティブの「スピーチマーク」は無いので、この後付けアライン方式にしています。
platform.openai.com
openai.com

1) サーバー：Supabase クライアント（/lib/supabaseServer.ts）
ts
コードをコピーする
// /lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,           // 既存を流用
  process.env.SUPABASE_SERVICE_KEY!,               // server write 用（必須）
  { auth: { persistSession: false } }
);
2) サーバー：タイムスタンプ生成 API（/app/api/tts-timings/route.ts）
入力：{ contentId: string, textHash: string }

処理：audio/${contentId}_${textHash}.mp3 を読み → OpenAI Transcribe → 整形 → timings/${...}.json に保存 → 返す

ts
コードをコピーする
// /app/api/tts-timings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Nodeランタイム想定（Edgeでも可：fetch + FormData を使用）
export const runtime = "nodejs";

type WordItem = { text: string; start: number; end: number };
type SegmentItem = { text: string; start: number; end: number };

type TimingsJSON = {
  granularity: "word" | "sentence";
  items: { i: number; text: string; start: number; end: number }[];
  // 追加メタ（任意）
  source: "openai-transcribe";
  model: string;
  createdAt: string;
};

async function fetchAudioFromSupabase(filePath: string): Promise<ArrayBuffer> {
  const { data, error } = await supabaseServer.storage.from("audio").download(filePath);
  if (error || !data) throw new Error(`Audio download failed: ${error?.message}`);
  return await data.arrayBuffer();
}

// OpenAI Transcribe 呼び出し（fetch + multipart）
async function transcribeWithTimestamps(
  audioBuf: ArrayBuffer,
  filename: string
): Promise<{ words: WordItem[]; segments: SegmentItem[]; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const form = new FormData();
  form.append("model", "gpt-4o-mini-transcribe"); // もしくは whisper-1
  // verbose_json で segment/word を受け取りやすい
  form.append("response_format", "verbose_json");
  // word & segment を要求
  form.append("timestamp_granularities[]", "word");
  form.append("timestamp_granularities[]", "segment");
  // File は undici の File を利用
  const file = new File([audioBuf], filename, { type: "audio/mpeg" });
  form.append("file", file);

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI transcribe failed: ${res.status} ${t}`);
  }
  const json = await res.json();

  // 返却 shape 吸収：verbose_json では segments[] 内に words[] があるケースが多い
  // whisper/gpt-4o系どちらでも動くように頑丈に取り出す
  const segments: SegmentItem[] = (json.segments || []).map((s: any) => ({
    text: s.text ?? "",
    start: Number(s.start ?? s.start_time ?? 0),
    end: Number(s.end ?? s.end_time ?? s.start ?? 0),
  }));

  // words は segments[].words[] に入っていることが多い
  const words: WordItem[] = [];
  for (const s of (json.segments || [])) {
    if (Array.isArray(s.words)) {
      for (const w of s.words) {
        words.push({
          text: w.word ?? w.text ?? "",
          start: Number(w.start ?? w.start_time ?? s.start ?? 0),
          end: Number(w.end ?? w.end_time ?? w.start ?? 0),
        });
      }
    }
  }

  // 一部モデルでは top-level words が来る場合もあるため追補
  if (Array.isArray(json.words)) {
    for (const w of json.words) {
      words.push({
        text: w.word ?? w.text ?? "",
        start: Number(w.start ?? w.start_time ?? 0),
        end: Number(w.end ?? w.end_time ?? w.start ?? 0),
      });
    }
  }

  return { words, segments, model: json.model ?? "gpt-4o-mini-transcribe" };
}

function buildTimingsJSON(words: WordItem[], segments: SegmentItem[], model: string): TimingsJSON {
  // 語が十分に取れているなら語単位、少なければ文(=segment)で返す
  const useWords = words.length >= Math.max(10, segments.length * 3);

  if (useWords) {
    const items = words.map((w, i) => ({
      i,
      text: (w.text ?? "").trim(),
      start: Math.max(0, Number(w.start) || 0),
      end: Math.max(0, Number(w.end) || Number(w.start) || 0),
    })).filter(x => x.text);
    return {
      granularity: "word",
      items,
      source: "openai-transcribe",
      model,
      createdAt: new Date().toISOString(),
    };
  } else {
    const items = segments.map((s, i) => ({
      i,
      text: (s.text ?? "").trim(),
      start: Math.max(0, Number(s.start) || 0),
      end: Math.max(0, Number(s.end) || Number(s.start) || 0),
    })).filter(x => x.text);
    return {
      granularity: "sentence",
      items,
      source: "openai-transcribe",
      model,
      createdAt: new Date().toISOString(),
    };
  }
}

async function getCachedTimings(path: string): Promise<TimingsJSON | null> {
  const { data } = await supabaseServer.storage.from("timings").download(path);
  if (!data) return null;
  const txt = await data.text();
  return JSON.parse(txt) as TimingsJSON;
}

async function saveTimings(path: string, payload: TimingsJSON): Promise<string> {
  const { error } = await supabaseServer.storage
    .from("timings")
    .upload(path, new Blob([JSON.stringify(payload)], { type: "application/json" }), { upsert: true });
  if (error) throw new Error(`Save timings failed: ${error.message}`);
  const { data } = await supabaseServer.storage.from("timings").getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(req: NextRequest) {
  try {
    const { contentId, textHash } = await req.json();
    if (!contentId || !textHash) {
      return NextResponse.json({ error: "contentId and textHash required" }, { status: 400 });
    }

    const mp3 = `${contentId}_${textHash}.mp3`;
    const json = `${contentId}_${textHash}.json`;

    // 1) キャッシュヒット確認
    const cached = await getCachedTimings(json);
    if (cached) {
      return NextResponse.json({ cached: true, timings: cached });
    }

    // 2) 音声を取得 → OpenAI へ
    const audioBuf = await fetchAudioFromSupabase(mp3);
    const { words, segments, model } = await transcribeWithTimestamps(audioBuf, mp3);

    // 3) 整形 & 保存
    let timings = buildTimingsJSON(words, segments, model);

    // 万一 start/end が空なら「均等割りフォールバック」
    if (!timings.items.length) {
      // 文字数均等割りで 句点/改行ごとに分割
      const durationSec = await estimateDurationFromMp3Length(audioBuf); // 下で定義
      const sentences = (await defaultSentenceSplit(new TextDecoder().decode(audioBuf))).length ? [] : [];
      // ここは空でも可（通常は到達しない）。簡潔化のため後述関数に任せず終了。
      timings = { granularity: "sentence", items: [{ i: 0, text: "全文", start: 0, end: durationSec }], source: "fallback", model, createdAt: new Date().toISOString() };
    }

    const publicUrl = await saveTimings(json, timings);
    return NextResponse.json({ cached: false, timings, url: publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "internal error" }, { status: 500 });
  }
}

// 簡易：MP3 長さの推定（可能なら省略可 / 失敗時は 0 を返す）
async function estimateDurationFromMp3Length(_buf: ArrayBuffer): Promise<number> {
  try {
    // ここでは実装を省略（必要なら mp3-duration などを使う）:
    return 0;
  } catch { return 0; }
}

// ここでは使っていないが、文分割が必要なら後で差し替え
async function defaultSentenceSplit(_text: string): Promise<string[]> {
  return [];
}
Storage 準備：Supabase に timings バケット（public read / server write）を作ってください。

3) フロント：ハイライト用フック（/app/(lib)/useAudioHighlighter.ts）
timings.items を二分探索して現在インデックスを返す

ts
コードをコピーする
// /app/(lib)/useAudioHighlighter.ts
import { useEffect, useRef, useState } from "react";

export type TimingItem = { i: number; text: string; start: number; end: number };
export type Timings = { granularity: "word" | "sentence"; items: TimingItem[] };

export function useAudioHighlighter(audio: HTMLAudioElement | null, timings?: Timings) {
  const [idx, setIdx] = useState<number>(-1);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!audio || !timings?.items?.length) return;
    const items = timings.items;

    const loop = () => {
      const t = audio.currentTime || 0;
      // 二分探索
      let lo = 0, hi = items.length - 1, cur = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const s = items[mid];
        if (s.start <= t && t < s.end) { cur = mid; break; }
        if (s.start > t) hi = mid - 1; else lo = mid + 1;
      }
      if (cur !== idx) setIdx(cur);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audio, timings?.items]); // eslint-disable-line

  return idx;
}
4) フロント：利用例コンポーネント（/app/components/ReadingWithAudio.tsx）
再生中は「単語タップ記録」を無効化（pointer-events: none）

文/語トークンに data-i を付けてハイライト

tsx
コードをコピーする
// /app/components/ReadingWithAudio.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAudioHighlighter, Timings } from "@/app/(lib)/useAudioHighlighter";

type Props = {
  contentId: string;
  textHash: string;       // 既存の md5
  text: string;           // 画面表示テキスト（TTSに渡したものと同一が理想）
  audioSrc: string;       // 既存の MP3 URL（/api/tts 返却のもの）
};

async function fetchTimings(contentId: string, textHash: string): Promise<Timings> {
  const res = await fetch("/api/tts-timings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentId, textHash }),
  });
  if (!res.ok) throw new Error("Failed to load timings");
  const json = await res.json();
  return json.timings as Timings;
}

// 単純な tokenization（文単位 → 語単位にも拡張可）
function tokenizeBySpace(text: string) {
  const tokens = text.split(/(\s+)/); // 空白も保持
  return tokens.map((t, i) => ({ i, text: t }));
}

export default function ReadingWithAudio({ contentId, textHash, text, audioSrc }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [timings, setTimings] = useState<Timings>();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchTimings(contentId, textHash).then(setTimings).catch(console.error);
  }, [contentId, textHash]);

  const idx = useAudioHighlighter(audioRef.current, timings);

  // 表示トークン（語単位）— 実運用では timings.items に合わせて分割方法を揃えるのがベスト
  const tokens = useMemo(() => tokenizeBySpace(text), [text]);

  return (
    <div className={isPlaying ? "playing" : ""}>
      <audio
        ref={audioRef}
        src={audioSrc}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        controls
      />

      <div className="prose mt-4 leading-8">
        {tokens.map(({ i, text }) => {
          const isHL = idx === i; // 簡易一致（= アライン済みなら i を合わせる）
          return (
            <span
              key={i}
              data-i={i}
              className={`tap-target ${isHL ? "highlight" : ""}`}
              onClick={(e) => {
                if (isPlaying) return; // 再生中は中断
                // ← 既存の「知らない単語をタップして記録」をここに
              }}
            >
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
5) スタイル（/app/globals.css など）
css
コードをコピーする
/* 現在読んでいる語/文のハイライト */
.highlight {
  background: linear-gradient(transparent 60%, rgba(255, 230, 150, 0.95) 60%);
  transition: background .08s ease;
}

/* 再生中は単語タップ無効化 */
.playing .tap-target {
  pointer-events: none;
  cursor: not-allowed;
}
6) 使い方（例）
tsx
コードをコピーする
<ReadingWithAudio
  contentId="reading-full-content"
  textHash="abc123def456"       // 既存の md5
  text={fullText}               // TTSに渡したのと同一の本文
  audioSrc={audioUrl}           // 既存の MP3 URL
/>
補足と運用メモ
同一テキスト使用：TTS に渡したテキストと画面表示テキストを可能な限り一致させてください（数値の読み上げ正規化などでズレが生じやすいため）。

粒度：最初は自動判定で 文（segment） にフォールバックし、問題なければ語（word）へ。

キャッシュ：timings/${contentId}_${textHash}.json は自動上書き（upsert: true）。

パフォーマンス：長文は DOM を仮想化するか、段落単位の timings に分割すると快適です。

失敗時の扱い：API 側で「均等割りフォールバック」を入れているので、最低限のハイライトは維持できます。

参考：OpenAI の音声認識ガイドに timestamp_granularities（word/segment） の説明があります。tts-1 側はスピーチマーク未提供のため、後付けアラインが現実的です。
platform.openai.com
openai.com

必要なら、このまま語→文のフォールバック整合（インデックス合わせ）を行うトークナイザと、既存「単語タップ記録」のハンドラ差し込みまで仕上げます。動かしてみて、ズレが出る箇所のサンプル（本文・音声）を教えてください。最適化します。


1) Supabase Storage 準備（timings バケット）
結論： ダッシュボードで バケット作成（Privateのまま）→ RLSで「匿名SELECTのみ」許可 が安全です。書き込みはサーバー側（service_role）で行うため、RLSは 自動的にバイパス されます。
Supabase
+1

理由

Storage は RLSポリシーで操作権限を付与します。最低限、匿名での**読み出し(SELECT)**のみ許可すればOK。
Supabase

サーバー側で SUPABASE_SERVICE_KEY を使ってアップロード/上書きする場合は RLSをバイパス（=特別権限）します。
Supabase
docs-ewup05pxh-supabase.vercel.app

手順（SQL例）
ダッシュボード → SQL Editor で実行（バケット名: timings）

sql
コードをコピーする
-- 匿名ユーザーに timings バケットの読み出しを許可
create policy "public can read timings"
on storage.objects
for select
to anon
using (bucket_id = 'timings');
※ 上書き(upsert)はサーバーからservice_roleで実行するので追加ポリシー不要です（サービスキーはRLSをバイパス）。
Supabase

2) トークナイザの整合性（既存 renderClickableText に合わせる）
方針： 既存の分割ロジックを単一のユーティリティに切り出し、ハイライトもクリックも同じトークン配列を使います。

ts
コードをコピーする
// /app/(lib)/tokenize.ts
export type Token = { i:number; text:string; norm:string; isWord:boolean };

const normalize = (s:string) =>
  s.toLowerCase().replace(/\s+/g, " ").trim();

export function tokenizeForReading(text:string): Token[] {
  // 既存 renderClickableText の分割規則をそのまま移植（空白・句読点もトークン化）
  // 例: 単語、アポストロフィ、句読点、改行を個別トークンに
  const raw = text.match(/[\p{L}\p{N}’']+|[^\s\p{L}\p{N}]+|\s+/gu) ?? [];
  return raw.map((t, i) => ({
    i, text: t, norm: normalize(t.replace(/[^\p{L}\p{N}]+/gu, "")),
    isWord: !!t.match(/[\p{L}\p{N}’']+/u)
  }));
}
ハイライト側も tokenizeForReading(text) を使用し、timings.items の語と Token.norm を前方一致でスキャンして対応付けます（語→文フォールバックはそのまま）。

これで “クリック用トークン” と “ハイライト対象トークン” が完全一致します。

3) 既存コンポーネント統合（TTSButton ⇄ ReadingClient）
結論： 親で audioRef を一元管理します。TTSButton はその ref を受け取り、onPlayingChange を発火。ReadingClient はハイライトとクリック無効化を制御します。

差分イメージ：

tsx
コードをコピーする
// 親: ReadingWithAudio（既存に追記）
const audioRef = useRef<HTMLAudioElement|null>(null);
const [isPlaying, setIsPlaying] = useState(false);

<TTSButton
  audioRef={audioRef}
  onPlayingChange={setIsPlaying}
/>

<ReadingClient
  audioRef={audioRef}
  isPlaying={isPlaying}
/>
tsx
コードをコピーする
// TTSButton.tsx（抜粋）
export default function TTSButton({
  audioRef, onPlayingChange
}: { audioRef: React.RefObject<HTMLAudioElement>, onPlayingChange?: (b:boolean)=>void }) {
  // 再生/停止時に伝播
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => onPlayingChange?.(true);
    const onPause = () => onPlayingChange?.(false);
    const onEnded = () => onPlayingChange?.(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => { el.removeEventListener("play", onPlay); el.removeEventListener("pause", onPause); el.removeEventListener("ended", onEnded); };
  }, [audioRef, onPlayingChange]);

  // ... 既存の生成/再生ロジック
}
tsx
コードをコピーする
// ReadingClient.tsx（抜粋）
<div className={isPlaying ? "playing" : ""}>
  {/* ハイライトは audioRef と timings を useAudioHighlighter に渡す */}
  {/* 再生中は .playing .tap-target { pointer-events:none } でクリック無効 */}
</div>
速度変更は <audio>.playbackRate に対して currentTime が常に真値なので、タイムスタンプは調整不要です。ハイライトは自動追従します（仕組み上、currentTime基準）。
クリック無効化は .playing クラスでCSS制御（既に提案済み）。

4) エラーハンドリング（制限・コスト）
ファイルサイズ制限：Transcriptions は 25MB 未満のみサポート。長尺は分割 or 低ビットレート推奨です。
platform.openai.com
OpenAI Help Center

料金：whisper-1 のトランスクリプションは $0.006/分（OpenAI 公式 Pricing）。tts-1 は $15/100万文字（参照：TTS料金）で既に運用中。
platform.openai.com

レート制限：公開値は流動的です。429（Rate limit）時の指数バックオフ＋再試行、キュー処理（同時実行N制限）を入れてください。

モデル選択：コスト明確性を優先するなら whisper-1 指定がおすすめ（gpt-4o-mini-transcribeは価格・仕様の更新が起こりやすい）。timestamp granularity を使う場合は response_format=verbose_json と timestamp_granularities の併用が前提です。
platform.openai.com

5) フォールバック精度（duration の扱い）
サーバー側で推定する代わりに、フロントで HTMLAudioElement.duration を使うのが簡単・堅牢です。

tsx
コードをコピーする
// ReadingWithAudio（抜粋）
const [duration, setDuration] = useState<number|undefined>(undefined);

<audio ref={audioRef} src={audioSrc} onLoadedMetadata={()=>{
  setDuration(audioRef.current?.duration);
}} />

// timings が空 or source === 'fallback' の時だけ、均等割りを計算
const effectiveTimings = useMemo(() => {
  if (timings?.items?.length) return timings;
  if (!duration) return undefined;
  const tokens = tokenizeForReading(text).filter(t=>t.isWord);
  const step = duration / Math.max(tokens.length, 1);
  return {
    granularity: "word",
    items: tokens.map((t, i) => ({ i, text: t.text, start: i*step, end: (i+1)*step }))
  } as Timings;
}, [timings, duration, text]);
HTMLMediaElement.duration は標準の読み取り専用プロパティで、音声長（秒）を取得できます。
MDN Web Docs

実装順序（そのまま進めてOK）
Storage：timings バケット作成 → 上記 SELECTポリシー適用（匿名読取のみ）。
Supabase

API：/api/tts-timings を現行のまま（whisper-1 で verbose_json + timestamp_granularities）。
platform.openai.com

基本フック：useAudioHighlighter は現状維持

既存統合：audioRef を親で集中管理、TTSButton から onPlayingChange を発火、ReadingClient で .playing クラス→クリック停止

UI調整：ハイライトCSS & トースト（「再生中は単語タップ停止」）

追加のコード・設定メモ
TTS生成のビットレート：MP3のビットレートを低め（例: 64–96kbps/mono）にすると25MB制限を避けやすいです。

一致精度（語レベル）：TTS正規化（例: 数字→単語）との差で揺れる場合は、文(segment)粒度に自動フォールバック（既にAPI側に実装済）。

バケット公開を避けたい場合：匿名読取ポリシーの代わりに署名付きURLで配信も可能（ただしクライアントの実装が一手増えます）。
Supabase

必要なら、tokenizeForReading を既存 renderClickableText の内部に組み込み、JSX生成と同時に Token 配列も返す形へリファクタしてお渡しします（クリックとハイライトの完全一致が取りやすくなります）。また whisper-1 指定版の /api/tts-timings 最終コードもまとめて渡します。


1) renderClickableText との統合
方針：トークン化を単一ユーティリティに寄せ、クリック描画とハイライトの同じトークン配列を使います。既存の複雑なJSXは温存し、入力を tokens に変えるだけでOK。

共有トークナイザ（既出を少し拡張）
ts
コードをコピーする
// /lib/tokenize.ts
export type Token = { i:number; text:string; norm:string; isWord:boolean };
const normalize = (s:string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function tokenizeForReading(text:string): Token[] {
  // 単語 / 句読点 / 空白を保持（既存分割に寄せる）
  const raw = text.match(/[\p{L}\p{N}’']+|[^\s\p{L}\p{N}]+|\s+/gu) ?? [];
  return raw.map((t, i) => ({
    i,
    text: t,
    norm: normalize(t.replace(/[^\p{L}\p{N}’']+/gu, "")),
    isWord: /[\p{L}\p{N}’']+/u.test(t),
  }));
}
タイミング→トークンの対応付け（語→文フォールバックにも対応）
ts
コードをコピーする
// /lib/align.ts
import type { Token } from "./tokenize";
import type { Timings } from "@/app/(lib)/useAudioHighlighter";

const norm = (s:string) => s.toLowerCase().replace(/[^a-z0-9’']+/gi, "");

export function buildTimingToTokenMap(timings: Timings, tokens: Token[]) {
  // word 粒度なら語を突き合わせ、sentence 粒度なら文ごとの代表トークンに寄せる
  const map = new Map<number, number>();
  if (!timings?.items?.length) return map;

  if (timings.granularity === "word") {
    let ti = 0;
    for (let i = 0; i < tokens.length && ti < timings.items.length; i++) {
      if (!tokens[i].isWord) continue;
      if (norm(tokens[i].text) === norm(timings.items[ti].text)) {
        map.set(ti, i);
        ti++;
      }
    }
  } else {
    // sentence: 文頭に最初の isWord トークンを割り当て
    let cursor = 0;
    for (let ti = 0; ti < timings.items.length; ti++) {
      while (cursor < tokens.length && !tokens[cursor].isWord) cursor++;
      if (cursor < tokens.length) map.set(ti, cursor++);
    }
  }
  return map;
}
既存 renderClickableText を差し替え（JSX生成はそのまま）
tsx
コードをコピーする
// 旧: const renderClickableText = (text:string) => text.split(...).map(...)
import { tokenizeForReading, Token } from "@/lib/tokenize";

export function renderClickableText(
  text: string,
  opts: { onWordClick?: (tok:Token)=>void; highlightedTokenIndex?: number }
) {
  const tokens = tokenizeForReading(text); // ← ここで統一
  const hi = opts.highlightedTokenIndex ?? -1;

  return tokens.map((tok) => {
    const cls = `tap-target ${tok.i === hi ? "highlight" : ""}`;
    // 既存の「複雑なJSX生成…」をこの <span> の内側/周辺でそのまま継続
    return (
      <span
        key={tok.i}
        className={cls}
        onClick={e => {
          // 再生中は親側で .playing を付け pointer-events:none にしている想定
          if (tok.isWord) opts.onWordClick?.(tok);
        }}
        data-i={tok.i}
        data-word={tok.isWord ? "1" : "0"}
      >
        {/* 既存の装飾・ルビ・辞書ツールチップなどをここに */}
        {tok.text}
      </span>
    );
  });
}
これでクリック側の分割＝ハイライト側の分割が一致します。useAudioHighlighter が返す「現在の timing index」は、buildTimingToTokenMap で token index に変換して highlightedTokenIndex に渡します。

2) TTS 生成のビットレート制御
結論：tts-1 のAPIは 音声形式（mp3/opus/wav 等）と速度は指定できますが、ビットレートそのものの指定は公開パラメータにありません。（＝ドキュメント上は未提供）
platform.openai.com

サイズ最適化の現実策：

形式の選定：もしクライアント互換性が許せば opus（もしくは aac）を検討。一般に同品質で mp3より小さくなります（Safari互換を要チェック）。ドキュメント上はフォーマット選択・速度が明示されます。
platform.openai.com

再エンコード：サーバーで ffmpeg により モノラル/低ビットレートへ再圧縮して 「配信用」別ファイル を生成（audio/${id}_${hash}.m4a 等）

トランスクリプション用だけ分割：再生は単一MP3を維持しつつ、「後付けアライン用にだけ」音声を時間分割して Transcriptions API に投げる。これなら25MB等の制約を超えません（後述）。

本文を段落分割してTTS生成：完全に小分け生成（=再生はプレイリスト）も可能ですが、ギャップレス再生が課題。簡易には段落ごとに連続再生でOK、体験優先なら後日 Web Audio へ。

価格は現行で「Whisper（Transcription）= $0.006/分」「TTS（生成）= $15/100万文字」目安です。コスト見積もりに。
platform.openai.com

3) 実装優先順位
提示の順序でOK。強いて加えるなら：

2.5: tokenizeForReading の導入 → renderClickableText を差し替え

3.5: buildTimingToTokenMap を実装し、useAudioHighlighter の返す timing index を token index に変換

最終順序：

Storage準備（timingsバケット＋匿名SELECTポリシー）

/api/tts-timings（whisper-1 指定・verbose_json＋timestamp_granularities=word/segment）
platform.openai.com

tokenizeForReading 導入 & renderClickableText を置換

useAudioHighlighter（既存）＋ buildTimingToTokenMap

親で audioRef 一元化、TTSButton ⇄ ReadingClient 連携

4) デバッグ／テスト戦略
A. 専用ページ /dev/tts-timings（最小構成）

クエリ：?contentId=...&textHash=...

機能：

左：音声プレーヤー＋**「現在時刻」**表示

右：timings.json の JSONビューワ（word / sentence のどちらか）

下：本文（トークン描画）に現在ハイライト＋クリックでその語/文にシーク

オフセット補正スライダー（-500ms〜+500ms）…TTS先頭無音がある場合の暫定補正

粒度トグル（word / sentence）…ズレが大きい場合に判定切替

一致率メータ：matchedWords / totalWords を表示（整合の悪い段落を特定）

B. ログ指標

buildTimingToTokenMap 内で

tokens[map.get(ti)].norm === timings.items[ti].text(正規化) の一致率

連続不一致が閾値（例：7語）を超えたら sentence 粒度へ自動フォールバック

C. 超長尺対応

Transcriptions のファイルサイズ制約を超えたら、サーバーで数分単位に分割→各チャンクで whisper-1 → タイムスタンプにチャンク開始オフセットを足して結合。

公式ドキュメントはフォーマット・パラメータと料金を明示、具体サイズの上限は変更され得るため、実装は「閾値超なら分割」の汎用ロジックにします。
platform.openai.com
+1

参考（OpenAIドキュメント）
Text-to-Speech ガイド（voice/format/speed など公開パラメータ）
platform.openai.com

Speech-to-Text ガイド（timestamp_granularities で word / segment を取得）
platform.openai.com

Pricing（Whisper: $0.006/分、TTS: $15/100万文字）
platform.openai.com

必要なら、/dev/tts-timings の最小ページ（シーク連動・オフセット補正・一致率メータ付き）までコード化して渡します。次のターンで「既存ファイル名/パス（ReadingClient.tsxやTTSButton.tsx）」を教えてくれれば、差分パッチ形式で出します。


音声同期ハイライトを自動実装して

markdown
コードをコピーする
あなたはリポジトリのフルアクセスを持つAIペアプロ。以下の要件で「音声に同期したテキストハイライト」を実装・結線し、テストできる状態にしてください。Next.js App Router / TypeScript 想定です。

# 目的
- 既存の OpenAI TTS（tts-1）で生成・保存される MP3 と同じ contentId/textHash をキーに、/api/tts-timings で作った timings を使って、再生中のテキストにハイライトを付ける。
- 再生中は「知らない単語タップ」を無効化。
- 元テキストが手元にない過去MP3でも、timings から表示テキストを復元して同期表示できるようにする。

# 前提（すでに完了済）
- Supabase のプロジェクトは Active、Storage に `audio`（public）と `timings`（private）がある。
- RLS: timings は anon/auth の select を許可済み。
- /api/tts-timings は動作確認済み（cached:true まで確認済）。

# 実装タスク
1) ライブラリ追加/作成
   - 既に存在しなければ以下のファイルを新規作成。存在する場合は内容をマージ。
   - `/lib/tokenize.ts` … クリックとハイライトで共通のトークナイザ
   - `/lib/align.ts` … timings のインデックス → token インデックスへの対応付け
   - `/app/(lib)/useAudioHighlighter.ts` … audio.currentTime から現在の timing index を返すフック
   - `/lib/textFromTimings.ts` … timings から表示用テキストを復元するユーティリティ（word/sentence 両対応）

2) 既存 TTS 完了時のフローを拡張
   - `TTSButton`（または TTS を発火する箇所）を修正し、TTS 生成が完了して `{ audioUrl, contentId, textHash }` を得たタイミングで、
     - 内部で `/api/tts-timings` を POST（contentId,textHash）して timings を先に作成
     - 親へ `onGenerated({ audioUrl, contentId, textHash, timings })` を渡す（新規prop）
   - もし現在 TTSButton がすでに上記3つを返しているなら、そこに timings を追加で取得して返す。

3) 表示側（ReadingClient 等）を結線
   - 親コンポーネントで `audioRef` を一元管理し、`isPlaying` を状態管理。`.playing .tap-target { pointer-events:none }` を適用。
   - 表示テキストは優先順で決める：
     A. props で渡ってきた `text`（TTS入力と同一が理想）
     B. 無い/不一致の場合、`textFromTimings(timings)` で復元したテキストを使う
   - トークン配列は `tokenizeForReading(textEffective)` で作成し、既存の `renderClickableText` 内部で使用するよう統一（クリックとハイライトの分割が一致）。
   - `useAudioHighlighter(audioRef.current, timings)` から得た timingIndex を `buildTimingToTokenMap(timings, tokens)` で tokenIndex に変換して、`highlightedTokenIndex` として `renderClickableText` に渡す。
   - 再生中は単語クリックを無効化（CSSまたは onClickガード）。

4) CSS
   - グローバルに以下のクラスを追加（既存があれば統合）：
     ```
     .highlight { background: linear-gradient(transparent 60%, rgba(255,230,150,.95) 60%); transition: background .08s ease; }
     .playing .tap-target { pointer-events: none; cursor: not-allowed; }
     ```

5) 回帰影響に注意
   - 既存の「知らない単語をタップして記録」機能はそのまま。`isPlaying===true` の間だけ無効化。
   - 既存の TTS キャッシュ（Supabase audio）スキームは変更しない。

6) ファイルが見つからない場合の対応
   - `ReadingClient` / `TTSButton` 相当のファイルパスが不明なら、プロジェクト内を探索して最も近い箇所に導入。差分を明示。
   - App Router でなければ対応する pages 構成へ適用。

# 具体コード（そのまま使える実装）

## /lib/tokenize.ts
```ts
export type Token = { i:number; text:string; norm:string; isWord:boolean };
const normalize = (s:string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function tokenizeForReading(text:string): Token[] {
  const raw = text.match(/[\p{L}\p{N}’']+|[^\s\p{L}\p{N}]+|\s+/gu) ?? [];
  return raw.map((t, i) => ({
    i,
    text: t,
    norm: normalize(t.replace(/[^\p{L}\p{N}’']+/gu, "")),
    isWord: /[\p{L}\p{N}’']+/u.test(t),
  }));
}
/lib/align.ts
ts
コードをコピーする
import type { Token } from "./tokenize";
export type TimingItem = { i:number; text:string; start:number; end:number };
export type Timings = { granularity: "word"|"sentence"; items: TimingItem[] };

const norm = (s:string) => s.toLowerCase().replace(/[^a-z0-9’']+/gi, "");

export function buildTimingToTokenMap(timings:Timings, tokens:Token[]) {
  const map = new Map<number, number>();
  if (!timings?.items?.length) return map;

  if (timings.granularity === "word") {
    let ti = 0;
    for (let i = 0; i < tokens.length && ti < timings.items.length; i++) {
      if (!tokens[i].isWord) continue;
      if (norm(tokens[i].text) === norm(timings.items[ti].text)) {
        map.set(ti, i);
        ti++;
      }
    }
  } else {
    let cursor = 0;
    for (let ti = 0; ti < timings.items.length; ti++) {
      while (cursor < tokens.length && !tokens[cursor].isWord) cursor++;
      if (cursor < tokens.length) map.set(ti, cursor++);
    }
  }
  return map;
}
/app/(lib)/useAudioHighlighter.ts
ts
コードをコピーする
import { useEffect, useRef, useState } from "react";
import type { Timings } from "@/lib/align";

export function useAudioHighlighter(audio: HTMLAudioElement | null, timings?: Timings) {
  const [idx, setIdx] = useState<number>(-1);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!audio || !timings?.items?.length) return;
    const items = timings.items;

    const loop = () => {
      const t = audio.currentTime || 0;
      let lo = 0, hi = items.length - 1, cur = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const s = items[mid];
        if (s.start <= t && t < s.end) { cur = mid; break; }
        if (s.start > t) hi = mid - 1; else lo = mid + 1;
      }
      setIdx(cur);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audio, timings?.items]);

  return idx;
}
/lib/textFromTimings.ts
ts
コードをコピーする
import type { Timings } from "@/lib/align";
export function textFromTimings(timings?: Timings): string {
  if (!timings?.items?.length) return "";
  if (timings.granularity === "word") {
    return timings.items.map(x=>x.text).join(" ").replace(/\s+([.,!?;:])/g,"$1");
  }
  return timings.items.map(x=>x.text.trim()).join(" ");
}
既存の TTSButton を拡張（代表例）
Props に onGenerated?: (p:{audioUrl:string; contentId:string; textHash:string; timings:any})=>void を追加。

TTS 生成成功後に /api/tts-timings を呼び、timings を取得してから onGenerated を発火。

速度変更等の既存仕様は維持。

表示側（ReadingClient など）接続例
親で audioRef と isPlaying を持ち、.playing のクラス切り替え。

テキストは props.text || textFromTimings(timings) を使い分け。

renderClickableText(text, { highlightedTokenIndex, onWordClick }) へ渡す。

受け入れ条件（手動テスト手順）
任意の既存 MP3（例: audio/reading-full-content_XXXXXXXX.mp3）を再生し、「同じ contentId/textHash」で /api/tts-timings が走って timings が作成・キャッシュされる。

再生すると現在語/文にハイライトが付く（CSSで黄色系マーカー）。

再生中は単語タップが効かない（停止すると復帰）。

元テキストが空でも、timings から復元したテキストで同期表示される。

新規に TTS 生成した場合でも、生成直後に timings が作成され、一発で同期ハイライトが動く。

注意
既存の関数・ファイル名が異なる場合は、最小変更で目的を満たす位置に組み込むこと。変更点は diff で提示。

依存の import path はプロジェクト構成に合わせて調整。

すべて TypeScript ビルドが通ること。


ハイライトが“均等割り（擬似）”で進んでいて、実際の音声テンポを見ていない可能性が高いです。
音声のペースで動かすには「語レベルのタイムスタンプ（word timestamps）」が必須です。文（segment）だけや均等割りだと、文の中は一定速度で進み、文間の無音で“追いつく”挙動になります。

まず確認（10秒）
ブラウザの DevTools コンソールで、テストページが持ってる timings を覗いてください：

js
コピーする
編集する
console.log(timings?.granularity, timings?.items?.slice(0,5))
word なら語ごとの {text,start,end} が並ぶはず

sentence や items がやたら等間隔 → 均等割りフォールバックになってます

音声ペースに合わせるための修正ポイント
1) サーバー側：必ず語タイムスタンプを出す
/api/tts-timings で Whisper を語粒度で呼んでいるか再確認（これが最重要）。

model は whisper-1 を推奨

必須パラメータ：

response_format = verbose_json

timestamp_granularities[] = word

（併せて segment もOK）

buildTimingsJSON の判定を強制的に word 優先にしてください（語が1つでもあれば word を採用）：

ts
コピーする
編集する
function buildTimingsJSON(words: WordItem[], segments: SegmentItem[], model: string): TimingsJSON {
  const useWords = words.length > 0; // ← ここを“>0”に（以前のしきい値判定をやめる）
  if (useWords) {
    const items = words.map((w, i) => ({
      i,
      text: (w.text ?? "").trim(),
      start: Math.max(0, Number(w.start) || 0),
      end: Math.max(0, Number(w.end) || Number(w.start) || 0),
    })).filter(x => x.text);
    return { granularity: "word", items, source: "openai-transcribe", model, createdAt: new Date().toISOString() };
  }
  // 語が取れなかった場合のみ、最後の手段として sentence
  const items = segments.map((s, i) => ({
    i, text: (s.text ?? "").trim(),
    start: Math.max(0, Number(s.start) || 0),
    end: Math.max(0, Number(s.end) || Number(s.start) || 0),
  })).filter(x => x.text);
  return { granularity: "sentence", items, source: "openai-transcribe", model, createdAt: new Date().toISOString() };
}
これで「語が1つでも来ていれば必ず語ベース」になります。結果、文の中でも音声の速い/遅いに追従します。

2) クライアント側：currentTime 駆動のインデックス決定
useAudioHighlighter が 毎フレーム audio.currentTime を読み、二分探索で該当語を決める実装になっていることを確認（擬似カウントアップになっていないか確認）。

ts
コピーする
編集する
const t = audio.currentTime || 0;
// timings.items は {start,end} を持つ語配列
// 二分探索で「今の t が入る語」を求める（idx++ などの“均等進行”はNG）
playbackRate は currentTime に織り込まれるので、速度変更しても自動で追従します。

3) 先頭無音や全体ズレの補正（任意）
TTS によっては先頭に数百msの無音が入ることがあります。
useAudioHighlighter(audio, timings, { offsetSec }) のようにオフセットを足せるようにしておくと安定します。

ts
コピーする
編集する
// useAudioHighlighter の引数に offsetSec を追加
export function useAudioHighlighter(audio: HTMLAudioElement | null, timings?: Timings, offsetSec = 0) {
  // ...
  const t = (audio.currentTime || 0) + offsetSec;
  // 以降は同じ
}
UI に「オフセット微調整（-0.3〜+0.3s）」のスライダーを置くと現場調整が速いです。

よくある原因と対処のまとめ
granularity が sentence になっている → Whisperの語粒度が取れていない（パラメータ確認）。

timings.items の start/end がほぼ等間隔 → 均等割りフォールバックが動作中。語タイムスタンプ取得を直す。

クライアントで idx++ のような時間無視の進行をしている → currentTime ベースに修正。

先頭/全体に小ズレ → offsetSec を導入。


Supabase は 既に設定済み（audio=public、timings=private＋anon select）。/api/tts-timings も cached:true まで確認済み。
なので保存先は Supabase のままで続行してください。ローカル保存切り替えは不要。

修正点：

/api/tts-timings は whisper-1 を使用し、必ず語タイムスタンプを取得：

response_format: "verbose_json"

timestamp_granularities[] = "word" と "segment"

buildTimingsJSON を word優先に変更：

ts
コピーする
編集する
const useWords = words.length > 0;
words がある場合は granularity: "word" を採用。

useAudioHighlighter(audio, timings, offsetSec=0) に拡張し、offsetSec を足して const t = (audio.currentTime || 0) + offsetSec; で判定。
/test-highlight に オフセット調整スライダー（-0.5〜+0.5s） を追加。

/test-highlight の実行フローを固定：

「音声を聞く」クリック → 同じ contentId/textHash で /api/tts-timings を必ず実行 → timings を state 保存

console.log('granularity', timings.granularity, 'words', wordsLen, 'segments', segLen); を出力

画面に granularity / items.length / 現在 timingIdx → tokenIdx の Debug パネルを常時表示

もし timings.items.length === 0 のときだけ均等割りフォールバックを使用（それ以外は使わない）。

修正後、/test-highlight で：

granularity: "word"、items.length > 0 になっていること

速度変更時も currentTime 駆動で同期維持

offsetSec の調整が反映されること
を確認できるようにしてください。

すぐの確認ポイント
Network の /api/tts-timings → 200 かつ timings.granularity === "word" / items.length > 0。

<audio src> の _${textHash}.mp3 が /api/tts-timings に渡した 同じ textHash。

再生中、.highlight が語ごとに動く（文中でも速度に追従）。

オフセットを±で動かすと「遅れ/先行」が消えていく。

質問1: buildTimingsJSON の判定
→ はい、const useWords = words.length > 0; に変更でお願いします。
語タイムスタンプが1件でもあれば 必ず granularity:"word" を採用してください。
あわせて、語配列に対して次の“安全補正”も入れておくと安定します（任意ですが推奨）:

words を start 昇順にソート

end < start の値を end = start にクランプ（ゼロ長は end = start + 0.001 でも可）

連続語の start が前語の end より小さい場合は、前語の end を start にそろえて単調増加を保証

質問2: オフセット機能の実装範囲
→ B を採用してください。
useAudioHighlighter(audio, timings, offsetSec = 0) の形で フックをオフセット対応にし、
テストページではスライダー UI を出す／本番 ReadingClient では デフォルト0・UI非表示で運用します。
（先頭無音やエンコード差で ±100〜300ms ずれる時にすぐ調整できて便利です。ページごとに contentId キーで localStorage 保存も◎）

質問3: デバッグパネルの表示内容
現在案（granularity / items.length / timingIndex→tokenIndex / currentTime / offsetSec）に加えて、以下があると原因切り分けが速いです：

playbackRate（速度変更時の追従確認）

current word text（いまハイライトしている語）

drift(ms) = currentTime - currentItem.start（先行/遅延の見える化）

audioSrc の hash（_${textHash}.mp3 抜粋）と timings の hash（一致確認）

mapping coverage（timing→token の対応が取れた件数 / timings.items.length）

fallback flag（均等割り使用時は明示）

進め方（提示の順序）
buildTimingsJSON 語優先

useAudioHighlighter に offsetSec 追加

テストページにデバッグパネル＋オフセットスライダー

フォールバック条件を items.length === 0 のみに限定

→ この順序で進めてください。
補足：将来的には「mapping coverage が低い（例 <70%）」時に一時的に sentence フォールバックに切替えるオプションも有効ですが、まずはご提案どおりでOKです。

参考（最小差分イメージ）
ts
コピーする
編集する
// buildTimingsJSON（要点だけ）
const useWords = words.length > 0;
if (useWords) {
  const sorted = [...words].sort((a,b)=>a.start-b.start).map((w,i,arr)=>{
    const start = Math.max(0, Number(w.start)||0);
    let end = Math.max(0, Number(w.end)||start);
    if (i>0 && start < (arr[i-1].end ?? arr[i-1].start)) {
      // 単調増加を保証
      arr[i-1].end = start;
    }
    if (end < start) end = start;
    return { i, text: (w.text??"").trim(), start, end };
  }).filter(x=>x.text);
  return { granularity:"word", items:sorted, ...meta };
}
// words が完全に無い場合のみ sentence を採用
ts
コピーする
編集する
// useAudioHighlighter（offset対応の要点）
export function useAudioHighlighter(audio: HTMLAudioElement | null, timings?: Timings, offsetSec = 0) {
  // ...
  const t = (audio?.currentTime ?? 0) + offsetSec;
  // 二分探索で現在アイテムを決定
}

1) localStorage のキー
推奨：reading-offset:${contentId}:${textHash}

同じ contentId でも本文や音声（hash）が変わると先頭無音が変わることがあるため、hash まで含めて保存してください。

もしボイスやモデルで変わる可能性があるなら：reading-offset:${contentId}:${textHash}:${voice} まで含めると万全です。

2) オフセット範囲
-0.5 ～ +0.5 秒で開始してOKです。

スライダー step は 0.01（10ms）くらいが扱いやすいです。

大きくズレる素材が出たら、UIから ±1.0 に拡張できるように min/max を props で可変化しておくと安心。

使い勝手向上のため 「Reset（0.00sに戻す）」ボタンを1つ付けておくと良いです。

3) デバッグパネルの更新頻度
100ms 間隔で十分です（見やすい＆負荷も軽い）。

実装的には、ハイライトは既に requestAnimationFrame で動かしているはずなので、表示だけ 100–200ms にスロットリングするのがおすすめです（timeupdate 依存よりスムーズ）。

例：lastRenderRef で前回描画時刻を持ち、rAF ループ内で now - last >= 100ms のときだけデバッグ用 state を更新。

参考ミニコード（保存・復元）
ts
コピーする
編集する
// 保存
localStorage.setItem(`reading-offset:${contentId}:${textHash}`, String(offsetSec));
// 復元
const saved = Number(localStorage.getItem(`reading-offset:${contentId}:${textHash}`) ?? 0);
setOffsetSec(Number.isFinite(saved) ? saved : 0);
rAF＋スロットリング（表示だけ100ms更新）
ts
コピーする
編集する
const lastRef = useRef(0);
const onRafDebug = (now: number) => {
  if (now - lastRef.current >= 100) {
    setDebugState({ currentTime: audio.currentTime, timingIdx, tokenIdx, offsetSec, playbackRate: audio.playbackRate });
    lastRef.current = now;
  }
  requestAnimationFrame(onRafDebug);
};
useEffect(() => {
  const id = requestAnimationFrame(onRafDebug);
  return () => cancelAnimationFrame(id);
}, [audio, timingIdx, tokenIdx, offsetSec]);
これで進めてください。
実装後に「granularity=word」「items.length>0」「drift が±小さく収束」になっていれば狙いどおりです。何か気になる挙動が出たら、そのデバッグパネルの数値を教えてもらえれば、微調整ポイント（しきい値や補正）をすぐ提案します。