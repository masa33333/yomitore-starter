'use client';

import { useState, useEffect } from 'react';
import DiaryCard from '@/components/DiaryCard';

export default function DiaryTestPage() {
  const [diary, setDiary] = useState(null);

  // localStorage からユーザーレベルを取得（デフォルト: B1）
  const getUserLevel = (): 'A1' | 'A2' | 'B1' | 'B2' => {
    if (typeof window === 'undefined') return 'B1';
    
    const savedLevel = localStorage.getItem('userLevel');
    const validLevels = ['A1', 'A2', 'B1', 'B2'];
    
    if (savedLevel && validLevels.includes(savedLevel)) {
      return savedLevel as 'A1' | 'A2' | 'B1' | 'B2';
    }
    
    return 'B1'; // デフォルト
  };

  useEffect(() => {
    const userLevel = getUserLevel();
    console.log('🎯 Using user level:', userLevel);
    
    fetch(`/api/claude-diary?id=fukuoka&level=${userLevel}`)
      .then(res => res.json())
      .then(data => {
        console.log('🔥 APIからのレスポンス:', data);
        console.log('🔥 data.en:', data.en);
        console.log('🔥 data.jp:', data.jp);
        
        // localStorageに保存（letterページで使用するため）
        localStorage.setItem('diary:fukuoka', JSON.stringify(data));
        console.log('💾 Saved to localStorage:', data);
        
        setDiary(data);
      })
      .catch(error => console.error('Failed to fetch diary:', error));
  }, []);

  if (!diary) {
    return (
      <div className="min-h-screen bg-gray-100 py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading diary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="mx-auto max-w-xl mt-10">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Diary Card Test
        </h1>
        <DiaryCard diary={diary} />
      </div>
    </div>
  );
}