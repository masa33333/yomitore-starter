'use client';

import React, { useState } from 'react';
import NewStampCard, { notifyNewStampCardUpdate } from '@/components/NewStampCard';
import { completeReading } from '@/lib/readingProgress';
import { ReadingCompletionData } from '@/types/stampCard';

export default function NewStampTestPage() {
  const [testCount, setTestCount] = useState(0);
  const [manualCount, setManualCount] = useState(0);

  // テスト用の読書完了データでスタンプ獲得をシミュレート
  const simulateReading = () => {
    const testData: ReadingCompletionData = {
      wordCount: Math.floor(Math.random() * 200) + 100, // 100-300語
      duration: Math.floor(Math.random() * 300) + 120, // 2-7分
      wpm: Math.floor(Math.random() * 100) + 120, // 120-220 WPM
      level: Math.floor(Math.random() * 5) + 1, // Level 1-5
      title: `テスト読み物 ${Date.now()}`,
      contentType: 'reading' as const
    };

    console.log('📚 読書完了をシミュレート:', testData);
    
    // 読書完了処理を実行
    const updatedProgress = completeReading(testData);
    console.log('✅ 更新された進捗:', updatedProgress);
    
    // スタンプカード更新通知
    notifyNewStampCardUpdate();
    
    setTestCount(prev => prev + 1);
  };

  // 5個のスタンプを連続で追加
  const addFiveStamps = () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        simulateReading();
      }, i * 800); // 0.8秒間隔で実行
    }
  };

  // 進捗データをリセット
  const resetProgress = () => {
    localStorage.removeItem('userProgress');
    localStorage.removeItem('readingHistory');
    localStorage.removeItem('lastLoginDate');
    localStorage.removeItem('dailyProgress');
    
    // ページをリロードして初期状態に戻す
    window.location.reload();
  };

  // 20個完了時のコールバック
  const handleComplete = () => {
    alert('🎉 おめでとうございます！20個のスタンプが完成しました！\nネコからメールが届きます！');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎴 新しいスタンプカード テストページ
          </h1>
          <p className="text-gray-600">
            stamp.md仕様に基づくスタンプカードUIのテスト
          </p>
        </div>

        {/* テストコントロール */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
          <h2 className="text-xl font-bold mb-4">テストコントロール</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button
              onClick={simulateReading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              📚 スタンプ1個追加
            </button>
            
            <button
              onClick={addFiveStamps}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              🎯 スタンプ5個連続追加
            </button>
            
            <button
              onClick={resetProgress}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              🔄 進捗をリセット
            </button>
          </div>
          
          {/* 手動スタンプ数テスト */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">手動スタンプ数テスト</h3>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="20"
                value={manualCount}
                onChange={(e) => setManualCount(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16">{manualCount} / 20</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              スライダーで手動でスタンプ数を調整できます
            </p>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>実際のデータテスト実行回数:</strong> {testCount}回
            </p>
          </div>
        </div>

        {/* スタンプカード表示 */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4 text-center">実際のデータ連動版</h2>
          <div className="flex justify-center">
            <NewStampCard onComplete={handleComplete} />
          </div>
        </div>

        {/* 手動テスト版 */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4 text-center">手動テスト版</h2>
          <div className="flex justify-center">
            <NewStampCard 
              filledCount={manualCount} 
              onComplete={() => alert('手動テスト: 20個完成！')} 
            />
          </div>
        </div>

        {/* 仕様確認 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">実装仕様確認</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">デザイン仕様</h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>ヘッダー: オレンジ地#FFA453 + 茶色文字#6E3129</li>
                  <li>説明欄: ベージュ地#fcd8a8 + 黒字</li>
                  <li>ネコアイコン: 茶色円#6E3129内にcat-icon.png</li>
                  <li>グリッド: 2列×10行（計20マス）</li>
                  <li>スタンプ: stamp.png（肉球）</li>
                  <li>固定幅: 320px</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">機能仕様</h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Framer Motionアニメーション</li>
                  <li>スタンプがポンとスケールイン</li>
                  <li>20個完了時のコールバック</li>
                  <li>ネコ名前の動的表示</li>
                  <li>進捗カウンター表示</li>
                  <li>レスポンシブ対応</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-600">
              <strong>期待される動作:</strong><br/>
              • スタンプ獲得時にスケール+回転アニメーション<br/>
              • 20個完了時にアラート表示<br/>
              • ネコの名前が「ネコ」から実際の名前に変更<br/>
              • 手動スライダーで任意のスタンプ数をテスト可能
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}