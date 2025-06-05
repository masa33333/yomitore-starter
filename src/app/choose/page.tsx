// ✅ /choose/page.tsx（表現スタイルが選択式だった安定版）
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChoosePage() {
  const router = useRouter();
  const [theme, setTheme] = useState('');
  const [subTopic, setSubTopic] = useState('');
  const [style, setStyle] = useState('専門家の語り口');
  const [level, setLevel] = useState(7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('theme', theme);
    localStorage.setItem('subTopic', subTopic);
    localStorage.setItem('style', style);
    localStorage.setItem('level', level.toString());
    router.push('/reading');
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">読み物の条件を入力</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">1. テーマ（例：卑弥呼、iPhone、南極など）</label>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block font-semibold">2. 特に知りたいこと（任意）</label>
          <input
            value={subTopic}
            onChange={(e) => setSubTopic(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-semibold">3. 表現スタイル</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="専門家の語り口">専門家の語り口</option>
            <option value="中学生にもわかる語り口">中学生にもわかる語り口</option>
            <option value="物語風">物語風</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold">4. 語彙レベル（1〜7）</label>
          <input
            type="number"
            min={1}
            max={7}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded">
          今日の読み物を生成
        </button>
      </form>
    </main>
  );
}