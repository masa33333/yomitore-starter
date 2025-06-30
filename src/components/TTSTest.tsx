'use client';

import React, { useState } from 'react';

interface TTSTestProps {
  className?: string;
}

export default function TTSTest({ className = '' }: TTSTestProps) {
  const [text, setText] = useState('Hello! This is a test of the text-to-speech system. How does it sound?');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const generateAudio = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          contentId: 'test-' + Date.now()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);
      setIsCached(data.cached || false);
      
    } catch (err) {
      console.error('TTS Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🎵 TTS Test Component</h2>
      
      {/* Text Input */}
      <div className="mb-4">
        <label htmlFor="tts-text" className="block text-sm font-medium text-gray-700 mb-2">
          Text to Convert to Speech:
        </label>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
          disabled={isLoading}
        />
        <div className="text-sm text-gray-500 mt-1">
          Character count: {text.length}
        </div>
      </div>

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={generateAudio}
          disabled={isLoading || !text.trim()}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isLoading || !text.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating Audio...
            </div>
          ) : (
            '🎵 Generate Audio'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">❌</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Cache Status */}
      {isCached && audioUrl && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">💾</span>
            <span className="text-sm text-green-700">Using cached audio file</span>
          </div>
        </div>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-3">🔊 Generated Audio</h3>
          <audio
            controls
            className="w-full"
            src={audioUrl}
            preload="metadata"
          >
            Your browser does not support the audio element.
          </audio>
          
          {/* Audio URL Display */}
          <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-600 break-all">
            <strong>Audio URL:</strong> {audioUrl}
          </div>
          
          {/* Download Link */}
          <div className="mt-2">
            <a
              href={audioUrl}
              download="generated-audio.mp3"
              className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              📥 Download Audio
            </a>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Instructions</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Enter any text in the textarea above</li>
          <li>• Click "Generate Audio" to create speech</li>
          <li>• The audio will be saved to Supabase Storage</li>
          <li>• Identical text will use cached audio files</li>
          <li>• Audio uses OpenAI TTS with "alloy" voice at 0.9x speed</li>
        </ul>
      </div>
    </div>
  );
}