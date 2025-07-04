'use client';

import { useState } from 'react';

export default function TestTTSPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  const testTTS = async () => {
    setLoading(true);
    
    // デバイス情報を表示（webkitAudioContextチェックを削除）
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      hasAudioContext: typeof AudioContext !== 'undefined',
      timestamp: new Date().toISOString()
    };
    
    setResult(`📱 Device Info:\n${JSON.stringify(deviceInfo, null, 2)}\n\n🔄 Testing TTS...`);
    
    try {
      const response = await fetch('/api/test-tts');
      
      if (response.ok) {
        // 音声ファイルのURLを作成
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        
        // 音声を再生
        const audio = new Audio(audioUrl);
        audio.play();
        
        setResult('✅ TTS Test Success! Audio should be playing.');
      } else {
        const errorData = await response.json();
        setResult(`❌ TTS Test Failed: ${JSON.stringify(errorData, null, 2)}`);
      }
    } catch (error: any) {
      setResult(`❌ Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">TTS Test Page</h1>
      
      <div className="mb-6">
        <button
          onClick={testTTS}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test TTS'}
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Test Result:</h2>
        <pre className="whitespace-pre-wrap text-sm">{result}</pre>
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">This test checks:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>TTS_VOICE environment variable loading</li>
          <li>OpenAI API key accessibility</li>
          <li>OpenAI TTS API connectivity</li>
          <li>Audio generation and playback</li>
        </ul>
      </div>
    </div>
  );
}