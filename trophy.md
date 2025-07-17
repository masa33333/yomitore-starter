📜 指示書：RewardSystem（コイン & トロフィー）
0. 絶対遵守事項
手紙 / メール通知ロジックと一切混同しない

既存 sendInFlightMail.ts, sendLetter.ts 等のファイルは 読み取り専用。

RewardSystem は 独立モジュール として実装し、 import も分離する。

既存 UI に破壊的変更を加えない。変更は RewardDisplay コンポーネント内のみ。

TypeScript／ESLint ルールはプロジェクト設定に従う（strict オン）。

1. ビジネスルール（確定版）
変換	条件
100 words → 1 stamp	
20 stamps → 1 coin	
5 coins → 1 bronze	
5 bronze → 1 silver	
5 silver → 1 gold	
4 gold → 1 platinum	

2. データ構造
ts
コードをコピーする
/** src/types/reward.ts */
export type Reward = "coin" | "bronze" | "silver" | "gold" | "platinum";

export interface RewardState {
  words: number;   // 累計語数
  stamps: number;  // 0‑19
  coin: number;    // 0‑4
  bronze: number;  // 0‑4
  silver: number;  // 0‑4
  gold: number;    // 0‑3  (4でplatinum)
  platinum: number; // 0‑∞
}
進捗は localStorage → Supabase 同期（既存 progressUtils.ts と同パターン）。

キー名：yomitore.reward.v2（v1 既存キーと衝突回避）。

3. コアロジック
ts
コードをコピーする
/** src/utils/rewardUtils.ts */
import { RewardState } from "@/types/reward";

export const addWords = (state: RewardState, delta: number): RewardState => {
  state.words += delta;
  state.stamps += Math.floor(delta / 100);

  if (state.stamps >= 20) {
    state.coin += Math.floor(state.stamps / 20);
    state.stamps %= 20;
  }
  if (state.coin >= 5) {
    state.bronze += Math.floor(state.coin / 5);
    state.coin %= 5;
  }
  if (state.bronze >= 5) {
    state.silver += Math.floor(state.bronze / 5);
    state.bronze %= 5;
  }
  if (state.silver >= 5) {
    state.gold += Math.floor(state.silver / 5);
    state.silver %= 5;
  }
  if (state.gold >= 4) {
    state.platinum += Math.floor(state.gold / 4);
    state.gold %= 4;
  }
  return { ...state };
};
ユニットテスト：__tests__/rewardUtils.test.ts で以下を保証

2 000 words → coin = 1

10 000 words → bronze = 1（他 0）

60 000 words → silver = 1, bronze = 1

1 000 000 words → platinum = 1（その他 0）

4. 表示コンポーネント
tsx
コードをコピーする
/** src/components/RewardDisplay.tsx */
import { RewardState } from "@/types/reward";

const ICON = {
  coin: "🪙",       // UI は後で SVG に差替え
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "🏆",
} as const;

type Props = { name: string; reward: RewardState };

export default function RewardDisplay({ name, reward }: Props) {
  const toIcons = (icon: string, n: number) =>
    n <= 4 ? icon.repeat(n) : `${icon}×${n}`;

  const rewardStr =
    toIcons(ICON.platinum, reward.platinum) +
    toIcons(ICON.gold, reward.gold) +
    toIcons(ICON.silver, reward.silver) +
    toIcons(ICON.bronze, reward.bronze) +
    toIcons(ICON.coin, reward.coin);

  return (
    <span className="inline-flex max-w-full overflow-x-auto whitespace-nowrap">
      {name}
      {rewardStr && <span className="ml-1">{rewardStr}</span>}
    </span>
  );
}
コインが 5 以上 → 🪙×5 のように略記（トロフィーも同様）。

overflow-x-auto でアイコン列が長い場合はスクロール。

5. 既存フローへの組み込み
readingComplete() → addWords 呼び出しで語数加算。

State 更新後に RewardDisplay を再レンダー。（Context または Zustand store）

手紙メール系ファイルには 一行も import しない。

6. デザイン TODO（別タスク化）
現状は画像生成版アイコンだが、最終的に SVG & Lottie へ置換。

アニメ：コイン → トロフィー変換時にパーティクル（Framer Motion）。

7. 納品物一覧
ファイル/ディレクトリ	目的
src/types/reward.ts	Reward 型定義
src/utils/rewardUtils.ts	変換ロジック
src/components/RewardDisplay.tsx	表示 UI
__tests__/rewardUtils.test.ts	ユニットテスト
public/images/coin.png　コインの画像
public/images/trophy-c.png　銅のトロフィーの画像
README 追記	仕様・使用例



1. ユニットテストの期待値（1 000 000 語）
計算過程
1 000 000 words
→ stamps = 10 000
→ coins = 500
→ bronze = 100
→ silver = 20
→ gold = 4
→ platinum = 1（gold 0 に繰り上げ）

最終値

ts
コードをコピーする
{
  words:     1_000_000,
  stamps:    0,
  coin:      0,
  bronze:    0,
  silver:    0,
  gold:      0,
  platinum:  1
}
この形がテストで expect(state).toEqual({...}) となる想定で正しいです。👌

2. 既存システムとの統合ポイント
readingComplete() は src/app/reading/ReadingClient.tsx（または同階層のフック）で「読了ボタン押下 → 語数加算 → 通知処理」の入口になっています。

addWords() 呼び出しはこの関数内の「語数 & 進捗更新ブロック」に 1 行追加するイメージで想定しています。

もし読了ロジックが複数ファイルに散っている場合は、進捗計算を一元化している util/hook の直下に入れて OK です。いずれにせよ 手紙 / メールの send 系ロジックとは分離 してください。

3. 画像ファイル（coin.png / trophy‑c.png など）
既に public/images/ 配下へ配置済みとのことなので、指示書側で “提供済み” として扱ってください。
仮画像を新規生成する必要はありません。

4. 状態管理：Context vs Zustand
プロジェクトが React Context をベースにしているなら、RewardState も同じ Context に統合で問題ありません。

たとえば ProgressContext があるなら、そこへ reward を追加して 単一の Provider で配布。Zustand 追加は不要です。

