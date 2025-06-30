# 英語多読アプリ TTS機能実装ロードマップ

## 📋 プロジェクト概要
英語多読支援アプリに音声読み上げ（TTS）機能を追加し、ユーザーがテキストを聞きながら学習できるようにする。

## 🎯 目標
- **コスト**: 月額$5以下で運用
- **品質**: 英語学習に十分な音質を確保
- **UX**: テキスト生成から5-10秒以内に音声提供

## 🚀 実装フェーズ

### Phase 1: MVP実装（3-5日）
**目標**: 基本的な音声再生機能の実装

#### タスクリスト
- [ ] Gemini Flash API の統合
  - APIキーの環境変数設定
  - Next.js API Route作成 (`/api/tts`)
- [ ] 音声ファイルの保存
  - Supabase Storage バケット作成
  - アップロード処理の実装
- [ ] フロントエンド再生機能
  - 再生ボタンコンポーネント作成
  - 基本的な音声プレイヤー実装

#### 必要なコード構造
```
src/
├── app/
│   └── api/
│       └── tts/
│           └── route.ts        # TTS API エンドポイント
├── components/
│   └── AudioPlayer.tsx         # 音声再生コンポーネント
├── lib/
│   └── tts/
│       ├── gemini.ts          # Gemini API クライアント
│       └── storage.ts         # Supabase Storage 操作
└── hooks/
    └── useAudio.ts            # 音声関連のカスタムフック
```

### Phase 2: コスト最適化（1週間）
**目標**: 運用コストを40%削減

#### タスクリスト
- [ ] 段階的生成の実装
  - 最初の2-3段落のみ即座に生成
  - スクロール位置に応じた追加生成
- [ ] キャッシュシステム
  - 同一テキストの重複生成防止
  - データベースでの音声URL管理
- [ ] 音声ファイルの圧縮
  - ffmpeg統合
  - 最適なビットレート設定（48kbps）

#### 実装詳細
```typescript
// 段階的生成のロジック
interface AudioGenerationStrategy {
  initialParagraphs: 3;
  generateFullAfterProgress: 0.3; // 30%読了後
  cacheExpiry: null; // 永続キャッシュ
}
```

### Phase 3: UX向上（1週間）
**目標**: 学習効果を高める機能追加

#### タスクリスト
- [ ] 再生速度調整（0.8x, 1.0x, 1.25x）
- [ ] スクロール同期
  - 現在再生中の段落をハイライト
- [ ] プリロード機能
  - 次の記事の音声を先読み生成
- [ ] 再生状態の永続化
  - 中断位置の記憶

### Phase 4: 高度な最適化（オプション）
**目標**: さらなるコスト削減と機能拡張

#### タスクリスト
- [ ] インテリジェントキャッシュ
  - 類似文章の自動検出
- [ ] Cloudflare Workers統合
  - エッジでの音声処理
- [ ] 学習支援機能
  - シャドーイングモード
  - センテンスリピート

## 🛠 技術スタック

### 必須
- **TTS API**: Google Gemini Flash (最安値)
- **ストレージ**: Supabase Storage
- **フロントエンド**: React + Next.js
- **音声処理**: Web Audio API

### オプション
- **キュー管理**: Supabase Edge Functions
- **音声圧縮**: ffmpeg-wasm
- **CDN**: Cloudflare

## 📊 コスト試算

| フェーズ | 月間コスト | 削減率 |
|---------|-----------|--------|
| Phase 1 (MVP) | ~$7 | - |
| Phase 2 (最適化) | ~$4.5 | 36% |
| Phase 3 (UX) | ~$4.5 | 36% |
| Phase 4 (高度) | ~$3 | 57% |

## 🔧 環境変数設定

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## 📝 実装時の注意事項

1. **エラーハンドリング**
   - API制限に対するリトライ処理
   - 生成失敗時のフォールバック

2. **セキュリティ**
   - 音声ファイルへの直接アクセス制限
   - レート制限の実装

3. **パフォーマンス**
   - 音声生成のバックグラウンド処理
   - UIのノンブロッキング設計

## 🚦 開始手順

1. このドキュメントをプロジェクトルートに `TTS_ROADMAP.md` として保存
2. Phase 1のタスクから順番に実装
3. 各フェーズ完了後にユーザーフィードバックを収集
4. 必要に応じて計画を調整

## 💡 Claude Codeでの作業例

```bash
# Phase 1の実装開始
claude-code "Create a Next.js API route for TTS using Gemini Flash API at /app/api/tts/route.ts"

# テスト
claude-code "Write tests for the TTS API endpoint"

# フロントエンド実装
claude-code "Create an AudioPlayer component that fetches and plays audio from Supabase Storage"
```

---

このロードマップに従って実装を進めることで、効率的にTTS機能を導入できます。各フェーズは独立しているため、MVPリリース後も継続的に改善を加えられます。