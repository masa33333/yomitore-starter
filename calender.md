連続読書日数表示機能 実装指示書
🎯 機能概要
アプリ終了時に「連続読書日数」を表示する画面を実装する。Kindleアプリの連続読書日数表示を参考に、視覚的にわかりやすいUIを作成。
📱 画面仕様
レイアウト構成
┌─────────────────────────┐
│      ヘッダー部分         │
│  連続読書記録と更新ボタン   │
├─────────────────────────┤
│                         │
│    連続○○日読書中！      │
│                         │
│   ┌─────┐  ┌─────┐    │
│   │ 130 │  │  18 │    │
│   └─────┘  └─────┘    │
│   連続読書    週間計画     │
│                         │
├─────────────────────────┤
│      カレンダー表示       │
│   < 1月 2021 >          │
│                         │
│ 日 月 火 水 木 金 土      │
│ 27 28 29 30 31  1  2    │
│  3  4  5  6  7  8  9    │
│ 10 11 12 13 14 15 16    │
│ 17 18 19 20 21 22 23    │
│ 24 25 26 27 28 29 30    │
│ 31  1  2  3  4  5  6    │
│                         │
└─────────────────────────┘
UI要素詳細
1. メインメッセージ

テキスト: "連続○○日読書中！"
フォント: 太字、アプリのメインフォント
色: アプリのプライマリカラー

2. 統計表示ボックス
typescriptinterface StatsBox {
  value: number;        // 表示する数値
  label: string;        // ラベル（連続読書/週間計画）
  backgroundColor: string; // 背景色
}

// 左側ボックス
{
  value: 連続日数,
  label: "連続読書",
  backgroundColor: "#E3F2FD" // 薄い青
}

// 右側ボックス（オプション）
{
  value: 今週の読書日数,
  label: "週間計画",
  backgroundColor: "#F3E5F5" // 薄い紫
}
3. カレンダー表示
typescriptinterface CalendarDisplay {
  currentMonth: Date;
  readingDays: Date[];    // 読書した日の配列
  consecutiveDays: Date[]; // 連続読書期間の日付配列
}

// 日付の表示スタイル
enum DateStyle {
  DEFAULT = "default",           // 通常の日付
  READ = "read",                // 読書した日（薄い青背景）
  CONSECUTIVE = "consecutive",   // 連続読書中（濃い青背景）
  TODAY = "today",              // 今日（枠線強調）
  FUTURE = "future"             // 未来の日付（グレーアウト）
}
💾 必要なデータ
読書記録データ構造
typescriptinterface ReadingRecord {
  userId: string;
  date: string;           // YYYY-MM-DD形式
  storiesRead: number;    // その日に読んだ話数
  wordsRead: number;      // その日に読んだ語数
}

interface ConsecutiveReadingData {
  currentStreak: number;        // 現在の連続日数
  longestStreak: number;        // 最長連続記録
  lastReadDate: string;         // 最後に読書した日
  totalReadingDays: number;     // 累計読書日数
  readingHistory: ReadingRecord[]; // 過去30日分の記録
}
🎨 デザイン仕様
カラーパレット
css/* メインカラー */
--primary-blue: #2196F3;
--light-blue: #E3F2FD;
--dark-blue: #1976D2;

/* カレンダー用 */
--calendar-read-day: #BBDEFB;      /* 読書した日 */
--calendar-consecutive: #64B5F6;    /* 連続読書日 */
--calendar-today-border: #FF5722;   /* 今日の枠線 */
--calendar-future: #E0E0E0;         /* 未来の日付 */
アニメーション
typescript// 画面表示時のアニメーション
1. フェードイン（全体）: 0.3秒
2. 数字のカウントアップ: 0.5秒
3. カレンダーの日付が順番に表示: 0.8秒

// 連続記録更新時の特別演出
- 紙吹雪アニメーション
- "新記録！"のバッジ表示
📋 実装TODO
基本実装

 連続読書日数計算ロジック

 日付の連続性チェック
 タイムゾーン考慮
 0時を跨いだ場合の処理


 UI コンポーネント作成

 メイン画面レイアウト
 統計ボックスコンポーネント
 カレンダーコンポーネント


 データ永続化

 AsyncStorageへの保存
 読書記録の更新処理



カレンダー機能

 月次カレンダー表示

 現在月の表示
 前月/翌月への移動（スワイプ）


 日付スタイリング

 読書日のハイライト
 連続読書期間の強調表示
 今日の日付の枠線



表示タイミング

 アプリ終了時の表示

 バックグラウンド移行時
 明示的な終了時


 表示条件

 当日読書した場合のみ
 設定でON/OFF可能



追加機能

 連続記録更新時の演出
 SNSシェア機能
 月間/年間統計表示
 読書目標設定

🔧 技術実装詳細
React Native コンポーネント構造
typescript// メインコンポーネント
ConsecutiveReadingScreen
├── Header
│   └── CloseButton
├── StatsSection
│   ├── MainMessage ("連続○○日読書中！")
│   └── StatsBoxes
│       ├── ConsecutiveBox
│       └── WeeklyBox
└── CalendarSection
    ├── MonthNavigator
    └── CalendarGrid
        └── DayCell (42個)
状態管理
typescriptinterface ConsecutiveReadingState {
  consecutiveDays: number;
  weeklyReadDays: number;
  readingHistory: ReadingRecord[];
  currentMonth: Date;
  isLoading: boolean;
}
API連携
typescript// 必要なエンドポイント
GET /api/users/{userId}/reading-streak
GET /api/users/{userId}/reading-history?month=2024-01
POST /api/users/{userId}/reading-complete
📝 注意事項

パフォーマンス最適化

カレンダーは仮想化不要（最大42セル）
読書履歴は30日分のみ保持


ユーザー体験

表示は3秒後に自動で閉じる
スキップ可能（タップで即閉じる）
連続記録が途切れても励ましのメッセージ


エッジケース

日付変更線を跨ぐユーザー
長期間アプリを使用しない場合
オフライン時の記録同期