'use client';

import React, { useState, useEffect } from 'react';
import NewStampCard, { notifyNewStampCardUpdate } from '@/components/NewStampCard';
import { completeReading, checkAndResetDailyData, getUserProgress, getAndClearConsecutiveReadingMessage, getAndClearWelcomeBackMessage } from '@/lib/readingProgress';
import { ReadingCompletionData, UserProgress } from '@/types/stampCard';

export default function ContinuityTestPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [testDay, setTestDay] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 初期データロード
    const currentProgress = getUserProgress();
    setProgress(currentProgress);
    
    // おかえりメッセージをチェック
    const welcomeBackMsg = getAndClearWelcomeBackMessage();
    if (welcomeBackMsg) {
      setMessage(`🤗 ${welcomeBackMsg.daysDifference}日ぶりのログイン！${welcomeBackMsg.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  }, []);

  // テスト用読書完了シミュレート
  const simulateReading = () => {
    const testData: ReadingCompletionData = {
      wordCount: Math.floor(Math.random() * 200) + 100,
      duration: Math.floor(Math.random() * 300) + 120,
      wpm: Math.floor(Math.random() * 100) + 120,
      level: Math.floor(Math.random() * 5) + 1,
      title: `テスト読み物 ${Date.now()}`,
      contentType: 'reading' as const
    };

    const updatedProgress = completeReading(testData);
    setProgress(updatedProgress);
    notifyNewStampCardUpdate();
    
    // セッション終了時メッセージをチェック（読書完了時）
    const consecutiveMsg = getAndClearConsecutiveReadingMessage();
    if (consecutiveMsg) {
      setMessage(`📚 ${consecutiveMsg}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // 連続ログインテスト（日付を進める）
  const simulateNextDay = () => {
    const nextDay = testDay + 1;
    setTestDay(nextDay);
    
    // テスト用の日付を設定
    const today = new Date();
    today.setDate(today.getDate() + nextDay);
    const testDate = today.toISOString().split('T')[0];
    
    // 前の日付を設定して連続ログインをテスト
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log(`📅 Setting lastLoginDate to: ${yesterdayStr}, today: ${testDate}`);
    
    localStorage.setItem('userProgress', JSON.stringify({
      ...progress,
      lastLoginDate: yesterdayStr
    }));
    
    // デイリーデータリセット処理を実行（テスト日付を指定）
    const updatedProgress = checkAndResetDailyData(testDate);
    setProgress(updatedProgress);
    
    // 連続読書メッセージをチェック
    const consecutiveMsg = getAndClearConsecutiveReadingMessage();
    if (consecutiveMsg) {
      setMessage(`📚 ${consecutiveMsg}`);
      setTimeout(() => setMessage(''), 5000);
    } else {
      console.log('❌ No consecutive reading message found');
    }
    
    console.log(`📅 Day ${nextDay}: ${testDate}, consecutive days: ${updatedProgress.consecutiveLoginDays}`);
  };

  // 復帰ボーナステスト（3日以上空ける）
  const simulateReturnAfterGap = () => {
    if (!progress) return;
    
    // 5日前の日付を設定
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    localStorage.setItem('userProgress', JSON.stringify({
      ...progress,
      lastLoginDate: fiveDaysAgo.toISOString().split('T')[0]
    }));
    
    // デイリーデータリセット処理を実行（現在日付で復帰テスト）
    const updatedProgress = checkAndResetDailyData();
    setProgress(updatedProgress);
    
    // おかえりメッセージをチェック
    const welcomeBackMsg = getAndClearWelcomeBackMessage();
    if (welcomeBackMsg) {
      setMessage(`🤗 ${welcomeBackMsg.daysDifference}日ぶりのログイン！${welcomeBackMsg.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
    
    console.log('🤗 5日ぶりの復帰をシミュレート');
  };

  // 進捗リセット
  const resetProgress = () => {
    localStorage.removeItem('userProgress');
    localStorage.removeItem('readingHistory');
    localStorage.removeItem('lastLoginDate');
    localStorage.removeItem('dailyProgress');
    setTestDay(0);
    setMessage('');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔥 継続支援機能 テストページ
          </h1>
          <p className="text-gray-600">
            連続ログインボーナス・デイリー達成・復帰ボーナスのテスト
          </p>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
            <div className="text-lg font-medium text-yellow-800">
              {message}
            </div>
          </div>
        )}

        {/* 現在の状況 */}
        {progress && (
          <div className="mb-6 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4">現在の状況</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">連続ログイン</div>
                <div className="text-2xl font-bold text-blue-600">{progress.consecutiveLoginDays}日</div>
              </div>
              <div>
                <div className="font-medium">今日の読書</div>
                <div className="text-2xl font-bold text-green-600">{progress.dailyStoriesRead}話</div>
              </div>
              <div>
                <div className="font-medium">最初の1話</div>
                <div className="text-lg">{progress.dailyFirstStoryBonus ? '✅' : '⭕'}</div>
              </div>
              <div>
                <div className="font-medium">3話目標</div>
                <div className="text-lg">{progress.dailyGoalAchieved ? '✅' : '⭕'}</div>
              </div>
            </div>
          </div>
        )}

        {/* テストコントロール */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
          <h2 className="text-xl font-bold mb-4">テスト機能</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={simulateReading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              📚 読書完了（連続読書メッセージテスト）
            </button>
            
            <button
              onClick={simulateNextDay}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              ⏭️ 翌日ログイン（連続ログインテスト）
            </button>
            
            <button
              onClick={simulateReturnAfterGap}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              🤗 5日後復帰（おかえりメッセージテスト）
            </button>
            
            <button
              onClick={resetProgress}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              🔄 進捗リセット
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>テスト手順:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>「⏭️ 翌日ログイン」を数回実行して連続ログイン日数を増やす</li>
              <li>「📚 読書完了」で「今日で〜日連続読書達成」メッセージ確認</li>
              <li>「🤗 5日後復帰」で「おかえりなさい」メッセージ確認</li>
            </ol>
          </div>
        </div>

        {/* スタンプカード表示 */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4 text-center">スタンプカード</h2>
          <div className="flex justify-center">
            <NewStampCard onComplete={() => alert('🎉 20個完成！')} />
          </div>
        </div>

        {/* 仕様説明 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">継続支援機能仕様（簡素版）</h3>
          <div className="text-sm text-blue-700 space-y-3">
            <div>
              <h4 className="font-semibold">📚 連続読書達成メッセージ</h4>
              <ul className="list-disc list-inside space-y-1 text-xs ml-4">
                <li>読書完了時に「今日で〜日連続読書達成！」と表示</li>
                <li>ボーナススタンプなし（メッセージのみ）</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">🤗 おかえりメッセージ</h4>
              <ul className="list-disc list-inside space-y-1 text-xs ml-4">
                <li>3日以上空いた復帰時に温かいメッセージ表示</li>
                <li>「また会えて嬉しいです！」等のランダムメッセージ</li>
                <li>ボーナススタンプなし（メッセージのみ）</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">📊 デイリー進捗記録</h4>
              <ul className="list-disc list-inside space-y-1 text-xs ml-4">
                <li>今日の最初の1話・3話目標の記録（表示なし）</li>
                <li>連続ログイン日数の管理</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}