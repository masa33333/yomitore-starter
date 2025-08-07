'use client';

import React, { useState, useRef } from 'react';
import TTSButton from '@/components/TTSButton';
import { useAudioHighlighter } from '@/hooks/useAudioHighlighter';
import { tokenizeForReading } from '@/lib/tokenize';
import type { TimingsJSON } from '@/types/highlight';

export default function HighlightTestSimplePage() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTimings, setCurrentTimings] = useState<TimingsJSON | null>(null);
  
  const testText = 'Recently the progress of AI has been remarkable. Many researchers are working on this technology.';
  
  const { currentTimingIndex } = useAudioHighlighter(audioRef.current, currentTimings);
  
  // 🎯 FIXED: Use direct timing index instead of problematic mapping
  const highlightedTokenIndex = currentTimingIndex;

  const handleTTSGenerated = (data: { audioUrl: string; contentId: string; textHash: string; timings: TimingsJSON }) => {
    console.log('🔥 Simple Test TTS Generated:', {
      itemsCount: data.timings.items.length,
      source: data.timings.source
    });
    setCurrentTimings(data.timings);
  };

  const renderText = () => {
    const tokens = tokenizeForReading(testText);
    
    return tokens.map((token, index) => {
      if (token.isWord) {
        // 単語のみハイライト判定
        const isHighlighted = isAudioPlaying && index === highlightedTokenIndex;
        
        return (
          <span
            key={index}
            className={isHighlighted ? 'audio-highlight' : ''}
          >
            {token.text}
          </span>
        );
      } else {
        // スペースや句読点はそのまま表示
        return (
          <span key={index}>
            {token.text}
          </span>
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <audio ref={audioRef} preload="none" style={{ display: 'none' }} />
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔥 Simple Highlight Test</h1>
        
        <div className="mb-6">
          <TTSButton
            text={testText}
            contentId="simple-test"
            variant="primary"
            audioRef={audioRef}
            onPlayingChange={setIsAudioPlaying}
            onGenerated={handleTTSGenerated}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow text-lg leading-8">
          {renderText()}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Current timing index: {currentTimingIndex}</p>
          <p>Highlighted token index: {highlightedTokenIndex}</p>
          <p>Timings available: {currentTimings?.items?.length || 0} items</p>
          <p>Is audio playing: {isAudioPlaying ? 'Yes' : 'No'}</p>
          {currentTimings && (
            <p>Current word: "{currentTimings.items?.[currentTimingIndex]?.text || 'N/A'}"</p>
          )}
        </div>
      </div>
    </div>
  );
}