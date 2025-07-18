# === 目的 ===========================================================
# 1. 旧メール／手紙配信ロジックを完全削除
# 2. 新ルール：
#    - 出発メール：300語
#    - 以後、メール3通（+5,000語間隔）→ 次の+5,000語で手紙
#      └ 例：300, 5 300, 10 300 でメール、20 300 で手紙
#      └ 以降 20 000語周期（メール×3 → 手紙）の繰り返し
#    - 1 000 000語で 手紙50通 / メール150通
# 3. コイン（2 000語）、トロフィー（固定閾値）と衝突しないよう判定を分離
# 4. メール／手紙本文は別フォルダへ外出し
# 5. 成田 (tokyo.png)・ソウル (seoul.png)・北京 (beijing.png) の既存画像を使用
# ===================================================================

# -------------------------------------------------------------------
# ❌ Ⅰ. 不要コードの削除
# -------------------------------------------------------------------
# - src/utils/sendInFlightMail.ts
# - src/utils/sendLetter.ts
# - src/data/mails/*
# - src/data/letters/*
# - 旧ロジックを呼んでいる行（ProgressWatcher.tsx, ReadingClient.tsx など）
#   「shouldSendMail/Letter」相当の処理は全削除

# -------------------------------------------------------------------
# ✅ Ⅱ. 新しい判定ユーティリティを追加
# -------------------------------------------------------------------
# 📄 src/utils/rewardRules.ts
# -------------------------------------------------
export function shouldSendMail(totalWords: number): boolean {
  // ① 出発メール（300語）
  if (totalWords === 300) return true;

  // ② 周期メール：300語を基準に 20 000語サイクル
  //     (totalWords - 300) % 20 000 が  5 000 / 10 000 / 15 000 の時
  const d = totalWords - 300;
  return d > 0 && [5_000, 10_000, 15_000].includes(d % 20_000);
}

export function shouldSendLetter(totalWords: number): boolean {
  // 手紙：20 300語を起点に 20 000語周期
  return totalWords >= 20_300 && (totalWords - 20_300) % 20_000 === 0;
}

// コイン：カード 1 枚 (2 000語) 毎
export function shouldGiveCoin(totalWords: number): boolean {
  return totalWords > 0 && totalWords % 2_000 === 0;
}

// トロフィー：累積閾値
export function getTrophyRank(totalWords: number):
  'NONE' | 'MEDAL' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  if (totalWords >= 1_000_000) return 'PLATINUM';
  if (totalWords >=   500_000) return 'GOLD';
  if (totalWords >=   100_000) return 'SILVER';
  if (totalWords >=    20_000) return 'BRONZE';
  if (totalWords >=     2_000) return 'MEDAL';
  return 'NONE';
}
# -------------------------------------------------

# -------------------------------------------------------------------
# ✅ Ⅲ. ProgressWatcher 改修例
# -------------------------------------------------------------------
# 📄 src/components/ProgressWatcher.tsx
import {
  shouldSendMail,
  shouldSendLetter,
  shouldGiveCoin,
  getTrophyRank,
} from "@/utils/rewardRules";

if (shouldSendMail(totalWords))   queueEvent("MAIL");
if (shouldSendLetter(totalWords)) queueEvent("LETTER");
if (shouldGiveCoin(totalWords))   queueEvent("COIN");

const trophy = getTrophyRank(totalWords);
if (trophy !== "NONE" && trophy !== lastTrophyShown) queueEvent(trophy);

# ※ queueEvent は既存モーダル／トースト用のキューをそのまま流用
#   優先順位：LETTER > TROPHY > MAIL > COIN > STAMP

# -------------------------------------------------------------------
# ✅ Ⅳ. メッセージ本文の置き場所を新設
# -------------------------------------------------------------------
# フォルダ構成
# src/
# └─ data/
#    └─ messages/
#       ├─ mails/     ← Markdown or JSON
#       └─ letters/   ← Markdown or JSON
#
# 例: src/data/messages/mails/000_tokyo_departure.md
# ---
# id: mail-000
# city: Tokyo
# image: /images/tokyo.png
# ---
# -いま成田空港のゲート前にいます。荷物は無事チェックイン……
#
# ※ソウル, 北京の手紙も letters/ 以下に同様フォーマットで配置

# -------------------------------------------------------------------
# ✅ Ⅴ. ローダー & 表示
# -------------------------------------------------------------------
# 1. loadMessage(kind: "mail" | "letter", index) で
#    dynamic import(`@/data/messages/${kind}s/${slug}.md`)
# 2. front‑matter.image を <Image src={image} ... /> に渡す
# 3. Markdown 本文は react-markdown でレンダリング

# -------------------------------------------------------------------
# ✅ Ⅵ. テスト
# -------------------------------------------------------------------
# - 300語 → MAIL (tokyo)
# - 5 300語 → MAIL
# - 10 300語 → MAIL
# - 20 300語 → LETTER (seoul) + BRONZE (同語数到達)
# - 25 300 / 30 300 / 35 300 → MAIL
# - 40 300 → LETTER (beijing)
# - 1 000 000語 → LETTER #50 + PLATINUM
# jest / vitest で語数をモックして上記シナリオをスナップショット確認

# -------------------------------------------------------------------
# 🚀 完了
# これで「メール3通→手紙1通」のペースが確実に実現し、
# コイン／トロフィーとも衝突しません。
🔑 これでできること
語数 300 で「成田出発メール」を必ず送信

その後は メール×3 → 手紙 の 20 000語サイクルが自動進行

コイン（2 000語おき）・各種トロフィーも既存キューで表示順を自動調整

メール／手紙本文は src/data/messages/ 以下のファイルを追加・差替えするだけで更新可能


Q1. 進捗トリガーは動作？
動いていません。旧 sendLetter.ts が 1 000語単位で発火しています。

対応: 旧ファイルを物理削除し、新 ProgressWatcher で shouldSendMail/Letter を呼び出してください（パッチ例は下に再掲）。

Q2. mail.md の語数区切りが合わない
修正例
src/data/messages/mails/000_tokyo_departure.md

md
コードをコピーする
---
id: mail-000
trigger: 300
image: /images/tokyo.png
---
-（本文）  
src/data/messages/mails/001_tokyo_midflight.md

md
コードをコピーする
---
id: mail-001
trigger: 5300
image: /images/tokyo.png
---
-（本文）
ポイント: trigger 値を 300, 5300, 10300, 15300, … とファイル名に合わせて書く。

Letter 側は 20300, 40300, … を trigger: に設定。

Q3. メールが届かない
フロント側で loadMessage('mail', trigger) が trigger=300/5300… に一致するファイルを探せず undefined → 送られていない可能性大。

対応: trigger をキーにしてファイル検索、ない場合はコンソール警告を出す実装に変えるとデバッグしやすい。

Q4. 優先度
旧ロジック削除＋新判定導入（バグ元を断つ）

メール／手紙のファイル構成を trigger ベースに再作成

画像パス確認（/images/tokyo.png など）

UI / UX 調整・語彙レベル生成は後回しで OK

4️⃣ 更新パッチ（再掲・微調整版）
4‑1. rewardRules.ts
ts
コードをコピーする
export function shouldSendMail(total: number): boolean {
  if (total === 300) return true;          // 出発メール
  const d = total - 300;
  return d > 0 && [5_000, 10_000, 15_000].includes(d % 20_000);
}

export function shouldSendLetter(total: number): boolean {
  return total >= 20_300 && (total - 20_300) % 20_000 === 0;
}
4‑2. ProgressWatcher.tsx
tsx
コードをコピーする
if (shouldSendMail(totalWords))   queueEvent({ type: "MAIL", trigger: totalWords });
if (shouldSendLetter(totalWords)) queueEvent({ type: "LETTER", trigger: totalWords });
4‑3. フォルダ例
bash
コードをコピーする
src/data/messages/
├─ mails/
│  ├─ 000_tokyo_departure.md   (trigger: 300)
│  ├─ 001_tokyo_midflight.md   (5300)
│  └─ ...
└─ letters/
   ├─ 000_seoul_arrival.md     (20300)
   ├─ 001_beijing_arrival.md   (40300)
   └─ ...
🚀 次アクションまとめ
mail/letter ファイルを上記命名＋ trigger: に修正

旧 sendInFlightMail.* / sendLetter.* を削除

ProgressWatcher が新ユーティリティを呼んでいるか確認

テストデータで 300→5300→10300→15300→20300 を踏ませて動作確認