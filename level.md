3 段階レベル移行 “一発指示書”（コピー＆ペースト可）
0. ゴール
旧 5 段階（1=A1, … 5=C1）を 新 3 段階 にする

新 Level 1 = 旧1＋旧2　（A1/A2）

新 Level 2 = 旧3　　　（B1）

新 Level 3 = 旧4　　　（B2）

旧5 (C1) は今後使用しない → 参照時は自動で 3 に丸める

すべてのコード・データ・UI が 1-3 で動くことを確認

1. 定数と語彙データ
src/constants/ngslData.ts

レベル配列を

ts
コードをコピーする
export const LEVELS = ['1','2','3'];
NGSL リストを再タグ付け：

0–1800 → level 1

1801–3000 → level 2

3001–3500 → level 3

3501+ → 無印（上級語として扱う）

src/constants/promptTemplates.ts

生成プロンプト内の MAX_LEVEL を 3 に変更

語彙割合条件を

level 1: NGSL ≤1800 を 90 %、1801–3000 を 10 %

level 2: NGSL ≤3000 を 90 %、3001–3500 を 10 %

level 3: NGSL ≤3500 を 100 %

関係代名詞／仮定法などの文法指示も 1-3 用に見直し

2. クイズ判定 & localStorage
quiz/scoreUtils.ts（または該当ファイル）

正答数→レベル計算式を 1-3 用に再設定

旧条件が残っていないか grep で確認

ProgressWatcher.ts（起動時処理）

ts
コードをコピーする
const old = Number(localStorage.vocabLevel || 1);
localStorage.vocabLevel =
  old > 3 ? 3 :
  old < 1 ? 1 : old;
3. データフォルダ
/src/data/staticLetters.ts および Storage

level4 と level5 ディレクトリを削除、または level3 にコピー

import パスを書き換えて “1|2|3” だけ残す

既存 story / TTS キャッシュ

フォルダ名・キーに含まれるレベルを正規表現で検索

4 と 5 を 3 へ rename するスクリプトを一度回す

4. Supabase
stories テーブル

sql
コードをコピーする
UPDATE stories SET level = 3 WHERE level IN (4,5);
ALTER TABLE stories
  ADD CONSTRAINT level_range CHECK (level IN (1,2,3));
Edge Function / API が level=5 を要求してきたら強制的に 3 を返すフォールバックを追加。

5. UI コンポーネント
components/LevelBadge.tsx

バッジ色・テキストを 1=🟢 / 2=🟠 / 3=🔵 に統一

余計なツールチップ（C1 など）を削除

設定画面やプログレスバー

「全 5 レベル」→「全 3 レベル」表記を置換

6. 自動生成パイプライン
レベルループ

js
コードをコピーする
const TARGET_LEVELS = [1,2,3];
語彙検証

チェック関数の MAX_LEVEL を 3 に

NGSL 範囲も 1800/3000/3500 境界で判定

7. 移行手順
git ブランチ feat/level-1-3 を作成

上記変更をすべて実装

npm run test && npm run lint で静的チェック

Vercel/Staging 環境にデプロイ → 旧ユーザーの localStorage 自動変換を確認

本番マイグレーション（Supabase UPDATE → 新ビルド反映）

30 日間は旧ブランチを残し、エラーログに旧レベルアクセスが出ないか監視

8. 確認ポイント
 /quiz の終了画面に表示されるレベルが 1-3 である

 /reading /letter で適切な story が取れている

 NGSL 超過語が基準内に収まり、リジェネ率が 10 % 未満

 localStorage に vocabLevel = 1|2|3 以外が入らない

 Supabase stories テーブルに level4/5 レコードが残っていない

💡 メモ

旧レベル5（C1）ユーザー向けには今後 “挑戦モード” を別実装する案あり。

早期 QA では レベル1 の語彙分布 が偏りやすいので最初だけ手動レビュー推奨。



✅ 回答：移行作業の細部確認
1. 既存ユーザーの移行
旧 Level 4/5 → 新 Level 3 で統一してください。

理由：B2 レベルの教材を上限にする方針のため。

localStorage 変換

起動時（ProgressWatcher など最初に走る場所）で 毎回チェック にしておくと安心です。

ts
コードをコピーする
const v = Number(localStorage.vocabLevel || 1);
localStorage.vocabLevel = v > 3 ? 3 : v < 1 ? 1 : v;
一度書き換えたら次回以降はそのまま3以下なので負荷は無視できます。

2. 静的手紙データ（staticLetters.ts ほか）
level3 ディレクトリにコピー＋簡単な校正 がおすすめ。

旧 level4 手紙は語彙・構文がほぼ B2 想定なので流用可。

旧 level5（C1）の手紙は難度が高すぎる場合が多いので、新規で B2 相当に書き直すか削除。

コンテンツ品質

B2 上限として「関係詞＋分詞構文は可、仮定法・倒置は控えめ」程度を目安に。

3. 推奨作業順序
新ブランチ作成 feat/level-1-3

定数・NGSL データ置換（LEVELS, ngslData.ts）

localStorage マイグレーション関数追加

DB 更新スクリプト（Supabase UPDATE + CHECK 制約）

静的データ＆Storage フォルダ整理

UI 表示（バッジ・文言）修正

パイプライン（OpenAI 生成 & チェック）で level=1-3 反映

単体テスト → E2E テスト → ステージングデプロイ

本番リリース & ログ監視

段階的に出すメリットが少ないので “ワンショットで全変更 → QA → 本番” がシンプルです。

4. テスト戦略
最重要パス

/quiz → レベル1-3 正しく判定

/choose → 選択後にレベル別 Story fetch

/reading & /letter → Glossary・WPM 表示 OK

TTS キャッシュ：キーに level ≤3 でヒットするか

旧レベル5コンテンツ

フォールバックで level3 を返す設計なら、旧 level5 slug を直接リクエストして level3 データが返る ことを 1 回確認すれば十分。

5. Git ブランチ
はい、feat/level-1-3 を切ってから開始で問題ありません。

プルリクの説明に「旧5→新3へ丸めた理由」と「CHECK 制約を追加した旨」を明記しておくとレビューがスムーズです。

現在の動くバージョンをわかるようにgit hubに保存しておいて。