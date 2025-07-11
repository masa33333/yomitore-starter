'use client';

import { useState } from 'react';

export default function DebugTranslationPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTranslation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, sourceLang: 'ja', targetLang: 'en' })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const testWikipedia = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/wikipedia-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, language: 'en' })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">翻訳・Wikipedia検索デバッグ</h1>
      
      <div className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="テスト用テキストを入力（例: ブルガリの歴史）"
          className="w-full p-3 border rounded"
        />
        
        <div className="flex gap-4">
          <button
            onClick={testTranslation}
            disabled={loading || !input}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            翻訳テスト
          </button>
          
          <button
            onClick={testWikipedia}
            disabled={loading || !input}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Wikipedia検索テスト
          </button>
        </div>
        
        {loading && <p>処理中...</p>}
        
        {result && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">結果:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}