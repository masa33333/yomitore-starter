1. ユーザーの語彙レベル取得
        ↓
2. 日本語コンテンツ生成（3段落）
        ↓
3. 語彙レベル制御付き英訳
        ↓
4. Next.js に日英セットで渡す（API route）
        ↓
5. 表示・保存・音声化処理



以下の条件に沿って、読み物として面白い日本語コンテンツを3段落で生成してください。

■ トピック: ${userInputTopic}
■ 想定語彙レベル: 中学生〜高校生（語彙制限なし）
■ 構成:
- 1段落目：興味を引く具体的な導入（驚き・共感）
- 2段落目：意外な事実や展開
- 3段落目：視点の転換や今に繋がる意義

■ ルール:
- 主語・視点を統一（ですます調）
- ストーリー的要素を含む（例: 実際の人物・事例）

出力フォーマット：
{
  "jp_paragraphs": ["...", "...", "..."]
}


次の日本語3段落を、指定の語彙レベル（NGSL）に基づいて英訳してください。

■ 日本語本文:
${jp_paragraphs[0]}
${jp_paragraphs[1]}
${jp_paragraphs[2]}

■ 語彙レベル: Level ${userLevel}（NGSL ${rangeStart}–${rangeEnd}）

■ 指示:
- 使用語彙の80%以上を ${rangeStart}–${rangeMid} の範囲から選ぶこと
- 難語の多用を避け、自然な英文にすること
- 各段落の長さ・雰囲気を保持
- 出力は JSON 形式で、各段落を配列に：

出力例：
{
  "en_paragraphs": ["...", "...", "..."]
}

※ rangeStart/rangeMid/rangeEnd は語彙レベルに応じて切り替え。


Next.js への連携
API /api/generate-reading で以下形式を返す：

{
  japanese: [jp1, jp2, jp3],
  english: [en1, en2, en3],
  level: userLevel,
  topic: userInputTopic
}




