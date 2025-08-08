'use client';

import React from 'react';
import { tokenizeForReading } from '@/lib/tokenize';

interface MobileHighlightedTextProps {
  text: string;
  currentWordIndex: number;
  isAudioPlaying: boolean;
  onWordClick?: (word: string) => void;
  className?: string;
}

/**
 * モバイル専用のハイライト表示コンポーネント
 * Web版とは独立したシンプルで確実な表示システム
 */
export default function MobileHighlightedText({
  text,
  currentWordIndex,
  isAudioPlaying,
  onWordClick,
  className = ''
}: MobileHighlightedTextProps) {
  
  const tokens = tokenizeForReading(text);
  let wordIndex = 0;

  const handleWordClick = (word: string) => {
    if (!isAudioPlaying && onWordClick) {
      onWordClick(word);
    }
  };

  return (
    <div className={`mobile-highlighted-text ${className}`}>
      {tokens.map((token, tokenIndex) => {
        if (token.isWord) {
          const isCurrentWord = wordIndex === currentWordIndex;
          const currentWordIdx = wordIndex;
          wordIndex++;

          return (
            <span
              key={tokenIndex}
              className={`
                clickable-word cursor-pointer 
                ${isCurrentWord && isAudioPlaying ? 'mobile-audio-highlight' : ''} 
                ${isAudioPlaying ? 'cursor-not-allowed' : 'hover:bg-yellow-200/50'}
              `}
              style={{
                backgroundColor: isCurrentWord && isAudioPlaying 
                  ? 'rgba(255, 255, 0, 0.6)' // より強めの黄色
                  : 'transparent',
                color: isCurrentWord && isAudioPlaying ? '#000' : 'inherit',
                fontWeight: isCurrentWord && isAudioPlaying ? 'bold' : 'inherit',
                borderRadius: '2px',
                padding: '1px 2px',
                transition: 'all 0.1s ease',
                display: 'inline-block',
                minWidth: '1ch'
              }}
              onClick={() => handleWordClick(token.text)}
              data-word-index={currentWordIdx}
              data-word={token.text}
            >
              {token.text}
            </span>
          );
        } else {
          // スペースや句読点はそのまま表示
          return (
            <span key={tokenIndex} className="token-space">
              {token.text}
            </span>
          );
        }
      })}
    </div>
  );
}