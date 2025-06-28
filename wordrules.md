 語彙制御が効くようになったプロン
  プト設計の要点をまとめます。

⏺ Update Todos
  ⎿ ☐ 効果的だった語彙制御プロンプ 
      トを抽出・整理
    ☐ 手紙・メール用の語彙制御プロ
      ンプトを作成

⏺ 🎯 効果的だった語彙制御プロンプト
  の要素

  📋 システムメッセージ（API側）

  Level 1-3用（最も効果的）:
  CRITICAL: You are writing for
  10-year-old children. You MUST
  use ONLY the simplest English
  words. Any word longer than 5
  letters is FORBIDDEN (except:
  people, mother, father, sister,
  brother, family, house, water,
  today). Use only words that
  appear in beginner children's
  books. Write exactly 140-200
  words in 3 paragraphs. EVERY word
   must be simple and basic.

  Level 4用:
  You are writing for intermediate
  English learners (B2 level).
  CRITICAL: You MUST write exactly
  200-240 words. COUNT your words
  carefully - you must reach at
  least 200 words. Write in at
  least 3 paragraphs. Include
  complex sentence structures and
  intermediate vocabulary. Do not
  include any labels or headers.
  WORD COUNT IS CRITICAL.

  Level 5用:
  You are writing for advanced
  English learners (C1+ level).
  CRITICAL: You MUST write exactly
  240-280 words. COUNT your words
  carefully - you must reach at
  least 240 words. Write in at
  least 3 paragraphs. Use
  sophisticated vocabulary, complex
   sentence structures, nuanced
  expressions, and varied sentence
  patterns. Do not include any
  labels or headers. WORD COUNT IS
  CRITICAL.

  📝 プロンプトテンプレート（Level 
  3が最も効果的）

  You must write for 10-year-old
  children. Use ONLY the words
  listed below. Do not use any
  other words.

  CRITICAL RULE: You can ONLY use
  words from this exact list. No
  other words allowed.

  ALLOWED WORD LIST (Use ONLY these
   words):
  Verbs: is, are, was, were, do,
  go, come, get, see, make, have,
  take, give, eat, drink, play,
  sleep, walk, run, sit, like,
  love, want, live, help, buy, use,
   look, find, put, call, open,
  can, will

  Nouns: cat, dog, pet, food, fish,
   meat, egg, milk, tea, water,
  home, house, room, bed, day,
  time, man, woman, boy, girl,
  baby, mom, dad, hand, foot, head,
   eye, hair, red, blue, black,
  white, sun, rain

  Adjectives: good, bad, big,
  small, new, old, hot, cold, nice,
   cute, fun, happy, sad, fast,
  slow, soft

  Others: a, an, the, and, or, but,
   in, on, at, to, for, with, from,
   of, some, many, all, my, your,
  his, her, they, them, we, us,
  this, that, when, where, what,
  who, how, very, so, too, also,
  not, yes, no

  RULES:
  1. Write 150-180 words exactly
  2. Make 3 short paragraphs
  3. Use simple sentences only
  4. Write about cats or dogs as
  pets
  5. Use ONLY words from the list
  above

  EXAMPLE (Follow this style
  exactly):
  "Cats are good pets. Many people
  love cats. Cats are small and
  soft. They like to eat fish and
  meat. Cats drink milk and water.
  Cats sleep a lot in the day.

  Cats can run very fast. They like
   to play with toys. Cats use
  their feet to walk on trees. Some
   cats are black. Some cats are
  white. All cats are cute and
  nice.

  People like cats at home. Cats
  make people happy. They are good
  pets for all family. This is why
  many people have cats. Cats are
  the best pets."

  Now write about the given topic
  using ONLY the allowed words
  above. Do not use any word not in
   the list.

  🔑 成功の要因

  1. 明確な制約階層

  - CRITICAL
  キーワードで最重要制約を明示
  - 具体的な数値制限（5文字制限、語
  数制限）
  - 例外語彙の明示的リスト

  2. 具体的な語彙リスト

  - 使用可能語彙の完全列挙
  - 品詞別の整理
  - 否定的制約（「使ってはいけない
  語彙」）

  3. ターゲット設定

  - 年齢指定（10歳児）
  - 学習レベル明示（children's
  books）
  - 複数回の繰り返し強調

  4. 具体例の提示

  - 理想的な出力例
  - スタイル指示
  - 「Exactly like this」の指示

  📬 
  手紙・メール用語彙制御プロンプト

⏺ Write(../../../../tmp/mail_letter
       _prompts.md)
  ⎿ Wrote 126 lines to ../../../../
    tmp/mail_letter_prompts.md
    # 手紙・メール用語彙制御プロン
    プト
    ## Level 3
    手紙プロンプト（最も効果的）
    ```
    You are writing a letter from a
     traveling cat to a child (age
    10). Use ONLY the simplest
    English words.
    CRITICAL RULE: You can ONLY use
     words from this exact list. No
     other words allowed.
    ALLOWED WORD LIST:
    … +116 lines (ctrl+r to expand)


⏺ Update Todos
  ⎿ ☒ 効果的だった語彙制御プロンプ 
      トを抽出・整理
    ☒ 手紙・メール用の語彙制御プロ
      ンプトを作成

⏺ 📋 成功した語彙制御の核心要素

  🔑 最も効果的だった3つの戦略

  1. 完全語彙リスト制限 - Level
  3で最も成功
    - 使用可能語彙を完全列挙
    -
  「この語彙のみ使用可能」の明示
    - 品詞別の整理
  2. 強力な否定制約
    - FORBIDDEN, NEVER USE,
  ABSOLUTELY NOT
    - 具体的な禁止語彙の列挙
    - 文字数制限（5文字以下）
  3. 具体例 + 模倣指示
    - 「Exactly like this」
    - 完全な出力例の提示
    - スタイル・構造の明示

  📧 手紙・メール応用のポイント

  - 語数調整: 手紙 80-120語、メール
   50-80語
  - 文体調整:
  より親しみやすく、日常的な表現
  - 感情表現: 旅の感動、友達への想
  いを簡単な語彙で表現

  🎯 実装時の注意点

  1. システムメッセージ:
  レベル別の適切な制約設定
  2. プロンプト構造: CRITICAL RULE
  → 語彙リスト → 例文 → 指示
  3. 語数管理:
  レベル別の適切な語数範囲設定

  この語彙制御システムを手紙・メー
  ル生成に適用すれば、同様の効果が
  期待できます。