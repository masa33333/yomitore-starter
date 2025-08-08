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
    console.log(`📱 MOBILE HOOK: ${words.length} words detected from text length ${text.length}`);
    console.log(`📱 MOBILE HOOK: Current state - audio:${!!audio}, isPlaying:${isAudioPlaying}, wordIndex:${currentWordIndex}`);
  }, [words.length, audio, isAudioPlaying, currentWordIndex]);

  // 音声再生開始/停止の監視
  useEffect(() => {
    if (!audio) return;

    const handlePlay = () => {
      console.log('📱 MOBILE: Audio play detected');
      
      let retryCount = 0;
      const maxRetries = 20; // 最大2秒待機（100ms × 20回）
      
      // 音声の長さを取得（推定値フォールバック付き）
      const waitForActualDuration = () => {
        if (audio.duration && audio.duration > 0 && !isNaN(audio.duration)) {
          // 実際の音声長さが取得できた場合
          console.log(`📱 MOBILE: Actual duration available: ${audio.duration.toFixed(1)}s`);
          durationRef.current = audio.duration;
          startTimeRef.current = Date.now();
          startHighlighting();
        } else if (retryCount < maxRetries) {
          // まだ取得できない場合は100ms後に再試行
          retryCount++;
          console.log(`📱 MOBILE: Duration not ready, retry ${retryCount}/${maxRetries}...`);
          setTimeout(waitForActualDuration, 100);
        } else {
          // 最大試行回数に達した場合は推定値を使用
          const estimatedDuration = estimateAudioDuration(text);
          console.log(`📱 MOBILE: Fallback to estimated duration: ${estimatedDuration.toFixed(1)}s`);
          durationRef.current = estimatedDuration;
          startTimeRef.current = Date.now();
          startHighlighting();
        }
      };
      
      // 即座に試行開始
      waitForActualDuration();
    };

    const handlePause = () => {
      console.log('📱 MOBILE: Audio paused');
      stopHighlighting();
      // 一時停止時はwordIndexをリセットしない（再開時に復活させるため）
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
      // 音声停止時はwordIndexをリセットしない（再開に備えて保持）
      console.log('📱 MOBILE: Audio playing state changed to false, highlighting stopped');
    }
  }, [isAudioPlaying]);

  const startHighlighting = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log('📱 MOBILE: Starting highlighting with params:', {
      duration: durationRef.current,
      totalWords: wordCountRef.current,
      startTime: startTimeRef.current
    });

    // パラメータ検証
    if (durationRef.current <= 0 || wordCountRef.current <= 0) {
      console.error('📱 MOBILE: Invalid parameters for highlighting:', {
        duration: durationRef.current,
        totalWords: wordCountRef.current
      });
      return;
    }

    // 初期状態設定（-1から0にリセット）
    setCurrentWordIndex(0);
    console.log('📱 MOBILE: Initial word index set to 0');

    // 50ms間隔の高頻度更新（20fps）
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const duration = durationRef.current;
      const totalWords = wordCountRef.current;

      if (duration > 0 && totalWords > 0) {
        // モバイル特化：シンプルな進行計算
        let rawProgress = elapsed / duration;
        
        // モバイル固有の先行調整（0.5秒早める）
        rawProgress = (elapsed + 0.5) / duration;
        
        // 進行度を0-1の範囲に制限
        const progress = Math.max(0, Math.min(rawProgress, 1.0));
        
        // 単語インデックス計算（確実に進行するよう調整）
        let wordIndex = Math.floor(progress * totalWords);
        
        // 初期段階（最初の5%）では強制的に進行
        if (elapsed > 1.0 && wordIndex === 0 && totalWords > 5) {
          wordIndex = Math.min(2, totalWords - 1); // 最低2語目まで進める
          console.log('📱 MOBILE: Force progress - moving to word 2');
        }
        
        // 最終インデックス
        const finalIndex = Math.max(0, Math.min(wordIndex, totalWords - 1));
        
        setCurrentWordIndex(finalIndex);

        // 診断情報更新（毎回更新に変更してデバッグ強化）
        setDiagnostics({
          elapsed: elapsed.toFixed(1),
          duration: duration.toFixed(1),
          progress: (progress * 100).toFixed(1),
          wordIndex: finalIndex,
          totalWords,
          method: 'mobile-simple'
        });

        // デバッグログ（頻度を上げる）
        if (Math.random() < 0.3) {
          console.log(`📱 MOBILE PROGRESS: ${elapsed.toFixed(1)}s/${duration.toFixed(1)}s → progress:${(progress*100).toFixed(1)}% → word ${finalIndex}/${totalWords}`);
        }
      } else {
        // duration/totalWordsが無効な場合のエラーログ
        console.error('📱 MOBILE ERROR: Invalid parameters:', {
          duration,
          totalWords,
          elapsed
        });
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