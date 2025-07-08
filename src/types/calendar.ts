/**
 * 連続読書記録カレンダー機能のデータ構造定義
 * calender.mdの仕様に基づく実装
 */

// 日別読書記録
export interface DayRecord {
  date: string;              // YYYY-MM-DD形式
  storiesRead: number;       // その日読んだ話数
  totalWords: number;        // その日読んだ総語数
  readingTime: number;       // その日の読書時間（ミリ秒）
  averageWPM: number;        // その日の平均WPM
  firstReadingTime?: string; // 最初の読書時刻（HH:MM形式）
  lastReadingTime?: string;  // 最後の読書時刻（HH:MM形式）
  streak: number;            // その日までの連続日数
  hasGoalAchieved: boolean;  // デイリー目標達成フラグ（3話以上）
  level: number;             // その日の主な読書レベル
}

// 月別統計
export interface MonthlyStats {
  year: number;
  month: number;             // 1-12
  totalDays: number;         // その月の読書日数
  totalStories: number;      // その月の総読書話数
  totalWords: number;        // その月の総読書語数
  totalTime: number;         // その月の総読書時間
  averageWPM: number;        // その月の平均WPM
  maxStreak: number;         // その月の最長連続日数
  currentStreak: number;     // 月末時点の連続日数
  goalAchievedDays: number;  // デイリー目標達成日数
  perfectWeeks: number;      // 完璧週間数（7日連続）
}

// カレンダー表示用データ
export interface CalendarData {
  currentMonth: MonthlyStats;
  days: DayRecord[];         // その月の日別記録（空の日も含む）
  streaks: StreakInfo[];     // 連続記録の詳細
  achievements: Achievement[]; // 達成項目
}

// 連続記録情報
export interface StreakInfo {
  startDate: string;         // 連続開始日
  endDate: string;           // 連続終了日（進行中の場合は今日）
  length: number;            // 連続日数
  status: 'active' | 'ended'; // 進行中か終了か
  totalStories: number;      // この連続期間中の総話数
  totalWords: number;        // この連続期間中の総語数
  averagePerDay: number;     // 1日平均話数
}

// 達成項目
export interface Achievement {
  id: string;
  type: 'streak' | 'stories' | 'words' | 'time' | 'goal';
  title: string;             // 「7日連続達成！」など
  description: string;       // 詳細説明
  achievedDate: string;      // 達成日
  icon: string;              // 表示アイコン
  level: 'bronze' | 'silver' | 'gold' | 'diamond'; // 達成レベル
}

// カレンダー設定
export interface CalendarSettings {
  dailyGoal: number;         // デイリー目標話数（デフォルト3）
  weekStartsOn: 0 | 1;       // 0=日曜始まり、1=月曜始まり
  showWPM: boolean;          // WPM表示するか
  showWordCount: boolean;    // 語数表示するか
  theme: 'light' | 'warm' | 'cool'; // カラーテーマ
}

// カレンダーフィルター
export interface CalendarFilter {
  year: number;
  month: number;
  level?: number;            // 特定レベルのみ表示
  minStreak?: number;        // 最低連続日数
  showGoalOnly?: boolean;    // 目標達成日のみ表示
}