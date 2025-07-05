
# 多読トレーニングアプリ

このアプリは**Next.js**と**Tailwind CSS**で構築された英語多読練習アプリです。語彙レベル判定テストと個人のレベルに合わせた読み物生成機能を提供し、読書速度（WPM）の測定と履歴管理が可能です。

## 主要機能

### 1. **語彙レベル判定テスト**
- 英語の語彙レベルを判定するクイズ機能
- 正答数に基づいてレベル（1-10）を算出
- テスト結果に基づいて適切なレベルの読み物を生成

### 2. **読み物生成機能**
- OpenAI APIを使用した英語読み物の自動生成
- テーマ、サブトピック、文体、語彙レベルを指定可能
- 英文と日本語訳を同時生成

### 3. **読書速度（WPM）測定**
- 読み始めから読了までの時間を自動計測
- 語数と時間からWPM（Words Per Minute）を算出
- リアルタイムで読書統計を表示

### 4. **読書履歴管理**
- ローカルストレージで読書履歴を自動保存
- 読書日時、テーマ、語数、WPM、読書時間を記録
- 平均WPMや総読書時間などの統計情報を表示

### 5. **直感的なユーザーインターフェース**
- 日本語訳の表示/非表示切り替え機能
- 読み直し、レベル変更、次の読み物への移動ボタン
- レスポンシブデザインでモバイル・デスクトップ対応

## 使用技術

- **Next.js 15**: React フレームワーク（App Router使用）
- **TypeScript**: 型安全性とコード品質の向上
- **Tailwind CSS**: ユーティリティファーストのCSSフレームワーク
- **OpenAI API**: GPT-4を使用した英語読み物の生成
- **React Hooks**: useState, useEffect等を使用した状態管理

## セットアップ方法

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd Quiz-App-in-NextJS-main
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
`.env.local`ファイルを作成し、OpenAI APIキーを設定：
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで `http://localhost:3000` にアクセス

## プロジェクト構成

### APIルート
- `src/app/api/generate-reading/route.ts`: 読み物生成API
- `src/app/api/test-openai/route.ts`: OpenAI接続テスト用API

### ページ
- `src/app/page.js`: ホームページ（語彙テスト選択）
- `src/app/choose/page.tsx`: 語彙レベル判定テスト
- `src/app/story-form/page.tsx`: 読み物生成条件入力フォーム
- `src/app/reading/page.tsx`: 読み物表示・WPM測定ページ
- `src/app/history/page.tsx`: 読書履歴表示ページ

### コンポーネント
- `src/components/VocabularyQuiz.tsx`: 語彙テストクイズ機能
- `src/components/Results.jsx`: テスト結果表示
- `src/components/Header.js`: ヘッダーナビゲーション
- `src/components/Footer.js`: フッター

### データ・型定義
- `src/data/vocabularyData.ts`: 語彙テスト用問題データ
- `src/types/reading.ts`: TypeScript型定義
- `src/context/PointsContext.js`: スコア管理用Context

## 使用方法

### 1. 語彙レベル判定
1. ホームページで「語彙テスト」を選択
2. 20問の語彙テストを回答
3. 正答数に基づいてレベル（1-10）が算出される

### 2. 読み物生成・読書
1. テスト完了後、または直接「読み物生成」から条件を入力
2. テーマ、サブトピック、文体を指定
3. 生成された英文を読み、「読了」ボタンでWPMを測定
4. 日本語訳は必要に応じて表示切り替え可能

### 3. 履歴確認
- ヘッダーの「履歴」から過去の読書記録を確認
- 平均WPM、総読書時間などの統計も表示

## ビルドとデプロイ

### プロダクションビルド
```bash
npm run build
npm start
```

### 型チェック
```bash
npx tsc --noEmit
```

### Lint実行
```bash
npm run lint
```

## 今後の改善点

- **ユーザー認証**: アカウント機能の追加
- **クラウド履歴保存**: サーバーサイドでの履歴管理
- **より詳細な統計**: 読書傾向の分析機能
- **SNS共有**: 読書成果の共有機能
- **オフライン対応**: PWA化による利用性向上
# redeploy trigger
