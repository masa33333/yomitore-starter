'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STORY_OPTIONS } from '@/lib/storyPrompt';
import { useLanguage } from '@/context/LanguageContext';
import CatLoader from '@/components/CatLoader';

export default function StoryFormPage() {
  const router = useRouter();
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

    // パラメータバリデーション
    const validGenre = genre && genre.trim() !== '' ? genre : null;
    const validTone = tone && tone.trim() !== '' ? tone : null;
    const validFeeling = feeling && feeling.trim() !== '' ? feeling : null;
    
    if (!validGenre || !validTone || !validFeeling) {
      setError('選択した値が正しくありません。再度選択してください。');
      setIsGenerating(false);
      return;
    }

    // ユーザーの語彙レベル（1-5）を取得
    const vocabLevel = Number(localStorage.getItem('vocabLevel')) || Number(localStorage.getItem('level')) || 3;
    
    try {
      // Generate story via API
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          genre: validGenre,
          mood: validFeeling, // Using 'mood' instead of 'feeling' as per spec
          tone: validTone,
          vocabLevel
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Save story data to localStorage
      if (data.storyData) {
        localStorage.setItem('generatedStories', JSON.stringify({
          [data.storyId]: data.storyData
        }));
        
        // Also save current story ID for easy access
        localStorage.setItem('currentStoryId', data.storyId);
      }

      // Redirect to reading page with story type and ID
      router.push(`/reading?type=story&id=${data.storyId}`);
      
    } catch (err) {
      console.error('Story generation failed:', err);
      setError(err instanceof Error ? err.message : 'ストーリー生成に失敗しました');
      setIsGenerating(false);
    }
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

        <div className="space-y-6">
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
              onClick={() => router.push('/choose')}
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