'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReadingFormPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [emotion, setEmotion] = useState('');
  const [style, setStyle] = useState('会話調');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      topic,
      emotion,
      style,
    });
    router.push(`/reading?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold mb-6">今日の読み物を作ろう</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            何について知りたい？
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="例：チンギスハーン、火山の仕組み など"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <p className="block text-gray-700 font-semibold mb-1">得たい感情は？</p>
          <div className="space-y-2">
            {['感動', '驚き', '笑い', 'ワクワク'].map((item) => (
              <label key={item} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="emotion"
                  value={item}
                  checked={emotion === item}
                  onChange={() => setEmotion(item)}
                  required
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">スタイル</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option>会話調</option>
            <option>日記風</option>
            <option>論説風</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          読み物を生成する
        </button>
      </form>
    </div>
  );
}
