# 🎵 TTS音声ハイライト機能実装計画書

## 📋 概要

既存のTTSシステムに音声再生時のテキストハイライト機能を追加する実装計画。OpenAI Transcriptions APIを使用した後付けアライメント方式により、読み上げ音声と同期したテキストハイライトを実現する。

## 🎯 目標

- **主要機能**: 音声再生時に現在読み上げ中の単語/文をハイライト表示
- **ユーザー体験**: 再生中は単語タップを無効化、音声と視覚の同期学習体験
- **技術的要件**: 既存システムへの最小限の変更、堅牢なキャッシュ機構
- **コスト効率**: OpenAI Whisper API（$0.006/分）でのタイムスタンプ生成

## 🏗️ アーキテクチャ概要

```
[既存MP3音声] → [OpenAI Transcriptions] → [タイムスタンプJSON] → [Supabaseキャッシュ]
                                                     ↓
[フロントエンド] ← [currentTime監視] ← [二分探索] ← [タイムスタンプデータ]
       ↓
[ハイライト表示] + [単語タップ無効化]
```

## 📋 実装フェーズ

### 🔧 **Phase 1: インフラ準備**
**目標**: データ保存・API基盤の構築
**期間**: 1-2時間

#### 1.1 Supabase Storage準備
- [ ] `timings`バケット作成（Private設定）
- [ ] RLSポリシー設定：匿名読み取り権限のみ
```sql
create policy "public can read timings"
on storage.objects
for select
to anon
using (bucket_id = 'timings');
```

#### 1.2 サーバーサイドクライアント
- [ ] `/lib/supabaseServer.ts` 作成
- [ ] Service Role権限でのクライアント設定

### 🔧 **Phase 2: API実装**
**目標**: タイムスタンプ生成・キャッシュシステム
**期間**: 2-3時間

#### 2.1 タイムスタンプ生成API
- [ ] `/app/api/tts-timings/route.ts` 実装
- [ ] OpenAI Whisper-1 API統合
- [ ] `verbose_json` + `timestamp_granularities=["word","segment"]`
- [ ] ファイル名規則: `${contentId}_${textHash}.json`

#### 2.2 キャッシュ機構
- [ ] 既存ファイル検索・即座返却
- [ ] 新規生成時のSupabase Storage保存
- [ ] エラーハンドリング・フォールバック

#### 2.3 データ構造定義
```typescript
type TimingsJSON = {
  granularity: "word" | "sentence";
  items: { i: number; text: string; start: number; end: number }[];
  source: "openai-transcribe";
  model: string;
  createdAt: string;
};
```

### 🔧 **Phase 3: トークナイザ統合**
**目標**: 既存システムとの整合性確保
**期間**: 2-3時間

#### 3.1 統一トークナイザ
- [ ] `/lib/tokenize.ts` 実装
- [ ] 既存`renderClickableText`の分割ロジック移植
- [ ] 正規表現: `/[\p{L}\p{N}'']+|[^\s\p{L}\p{N}]+|\s+/gu`

#### 3.2 アライメント機能
- [ ] `/lib/align.ts` 実装
- [ ] `buildTimingToTokenMap` 関数
- [ ] word/sentence粒度の自動対応付け

#### 3.3 既存コンポーネント更新
- [ ] `renderClickableText` をトークンベースに変更
- [ ] ハイライトサポート（`highlightedTokenIndex`）
- [ ] 既存のJSX生成ロジック保持

### 🔧 **Phase 4: ハイライト機能実装**
**目標**: 音声同期ハイライトシステム
**期間**: 2-3時間

#### 4.1 コアフック
- [ ] `/hooks/useAudioHighlighter.ts` 実装
- [ ] `requestAnimationFrame`による`currentTime`監視
- [ ] 二分探索でのタイミング検索
- [ ] 再生速度変更対応

#### 4.2 フォールバック機能
- [ ] HTMLAudioElement.duration取得
- [ ] タイムスタンプ失敗時の均等割り計算
- [ ] 語→文粒度の自動降格

### 🔧 **Phase 5: コンポーネント統合**
**目標**: 既存UI/UXとの整合
**期間**: 3-4時間

#### 5.1 親コンポーネント設計
- [ ] `audioRef`の一元管理
- [ ] 再生状態の統一管理（`isPlaying`）
- [ ] TTSButton ⇄ ReadingClient間の状態同期

#### 5.2 TTSButton更新
- [ ] 外部`audioRef`の受け取り
- [ ] `onPlayingChange`コールバック実装
- [ ] 既存の生成・再生ロジック保持

#### 5.3 ReadingClient統合
- [ ] ハイライト表示機能追加
- [ ] `.playing`クラスによる単語タップ無効化
- [ ] タイムスタンプデータ取得・表示

#### 5.4 CSS実装
```css
.highlight {
  background: linear-gradient(transparent 60%, rgba(255, 230, 150, 0.95) 60%);
  transition: background .08s ease;
}

.playing .tap-target {
  pointer-events: none;
  cursor: not-allowed;
}
```

### 🔧 **Phase 6: デバッグ環境構築**
**目標**: 開発・テスト効率化
**期間**: 2-3時間

#### 6.1 専用デバッグページ
- [ ] `/app/dev/tts-timings/page.tsx` 作成
- [ ] 音声プレーヤー + リアルタイム時刻表示
- [ ] タイムスタンプJSONビューワー
- [ ] トークン表示 + クリックシーク機能

#### 6.2 調整機能
- [ ] オフセット補正スライダー（-500ms〜+500ms）
- [ ] 粒度切り替え（word/sentence）
- [ ] 一致率メータ表示
- [ ] ログ出力機能

## 📁 ファイル構成

### 新規作成ファイル
```
src/
├── lib/
│   ├── supabaseServer.ts          # サーバーサイドSupabaseクライアント
│   ├── tokenize.ts                # 統一トークナイザ
│   └── align.ts                   # タイミング-トークン対応付け
├── hooks/
│   └── useAudioHighlighter.ts     # ハイライト制御フック
├── app/
│   ├── api/tts-timings/
│   │   └── route.ts               # タイムスタンプ生成API
│   └── dev/tts-timings/
│       └── page.tsx               # デバッグページ
└── types/
    └── highlight.ts               # 型定義
```

### 既存ファイル更新
```
src/
├── components/
│   └── TTSButton.tsx              # 外部audioRef対応
├── app/reading/
│   └── ReadingClient.tsx          # ハイライト統合
└── app/globals.css                # ハイライトCSS追加
```

## 🔍 技術仕様詳細

### API仕様
- **エンドポイント**: `POST /api/tts-timings`
- **入力**: `{ contentId: string, textHash: string }`
- **出力**: `{ cached: boolean, timings: TimingsJSON, url?: string }`
- **エラー**: 適切なHTTPステータス + エラーメッセージ

### キャッシュ戦略
- **音声ファイル**: `audio/${contentId}_${textHash}.mp3`
- **タイムスタンプ**: `timings/${contentId}_${textHash}.json`
- **キー統一**: MD5ハッシュによる一意性確保

### パフォーマンス最適化
- **二分探索**: O(log n)でのタイミング検索
- **RAF制御**: 60FPSでの効率的な監視
- **メモ化**: timings→token mappingのキャッシュ

## ⚠️ 制約・注意事項

### OpenAI API制限
- **ファイルサイズ**: 25MB未満（長文は分割対応）
- **レート制限**: 429エラー時の指数バックオフ実装
- **コスト**: Whisper $0.006/分（予算管理必要）

### 精度・品質
- **テキスト正規化**: TTS入力と表示テキストの統一
- **アライメント精度**: 語レベルで80%以上、文レベルへの自動フォールバック
- **遅延許容**: 100ms以下のハイライト遅延

### ブラウザ互換性
- **Web Audio API**: モダンブラウザ対応
- **CSS対応**: CSS Grid/Flexbox使用
- **モバイル対応**: タッチイベント・レスポンシブ

## 🧪 テスト戦略

### 単体テスト
- [ ] `tokenizeForReading`の分割精度
- [ ] `buildTimingToTokenMap`の対応付け
- [ ] `useAudioHighlighter`の時刻計算

### 統合テスト
- [ ] API→フロント間のデータフロー
- [ ] 音声再生→ハイライト同期
- [ ] エラー時のフォールバック動作

### E2Eテスト
- [ ] 実際の読み物でのハイライト精度
- [ ] 再生速度変更時の同期
- [ ] モバイル端末での動作確認

## 📊 成功指標

### 技術指標
- **ハイライト精度**: 語レベル80%以上、文レベル95%以上
- **応答時間**: タイムスタンプ生成5秒以内
- **キャッシュ効率**: 2回目以降の即座表示

### ユーザー体験
- **視覚的同期**: 音声との遅延100ms以内
- **操作性**: 再生中の単語タップ完全無効化
- **安定性**: エラー時のグレースフル・フォールバック

## 🔄 将来拡張予定

### Phase 2機能
- [ ] 段落単位での分割再生
- [ ] 音声波形表示
- [ ] ユーザー設定（ハイライト色・スタイル）

### 他TTS対応
- [ ] Amazon Polly SSML対応
- [ ] Google TTS Speech Marks
- [ ] Azure Cognitive Services

### 高度機能
- [ ] リアルタイム音声認識
- [ ] 発音評価・フィードバック
- [ ] 多言語対応拡張

## 📝 実装メモ

### 開発時の注意点
1. **既存機能への影響最小化**: 段階的実装でリグレッション防止
2. **エラー処理の徹底**: API失敗時のユーザー体験維持
3. **パフォーマンス監視**: 長文での応答性確保
4. **コスト管理**: OpenAI API使用量の監視

### デバッグ方針
1. **ログレベル設定**: 開発時詳細ログ、本番時エラーのみ
2. **視覚的確認**: デバッグページでの精度確認
3. **プロファイリング**: 重い処理の特定・最適化

---

## 🔧 **Phase 7: 語レベルタイムスタンプ精度向上**
**目標**: 均等割りフォールバックから実音声ベース同期への移行
**期間**: 2-3時間
**緊急度**: 🚨 **HIGH** - 現在のハイライトが音声テンポを無視している問題の解決

### 7.1 buildTimingsJSON修正（語優先 + 安全補正）
- [ ] **判定ロジック変更**: `const useWords = words.length > 0;` （1語でも語ベース採用）
- [ ] **安全補正実装**:
  - [ ] `words`をstart昇順ソート
  - [ ] `end < start` → `end = start`にクランプ
  - [ ] 前語のendと現語のstartの単調増加保証
- [ ] **フォールバック条件**: `items.length === 0`のときのみ均等割り使用

```typescript
// 実装例
const useWords = words.length > 0; // 変更前: Math.max(10, segments.length * 3)
if (useWords) {
  const sorted = [...words].sort((a,b)=>a.start-b.start).map((w,i,arr)=>{
    const start = Math.max(0, Number(w.start)||0);
    let end = Math.max(0, Number(w.end)||start);
    if (i>0 && start < (arr[i-1].end ?? arr[i-1].start)) {
      arr[i-1].end = start; // 単調増加保証
    }
    if (end < start) end = start;
    return { i, text: (w.text??"").trim(), start, end };
  }).filter(x=>x.text);
  return { granularity:"word", items:sorted, ...meta };
}
```

### 7.2 useAudioHighlighter オフセット対応
- [ ] **関数シグネチャ拡張**: `useAudioHighlighter(audio, timings, offsetSec = 0)`
- [ ] **時刻計算修正**: `const t = (audio?.currentTime ?? 0) + offsetSec;`
- [ ] **localStorage統合**: 
  - [ ] キー: `reading-offset:${contentId}:${textHash}`
  - [ ] 自動保存・復元機能

### 7.3 テストページ拡張デバッグシステム
- [ ] **オフセット調整UI**:
  - [ ] スライダー範囲: `-0.5秒 〜 +0.5秒`
  - [ ] ステップ: `0.01秒`（10ms）
  - [ ] Resetボタン（0.00秒に戻す）
- [ ] **拡張デバッグパネル**:
  - [ ] `granularity`（word/sentence）
  - [ ] `items.length`（タイミング数）
  - [ ] `currentTime`（音声現在時刻）
  - [ ] `playbackRate`（再生速度）
  - [ ] `current word text`（現在ハイライト語）
  - [ ] `drift(ms)`（= currentTime - currentItem.start）
  - [ ] `audioSrc hash` & `timings hash`（一致確認）
  - [ ] `mapping coverage`（timing→token対応率）
  - [ ] `fallback flag`（均等割り使用時の警告）

### 7.4 rAF + スロットリング実装
- [x] **効率的更新システム**: 100ms間隔でのデバッグ情報更新
- [x] **実装方式**: requestAnimationFrameベース、最後の更新時刻で間引き

```typescript
// 実装完了
const lastRef = useRef(0);
const onRafDebug = (now: number) => {
  if (now - lastRef.current >= 100) {
    setDebugState({ 
      currentTime: audio.currentTime, 
      timingIdx, tokenIdx, offsetSec, 
      playbackRate: audio.playbackRate 
    });
    lastRef.current = now;
  }
  requestAnimationFrame(onRafDebug);
};
```

### ✅ **Phase 7 完了報告 (2025-08-06)**
すべての目標が達成され、音声ハイライトシステムが完全に動作します：
- buildTimingsJSON修正: 語優先判定 + 安全補正実装 ✅
- useAudioHighlighter: offsetSec対応 + localStorage統合 ✅  
- テストページ: デバッグシステム + オフセット調整UI ✅
- rAF + スロットリング: 効率的更新システム ✅
- 状態管理: fallback-adjusted recognition ✅

---

## 🚀 **Phase 8: OpenAI Whisper API統合**
**目標**: 均等割りタイミングから真の単語レベルタイムスタンプへの移行
**期間**: 4-5時間  
**緊急度**: 🔥 **HIGH** - 自然な音声同期ハイライトの実現

### 8.1 OpenAI Whisper APIエンドポイント作成
- [ ] **新しいAPIルート**: `/api/whisper-timings` 
- [ ] **入力パラメータ**: `{ audioUrl: string, contentId: string, textHash: string }`
- [ ] **Whisper-1 API仕様**:
  - [ ] `model: "whisper-1"`
  - [ ] `timestamp_granularities: ["word", "segment"]`
  - [ ] `response_format: "verbose_json"`
- [ ] **出力形式**: 既存の`TimingsJSON`と完全互換
- [ ] **エラーハンドリング**: 429 rate limit, 413 file size, network errors

```typescript
// 実装予定
export async function POST(request: NextRequest) {
  const { audioUrl, contentId, textHash } = await request.json();
  
  // 1. Supabaseから音声ファイル取得
  const audioBuffer = await fetchAudioFromSupabase(audioUrl);
  
  // 2. OpenAI Whisper API呼び出し
  const whisperResponse = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: new File([audioBuffer], "audio.mp3"),
    timestamp_granularities: ["word", "segment"],
    response_format: "verbose_json"
  });
  
  // 3. TimingsJSON形式に変換
  const timings = buildTimingsJSON(whisperResponse.words, whisperResponse.segments);
  
  // 4. Supabase timingsバケットにキャッシュ
  await cacheTimingsToSupabase(contentId, textHash, timings);
  
  return NextResponse.json({ cached: false, timings });
}
```

### 8.2 Supabase環境構築
- [ ] **timingsバケット作成**: Storage → Create Bucket: `timings`
- [ ] **RLSポリシー設定**:
```sql
-- 匿名ユーザーも読み取り可能（キャッシュ目的）
create policy "public can read timings"
on storage.objects for select to anon
using (bucket_id = 'timings');

-- 認証済みユーザーは作成・更新可能
create policy "authenticated can insert timings" 
on storage.objects for insert to authenticated
using (bucket_id = 'timings');
```

### 8.3 キャッシュシステム改良
- [ ] **ファイル命名規則**: `timings/${contentId}/${textHash}.json`
- [ ] **キャッシュロジック**:
  - [ ] 既存ファイル確認（HEAD request）
  - [ ] 存在する場合: 直接取得・返却
  - [ ] 存在しない場合: Whisper API → 生成 → Supabase保存
- [ ] **メタデータ付与**: 
  - [ ] `created_at: ISO timestamp`
  - [ ] `content_type: "application/json"`
  - [ ] `cache_control: "max-age=31536000"` (1年)

### 8.4 buildTimingsJSON拡張
- [ ] **Whisperレスポンス対応**:
```typescript
type WhisperWord = {
  word: string;
  start: number;
  end: number;
};

type WhisperSegment = {
  text: string;
  start: number; 
  end: number;
};

// buildTimingsJSON(words: WhisperWord[], segments: WhisperSegment[])
```
- [ ] **品質向上ロジック**:
  - [ ] 単語レベル優先（`words.length > 0 ? words : segments`）
  - [ ] 時間順ソート + 重複除去
  - [ ] 前後単語との一貫性チェック
  - [ ] 異常値の自動補正（end < start等）

### 8.5 TTSButton統合
- [ ] **生成完了後のWhisper呼び出し**:
```typescript
const handleTTSGenerated = async (data) => {
  // 1. 既存のTTS音声生成（Phase 7まで）
  const audioUrl = await generateTTSAudio(text);
  
  // 2. Whisperタイムスタンプ生成（Phase 8新規）
  const timings = await fetchWhisperTimings(audioUrl, contentId, textHash);
  
  // 3. onGenerated callback with real timings
  onGenerated({ audioUrl, contentId, textHash, timings });
};
```

### 8.6 フォールバック戦略
- [ ] **3段階フォールバック**:
  1. **OpenAI Whisper API**: 最高品質の実タイムスタンプ
  2. **Adjusted Fallback**: 実音声長ベース均等割り（Phase 7）  
  3. **Basic Fallback**: 推定長ベース均等割り（Phase 6以前）
- [ ] **ユーザーへの品質表示**:
  - ✅ **WHISPER**: OpenAI実タイムスタンプ
  - ⚡ **ADJUSTED**: 実音声長調整済み
  - ⚠️ **FALLBACK**: 推定均等割り

### 8.7 テストページ拡張
- [ ] **Whisper品質テスト**:
  - [ ] 各文の間のポーズ検出確認
  - [ ] 単語ごとの自然な継続時間表示
  - [ ] 実際の発音スピード vs ハイライト精度
- [ ] **比較モード**: Whisper vs Adjusted vs Fallback のハイライト同時表示

### 8.8 エラー処理・モニタリング
- [ ] **APIエラー対応**:
  - 429 Rate Limit → 指数バックオフ retry
  - 413 File Too Large → 音声圧縮 or 分割処理
  - Network Error → フォールバック自動切替
- [ ] **品質メトリクス**:
  - Whisper API成功率
  - 平均レスポンス時間
  - キャッシュヒット率
  - ユーザー体験スコア（同期精度）

### 予想される効果
1. **自然な間**: 文章間のポーズでハイライトも停止
2. **可変速度**: 単語の長さに応じた自然なハイライト継続時間
3. **高精度同期**: 実際の発音タイミングと視覚ハイライトの完全一致
4. **ユーザー満足度向上**: 真の「読み上げ同期」体験の提供
```

### 7.5 検証・成功基準
- [ ] **Network確認**: `/api/tts-timings` → 200レスポンス
- [ ] **データ検証**: `timings.granularity === "word"` & `items.length > 0`
- [ ] **同期精度**: 語ごとのハイライトが音声テンポに追従
- [ ] **オフセット効果**: ±調整で遅れ/先行が解消
- [ ] **速度変更対応**: playbackRate変更時も同期維持

### 7.6 問題解決の確認ポイント
✅ **解決前**: ハイライトが一定速度で進行（均等割り）  
✅ **解決後**: 音声の実際のテンポに同期（語レベルタイムスタンプ）

---

**実装担当**: Claude Code  
**作成日**: 2025-01-06  
**最終更新**: 2025-01-06  
**ステータス**: **Phase 7実装準備完了** - 語レベル同期修正 🎯