/**
 * 連続読書記録カレンダーのデータ管理
 */

import { DayRecord, MonthlyStats, CalendarData, StreakInfo, Achievement, CalendarFilter } from '@/types/calendar';

// localStorage キー
const CALENDAR_STORAGE_KEY = 'readingCalendar';
const ACHIEVEMENTS_STORAGE_KEY = 'calendarAchievements';

/**
 * 今日の読書記録を更新
 */
export function updateTodayRecord(
  storiesRead: number,
  wordsRead: number,
  readingTime: number,
  wpm: number,
  level: number
): DayRecord {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM
  
  const existingRecords = getCalendarRecords();
  const todayRecord = existingRecords.find(record => record.date === today);
  
  if (todayRecord) {
    // 既存記録を更新
    todayRecord.storiesRead += storiesRead;
    todayRecord.totalWords += wordsRead;
    todayRecord.readingTime += readingTime;
    todayRecord.averageWPM = calculateAverageWPM(todayRecord.readingTime, todayRecord.totalWords);
    todayRecord.lastReadingTime = currentTime;
    todayRecord.hasGoalAchieved = todayRecord.storiesRead >= 3;
    todayRecord.level = level; // 最新のレベルで更新
  } else {
    // 新しい記録を作成
    const streak = calculateStreak(today, existingRecords);
    const newRecord: DayRecord = {
      date: today,
      storiesRead,
      totalWords: wordsRead,
      readingTime,
      averageWPM: wpm,
      firstReadingTime: currentTime,
      lastReadingTime: currentTime,
      streak,
      hasGoalAchieved: storiesRead >= 3,
      level
    };
    existingRecords.push(newRecord);
  }
  
  saveCalendarRecords(existingRecords);
  
  // 達成項目をチェック
  checkAchievements(existingRecords);
  
  return existingRecords.find(record => record.date === today)!;
}

/**
 * 連続日数を計算
 */
function calculateStreak(targetDate: string, records: DayRecord[]): number {
  const sortedRecords = records
    .filter(record => record.date <= targetDate)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  if (sortedRecords.length === 0) return 1;
  
  let streak = 1;
  const target = new Date(targetDate);
  
  // 昨日から逆順で連続日数をカウント
  for (let i = 1; i <= 365; i++) { // 最大365日まで
    const checkDate = new Date(target);
    checkDate.setDate(checkDate.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    const dayRecord = sortedRecords.find(record => record.date === checkDateStr);
    if (dayRecord && dayRecord.storiesRead > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * 平均WPMを計算
 */
function calculateAverageWPM(totalTimeMs: number, totalWords: number): number {
  if (totalTimeMs === 0) return 0;
  const minutes = totalTimeMs / 60000;
  return Math.round(totalWords / minutes);
}

/**
 * カレンダー記録を取得
 */
export function getCalendarRecords(): DayRecord[] {
  try {
    const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to parse calendar records:', error);
    return [];
  }
}

/**
 * カレンダー記録を保存
 */
function saveCalendarRecords(records: DayRecord[]): void {
  try {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save calendar records:', error);
  }
}

/**
 * 指定月のカレンダーデータを取得
 */
export function getCalendarData(year: number, month: number): CalendarData {
  const records = getCalendarRecords();
  const monthRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getFullYear() === year && recordDate.getMonth() + 1 === month;
  });
  
  // その月の全日付を生成（記録がない日も含む）
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: DayRecord[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const existingRecord = monthRecords.find(record => record.date === dateStr);
    
    if (existingRecord) {
      days.push(existingRecord);
    } else {
      // 記録がない日は空の記録を作成
      days.push({
        date: dateStr,
        storiesRead: 0,
        totalWords: 0,
        readingTime: 0,
        averageWPM: 0,
        streak: 0,
        hasGoalAchieved: false,
        level: 0
      });
    }
  }
  
  const monthlyStats = calculateMonthlyStats(year, month, monthRecords);
  const streaks = calculateStreaks(records);
  const achievements = getAchievements();
  
  return {
    currentMonth: monthlyStats,
    days,
    streaks,
    achievements
  };
}

/**
 * 月別統計を計算
 */
function calculateMonthlyStats(year: number, month: number, records: DayRecord[]): MonthlyStats {
  const totalDays = records.filter(r => r.storiesRead > 0).length;
  const totalStories = records.reduce((sum, r) => sum + r.storiesRead, 0);
  const totalWords = records.reduce((sum, r) => sum + r.totalWords, 0);
  const totalTime = records.reduce((sum, r) => sum + r.readingTime, 0);
  const averageWPM = totalTime > 0 ? Math.round(totalWords / (totalTime / 60000)) : 0;
  const goalAchievedDays = records.filter(r => r.hasGoalAchieved).length;
  
  // 最長連続日数を計算
  let maxStreak = 0;
  let currentStreak = 0;
  
  records.forEach(record => {
    if (record.storiesRead > 0) {
      currentStreak = record.streak;
      maxStreak = Math.max(maxStreak, currentStreak);
    }
  });
  
  // 月末時点の連続日数
  const lastDayRecord = records
    .filter(r => r.storiesRead > 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const endStreak = lastDayRecord ? lastDayRecord.streak : 0;
  
  return {
    year,
    month,
    totalDays,
    totalStories,
    totalWords,
    totalTime,
    averageWPM,
    maxStreak,
    currentStreak: endStreak,
    goalAchievedDays,
    perfectWeeks: 0 // TODO: 実装
  };
}

/**
 * 連続記録を計算
 */
function calculateStreaks(records: DayRecord[]): StreakInfo[] {
  const activeRecords = records
    .filter(r => r.storiesRead > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const streaks: StreakInfo[] = [];
  let currentStreak: StreakInfo | null = null;
  
  activeRecords.forEach((record, index) => {
    if (index === 0) {
      // 最初の記録
      currentStreak = {
        startDate: record.date,
        endDate: record.date,
        length: 1,
        status: 'active',
        totalStories: record.storiesRead,
        totalWords: record.totalWords,
        averagePerDay: record.storiesRead
      };
    } else {
      const prevDate = new Date(activeRecords[index - 1].date);
      const currentDate = new Date(record.date);
      const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1 && currentStreak) {
        // 連続継続
        currentStreak.endDate = record.date;
        currentStreak.length++;
        currentStreak.totalStories += record.storiesRead;
        currentStreak.totalWords += record.totalWords;
        currentStreak.averagePerDay = currentStreak.totalStories / currentStreak.length;
      } else {
        // 連続が途切れた
        if (currentStreak) {
          currentStreak.status = 'ended';
          streaks.push(currentStreak);
        }
        
        currentStreak = {
          startDate: record.date,
          endDate: record.date,
          length: 1,
          status: 'active',
          totalStories: record.storiesRead,
          totalWords: record.totalWords,
          averagePerDay: record.storiesRead
        };
      }
    }
  });
  
  // 最後の連続記録を追加
  if (currentStreak) {
    // 今日まで連続しているかチェック
    const today = new Date().toISOString().split('T')[0];
    const lastDate = new Date(currentStreak.endDate);
    const todayDate = new Date(today);
    const daysSinceLastReading = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastReading > 1) {
      currentStreak.status = 'ended';
    }
    
    streaks.push(currentStreak);
  }
  
  return streaks.filter(streak => streak.length >= 2); // 2日以上の連続のみ
}

/**
 * 達成項目をチェック
 */
function checkAchievements(records: DayRecord[]): void {
  const achievements = getAchievements();
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = records.find(record => record.date === today);
  
  if (!todayRecord) return;
  
  const newAchievements: Achievement[] = [];
  
  // 連続日数の達成項目
  const streakMilestones = [3, 7, 14, 30, 50, 100];
  for (const milestone of streakMilestones) {
    if (todayRecord.streak === milestone) {
      const existingAchievement = achievements.find(a => 
        a.type === 'streak' && a.description.includes(milestone.toString())
      );
      
      if (!existingAchievement) {
        let level: Achievement['level'] = 'bronze';
        if (milestone >= 50) level = 'diamond';
        else if (milestone >= 30) level = 'gold';
        else if (milestone >= 14) level = 'silver';
        
        newAchievements.push({
          id: `streak-${milestone}-${today}`,
          type: 'streak',
          title: `${milestone}日連続達成！`,
          description: `${milestone}日間連続で読書を続けました`,
          achievedDate: today,
          icon: '🔥',
          level
        });
      }
    }
  }
  
  // デイリー目標達成
  if (todayRecord.hasGoalAchieved) {
    const goalAchievementToday = achievements.find(a => 
      a.type === 'goal' && a.achievedDate === today
    );
    
    if (!goalAchievementToday) {
      newAchievements.push({
        id: `goal-${today}`,
        type: 'goal',
        title: 'デイリー目標達成！',
        description: '1日3話以上読書を達成',
        achievedDate: today,
        icon: '🎯',
        level: 'bronze'
      });
    }
  }
  
  if (newAchievements.length > 0) {
    saveAchievements([...achievements, ...newAchievements]);
    console.log('🏆 新しい達成項目:', newAchievements);
  }
}

/**
 * 達成項目を取得
 */
export function getAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to parse achievements:', error);
    return [];
  }
}

/**
 * 達成項目を保存
 */
function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
  } catch (error) {
    console.error('Failed to save achievements:', error);
  }
}

/**
 * 現在の連続日数を取得
 */
export function getCurrentStreak(): number {
  const records = getCalendarRecords();
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = records.find(record => record.date === today);
  
  if (todayRecord && todayRecord.storiesRead > 0) {
    return todayRecord.streak;
  }
  
  // 今日まだ読書していない場合は昨日までの連続を確認
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayRecord = records.find(record => record.date === yesterdayStr);
  
  return yesterdayRecord ? yesterdayRecord.streak : 0;
}