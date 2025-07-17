'use client';

import { useReward } from '@/context/RewardContext';
import RewardDisplay from '@/components/RewardDisplay';
import RewardEarnedFlash from '@/components/RewardEarnedFlash';
import RewardFlashManager from '@/components/RewardFlashManager';
import { useState } from 'react';

export default function RewardTestPage() {
  const { reward, addWordsToReward } = useReward();
  const [testWords, setTestWords] = useState<number>(100);

  const testCases = [
    { label: '100語 (1スタンプ)', words: 100 },
    { label: '2000語 (1コイン)', words: 2000 },
    { label: '10000語 (1ブロンズ)', words: 10000 },
    { label: '50000語 (1シルバー)', words: 50000 },
    { label: '250000語 (1ゴールド)', words: 250000 },
    { label: '1000000語 (1プラチナ)', words: 1000000 },
  ];

  const trophyTestCases = [
    { label: '🥉 ブロンズ演出テスト', words: 10000 },
    { label: '🥈 シルバー演出テスト', words: 50000 },
    { label: '🥇 ゴールド演出テスト', words: 250000 },
    { label: '🏆 プラチナ演出テスト', words: 1000000 },
  ];

  const handleAddWords = (words: number) => {
    addWordsToReward(words);
  };

  const handleReset = () => {
    localStorage.removeItem('yomitore.reward.v2');
    window.location.reload();
  };

  const simulateStampCardComplete = () => {
    // スタンプカード完成時のコイン獲得をシミュレート
    addWordsToReward(2000);
    console.log('🎴 スタンプカード完成をシミュレート - コイン獲得!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 報酬獲得演出 */}
      <RewardEarnedFlash />
      <RewardFlashManager />
      
      <h1 className="text-3xl font-bold mb-6">RewardSystem テスト</h1>
      
      {/* 現在の状態表示 */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">現在の報酬状態</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>語数: {reward.words.toLocaleString()}</div>
          <div>スタンプ: {reward.stamps}/20</div>
          <div>コイン: {reward.coin}/5</div>
          <div>ブロンズ: {reward.bronze}/5</div>
          <div>シルバー: {reward.silver}/5</div>
          <div>ゴールド: {reward.gold}/4</div>
          <div>プラチナ: {reward.platinum}</div>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold mb-2">表示:</h3>
          <div className="text-lg">
            <RewardDisplay name="あなた" reward={reward} />
          </div>
        </div>
      </div>

      {/* カスタム語数追加 */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">カスタム語数追加</h2>
        <div className="flex gap-4 items-center">
          <input
            type="number"
            value={testWords}
            onChange={(e) => setTestWords(parseInt(e.target.value) || 0)}
            className="border rounded px-3 py-2 w-32"
            placeholder="語数"
          />
          <button
            onClick={() => handleAddWords(testWords)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            追加
          </button>
        </div>
      </div>

      {/* テストケース */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">テストケース</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {testCases.map((testCase, index) => (
            <button
              key={index}
              onClick={() => handleAddWords(testCase.words)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
            >
              {testCase.label}
            </button>
          ))}
        </div>
        
        {/* 特別テスト */}
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-3">特別テスト</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={simulateStampCardComplete}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm"
            >
              🎴 スタンプカード完成演出（コイン獲得）
            </button>
            
            {/* トロフィー演出専用テスト */}
            {trophyTestCases.map((testCase, index) => (
              <button
                key={index}
                onClick={() => {
                  // 現在の状態をリセットしてから該当トロフィーを獲得
                  localStorage.removeItem('yomitore.reward.v2');
                  setTimeout(() => {
                    handleAddWords(testCase.words);
                  }, 100);
                }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded hover:from-yellow-600 hover:to-orange-600 text-sm font-semibold"
              >
                {testCase.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 期待値テスト */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">期待値テスト</h2>
        <div className="space-y-2 text-sm">
          <div>✅ 2,000語 → 🪙×1</div>
          <div>✅ 10,000語 → 🥉×1</div>
          <div>✅ 60,000語 → 🥈×1 + 🥉×1</div>
          <div>✅ 1,000,000語 → 🏆×1 (他は全て0)</div>
        </div>
      </div>

      {/* リセット */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">リセット</h2>
        <button
          onClick={handleReset}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          データリセット
        </button>
      </div>
    </div>
  );
}