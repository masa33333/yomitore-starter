'use client';

import { useState } from 'react';

interface TravelResponse {
  english: string;
  type: string;
  level: number;
  location: string;
  activity: string;
  emotion: string;
  catName: string;
  wordCount: number;
  targetWordRange: string;
  vocabularyCheck?: {
    isCompliant: boolean;
    forbiddenWords: string[];
    complianceRate: number;
  };
}

export default function TravelTestPage() {
  const [response, setResponse] = useState<TravelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォーム状態
  const [level, setLevel] = useState(3);
  const [type, setType] = useState<'letter' | 'mail'>('letter');
  const [location, setLocation] = useState('Tokyo');
  const [activity, setActivity] = useState('visiting temples');
  const [emotion, setEmotion] = useState('excited');
  const [catName, setCatName] = useState('ミケ');

  const generateTravelContent = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const requestBody = {
        level,
        type,
        location,
        activity,
        emotion,
        catName
      };

      console.log('Sending request:', requestBody);

      const res = await fetch('/api/travel/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🐱 Travel Mail/Letter Generator Test</h1>
      
      {/* 設定パネル */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Generation Settings</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Level</label>
            <select 
              value={level} 
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value={1}>Level 1 (A1)</option>
              <option value={2}>Level 2 (A2)</option>
              <option value={3}>Level 3 (B1)</option>
              <option value={4}>Level 4 (B2)</option>
              <option value={5}>Level 5 (C1+)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as 'letter' | 'mail')}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="letter">Letter (手紙)</option>
              <option value="mail">Mail (メール)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input 
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g., Tokyo, Paris"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Activity</label>
            <input 
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g., exploring, eating"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Emotion</label>
            <input 
              type="text"
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g., happy, excited"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Cat Name</label>
          <input 
            type="text"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="e.g., ミケ, タマ"
          />
        </div>

        <button
          onClick={generateTravelContent}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Generating...' : `Generate ${type}`}
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 結果表示 */}
      {response && (
        <div className="space-y-6">
          {/* 生成されたコンテンツ */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Generated {response.type}</h3>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                {response.english}
              </div>
            </div>
          </div>

          {/* メタデータ */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Generation Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Type:</strong> {response.type}</div>
              <div><strong>Level:</strong> {response.level}</div>
              <div><strong>Location:</strong> {response.location}</div>
              <div><strong>Activity:</strong> {response.activity}</div>
              <div><strong>Emotion:</strong> {response.emotion}</div>
              <div><strong>Cat Name:</strong> {response.catName}</div>
              <div><strong>Word Count:</strong> {response.wordCount}</div>
              <div><strong>Target Range:</strong> {response.targetWordRange}</div>
            </div>
          </div>

          {/* Level 3語彙チェック */}
          {response.vocabularyCheck && (
            <div className={`border rounded-lg p-6 ${
              response.vocabularyCheck.isCompliant 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Level 3 Vocabulary Check</h3>
              <div className="space-y-2">
                <div>
                  <strong>Compliance:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    response.vocabularyCheck.isCompliant 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {response.vocabularyCheck.isCompliant ? '✅ Compliant' : '⚠️ Violations Found'}
                  </span>
                </div>
                <div><strong>Compliance Rate:</strong> {response.vocabularyCheck.complianceRate}%</div>
                {response.vocabularyCheck.forbiddenWords.length > 0 && (
                  <div>
                    <strong>Forbidden Words Found:</strong>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {response.vocabularyCheck.forbiddenWords.map((word, index) => (
                        <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}