'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import CatLoader from '@/components/CatLoader';

export default function ReadingFormPage() {
  const router = useRouter();
  const { displayLang } = useLanguage();
  const [topic, setTopic] = useState('');
  const [emotion, setEmotion] = useState('');
  const [style, setStyle] = useState('専門家がわかりやすく説明');
  const [isGenerating, setIsGenerating] = useState(false);

  // 表示テキストの定義
  const text = {
    title: {
      ja: '今日の読み物を作ろう',
      en: 'Let\'s Create Today\'s Reading!',
    },
    question1: {
      ja: '何について知りたい？',
      en: 'What do you want to learn about?',
    },
    placeholder: {
      ja: '例：チンギスハーン、火山の仕組み など',
      en: 'e.g., Genghis Khan, how volcanoes work',
    },
    emotionLabel: {
      ja: '得たい感情は？',
      en: 'What kind of feeling do you want?',
    },
    styleLabel: {
      ja: '表現スタイル',
      en: 'Expression Style',
    },
    generateButton: {
      ja: '読み物を生成する',
      en: 'Generate Reading',
    },
  };

  // 感情の選択肢定義
  const emotions = {
    ja: ['感動', '驚き', '笑い', 'ワクワク'],
    en: ['Moved', 'Surprised', 'Amused', 'Excited'],
  };

  // スタイルの選択肢定義
  const styles = {
    ja: [
      { value: '専門家がわかりやすく説明', label: '専門家がわかりやすく説明' },
      { value: '対話形式', label: '対話形式' },
      { value: '物語形式', label: '物語形式' },
    ],
    en: [
      { value: '専門家がわかりやすく説明', label: 'Explained by an expert in plain terms' },
      { value: '対話形式', label: 'Dialogue format' },
      { value: '物語形式', label: 'Narrative format' },
    ],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    const params = new URLSearchParams({
      type: 'reading',
      topic,
      emotion,
      style,
    });
    router.push(`/reading?${params.toString()}`);
  };

  if (isGenerating) {
    return <CatLoader />;
  }

  return (
    <div className="min-h-screen bg-[#FFF9F4] flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-[#1E1E1E] mb-6">{text.title[displayLang]}</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div>
          <label className="block text-[#1E1E1E] font-semibold mb-1">
            {text.question1[displayLang]}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder={text.placeholder[displayLang]}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#1E1E1E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB86C]"
          />
        </div>

        <div>
          <p className="block text-[#1E1E1E] font-semibold mb-1">{text.emotionLabel[displayLang]}</p>
          <div className="space-y-2">
            {emotions[displayLang].map((item, index) => {
              const value = emotions.ja[index]; // 値は日本語で統一
              return (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="emotion"
                    value={value}
                    checked={emotion === value}
                    onChange={() => setEmotion(value)}
                    required
                  />
                  <span className="text-[#1E1E1E]">{item}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[#1E1E1E] font-semibold mb-1">{text.styleLabel[displayLang]}</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#FFB86C]"
          >
            {styles[displayLang].map((styleOption) => (
              <option key={styleOption.value} value={styleOption.value}>
                {styleOption.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-[#FFB86C] hover:bg-[#e5a561] text-[#1E1E1E] font-semibold py-3 px-6 rounded-md transition"
        >
          {text.generateButton[displayLang]}
        </button>
      </form>
    </div>
  );
}
