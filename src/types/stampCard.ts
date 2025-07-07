/**
 * スタンプカード機能のデータ構造定義
 * stamp.mdの仕様に基づく実装
 */

// ユーザー全体の進捗データ
export interface UserProgress {
  // 基本データ
  totalStamps: number;          // 累計スタンプ数
  totalWords: number;           // 累計読了語数 (既存のtotalWordsReadと統合)
  currentCardStamps: number;    // 現在のカード内スタンプ数（0-19）
  completedCards: number;       // 完成したカード枚数
  
  // コイン・トロフィー
  bronzeCoins: number;          // ブロンズコイン数（10スタンプごと）
  bronzeTrophies: number;       // ブロンズトロフィー数（5カード完成）
  silverTrophies: number;       // シルバートロフィー数（5ブロンズ）
  goldTrophies: number;         // ゴールドトロフィー数（5シルバー）
  platinumTrophies: number;     // プラチナトロフィー数（4ゴールド）
  
  // 連続ログイン
  consecutiveLoginDays: number;  // 連続ログイン日数
  lastLoginDate: string;        // 最終ログイン日 (YYYY-MM-DD)
  
  // デイリー達成
  dailyStoriesRead: number;     // 今日読んだ話数
  dailyFirstStoryBonus: boolean; // 今日の最初の話ボーナス取得済み
  dailyGoalAchieved: boolean;   // デイリー目標達成済み（3話）
  
  // 最終更新日時
  lastUpdated: string;          // ISO文字列
}

// 個別スタンプのデータ
export interface StampData {
  id: string;                   // ユニークID
  completionDate: string;       // 読了日時 (ISO文字列)
  wordCount: number;            // その回の語数
  level: number;                // その時の語彙レベル (1-5)
  sessionDuration: number;      // 読書時間（ミリ秒）
  wpm: number;                  // WPM
  title?: string;               // 読み物タイトル
  contentType: 'reading' | 'story'; // コンテンツタイプ
  
  // ボーナス情報
  isBonusStamp?: boolean;       // ボーナススタンプか
  bonusType?: 'daily_first' | 'daily_goal' | 'consecutive' | 'comeback'; // ボーナス種類
}

// 読書完了時のデータ
export interface ReadingCompletionData {
  wordCount: number;
  duration: number;             // ミリ秒
  wpm: number;
  level: number;
  title: string;
  contentType: 'reading' | 'story';
  
  // 省略可能フィールド
  sessionId?: string;
  completionDate?: string;      // 指定されない場合は現在時刻
}

// メール配信データ（継続支援機能）
export interface Mail {
  id: string;
  stationName: string;          // 到着した都市名
  title: string;                // メールタイトル
  content: string;              // メール本文（英語）
  contentJP?: string;           // 日本語翻訳
  imageUrl?: string;            // ご当地画像URL
  receivedAt: string;           // 受信日時 (ISO文字列)
  isRead: boolean;              // 既読フラグ
  triggerStamp: number;         // 何スタンプ目で配信されたか
}

// ログインボーナス設定
export interface LoginBonusConfig {
  day3: {
    bonusStamps: number;        // +1スタンプ
  };
  day7: {
    specialStamp: string;       // 特別な切手デザインID
  };
  day14: {
    accessory: string;          // ネコの特別アクセサリーID
  };
  day30: {
    albumPage: string;          // 旅の思い出アルバムページID
  };
}

// デイリー目標設定
export interface DailyGoals {
  firstStory: boolean;          // 今日の最初の1話
  goalStories: number;          // デイリー目標話数（デフォルト3話）
  weekendChallenge: number;     // 週末チャレンジ話数（デフォルト5話）
}

// 復帰ボーナス設定
export interface ComebackBonus {
  daysThreshold: number;        // 何日以上空いたら復帰ボーナス（デフォルト3日）
  bonusStamps: number;          // 復帰ボーナススタンプ数
  message: string;              // 復帰メッセージ
}

// スタンプカード表示用データ
export interface StampCardDisplay {
  currentStamps: StampData[];   // 現在のカード内スタンプ（最大50個）
  progress: {
    current: number;            // 現在のスタンプ数（0-49）
    total: number;              // カード完成に必要な数（50）
    percentage: number;         // 進捗率（0-100）
  };
  nextMilestone: {
    type: 'coin' | 'card' | 'mail';
    stampsNeeded: number;       // あと何スタンプで達成か
    description: string;        // 「あと3スタンプでコイン獲得」等
  };
}

// デバッグ・管理用
export interface StampCardMetrics {
  totalReadingTime: number;     // 総読書時間（ミリ秒）
  averageWPM: number;          // 平均WPM
  favoriteLevel: number;        // 最もよく読むレベル
  longestStreak: number;        // 最長連続ログイン日数
  totalBonusStamps: number;     // 累計ボーナススタンプ数
}