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
      // getUserProgress: Loaded from storage (logging removed)
      
      // マイグレーション処理を削除（重複更新の原因）
      // 既存データは初回時のmigrateFromLegacySystem()のみで処理
      
      // データ整合性チェック - 語数とスタンプ数の論理的チェック
      const expectedStamps = Math.floor(parsed.totalWords / 100);
      if (parsed.totalStamps !== expectedStamps) {
        // Stamp count mismatch detected - correcting silently in memory
        parsed.totalStamps = expectedStamps;
        parsed.currentCardStamps = expectedStamps % 20; // 20個でカード完成
        parsed.completedCards = Math.floor(expectedStamps / 20);
      }
      
      return parsed;
    }
  } catch (error) {
    // Failed to parse user progress - silent handling
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
  
  // 🔍 新規ユーザー検出: 進捗データが存在しない場合は新規ユーザー
  const allKeys = Object.keys(localStorage);
  const hasProgressData = allKeys.some(key => 
    ['totalWordsRead', 'userProgress', 'yomitore.reward.v2', 'stampCard', 'completedReadings'].includes(key)
  );
  const isFreshStart = !hasProgressData; // 進捗データがない場合は新規ユーザー
  
  if (isFreshStart) {
    progress.totalWords = 0;
    progress.totalStamps = 0;
    progress.currentCardStamps = 0;
    progress.completedCards = 0;
  } else {
    progress.totalWords = legacyWords;
    // 1話毎にスタンプ1個の新システム（stamp.md仕様）
    // レガシーデータは既存のcompletedReadings値を使用
    const legacyReadings = parseInt(localStorage.getItem('completedReadings') || '0', 10);
    progress.totalStamps = legacyReadings;
    progress.currentCardStamps = progress.totalStamps % 20; // 20個でカード完成
    progress.completedCards = Math.floor(progress.totalStamps / 20);
  }
  
  // データ整合性チェック - 語数とスタンプ数の論理的チェック
  const expectedStamps = Math.floor(progress.totalWords / 100);
  if (progress.totalStamps !== expectedStamps) {
    progress.totalStamps = expectedStamps;
    progress.currentCardStamps = expectedStamps % 20;
    progress.completedCards = Math.floor(expectedStamps / 20);
  }
  
  // コインとトロフィーを計算（新しいスタンプ数ベース）
  progress.bronzeCoins = Math.floor(progress.totalStamps / 20);
  progress.bronzeTrophies = Math.floor(progress.completedCards / 5);
  progress.silverTrophies = Math.floor(progress.bronzeTrophies / 5);
  progress.goldTrophies = Math.floor(progress.silverTrophies / 5);
  progress.platinumTrophies = Math.floor(progress.goldTrophies / 4);
  
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
    
    // 🔧 修正: 既存システムとの互換性を維持
    localStorage.setItem(STORAGE_KEYS.TOTAL_WORDS_READ, progress.totalWords.toString());
    localStorage.setItem(STORAGE_KEYS.COMPLETED_READINGS, progress.totalStamps.toString());
  } catch (error) {
    // Failed to save user progress - silent handling
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
    // Failed to parse stamp card data (logging removed)
    return [];
  }
}

/**
 * スタンプカードデータを保存
 */
export function saveStampCardData(stamps: StampData[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STAMP_CARD, JSON.stringify(stamps));
    // Stamp card data saved (logging removed)
  } catch (error) {
    // Failed to save stamp card data (logging removed)
  }
}

/**
 * 連続読書達成メッセージの記録（セッション終了時に表示用）
 */
function recordConsecutiveReadingMessage(progress: UserProgress): void {
  const consecutiveDays = progress.consecutiveLoginDays;
  
  if (consecutiveDays > 0) {
    const message = `今日で${consecutiveDays}日連続読書達成！`;
    localStorage.setItem('consecutiveReadingMessage', message);
    console.log(`📚 ${message}`);
  }
}


/**
 * デイリーデータの管理
 */
export function checkAndResetDailyData(testDate?: string): UserProgress {
  const progress = getUserProgress();
  const today = testDate || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 日付が変わっていたらデイリーデータをリセット
  if (progress.lastLoginDate !== today) {
    // 連続ログイン日数の更新
    const todayDate = testDate ? new Date(testDate) : new Date();
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log('🔍 Checking login continuity...');
    console.log('  Current lastLoginDate:', progress.lastLoginDate);
    console.log('  Expected yesterday:', yesterdayStr);
    console.log('  Today:', today);
    
    if (progress.lastLoginDate === yesterdayStr) {
      // 連続ログイン継続
      console.log('✅ Consecutive login continued!');
      progress.consecutiveLoginDays += 1;
    } else if (progress.lastLoginDate === '') {
      // 初回ログイン
      console.log('🆕 First time login!');
      progress.consecutiveLoginDays = 1;
    } else {
      // 連続ログインが途切れた
      console.log('💔 Consecutive login broken!');
      const lastLoginDate = new Date(progress.lastLoginDate);
      const currentDate = testDate ? new Date(testDate) : new Date();
      const daysDifference = Math.floor((currentDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log('  Days difference:', daysDifference);
      
      if (daysDifference >= 3) {
        // 3日以上空いている場合は復帰メッセージ
        showWelcomeBackMessage(daysDifference);
        console.log(`🤗 おかえりなさい！${daysDifference}日ぶりのログイン`);
      }
      
      progress.consecutiveLoginDays = 1;
    }
    
    console.log('📅 Daily data reset for new day:', today);
    console.log('📊 Previous lastLoginDate:', progress.lastLoginDate, 'yesterday should be:', yesterdayStr);
    console.log('🔥 Consecutive login days updated to:', progress.consecutiveLoginDays);
    
    // デイリーデータリセット
    progress.dailyStoriesRead = 0;
    progress.dailyFirstStoryBonus = false;
    progress.dailyGoalAchieved = false;
    progress.lastLoginDate = today;
    
    // 連続読書達成メッセージの記録
    recordConsecutiveReadingMessage(progress);
    
    saveUserProgress(progress);
  }
  
  return progress;
}

/**
 * 読書完了時の統一処理（メイン関数）
 */
export function completeReading(data: ReadingCompletionData): UserProgress {
  // 1. 既存進捗データを取得
  let progress = getUserProgress();
  const previousTotalStamps = progress.totalStamps;

  // 2. 主要な進捗を先に計算
  const newStampsEarned = 1;
  progress.totalStamps += newStampsEarned;
  progress.totalWords += data.wordCount;
  progress.dailyStoriesRead += 1;

  // 3. カード完成チェック
  const cardsBeforeReading = Math.floor(previousTotalStamps / 20);
  const cardsAfterReading = Math.floor(progress.totalStamps / 20);
  const newCardsCompleted = cardsAfterReading - cardsBeforeReading;

  // 4. 演出を即時実行
  if (newCardsCompleted > 0) {
    // カード完成演出
    window.dispatchEvent(new CustomEvent('showRewardFlash', { 
      detail: { rewardType: 'gold', count: newCardsCompleted } 
    }));
  } else if (progress.totalStamps % 20 === 0) {
    // 20スタンプごとのコイン獲得演出
    const newCoinsEarned = Math.floor(progress.totalStamps / 20) - Math.floor(previousTotalStamps / 20);
    if (newCoinsEarned > 0) {
      window.dispatchEvent(new CustomEvent('showRewardFlash', { 
        detail: { rewardType: 'coin', count: newCoinsEarned } 
      }));
    }
  } else {
    // 通常のスタンプ獲得演出
    window.dispatchEvent(new CustomEvent('showRewardFlash', { 
      detail: { rewardType: 'stamp', count: 1 } 
    }));
  }

  // 5. 残りの重い処理を非同期で実行
  setTimeout(() => {
    // a. カード進捗を更新
    progress.currentCardStamps = progress.totalStamps % 20;
    if (newCardsCompleted > 0) {
      progress.completedCards += newCardsCompleted;
      // カード完成通知（UI更新用）
      window.dispatchEvent(new CustomEvent('cardCompleted', { 
        detail: { newCards: newCardsCompleted, totalCards: progress.completedCards } 
      }));
    }

    // b. コイン・トロフィー更新
    updateAchievements(progress);

    // c. デイリーボーナス処理
    processeDailyBonuses(progress);

    // d. 連続読書メッセージ記録
    recordConsecutiveReadingMessage(progress);

    // e. スタンプデータ作成・保存
    const stamps = getStampCardData();
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
    if (shouldAwardBonusStamp(progress)) {
      stamp.isBonusStamp = true;
      stamp.bonusType = getBonusType(progress);
    }
    stamps.push(stamp);
    saveStampCardData(stamps);

    // f. 履歴保存
    saveToHistory({
      type: data.contentType,
      title: data.title,
      contentJP: '',
      contentEN: '',
      level: data.level,
      wordCount: data.wordCount,
      duration: data.duration,
      wpm: data.wpm
    });

    // g. 最終的な進捗データを保存
    saveUserProgress(progress);
  }, 10); // 10ms後に実行

  return progress;
}

/**
 * コイン・トロフィー更新
 */
function updateAchievements(progress: UserProgress): void {
  // 以前のコイン数を記録
  const previousCoins = progress.bronzeCoins;
  
  // updateAchievements: コイン計算開始 (logging removed)
  
  // ブロンズコイン（20スタンプごと）
  progress.bronzeCoins = Math.floor(progress.totalStamps / 20);
  
  // 新しいコインが獲得された場合（20個に到達した時のみ）
  const newCoinsEarned = progress.bronzeCoins - previousCoins;
  
  // updateAchievements: コイン計算結果 (logging removed)
  
  // 20の倍数に到達した場合のみコイン演出を表示
  if (newCoinsEarned > 0) {
    // 20スタンプ達成時のコイン演出（即座に表示）
    window.dispatchEvent(new CustomEvent('showRewardFlash', { 
      detail: { 
        rewardType: 'coin', // 20スタンプ達成はコイン演出
        count: newCoinsEarned
      } 
    }));
  }
  
  // ブロンズトロフィー（5カード完成）
  const previousBronzeTrophies = progress.bronzeTrophies;
  progress.bronzeTrophies = Math.floor(progress.completedCards / 5);
  const newBronzeTrophies = progress.bronzeTrophies - previousBronzeTrophies;
  
  if (newBronzeTrophies > 0) {
    // ブロンズトロフィー獲得演出（250話達成！）
    window.dispatchEvent(new CustomEvent('showRewardFlash', { 
      detail: { 
        rewardType: 'bronze',
        count: newBronzeTrophies
      } 
    }));
  }
  
  // シルバートロフィー（5ブロンズ）
  progress.silverTrophies = Math.floor(progress.bronzeTrophies / 5);
  
  // ゴールドトロフィー（5シルバー）
  progress.goldTrophies = Math.floor(progress.silverTrophies / 5);
  
  // プラチナトロフィー（4ゴールド）
  progress.platinumTrophies = Math.floor(progress.goldTrophies / 4);
}

/**
 * デイリー進捗記録（日付チェックなし）
 */
function processeDailyBonuses(progress: UserProgress): void {
  // 今日が変わっているかチェック
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastLoginDate !== today) {
    // 日付が変わっている場合は読書カウントをリセット
    progress.dailyStoriesRead = 1; // 現在の読書が今日の最初
    progress.dailyFirstStoryBonus = false;
    progress.dailyGoalAchieved = false;
    progress.lastLoginDate = today;
  }

  // 今日の最初の1話の記録
  if (progress.dailyStoriesRead === 1 && !progress.dailyFirstStoryBonus) {
    progress.dailyFirstStoryBonus = true;
    console.log('🌟 今日の最初の1話達成！');
  }
  
  // デイリー目標達成（3話）の記録
  if (progress.dailyStoriesRead >= 3 && !progress.dailyGoalAchieved) {
    progress.dailyGoalAchieved = true;
    console.log('🎯 デイリー目標3話達成！');
  }
}


/**
 * おかえりメッセージの表示
 */
function showWelcomeBackMessage(daysDifference: number): void {
  const messages = [
    'また会えて嬉しいです！',
    'お帰りなさい！待っていました',
    'また一緒に読書の旅を始めましょう',
    'あなたのことを想っていました',
    '新しい冒険の準備はできています'
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  // おかえりメッセージをlocalStorageに記録（UI表示用）
  localStorage.setItem('welcomeBackMessage', JSON.stringify({
    daysDifference,
    message: randomMessage
  }));
}

/**
 * 連続読書達成メッセージを取得・クリア
 */
export function getAndClearConsecutiveReadingMessage(): string | null {
  const message = localStorage.getItem('consecutiveReadingMessage');
  if (message) {
    localStorage.removeItem('consecutiveReadingMessage');
    return message;
  }
  return null;
}

/**
 * おかえりメッセージを取得・クリア
 */
export function getAndClearWelcomeBackMessage(): { daysDifference: number; message: string } | null {
  const stored = localStorage.getItem('welcomeBackMessage');
  if (stored) {
    localStorage.removeItem('welcomeBackMessage');
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse welcome back message:', error);
      return null;
    }
  }
  return null;
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
  
  // 現在のカード内のスタンプ（最新20個）
  const currentCardStamps = stamps.slice(-20);
  
  // 次のマイルストーン計算
  const nextCoin = (Math.floor(progress.totalStamps / 20) + 1) * 20;
  const nextCard = (Math.floor(progress.totalStamps / 20) + 1) * 20;
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
      total: 20,
      percentage: (progress.currentCardStamps / 20) * 100
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

// 緊急デバッグ機能を追加
export function emergencyDebugProgress(): void {
  const progress = getUserProgress();
  console.log('🚨 Emergency Debug - Current Progress:', progress);
  
  const actualTotalWords = 162 + 142; // 実際に読んだ語数
  const expectedStamps = Math.floor(actualTotalWords / 100);
  
  console.log('🧮 Manual calculation:', {
    actualWordsRead: actualTotalWords,
    expectedStamps: expectedStamps,
    currentStamps: progress.totalStamps,
    currentWords: progress.totalWords,
    difference: progress.totalWords - actualTotalWords
  });
}

export function emergencyFixProgress(): void {
  const actualTotalWords = 162 + 142; // 実際に読んだ語数
  const progress = getUserProgress();
  
  console.log('🔧 Emergency Fix - Before:', progress);
  
  progress.totalWords = actualTotalWords;
  progress.totalStamps = Math.floor(actualTotalWords / 100);
  progress.currentCardStamps = progress.totalStamps % 20;
  progress.completedCards = Math.floor(progress.totalStamps / 20);
  progress.bronzeCoins = Math.floor(progress.totalStamps / 20);
  
  saveUserProgress(progress);
  
  console.log('🔧 Emergency Fix - After:', progress);
}

// 開発者コンソール用
if (typeof window !== 'undefined') {
  (window as any).readingProgress = {
    getUserProgress,
    getStampCardDisplay,
    resetProgress,
    completeReading,
    emergencyDebugProgress,
    emergencyFixProgress
  };
}