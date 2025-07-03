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
    <div className={`mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-lg ${className}`}>
      <h2 className="mb-6 text-2xl font-bold text-gray-800">🎵 TTS Test Component</h2>
      
      {/* Text Input */}
      <div className="mb-4">
        <label htmlFor="tts-text" className="mb-2 block text-sm font-medium text-gray-700">
          Text to Convert to Speech:
        </label>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          className="w-full resize-none rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          rows={4}
          disabled={isLoading}
        />
        <div className="mt-1 text-sm text-gray-500">
          Character count: {text.length}
        </div>
      </div>

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={generateAudio}
          disabled={isLoading || !text.trim()}
          className={`w-full rounded-md px-4 py-3 font-medium transition-colors ${
            isLoading || !text.trim()
              ? 'cursor-not-allowed bg-gray-300 text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="mr-2 size-5 animate-spin rounded-full border-b-2 border-white"></div>
              Generating Audio...
            </div>
          ) : (
            '🎵 Generate Audio'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="shrink-0">
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
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">💾</span>
            <span className="text-sm text-green-700">Using cached audio file</span>
          </div>
        </div>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 text-lg font-medium text-gray-800">🔊 Generated Audio</h3>
          <audio
            controls
            className="w-full"
            src={audioUrl}
            preload="metadata"
          >
            Your browser does not support the audio element.
          </audio>
          
          {/* Audio URL Display */}
          <div className="mt-3 break-all rounded bg-gray-100 p-2 text-xs text-gray-600">
            <strong>Audio URL:</strong> {audioUrl}
          </div>
          
          {/* Download Link */}
          <div className="mt-2">
            <a
              href={audioUrl}
              download="generated-audio.mp3"
              className="inline-flex items-center px-3 py-1 text-sm text-blue-600 underline hover:text-blue-800"
            >
              📥 Download Audio
            </a>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-medium text-blue-800">💡 Instructions</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Enter any text in the textarea above</li>
          <li>• Click &quot;Generate Audio&quot; to create speech</li>
          <li>• The audio will be saved to Supabase Storage</li>
          <li>• Identical text will use cached audio files</li>
          <li>• Audio uses OpenAI TTS with &quot;alloy&quot; voice at 0.9x speed</li>
        </ul>
      </div>
    </div>
  );
}