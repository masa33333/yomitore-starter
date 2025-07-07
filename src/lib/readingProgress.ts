/**
 * 読書進捗管理の統一システム
 * 既存システムとスタンプカード機能を統合
 */

import { UserProgress, StampData, ReadingCompletionData, StampCardDisplay } from '@/types/stampCard';
import { saveToHistory } from '@/lib/saveToHistory';

// localStorage キー定数
const STORAGE_KEYS = {
  USER_PROGRESS: 'userProgress',
  STAMP_CARD: 'stampCard',
  DAILY_DATA: 'dailyData',
  // 既存システムとの互換性
  TOTAL_WORDS_READ: 'totalWordsRead',
  COMPLETED_READINGS: 'completedReadings',
  TOTAL_READING_TIME: 'totalReadingTime',
} as const;

/**
 * 初期ユーザー進捗データを取得
 */
function getDefaultUserProgress(): UserProgress {
  return {
    totalStamps: 0,
    totalWords: 0,
    currentCardStamps: 0,
    completedCards: 0,
    bronzeCoins: 0,
    bronzeTrophies: 0,
    silverTrophies: 0,
    goldTrophies: 0,
    platinumTrophies: 0,
    consecutiveLoginDays: 0,
    lastLoginDate: '',
    dailyStoriesRead: 0,
    dailyFirstStoryBonus: false,
    dailyGoalAchieved: false,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * ユーザー進捗データを取得
 */
export function getUserProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
    if (stored) {
      const parsed = JSON.parse(stored) as UserProgress;
      
      // 既存システムからのマイグレーション
      const legacyWords = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_WORDS_READ) || '0', 10);
      if (legacyWords > parsed.totalWords) {
        parsed.totalWords = legacyWords;
        console.log('📊 Migrated totalWords from legacy system:', legacyWords);
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('❌ Failed to parse user progress:', error);
  }
  
  // 初回または破損時は既存データからマイグレーション
  return migrateFromLegacySystem();
}

/**
 * 既存システムからデータをマイグレーション
 */
function migrateFromLegacySystem(): UserProgress {
  const progress = getDefaultUserProgress();
  
  // 既存データを取得
  const legacyWords = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_WORDS_READ) || '0', 10);
  const legacyReadings = parseInt(localStorage.getItem(STORAGE_KEYS.COMPLETED_READINGS) || '0', 10);
  
  progress.totalWords = legacyWords;
  progress.totalStamps = legacyReadings; // 1読了 = 1スタンプ
  progress.currentCardStamps = legacyReadings % 50;
  progress.completedCards = Math.floor(legacyReadings / 50);
  
  // コインとトロフィーを計算
  progress.bronzeCoins = Math.floor(legacyReadings / 10);
  progress.bronzeTrophies = Math.floor(progress.completedCards / 5);
  progress.silverTrophies = Math.floor(progress.bronzeTrophies / 5);
  progress.goldTrophies = Math.floor(progress.silverTrophies / 5);
  progress.platinumTrophies = Math.floor(progress.goldTrophies / 4);
  
  console.log('📦 Migrated from legacy system:', progress);
  saveUserProgress(progress);
  
  return progress;
}

/**
 * ユーザー進捗データを保存
 */
export function saveUserProgress(progress: UserProgress): void {
  try {
    progress.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
    
    // 既存システムとの互換性を保持
    localStorage.setItem(STORAGE_KEYS.TOTAL_WORDS_READ, progress.totalWords.toString());
    localStorage.setItem(STORAGE_KEYS.COMPLETED_READINGS, progress.totalStamps.toString());
    
    console.log('💾 User progress saved:', progress);
  } catch (error) {
    console.error('❌ Failed to save user progress:', error);
  }
}

/**
 * スタンプカードデータを取得
 */
export function getStampCardData(): StampData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STAMP_CARD);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Failed to parse stamp card data:', error);
    return [];
  }
}

/**
 * スタンプカードデータを保存
 */
export function saveStampCardData(stamps: StampData[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STAMP_CARD, JSON.stringify(stamps));
    console.log('💾 Stamp card data saved:', stamps.length, 'stamps');
  } catch (error) {
    console.error('❌ Failed to save stamp card data:', error);
  }
}

/**
 * デイリーデータの管理
 */
export function checkAndResetDailyData(): UserProgress {
  const progress = getUserProgress();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 日付が変わっていたらデイリーデータをリセット
  if (progress.lastLoginDate !== today) {
    // 連続ログイン日数の更新
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (progress.lastLoginDate === yesterdayStr) {
      // 連続ログイン継続
      progress.consecutiveLoginDays += 1;
    } else if (progress.lastLoginDate === '') {
      // 初回ログイン
      progress.consecutiveLoginDays = 1;
    } else {
      // 連続ログインが途切れた
      progress.consecutiveLoginDays = 1;
    }
    
    // デイリーデータリセット
    progress.dailyStoriesRead = 0;
    progress.dailyFirstStoryBonus = false;
    progress.dailyGoalAchieved = false;
    progress.lastLoginDate = today;
    
    console.log('📅 Daily data reset for new day:', today);
    console.log('🔥 Consecutive login days:', progress.consecutiveLoginDays);
    
    saveUserProgress(progress);
  }
  
  return progress;
}

/**
 * 読書完了時の統一処理（メイン関数）
 */
export function completeReading(data: ReadingCompletionData): UserProgress {
  console.log('📖 Starting reading completion process:', data);
  
  // 1. デイリーデータチェック・リセット
  let progress = checkAndResetDailyData();
  
  // 2. 基本進捗更新
  progress.totalWords += data.wordCount;
  progress.totalStamps += 1;
  progress.currentCardStamps = progress.totalStamps % 50;
  progress.dailyStoriesRead += 1;
  
  // 3. カード完成チェック
  if (progress.currentCardStamps === 0 && progress.totalStamps > 0) {
    progress.completedCards += 1;
    console.log('🎊 Card completed! Total cards:', progress.completedCards);
  }
  
  // 4. コイン・トロフィー更新
  updateAchievements(progress);
  
  // 5. デイリーボーナス処理
  processeDailyBonuses(progress);
  
  // 6. スタンプデータ作成・保存
  const stamp: StampData = {
    id: generateStampId(),
    completionDate: data.completionDate || new Date().toISOString(),
    wordCount: data.wordCount,
    level: data.level,
    sessionDuration: data.duration,
    wpm: data.wpm,
    title: data.title,
    contentType: data.contentType,
  };
  
  // ボーナススタンプかチェック
  if (shouldAwardBonusStamp(progress)) {
    stamp.isBonusStamp = true;
    stamp.bonusType = getBonusType(progress);
  }
  
  const stamps = getStampCardData();
  stamps.push(stamp);
  saveStampCardData(stamps);
  
  // 7. 履歴保存（既存システム）
  saveToHistory({
    type: data.contentType,
    title: data.title,
    contentJP: '', // 必要に応じて後で追加
    contentEN: '', // 必要に応じて後で追加
    level: data.level,
    wordCount: data.wordCount,
    duration: data.duration,
    wpm: data.wpm
  });
  
  // 8. 進捗データ保存
  saveUserProgress(progress);
  
  console.log('✅ Reading completion process finished:', progress);
  
  return progress;
}

/**
 * コイン・トロフィー更新
 */
function updateAchievements(progress: UserProgress): void {
  // ブロンズコイン（10スタンプごと）
  progress.bronzeCoins = Math.floor(progress.totalStamps / 10);
  
  // ブロンズトロフィー（5カード完成）
  progress.bronzeTrophies = Math.floor(progress.completedCards / 5);
  
  // シルバートロフィー（5ブロンズ）
  progress.silverTrophies = Math.floor(progress.bronzeTrophies / 5);
  
  // ゴールドトロフィー（5シルバー）
  progress.goldTrophies = Math.floor(progress.silverTrophies / 5);
  
  // プラチナトロフィー（4ゴールド）
  progress.platinumTrophies = Math.floor(progress.goldTrophies / 4);
}

/**
 * デイリーボーナス処理
 */
function processeDailyBonuses(progress: UserProgress): void {
  // 今日の最初の話ボーナス
  if (progress.dailyStoriesRead === 1 && !progress.dailyFirstStoryBonus) {
    progress.dailyFirstStoryBonus = true;
    console.log('🌅 First story of the day bonus awarded!');
  }
  
  // デイリー目標達成（3話）
  if (progress.dailyStoriesRead >= 3 && !progress.dailyGoalAchieved) {
    progress.dailyGoalAchieved = true;
    progress.totalStamps += 1; // ボーナススタンプ
    console.log('🎯 Daily goal achieved! Bonus stamp awarded!');
  }
}

/**
 * ボーナススタンプ判定
 */
function shouldAwardBonusStamp(progress: UserProgress): boolean {
  // 連続ログインボーナス
  if (progress.consecutiveLoginDays === 3 || progress.consecutiveLoginDays === 7) {
    return true;
  }
  
  // 復帰ボーナス（今回は実装せず）
  return false;
}

/**
 * ボーナスタイプ取得
 */
function getBonusType(progress: UserProgress): StampData['bonusType'] {
  if (progress.dailyStoriesRead === 1 && progress.dailyFirstStoryBonus) {
    return 'daily_first';
  }
  if (progress.dailyGoalAchieved) {
    return 'daily_goal';
  }
  if (progress.consecutiveLoginDays === 3 || progress.consecutiveLoginDays === 7) {
    return 'consecutive';
  }
  return undefined;
}

/**
 * スタンプID生成
 */
function generateStampId(): string {
  return `stamp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * スタンプカード表示用データ生成
 */
export function getStampCardDisplay(): StampCardDisplay {
  const progress = getUserProgress();
  const stamps = getStampCardData();
  
  // 現在のカード内のスタンプ（最新50個）
  const currentCardStamps = stamps.slice(-50);
  
  // 次のマイルストーン計算
  const nextCoin = (Math.floor(progress.totalStamps / 10) + 1) * 10;
  const nextCard = (Math.floor(progress.totalStamps / 50) + 1) * 50;
  const stampsToNextCoin = nextCoin - progress.totalStamps;
  const stampsToNextCard = nextCard - progress.totalStamps;
  
  let nextMilestone;
  if (stampsToNextCoin <= stampsToNextCard) {
    nextMilestone = {
      type: 'coin' as const,
      stampsNeeded: stampsToNextCoin,
      description: `あと${stampsToNextCoin}スタンプでコイン獲得`
    };
  } else {
    nextMilestone = {
      type: 'card' as const,
      stampsNeeded: stampsToNextCard,
      description: `あと${stampsToNextCard}スタンプでカード完成`
    };
  }
  
  return {
    currentStamps: currentCardStamps,
    progress: {
      current: progress.currentCardStamps,
      total: 50,
      percentage: (progress.currentCardStamps / 50) * 100
    },
    nextMilestone
  };
}

/**
 * デバッグ用：進捗リセット
 */
export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_PROGRESS);
  localStorage.removeItem(STORAGE_KEYS.STAMP_CARD);
  localStorage.removeItem(STORAGE_KEYS.DAILY_DATA);
  console.log('🗑️ All progress data reset');
}

// 開発者コンソール用
if (typeof window !== 'undefined') {
  (window as any).readingProgress = {
    getUserProgress,
    getStampCardDisplay,
    resetProgress,
    completeReading
  };
}