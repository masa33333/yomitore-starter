'use client';

import { useState } from 'react';
import { STORY_OPTIONS } from '@/lib/storyPrompt';
import { useLanguage } from '@/context/LanguageContext';
import CatLoader from '@/components/CatLoader';

export default function StoryFormPage() {
  const { displayLang } = useLanguage();
  const [genre, setGenre] = useState('');
  const [tone, setTone] = useState('');
  const [feeling, setFeeling] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateStory = async () => {
    if (!genre || !tone || !feeling) {
      setError('すべてのフィールドを選択してください');
      return;
    }

    setError('');
    setIsGenerating(true);

    // 🔧【修正】パラメータバリデーション - 空文字や null をチェック
    const validGenre = genre && genre.trim() !== '' ? genre : null;
    const validTone = tone && tone.trim() !== '' ? tone : null;
    const validFeeling = feeling && feeling.trim() !== '' ? feeling : null;
    
    console.log('🎭 【ストーリーフォーム】遷移前パラメータ検証:', { 
      validGenre, 
      validTone, 
      validFeeling 
    });
    
    if (!validGenre || !validTone || !validFeeling) {
      setError('選択した値が正しくありません。再度選択してください。');
      setIsGenerating(false);
      return;
    }

    // ユーザーの生成レベル（1-5）を取得
    const level = Number(localStorage.getItem('level')) || Number(localStorage.getItem('fixedLevel')) || 3;
    console.log('📊 Story-form: 生成レベル使用:', level);
    
    // localStorageにも保存（フォールバック用）
    localStorage.setItem('storyParams', JSON.stringify({
      genre: validGenre,
      tone: validTone,
      feeling: validFeeling,
      level
    }));
    
    // 🔧【修正】URLパラメータでgenre/tone/feelingを渡す
    const queryParams = new URLSearchParams({
      mode: 'story',
      genre: validGenre,
      tone: validTone,
      feeling: validFeeling,
      level: level.toString()
    });
    
    console.log('🎭 【ストーリーフォーム】遷移URL:', `/reading?${queryParams.toString()}`);
    
    // URLパラメータ付きで遷移
    window.location.href = `/reading?${queryParams.toString()}`;
  };

  // 表示言語に応じたラベル生成関数
  const getOptionLabel = (option: { ja: string; en: string }) => {
    return displayLang === 'ja' ? `${option.ja} – ${option.en}` : option.en;
  };

  // 表示言語に応じたUIテキスト取得関数
  const getUIText = (jaText: string, enText: string) => {
    return displayLang === 'ja' ? jaText : enText;
  };

  if (isGenerating) {
    return <CatLoader />;
  }

  return (
    <main className="p-4 max-w-2xl mx-auto bg-[#FFF9F4] min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">

        <h1 className="text-2xl font-bold mb-6 text-center text-[#1E1E1E]">
          Create Your Story
        </h1>

        {/* 機能無効化の通知 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <div className="text-yellow-400 mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-yellow-800 font-medium">機能一時停止中</h3>
              <p className="text-yellow-700 text-sm mt-1">
                この機能は現在メンテナンス中です。代わりに<strong>プリセットストーリー</strong>をご利用ください。
              </p>
            </div>
          </div>
        </div>

        {/* 戻るボタンを上に移動 */}
        <div className="text-center mb-6">
          <button
            onClick={() => window.location.href = '/choose'}
            className="bg-[#FFB86C] text-[#1E1E1E] px-6 py-3 rounded-md font-semibold hover:bg-[#e5a561] transition-colors"
          >
            ← 選択画面に戻る
          </button>
        </div>

        {/* フォームフィールドを一時的に非表示 */}
        <div className="space-y-6" style={{ display: 'none' }}>
          {/* Genre Selection */}
          <div>
            <label htmlFor="genre" className="block text-base font-medium text-[#1E1E1E] mb-2">
              {displayLang === 'ja' ? 'ジャンル' : 'Genre'}
            </label>
            <select
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-white text-[#1E1E1E] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB86C]"
              disabled={isGenerating}
            >
              <option value="">{getUIText('選択してください', 'Please select')}</option>
              {STORY_OPTIONS.genres.map((option) => (
                <option key={option.value} value={option.value}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </div>

          {/* Tone Selection */}
          <div>
            <label htmlFor="tone" className="block text-base font-medium text-[#1E1E1E] mb-2">
              {displayLang === 'ja' ? '雰囲気' : 'Tone'}
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-white text-[#1E1E1E] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB86C]"
              disabled={isGenerating}
            >
              <option value="">{getUIText('選択してください', 'Please select')}</option>
              {STORY_OPTIONS.tones.map((option) => (
                <option key={option.value} value={option.value}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </div>

          {/* Feeling Selection */}
          <div>
            <label htmlFor="feeling" className="block text-base font-medium text-[#1E1E1E] mb-2">
              {displayLang === 'ja' ? '読後感' : 'Aftertaste'}
            </label>
            <select
              id="feeling"
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              className="w-full bg-white text-[#1E1E1E] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB86C]"
              disabled={isGenerating}
            >
              <option value="">{getUIText('選択してください', 'Please select')}</option>
              {STORY_OPTIONS.feelings.map((option) => (
                <option key={option.value} value={option.value}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={handleGenerateStory}
              disabled={isGenerating || !genre || !tone || !feeling}
              className={`w-full px-6 py-3 rounded-md font-semibold transition-colors ${
                isGenerating
                  ? 'bg-gray-400 text-[#1E1E1E] cursor-not-allowed'
                  : 'bg-[#FFB86C] text-[#1E1E1E] hover:bg-[#e5a561] focus:outline-none focus:ring-2 focus:ring-[#FFB86C] focus:ring-offset-2'
              }`}
            >
              {isGenerating ? 'Generating Story...' : 'Generate Story'}
            </button>

          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => window.location.href = '/choose'}
              disabled={isGenerating}
              className="text-[#1E1E1E] hover:opacity-70 text-sm underline"
            >
              {getUIText('← 選択画面に戻る', '← Back to selection')}
            </button>
          </div>
        </div>
      </div>

    </main>
  );
}