# 依頼内容

現在、英語多読アプリ「読みトレ」の vercel 合格版ブランチ `vercel-pass-version` を元に開発を進めています。

/reading ページで生成される読み物と物語が、以下のようにテンプレ的な出力になってしまいます：

---
例1: 読み物（informational）
> This reading material covers important aspects of [topic]. Understanding this subject can help improve your knowledge...

例2: 物語（narrative）
> This is a [Genre] story with a [Tone] tone that should evoke [Feeling]. The character begins their journey...
---

以前は、テーマや感情、ジャンルに応じてもっと自然で具体的な内容が生成されていました。

# 修正の目的

- `src/app/api/generate-reading/route.ts` にあるプロンプトや処理の見直し
- 必要であれば `/choose` や `/reading` に関わる処理も調整
- Claude API or OpenAI APIへのプロンプトが破損していないか確認
- ユーザーの選択（ジャンル・感情・スタイルなど）に応じた **具体的で自然な文章が出力されるよう修正**

# 期待する状態

- `/reading` ページで生成される英文・物語がテンプレでなく、自然で内容のあるものになる
- JSONなど構造データを使って制御している場合は整合性を保つ

# 追加情報

- 語彙制限には NGSL を使用しています（Level 1〜5）
- 読み物と物語は mode によって切り替えています（`mode=reading` / `mode=story`）

必要があれば `/choose/page.tsx` も見てください。
