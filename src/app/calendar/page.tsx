'use client';

import React, { useState, useEffect } from 'react';
import { getCalendarData, getCurrentStreak } from '@/lib/calendarData';
import type { CalendarData } from '@/types/calendar';

export default function CalendarPage() {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [weeklyData, setWeeklyData] = useState<{
    todayWords: number;
    weekWords: number;
    weekTime: number;
    dailyWords: number[];
    maxWords: number;
  }>({
    todayWords: 0,
    weekWords: 0,
    weekTime: 0,
    dailyWords: [],
    maxWords: 0
  });

  useEffect(() => {
    const now = new Date();
    const data = getCalendarData(now.getFullYear(), now.getMonth() + 1);
    setCalendarData(data);
    setCurrentStreak(getCurrentStreak());

    // 今日から7日前までのデータを取得
    const today = new Date();
    const weekData = [];
    let weekTotal = 0;
    let weekTimeTotal = 0;
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecord = data.days.find(day => day.date === dateStr);
      const words = dayRecord ? dayRecord.totalWords : 0;
      const time = dayRecord ? dayRecord.readingTime : 0;
      
      weekData.push(words);
      weekTotal += words;
      weekTimeTotal += time;
    }

    const maxWords = Math.max(...weekData, 1); // 最低1にして0除算を回避
    
    setWeeklyData({
      todayWords: weekData[6], // 今日（配列の最後）
      weekWords: weekTotal,
      weekTime: Math.floor(weekTimeTotal / 60000), // ミリ秒を分に変換
      dailyWords: weekData,
      maxWords
    });
  }, []);

  if (!calendarData) {
    return (
      <main className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="text-text-primary">読み込み中...</div>
      </main>
    );
  }

  const { currentMonth } = calendarData;

  return (
    <main className="min-h-screen bg-page-bg">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* 連続記録ハイライト */}
        <div className="text-center mb-8">
          <div className="bg-orange-500 text-white rounded-2xl px-8 py-6 inline-block">
            <div className="text-lg mb-2">連続日数</div>
            <div className="text-9xl font-bold">{currentStreak}</div>
          </div>
          <div className="text-base text-gray-600 mt-4">
            {currentStreak >= 30 ? '素晴らしい習慣です！' :
             currentStreak >= 14 ? 'すごい継続力ですね！' :
             currentStreak >= 7 ? '1週間達成！' :
             currentStreak >= 3 ? '3日坊主克服！' :
             currentStreak > 0 ? '読書習慣継続中！' : '読書を始めましょう'}
          </div>
        </div>

        {/* 今日・今週の統計 */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-text-primary mb-1">{weeklyData.todayWords.toLocaleString()}</div>
            <div className="text-sm text-gray-600">今日のワード数</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-text-primary mb-1">{weeklyData.weekWords.toLocaleString()}</div>
            <div className="text-sm text-gray-600">今週のワード数</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-text-primary mb-1">{weeklyData.weekTime}分</div>
            <div className="text-sm text-gray-600">今週の読書時間</div>
          </div>
        </div>

        {/* 一週間の歩み（棒グラフ） */}
        <div className="bg-white rounded-lg border border-[#FFE1B5] p-6 shadow-sm">
          <div className="flex items-end justify-between h-48 mb-4">
            {weeklyData.dailyWords.map((words, index) => {
              const today = new Date();
              const date = new Date(today);
              date.setDate(date.getDate() - (6 - index));
              const isToday = index === 6;
              const isYesterday = index === 5;
              
              // 高さを計算（最大値に対する割合）
              const height = Math.max((words / weeklyData.maxWords) * 100, 2); // 最低2%の高さ
              
              let barColor = 'bg-gray-300';
              if (isToday) {
                barColor = 'bg-orange-500';
              } else if (words > 0) {
                barColor = 'bg-orange-300';
              }
              
              const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
              const dayName = isToday ? '今日' : dayNames[date.getDay()];
              
              return (
                <div key={index} className="flex flex-col items-center h-full justify-end">
                  {/* ワード数表示 */}
                  {words > 0 && (
                    <div className="text-xs text-gray-600 mb-1">{words}</div>
                  )}
                  
                  {/* 棒グラフ */}
                  <div
                    className={`w-8 ${barColor} rounded-t transition-all duration-300`}
                    style={{ height: `${height}%` }}
                  />
                  
                  {/* 曜日ラベル */}
                  <div className={`text-xs mt-2 ${isToday ? 'font-bold text-orange-600' : 'text-gray-600'}`}>
                    {dayName}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 一日の平均 */}
          <div className="text-center text-sm text-gray-600">
            一日の平均: {Math.round(weeklyData.weekWords / 7).toLocaleString()}語
          </div>
        </div>
      </div>
    </main>
  );
}