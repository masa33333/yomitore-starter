0. 目的
動的生成フロー（story-form）を停止。

プリセット Story を Supabase に保存し、
/choose → /stories でタイトル一覧を表示。

選択後 /reading?slug=<slug> で、choose ページで確定した語彙レベルに合った本文を表示。

最初のコンテンツは Notting Hill（level 1-3 の 3 本）。

1. DB 構造（stories テーブル）
pgsql
コードをコピーする
id            SERIAL  PK
slug          text        -- "notting-hill"
level         int         -- 1|2|3
title         text
tokens        text[]      -- tokenised words
glossary      jsonb       -- [{index,word,hint}]
word_count    int
created_at    timestamptz
複合一意キー (slug, level)

CHECK (level IN (1,2,3))

2. Notting Hill インポートスクリプト
bash
コードをコピーする
stories/notting-hill/
  level1.txt   # A2
  level2.txt   # B1
  level3.txt   # B2
scripts/importNottingHill.mjs
読み込み → tokenise → glossary 埋め込み

supabase.from('stories').upsert(...)

3. フロント改修
3-1 /choose ページ
“Read stories” ボタンを /stories にリンク。

レベル選択 UI は従来どおり残す（localStorage.vocabLevel 更新）。

3-2 /stories 新規ページ
Supabase から

sql
コードをコピーする
select slug,title from stories
where level = 1
group by slug,title;
（level=1 で代表取得）

カード or リストでタイトルのみ表示。

クリック → /reading?slug=<slug>

※ レベル説明文は置かない。UI は単純なタイトル一覧のみ。

3-3 /reading
ts
コードをコピーする
const userLevel = getUserLevel();          // 1|2|3
const { data } = await supabase
  .from('stories')
  .select('*')
  .eq('slug', slug)
  .eq('level', userLevel)
  .single();
tokens + glossary → Popover 表示。

3-4 UI 表示
Level バッジや説明は不要。本文の難語にだけ Popover ヒントを付ける。

4. story-form の扱い
ルートから外す（コメントアウト）だがファイルは残す。

5. ルーティング
/index　変更なし

/choose ボタン追加

/stories 新ページ

/reading slug パラメータ対応

6. テスト項目
 /stories に Notting Hill が表示される

 /choose でレベルを 1/2/3 に変更後、/reading が対応本文を取得

 glossary ポップアップが動く

 旧 story-form URL は 404 もしくはリダイレクト

7. 推奨作業順
git checkout -b feat/story-library

スクリプトで Notting Hill インポート

/stories 実装 → /reading 更新

/choose ボタン追加

e2e テスト → ステージング → 本番


1. 既存のreading機能との互換性
    - 現在の/readingページは動的生成ベース
  ですが、これを完全に置き換えますか？→完全に置き換える

2. Notting Hillファイルの準備
    - stories/notting-hill/level1.txt,
  level2.txt, level3.txt
  は既に存在しますか？→Yes

3. tokenise と glossary 生成
tokenise：

各 levelX.txt を単語単位で tokens 配列に分割してください（既定の split(/\b/) で可）。

glossary：

今回の Notting Hill では不要です。

インポートスクリプトでは glossary: [] を入れておくか、カラムを NULL にしてください。

4. Supabase テーブル作成
stories テーブルはまだ無いので マイグレーション SQL が必要です。

sql
コードをコピーする
CREATE TABLE stories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL,
  level       INT  NOT NULL CHECK (level IN (1,2,3)),
  title       TEXT NOT NULL,
  tokens      TEXT[] NOT NULL,
  glossary    JSONB,            -- 今回は NULL or []
  word_count  INT  NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (slug, level)
);
5. 作業順序
推奨した順序 （定数→スクリプト→/stories→/reading→テスト） の通りで OK。

新ブランチ feat/story-library を切ってから作業開始してください。
