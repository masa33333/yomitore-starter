// ✅ /reading/page.tsx（英語を常時表示 + 日本語はボタンで表示 + 見出し削除）
'use client';

import { useEffect, useState } from 'react';

export default function ReadingPage() {
  const [loading, setLoading] = useState(true);
  const [japanese, setJapanese] = useState('');
  const [english, setEnglish] = useState('');
  const [showJapanese, setShowJapanese] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/generate-reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme: localStorage.getItem('theme') || '',
            subTopic: localStorage.getItem('subTopic') || '',
            style: localStorage.getItem('style') || '',
            level: Number(localStorage.getItem('level')) || 7,
          }),
        });

        const data = await res.json();
        setJapanese(data.japanese);
        setEnglish(data.english);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="p-4">
      {loading ? (
        <p>生成中です...</p>
      ) : (
        <>
          <h1 className="text-xl font-bold mb-4">📘 今日の読み物</h1>

          <div className="mb-4 whitespace-pre-wrap text-gray-800">
            <p>{english}</p>
          </div>

          <button
            onClick={() => setShowJapanese(!showJapanese)}
            className="bg-gray-200 px-4 py-2 rounded mb-4"
          >
            {showJapanese ? '日本語訳を隠す' : '日本語訳を表示'}
          </button>

          {showJapanese && (
            <div className="whitespace-pre-wrap text-gray-700">
              <p>{japanese}</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
