# CLAUDE.md – Project Memory

> **Purpose**
> This file is auto‑loaded by Claude Code at startup to give the AI full project context so we don’t have to repeat ourselves each session.

---

## 📦 Project Overview

* **Name**: 読みトレ – “Travel‑Cat Extensive Reading”
* **Concept**: A cat travels the world as the user reads English passages.
  More words → farther destinations → new letters from the cat.
* **Key flows**

  1. `/start` → cat naming (i18n)
  2. `/tokyo` → Narita intro popup, then `/map`
  3. `/map` → shows current city & next destination, handles word progress
  4. `/quiz` → adaptive vocab test → saves `vocabLevel`
  5. `/choose` → reading topic
  6. `/reading` → generates passage → `/letter`

---

## 🛠 Tech Stack

| Area          | Library / Tool                                                  |
| ------------- | --------------------------------------------------------------- |
| Framework     | **Next.js 14** / React 18                                       |
| Language      | **TypeScript** (strict)                                         |
| Styling       | **Tailwind CSS**                                                |
| State / i18n  | Custom **LanguageContext** + `useTranslation` (no next‑i18next) |
| Map           | Static SVG world map (soon → `react‑leaflet`)                   |
| Testing       | Vitest                                                          |
| Lint / Format | ESLint + Prettier                                               |

---

## 📂 Important Paths

```
app/start/page.tsx     – cat naming (i18n)
app/tokyo/page.tsx     – Narita intro page
app/map/page.tsx       – main map & progress
app/quiz/…             – vocab test
src/contexts/LanguageContext.tsx
src/hooks/useTranslation.ts
src/locales/ja.json / en.json
```

---

## 🧭 Coding Conventions

* **Strict TS** – no `any`, prefer explicit types.
* **Tailwind first** – utility classes > custom CSS.
* **LocalStorage keys**

  * `catName`, `displayLang`, `vocabLevel`, `totalWordsRead`, `currentCityIndex`, `mapIntroShown`.
* **Component naming**: PascalCase React components.
* **Imports**: absolute paths via `@/` alias.

---

## 🚀 Common Commands

```bash
# dev
npm run dev
# lint & test
npm run lint && npm run test
```

---

## 🔨 Live TODO (2025‑06‑17)

* [ ] Adjust cat/flag positions on map so Tokyo & Seoul markers do not overlap popup.
* [ ] Replace static map with react‑leaflet + dynamic zoom.
* [ ] Ensure `vocabLevel` propagates to generateReading().
* [ ] Remove legacy cat emoji overlay.
* [x] **Mail notification system implementation (2025-06-17 COMPLETED)**

---

## 📝 Tips for Claude

* Use `useTranslation()` – keys live in `src/locales/*`.
* When adding new UI text, **always add both `ja` and `en` keys**.
* For quick guidance on coords, refer to `cities.json`.
* Keep first‑time popups gated by `mapIntroShown`.


### 📬 メール・手紙に関する仕様（2025年6月時点）

#### ✅ コンセプト
- 「読みトレ」は、読書量・時間に応じてネコが世界を旅し、その途中で **「手紙」または「メール」** を送ってくる。
- 📮 都市に到着したタイミングで送られるのが **「手紙（letter）」**、  
  ✉️ 道中での出来事や近況報告は **「メール（mail）」** として区別。

---

#### ✉️ 手紙（Letter）

- **トリガー**：都市到着（＝語数が指定値を超えたとき）
- **形式**：
  - `/data/letterData.ts` に保存（各都市ごと、レベル別英語 + 共通日本語）
  - フィールド構成：
    ```ts
    {
      id: number,
      city: string,
      jp: string,
      en: {
        1: string,  // レベル1〜2
        4: string,  // レベル4〜5
        7: string   // レベル6〜7
      }
    }
    ```
- **表示場所**：`/letter`
- **画像**：各都市ごとにAI生成したイラスト（ネコ＋名所）を添付
- **文体**：
  - 読み応えのある約150語
  - 都市の文化・歴史に関する豆知識を含める
  - 猫の視点でワクワク感と読者への語りかけを含む

---

#### 📧 メール（Mail）

- **トリガー**：読書時間（例：10分・30分・60分など）に達したとき  
  ※ 不正カウント防止のため、WPM が異常に低い場合は除外

- **形式**：
  - AIによるオンデマンド生成
  - 一度送ったものはキャッシュ（localStorage or Supabase）して再利用
  - 構成例：
    ```ts
    {
      id: string,
      type: 'inFlight',
      leg: string,   // 例: "Tokyo-Seoul"
      sentAt: number,
      jp: string,
      en: Record<number, string>
    }
    ```

- **表示場所**：`/mailbox` または `/letter` 内でタブ分けも可
- **文体**：
  - 軽め・日常的・即時性のある内容（「富士山が見えたよ」「機内食で魚を選んだよ」など）
  - 50〜80語程度、レベル別英語＋日本語

---

#### 🔒 その他の仕様・制約

- **語彙レベル別出し分け**：1 / 4 / 7 の3段階（やさしい・標準・やや高度）
  - `getEnglishText()` 関数で最も近いレベルの文を選択
- **順序制御**：
  - 都市未到着の場合、inFlightメールは到着手紙より前に届くよう調整
  - 送信済み手紙・メールはステータス管理（`draft`, `queued`, `sent`）
- **今後の拡張**：
  - デイリーストリーク、語数バッジ、クイズ付きメールなど

---


---

## 📋 Work Session Summary (2025-06-17)

### ✅ Completed Today

**Mail Notification System Implementation** - Full automated mail/letter delivery system based on reading progress.

#### Task 1: Arrival Mail Flags
- **File**: `src/lib/arrivalMailUtils.ts`
- **localStorage key**: `arrivalMail:<city>` = `"true"`
- **Functions**: `setArrivalMailFlag()`, `hasArrivalMail()`, `clearArrivalMailFlag()`

#### Task 2: In-Flight Mail Flags
- **File**: `src/lib/inFlightMailUtils.ts` 
- **localStorage key**: `inFlightSent:<leg>` = `[30,60,90]` (JSON array)
- **Functions**: `addInFlightMail()`, `getInFlightMailMinutes()`, `hasInFlightMail()`

#### Task 3: Send Arrival Mail
- **File**: `src/lib/sendArrivalMail.ts`
- **Function**: `sendArrivalMail(city)` - AI-generated arrival letters
- **Dependencies**: `buildArrivalPrompt()`, `showNotification()`, `saveLetterToStorage()`

#### Task 4: Send In-Flight Mail  
- **File**: `src/lib/sendInFlightMail.ts`
- **Function**: `sendInFlightMail(leg, minute)` - AI-generated journey emails
- **Features**: Word count, WPM calculation, metrics tracking
- **Dependencies**: `buildInFlightPrompt()`, `countWords()`, `calculateWPM()`

#### Task 5: Progress Watcher Hook
- **File**: `src/hooks/useProgressWatcher.ts`
- **Function**: `useProgressWatcher()` - monitors reading progress every 1 minute
- **Logic**: 
  - Arrival check: `words >= ARRIVAL_WORDS[city]` → `sendArrivalMail()`
  - In-flight check: `minutes >= milestone && !sent.includes(milestone)` → `sendInFlightMail()`
- **Constants**: `src/constants/progress.ts` - city thresholds & flight milestones

#### Task 6: Notification Text Switching
- **File**: `src/components/MailNotification.tsx`
- **Update**: Mail vs Letter icon differentiation
  - Mail: `✉️ ${catName} から未読メールが届いています`
  - Letter: `📮 ${catName} から手紙が届いています`

#### Task 7: Progress Summary Data
- **File**: `src/app/history/page.tsx`
- **Update**: Removed default values `= 0` for `wordCount` and `wpm` since `saveToHistory()` guarantees these values

### 📁 New Files Created

```
src/lib/arrivalMailUtils.ts          - Arrival mail flag management
src/lib/inFlightMailUtils.ts         - In-flight mail flag management  
src/lib/sendArrivalMail.ts           - Arrival mail generation & sending
src/lib/sendInFlightMail.ts          - In-flight mail generation & sending
src/lib/promptTemplates/arrivalPrompt.ts    - Arrival mail AI prompts
src/lib/promptTemplates/inFlightPrompt.ts   - In-flight mail AI prompts
src/lib/notificationUtils.ts         - Notification display utilities
src/lib/wordCountUtils.ts            - Word counting & WPM calculation
src/lib/progressUtils.ts             - Progress tracking utilities
src/hooks/useProgressWatcher.ts      - Progress monitoring hook
src/constants/progress.ts            - Progress thresholds & milestones
```

### 🔄 Integration Points

1. **Progress Monitoring**: `useProgressWatcher()` should be called from main app layout
2. **API Integration**: Mail generation uses `/api/generate-reading` with `isMailGeneration: true`
3. **Storage Integration**: Uses existing `letterStorage.ts` for mail persistence
4. **Notification Integration**: Uses existing notification system with type-based messages

### 🛠 Next Steps / Future Work

1. **UI Integration**: Add `useProgressWatcher()` to main app layout
2. **Testing**: Test complete flow from reading → notifications → mail generation
3. **Refinement**: Fine-tune AI prompts for better mail content quality
4. **Performance**: Optimize progress checking frequency if needed
5. **Analytics**: Add metrics tracking for mail engagement
6. **Localization**: Ensure all new text supports i18n

### 🐛 Known Issues to Monitor

- API rate limiting for mail generation
- localStorage size with accumulated mail data
- Progress watcher performance with frequent checks
- Mail generation fallback reliability

---

*End of CLAUDE.md*
