'use client';

import { useState } from 'react';

export default function GenerateDiaryPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [generatedDiary, setGeneratedDiary] = useState<any>(null);

  const generateFukuokaDiary = async () => {
    setIsGenerating(true);
    setStatus('福岡の日記を生成中...');

    try {
      // 1. ユーザーレベルを取得（デフォルト: B1）
      const getUserLevel = (): 'A1' | 'A2' | 'B1' | 'B2' => {
        const savedLevel = localStorage.getItem('userLevel');
        const validLevels = ['A1', 'A2', 'B1', 'B2'];
        return (savedLevel && validLevels.includes(savedLevel)) 
          ? (savedLevel as 'A1' | 'A2' | 'B1' | 'B2') 
          : 'B1';
      };

      const userLevel = getUserLevel();
      console.log('📚 Using user level:', userLevel);

      // 2. fetch APIエンドポイント経由で日記生成
      setStatus('APIエンドポイント呼び出し中...');
      const response = await fetch(`/api/claude-diary?id=fukuoka&level=${userLevel}`);
      
      if (!response.ok) {
        throw new Error(`API response error: ${response.status} ${response.statusText}`);
      }
      
      const diaryData = await response.json();
      console.log('📖 Generated diary:', diaryData);
      setStatus('日記をlocalStorageに保存中...');

      // 5. localStorageに保存
      const diaryToSave = {
        id: 'fukuoka',
        location: 'Fukuoka',
        createdAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        ...diaryData
      };

      localStorage.setItem('diary:fukuoka', JSON.stringify(diaryToSave));
      console.log('💾 Diary saved to localStorage:', diaryToSave);

      setGeneratedDiary(diaryToSave);
      setStatus('✅ 福岡の日記が正常に生成・保存されました！');

    } catch (error) {
      console.error('❌ Error generating diary:', error);
      setStatus(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          日記生成テスト
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">福岡の日記を生成</h2>
          
          <button
            onClick={generateFukuokaDiary}
            disabled={isGenerating}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              isGenerating
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isGenerating ? '生成中...' : '🏙️ 福岡の日記を生成'}
          </button>

          {status && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{status}</p>
            </div>
          )}
        </div>

        {generatedDiary && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">生成された日記</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800">英語版:</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{generatedDiary.en}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800">日本語版:</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{generatedDiary.jp}</p>
              </div>

              <div className="pt-4 border-t">
                <a
                  href="/letter?id=fukuoka"
                  className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  📮 手紙ページで確認
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}