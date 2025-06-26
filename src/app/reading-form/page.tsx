'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import CatLoader from '@/components/CatLoader';

export default function ReadingFormPage() {
  const router = useRouter();
  const { displayLang } = useLanguage();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 表示テキストの定義
  const text = {
    title: {
      ja: '今日の読み物を作ろう',
      en: 'Let\'s Create Today\'s Reading!',
    },
    question1: {
      ja: '知りたいテーマ',
      en: 'What topic would you like to learn about?',
    },
    placeholder: {
      ja: '例：コーヒー、火山の仕組み、チンギスハーン など',
      en: 'e.g., Coffee, How volcanoes work, Genghis Khan',
    },
    generateButton: {
      ja: '生成',
      en: 'Generate',
    },
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    const params = new URLSearchParams({
      mode: 'reading',
      topic,
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
          <label className="block text-[#1E1E1E] font-semibold mb-2">
            {text.question1[displayLang]}
          </label>
          <input
            type="text"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder={text.placeholder[displayLang]}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-[#1E1E1E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB86C]"
          />
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
