'use client';

import { useEffect, useRef, useState } from 'react';
import { tokenizeForReading } from '@/lib/tokenize';

/**
 * モバイル専用ハイライトフック
 * OpenAIタイミングデータに依存せず、均等割りで確実に進行
 * setInterval基盤で安定動作、audio.currentTimeに依存しない独立システム
 */
export function useMobileHighlighter(
  audio: HTMLAudioElement | null,
  text: string,
  isAudioPlaying: boolean
) {
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [diagnostics, setDiagnostics] = useState<any>({});
  
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wordCountRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  
  // テキストから単語を抽出
  const tokens = tokenizeForReading(text);
  const words = tokens.filter(token => token.isWord);
  
  useEffect(() => {
    wordCountRef.current = words.length;
    console.log(`📱 MOBILE: ${words.length} words detected`);
  }, [words.length]);

  // 音声再生開始/停止の監視
  useEffect(() => {
    if (!audio) return;

    const handlePlay = () => {
      console.log('📱 MOBILE: Audio play detected');
      startTimeRef.current = Date.now();
      
      // 音声の長さを取得（推定値も使用）
      const audioDuration = audio.duration || estimateAudioDuration(text);
      durationRef.current = audioDuration;
      
      console.log(`📱 MOBILE: Duration=${audioDuration.toFixed(1)}s, Words=${wordCountRef.current}`);
      
      startHighlighting();
    };

    const handlePause = () => {
      console.log('📱 MOBILE: Audio paused');
      stopHighlighting();
    };

    const handleEnded = () => {
      console.log('📱 MOBILE: Audio ended');
      stopHighlighting();
      setCurrentWordIndex(-1);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      stopHighlighting();
    };
  }, [audio]);

  // 音声再生状態の変化に対応
  useEffect(() => {
    if (!isAudioPlaying) {
      stopHighlighting();
      setCurrentWordIndex(-1);
    }
  }, [isAudioPlaying]);

  const startHighlighting = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // 50ms間隔の高頻度更新（20fps）
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const duration = durationRef.current;
      const totalWords = wordCountRef.current;

      if (duration > 0 && totalWords > 0) {
        // 均等割りでの進行計算
        const progress = Math.min(elapsed / duration, 1.0);
        const wordIndex = Math.floor(progress * totalWords);
        const clampedIndex = Math.max(0, Math.min(wordIndex, totalWords - 1));

        // モバイル固有の先行調整（0.5秒早める）
        const adjustedProgress = Math.min((elapsed + 0.5) / duration, 1.0);
        const adjustedIndex = Math.floor(adjustedProgress * totalWords);
        const finalIndex = Math.max(0, Math.min(adjustedIndex, totalWords - 1));

        setCurrentWordIndex(finalIndex);

        // 診断情報更新（5回に1回）
        if (Math.random() < 0.2) {
          setDiagnostics({
            elapsed: elapsed.toFixed(1),
            duration: duration.toFixed(1),
            progress: (progress * 100).toFixed(1),
            wordIndex: finalIndex,
            totalWords,
            method: 'uniform-mobile'
          });

          console.log(`📱 MOBILE: ${elapsed.toFixed(1)}s/${duration.toFixed(1)}s → word ${finalIndex}/${totalWords}`);
        }
      }
    }, 50);
  };

  const stopHighlighting = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return {
    currentWordIndex,
    diagnostics,
    totalWords: words.length,
    words: words.map(token => token.text)
  };
}

/**
 * 音声長さの推定（audio.durationが取得できない場合のフォールバック）
 * 英語の平均的な読み上げ速度から推定
 */
function estimateAudioDuration(text: string): number {
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const wordsPerMinute = 180; // 平均的な英語読み上げ速度
  const duration = (words.length / wordsPerMinute) * 60;
  
  console.log(`📱 MOBILE: Estimated duration ${duration.toFixed(1)}s for ${words.length} words`);
  return duration;
}