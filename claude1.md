# 🔧 Task: /reading-form を「テーマ入力だけ」に簡素化し、
# 生成は「 指定語彙レベルで英訳」　

## 1. UI 変更
### ❌ 削除
- 「感情・雰囲気」フィールド  
- 「文体」フィールド
### ✅ 残す
- Input: `テーマ (topic)` のみ
```tsx
<form onSubmit={...}>
  <Label>知りたいテーマ</Label>
  <Input name="topic" required />
  <Button type="submit">生成</Button>
</form>
2. 生成仕様
英語で読み物を 200–300 英単語相当 の情報量で、
ユーザー語彙レベル (${level}) に合わせて生成
教育的で興味深い内容にする
構成は 5 段落：導入・キーファクト・例示・追加洞察・まとめ

Did you know? などの締め文は不要

JSON 構造を厳守

新 Prompt

You are a professional English educational content writer specializing in creating engaging reading materials for English learners.

## 指示
1. 英語で、以下の条件で読み物を作成せよ
   - テーマ: ${topic}
   - 段落数: 5
   - 情報量: 200–300 英単語相当
   - 専門家視点の驚きウンチクを交え、中学生にもわかる表現で
2.  以下のstrict JSON形式で出力してください：
 {
    "title": "[Engaging
  Title About ${topic}]",
    "content": [
      "[First paragraph:
  Introduction to the
  topic]",
      "[Second paragraph:
   Key information or
  interesting facts]",
      "[Third paragraph:
  Examples or practical
  applications]",
      "[Fourth paragraph:
   Additional insights or
   perspectives]",
      "[Fifth paragraph:
  Conclusion or takeaway
  message]"
    ],
    "themes": ["[Related
  theme 1]", "[Related
  theme 2]", "[Related
  theme 3]"]
  }

重要な制約:
  - 語彙レベル${level}に適したレベルの単語のみを使用
  - 読み物は200-300語程度
  - ${topic}について教育的で興味深い内容にする
  - JSON形式を厳密に守る
  - contentは配列形式で段落ごとに分ける
  - themesには関連する3つのテーマを含める

実装変更
app/api/generate/route.ts

受け取る body: { topic: string }

level はユーザープロファイルまたは cookies/session で取得

Emotion / style 引数の削除

generateStory() シグネチャを (topic: string, level: number) に簡素化

3. 受入基準
✅ フォームは テーマ入力欄＋生成ボタン のみ

✅ 生成結果 JSON に、段落数 5

✅ 英文は level に適した語彙で 200–300 words 相当

✅ Notebook → 戻るフローは既存ストアで維持（別タスクで対応済）

4. テスト
テーマ: “コーヒー” → 英語で 5 段落、ウンチク入り

level = 3 で平易語彙、level = 7 で高度語彙になるか確認

空テーマで送信時はバリデーションでブロック

**備考**  
- 旧 `emotion` / `style` 型定義・入力欄を完全削除  
- Front と API 両方でパラメータ整合を取ること  
- `.schema.ts` などバリデーションスキーマを更新したら Zod エラー確認。