'use client';

import React, { useState } from 'react';
import NewStampCard, { notifyNewStampCardUpdate } from '@/components/NewStampCard';
import { completeReading } from '@/lib/readingProgress';
import { ReadingCompletionData } from '@/types/stampCard';

export default function StampTestPage() {
  const [testStamps, setTestStamps] = useState(0);

  // テスト用の読書完了データ
  const simulateReading = () => {
    const testData: ReadingCompletionData = {
      wordCount: Math.floor(Math.random() * 200) + 50, // 50-250語
      duration: Math.floor(Math.random() * 300) + 120, // 2-7分
      wpm: Math.floor(Math.random() * 100) + 100, // 100-200 WPM
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
    
    setTestStamps(prev => prev + 1);
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

  // 10個のスタンプを一気に追加（マイルストーンテスト用）
  const addTenStamps = () => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        simulateReading();
      }, i * 500); // 0.5秒間隔で実行
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🗺️ スタンプカード テストページ
          </h1>
          <p className="text-gray-600">
            スタンプカードシステムの動作をテストできます
          </p>
        </div>

        {/* テストコントロール */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
          <h2 className="text-xl font-bold mb-4">テストコントロール</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={simulateReading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              📚 読書完了をシミュレート
            </button>
            
            <button
              onClick={addTenStamps}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              🎯 10個スタンプ追加 (マイルストーンテスト)
            </button>
            
            <button
              onClick={resetProgress}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              🔄 進捗をリセット
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>テスト実行回数:</strong> {testStamps}回
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ※ ブラウザの開発者ツール (F12) → Console でデバッグ情報を確認できます
            </p>
          </div>
        </div>

        {/* スタンプカード表示 */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4">スタンプカード</h2>
          
          <NewStampCard 
            onComplete={() => {
              alert('🎉 おめでとうございます！20個のスタンプが完成しました！');
            }}
          />
        </div>

        {/* 説明 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3 text-blue-800">テスト機能の説明</h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>
              <strong>📚 読書完了をシミュレート:</strong> 
              ランダムな読書データで1つのスタンプを獲得します
            </li>
            <li>
              <strong>🎯 10個スタンプ追加:</strong> 
              連続アニメーションをテストできます（20個完成に向けて）
            </li>
            <li>
              <strong>🔄 進捗をリセット:</strong> 
              すべての進捗データを削除して初期状態に戻します
            </li>
          </ul>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-600">
              <strong>期待される動作:</strong><br/>
              • stamp.md仕様のカードデザイン（オレンジヘッダー + ベージュ背景）<br/>
              • 5列×4行（計20マス）のスタンプグリッド<br/>
              • 肉球スタンプのスケール+回転アニメーション<br/>
              • 20個完成時のアラート表示
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}