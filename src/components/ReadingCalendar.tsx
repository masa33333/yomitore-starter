'use client';

import React, { useState, useEffect } from 'react';
import { getCalendarData, getCurrentStreak } from '@/lib/calendarData';
import type { CalendarData, DayRecord } from '@/types/calendar';

interface ReadingCalendarProps {
  year?: number;
  month?: number;
  className?: string;
}

export default function ReadingCalendar({ 
  year: propYear, 
  month: propMonth, 
  className = '' 
}: ReadingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return {
      year: propYear || now.getFullYear(),
      month: propMonth || (now.getMonth() + 1)
    };
  });
  
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);

  // データを読み込み
  useEffect(() => {
    const data = getCalendarData(currentDate.year, currentDate.month);
    setCalendarData(data);
    setCurrentStreak(getCurrentStreak());
  }, [currentDate]);

  // 月を変更
  const changeMonth = (delta: number) => {
    setCurrentDate(prev => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      
      return { year: newYear, month: newMonth };
    });
  };

  // 日付のスタイルを取得
  const getDayStyle = (day: DayRecord): string => {
    const baseStyle = "aspect-square flex flex-col items-center justify-center text-xs border rounded-lg relative";
    
    if (day.storiesRead === 0) {
      return `${baseStyle} bg-gray-100 text-gray-400 border-gray-200`;
    }
    
    // 読書レベルに応じた色分け
    let colorClass = '';
    if (day.storiesRead >= 5) {
      colorClass = 'bg-green-600 text-white border-green-700'; // 5話以上
    } else if (day.storiesRead >= 3) {
      colorClass = 'bg-green-400 text-white border-green-500'; // 3-4話（目標達成）
    } else if (day.storiesRead >= 1) {
      colorClass = 'bg-yellow-300 text-gray-800 border-yellow-400'; // 1-2話
    }
    
    return `${baseStyle} ${colorClass}`;
  };

  // 連続アイコンを取得
  const getStreakIcon = (day: DayRecord): string => {
    if (day.storiesRead === 0) return '';
    if (day.streak >= 30) return '🔥';
    if (day.streak >= 14) return '⚡';
    if (day.streak >= 7) return '✨';
    if (day.streak >= 3) return '💫';
    return '⭐';
  };

  if (!calendarData) {
    return (
      <div className={`reading-calendar ${className}`}>
        <div className="text-center p-4">読み込み中...</div>
      </div>
    );
  }

  const { currentMonth, days } = calendarData;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={`reading-calendar ${className}`}>
      {/* ヘッダー */}
      <div className="calendar-header bg-orange-100 rounded-t-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-full hover:bg-orange-200 transition-colors"
            aria-label="前の月"
          >
            ◀
          </button>
          
          <h2 className="text-xl font-bold text-gray-800">
            {currentDate.year}年 {currentDate.month}月
          </h2>
          
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-full hover:bg-orange-200 transition-colors"
            aria-label="次の月"
          >
            ▶
          </button>
        </div>
        
        {/* 月間統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="bg-white rounded-lg p-2">
            <div className="text-xs text-gray-600">読書日数</div>
            <div className="text-lg font-bold text-orange-600">{currentMonth.totalDays}日</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className="text-xs text-gray-600">総話数</div>
            <div className="text-lg font-bold text-green-600">{currentMonth.totalStories}話</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className="text-xs text-gray-600">現在の連続</div>
            <div className="text-lg font-bold text-red-600">{currentStreak}日</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className="text-xs text-gray-600">目標達成</div>
            <div className="text-lg font-bold text-blue-600">{currentMonth.goalAchievedDays}日</div>
          </div>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="calendar-weekdays grid grid-cols-7 bg-gray-50 border-x border-gray-200">
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div 
            key={day} 
            className={`p-2 text-center text-sm font-medium ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="calendar-grid grid grid-cols-7 bg-white border border-gray-200 rounded-b-lg overflow-hidden">
        {/* 月の最初の週の空白日 */}
        {Array.from({ 
          length: new Date(currentDate.year, currentDate.month - 1, 1).getDay() 
        }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square bg-gray-50 border-r border-b border-gray-200" />
        ))}
        
        {/* 実際の日付 */}
        {days.map((day) => {
          const dayNumber = parseInt(day.date.split('-')[2]);
          const isToday = day.date === today;
          
          return (
            <div
              key={day.date}
              className={`${getDayStyle(day)} border-r border-b border-gray-200 p-1 ${
                isToday ? 'ring-2 ring-orange-400' : ''
              }`}
              title={day.storiesRead > 0 ? 
                `${day.storiesRead}話読了 (${day.totalWords}語, ${Math.floor(day.readingTime / 60000)}分)` : 
                '読書記録なし'
              }
            >
              {/* 日付 */}
              <div className="text-xs font-medium mb-1">{dayNumber}</div>
              
              {/* 読書情報 */}
              {day.storiesRead > 0 && (
                <div className="flex flex-col items-center">
                  {/* 話数 */}
                  <div className="text-xs font-bold">{day.storiesRead}</div>
                  
                  {/* 連続アイコン */}
                  {day.streak >= 3 && (
                    <div className="text-xs leading-none">{getStreakIcon(day)}</div>
                  )}
                  
                  {/* 目標達成マーク */}
                  {day.hasGoalAchieved && (
                    <div className="absolute top-0 right-0 text-xs">🎯</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="calendar-legend mt-4 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-700">凡例</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-300 border border-yellow-400 rounded"></div>
            <span>1-2話</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 border border-green-500 rounded"></div>
            <span>3-4話 (目標達成)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 border border-green-700 rounded"></div>
            <span>5話以上</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span>30日連続</span>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          🎯: デイリー目標達成 | ⭐: 3日連続 | 💫: 7日連続 | ✨: 14日連続 | ⚡: 21日連続 | 🔥: 30日連続
        </div>
      </div>
    </div>
  );
}

/**
 * ミニカレンダー（他のページに埋め込み用）
 */
export function MiniReadingCalendar({ className = '' }: { className?: string }) {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayRecord, setTodayRecord] = useState<DayRecord | null>(null);

  useEffect(() => {
    const today = new Date();
    const data = getCalendarData(today.getFullYear(), today.getMonth() + 1);
    const todayStr = today.toISOString().split('T')[0];
    const record = data.days.find(day => day.date === todayStr);
    
    setCurrentStreak(getCurrentStreak());
    setTodayRecord(record || null);
  }, []);

  return (
    <div className={`mini-reading-calendar bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="text-sm font-semibold mb-3 text-gray-700">今日の読書記録</h3>
      
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-orange-50 rounded-lg p-2">
          <div className="text-xs text-gray-600">ワード数</div>
          <div className="text-lg font-bold text-orange-600">
            {todayRecord ? `${todayRecord.totalWords}語` : '0語'}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-2">
          <div className="text-xs text-gray-600">連続</div>
          <div className="text-lg font-bold text-red-600">{currentStreak}日</div>
        </div>
      </div>
      
      {currentStreak >= 3 && (
        <div className="mt-2 text-center">
          <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            🔥 {currentStreak}日連続達成中！
          </span>
        </div>
      )}
    </div>
  );
}