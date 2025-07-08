'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentStreak } from '@/lib/calendarData';

interface StreakBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export default function StreakBadge({ className = '', showLabel = true }: StreakBadgeProps) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(getCurrentStreak());
  }, []);

  if (streak === 0) return null;

  // 連続日数に応じたアイコンとスタイル
  const getStreakDisplay = (days: number) => {
    if (days >= 30) {
      return { icon: '🔥', color: 'bg-red-500', textColor: 'text-white' };
    } else if (days >= 14) {
      return { icon: '⚡', color: 'bg-yellow-500', textColor: 'text-white' };
    } else if (days >= 7) {
      return { icon: '✨', color: 'bg-purple-500', textColor: 'text-white' };
    } else if (days >= 3) {
      return { icon: '💫', color: 'bg-blue-500', textColor: 'text-white' };
    } else {
      return { icon: '⭐', color: 'bg-green-500', textColor: 'text-white' };
    }
  };

  const display = getStreakDisplay(streak);

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${display.color} ${display.textColor} ${className}`}>
      <span>{display.icon}</span>
      <span>{streak}</span>
      {showLabel && <span>日連続</span>}
    </div>
  );
}