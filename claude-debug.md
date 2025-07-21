Error:   × You're importing a component that needs `useRouter`. This React hook only works in a client component. To fix, mark the file (or its parent) with the `"use client"` directive.

./src/app/toeic/page.tsx

Error:   × You're importing a component that needs `useRouter`. This React hook only works in a client component. To fix, mark the file (or its parent) with the `"use client"` directive.
  │
  │  Learn more: https://nextjs.org/docs/app/api-reference/directives/use-client
  │

   ╭─[/Users/nakajimamasahiro/Downloads/yomitore-starter/src/app/toeic/page.tsx:1:1]
 1 │ import { useRouter } from 'next/navigation';
   ·          ─────────
 2 │ import { useTranslation } from '@/hooks/useTranslation';
 3 │ import { useEffect, useState } from 'react';
 4 │ import { getGenerationLevelName } from '@/utils/getEnglishText'; // 追加
   ╰────
  × You're importing a component that needs `useEffect`. This React hook only works in a client component. To fix, mark the file (or its parent) with the `"use client"` directive.
  │
  │  Learn more: https://nextjs.org/docs/app/api-reference/directives/use-client
  │

   ╭─[/Users/nakajimamasahiro/Downloads/yomitore-starter/src/app/toeic/page.tsx:3:1]
 1 │ import { useRouter } from 'next/navigation';
 2 │ import { useTranslation } from '@/hooks/useTranslation';
 3 │ import { useEffect, useState } from 'react';
   ·          ─────────
 4 │ import { getGenerationLevelName } from '@/utils/getEnglishText'; // 追加
 5 │ 
 6 │ interface Passage {
   ╰────
  × You're importing a component that needs `useState`. This React hook only works in a client component. To fix, mark the file (or its parent) with the `"use client"` directive.
  │
  │  Learn more: https://nextjs.org/docs/app/api-reference/directives/use-client
  │

   ╭─[/Users/nakajimamasahiro/Downloads/yomitore-starter/src/app/toeic/page.tsx:3:1]
 1 │ import { useRouter } from 'next/navigation';
 2 │ import { useTranslation } from '@/hooks/useTranslation';
 3 │ import { useEffect, useState } from 'react';
   ·                     ────────
 4 │ import { getGenerationLevelName } from '@/utils/getEnglishText'; // 追加
 5 │ 
 6 │ interface Passage {
   ╰────

## 📋 Work Session Summary (2025-07-18)

### ✅ Completed Today

#### 1. TOEICボタンのUI調整
- **目的**: `choose`ページのTOEICボタンの見た目を調整。
- **変更内容**:
    - `src/app/choose/page.tsx`にて、TOEICボタンの背景色を`bg-blue-500`から`bg-orange-500`に変更。ホバー時の色も`hover:bg-blue-600`から`hover:bg-orange-600`に変更。
    - ボタンの文字色を`text-white`から`text-black`に変更。説明文の文字色も`text-white/90`から`text-black/90`に変更。

#### 2. TOEICパッセージ選択機能の実装
- **目的**: TOEICボタンクリック後にパッセージリストを表示し、選択できるようにする。
- **変更内容**:
    - `src/app/choose/page.tsx`のTOEICボタンの遷移先を`/reading-form?category=toeic`から`/toeic`に変更。
    - `src/app/toeic/page.tsx`を新規作成。
        - 初期はダミーデータでパッセージリストを表示。
        - 各パッセージクリックで`/reading?slug=toeic/passageX`に遷移するように設定。
    - `content/toeic`ディレクトリを新規作成。
    - `public/stories/toeic/passage1.md`と`public/stories/toeic/passage2.md`をサンプルとして作成。

#### 3. TOEICパッセージ読み込みの修正
- **目的**: `/reading`ページでTOEICパッセージが正しく読み込まれるようにする。
- **変更内容**:
    - `src/lib/serverStoryLoader.ts`を修正。
        - `slug`が`toeic/`で始まる場合、`content/toeic`ディレクトリから`.md`ファイルを読み込むロジックを追加。
        - MarkdownのFront Matterを解析し、タイトルと本文を抽出する`parseFrontMatter`関数を追加。
    - `src/app/reading/page.tsx`を修正。
        - `slug`が`toeic/`で始まる場合に`loadStoryFromFileServer`を呼び出す条件を追加。
        - TOEICパッセージの場合、`loadStoryFromFileServer`に`level`パラメータを渡さないように修正（`slug.startsWith('toeic/') ? 0 : userLevel`）。

#### 4. 累計語数加算の不具合修正
- **目的**: 読書完了後、累計語数が正しく加算されない問題を解決。
- **原因**: `src/lib/readingProgress.ts`の`saveUserProgress`関数内で、古い互換性維持のための`localStorage.setItem(STORAGE_KEYS.TOTAL_WORDS_READ, ...)`の行がコメントアウトされていたため、`totalWordsRead`が更新されていなかった。
- **変更内容**:
    - `src/lib/readingProgress.ts`の`saveUserProgress`関数内の以下の行のコメントアウトを解除。
        ```typescript
        localStorage.setItem(STORAGE_KEYS.TOTAL_WORDS_READ, progress.totalWords.toString());
        localStorage.setItem(STORAGE_KEYS.COMPLETED_READINGS, progress.totalStamps.toString());
        ```

#### 5. `reading`ページのデバッグツール削除
- **目的**: 読了後に表示されるスタンプカードの下にあるデバッグツールを削除。
- **変更内容**:
    - `src/app/reading/ReadingClient.tsx`のJSX内で、`endTime && (...)`の条件ブロック内にある以下の`div`要素を削除。
        ```jsx
        {/* 🔧 デバッグ用ボタン群 */}
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-4">
          <h4 className="mb-3 text-sm font-bold text-yellow-800">🔧 デバッグツール</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {/* ... デバッグボタンのコード ... */}
          </div>
        </div>
        ```
    - このコードブロックは、`NewStampCard`コンポーネントの直後に配置されていました。

#### 6. TOEICパッセージのレベル生成スクリプトの作成と実行
- **目的**: TOEICパッセージのレベル1とレベル2のテキストを自動生成する。
- **変更内容**:
    - `scripts/generateToeicLevels.mjs`を新規作成。
        - `content/toeic`内の既存パッセージを読み込み。
        - `http://localhost:3000/api/rewrite-level`APIを呼び出し、レベル1とレベル2のテキストを生成。
        - 生成されたテキストを`content/toeic/passageX_levelY.md`として保存。
    - スクリプトを実行 (`node scripts/generateToeicLevels.mjs`)。

#### 7. TOEICパッセージAPIの修正
- **目的**: 生成されたレベル別パッセージを`/toeic`ページで表示できるようにする。
- **変更内容**:
    - `src/app/api/toeic-passages/route.ts`を修正。
        - `fs/promises`を使用し、非同期でディレクトリを読み込むように変更。
        - ファイル名から`_level`を解析し、パッセージオブジェクトに`level`プロパティとして追加。
        - パッセージを番号とレベルでソートして返すように変更。
        - デバッグログを追加し、APIの動作を確認できるようにした。

#### 8. `/toeic`ページへの語彙レベル表示・変更機能の追加
- **目的**: `/toeic`ページに、ユーザーの語彙レベル表示と「レベル変更」機能を追加する。
- **変更内容**:
    - `src/app/toeic/page.tsx`を修正。
        - `selectedLevel`と`showLevelSelector`のstateを追加。
        - `useEffect`で`localStorage`から`selectedLevel`を読み込む処理を追加。
        - `handleLevelChange`関数を追加し、`selectedLevel`の更新と`localStorage`への保存を行う。
        - `getGenerationLevelName`関数を`@/utils/getEnglishText`からインポート。
        - 「語彙レベル」表示と「レベル変更」ボタン、およびレベル選択UIのJSXを追加。
        - パッセージ選択時に、選択された`selectedLevel`を`/reading`ページのURLパラメータとして渡すように修正。

### 🐛 現在の課題

- ~~`src/app/toeic/page.tsx`が`"use client";`ディレクティブが正しく機能していない可能性があり、`useRouter`, `useEffect`, `useState`に関するエラーが継続している。~~
    - ✅ **解決済み (2025-07-21)**: `.next`ディレクトリ削除とサーバー再起動でエラー解決
    - TOEICページが正常に表示されることを確認

---

## 📋 明日のタスク (2025-07-19)

### 🎯 TOEICページの整備・完成
**優先度**: 🚨 **HIGH**

#### 1. TOEICページの基本修正
- [ ] `src/app/toeic/page.tsx`の`"use client"`ディレクティブ問題解決
- [ ] useRouter, useEffect, useStateのエラー修正
- [ ] 開発サーバー再起動・.nextディレクトリクリア
- [ ] TOEICパッセージ一覧の表示確認

#### 2. TOEICパッセージ機能の完成
- [ ] パッセージ選択時の読書ページ遷移動作確認
- [ ] レベル別パッセージ表示の動作確認
- [ ] Front Matter解析機能の動作確認
- [ ] TOEICパッセージ読み込みエラーの修正

#### 3. UI/UX改善
- [ ] TOEICページのデザイン調整
- [ ] 語彙レベル選択機能の動作確認
- [ ] パッセージリストの表示形式改善
- [ ] レスポンシブデザイン対応

#### 4. 累計語数・進捗管理
- [ ] TOEICパッセージ読了後の語数加算確認
- [ ] 読書履歴への適切な記録
- [ ] 進捗データの整合性確認

#### 5. 最終テスト・デバッグ
- [ ] 全体的な動作テスト
- [ ] エラーログの確認・修正
- [ ] パフォーマンスチェック
- [ ] 不要なデバッグツールの削除

### 🔧 技術的課題
- **Client Component問題**: useRouter/useEffect/useStateエラーの根本解決
- **API連携**: TOEICパッセージAPIとの正しい連携
- **ファイル読み込み**: Markdownファイルの確実な読み込み
- **状態管理**: localStorage連携とReact状態の同期

### 📁 関連ファイル
```
src/app/toeic/page.tsx              - メインのTOEICページ
src/app/api/toeic-passages/route.ts - TOEICパッセージAPI
src/lib/serverStoryLoader.ts        - サーバーサイドストーリーローダー
content/toeic/                      - TOEICパッセージファイル
scripts/generateToeicLevels.mjs     - レベル生成スクリプト
```

### 🎯 成功基準
- ✅ TOEICページが正常に表示される
- ✅ パッセージ選択が正しく動作する
- ✅ 語彙レベル変更機能が動作する
- ✅ 読書完了後の語数加算が正しく動作する
- ✅ エラーが発生しない
