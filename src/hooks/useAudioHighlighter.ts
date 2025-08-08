import { useEffect, useRef, useState } from 'react';
import { TimingsJSON } from '@/types/highlight';

// align.tsとの互換性のための型エイリアス
export type Timings = TimingsJSON;

/**
 * 音声再生時のテキストハイライト制御フック
 * currentTimeを監視し、現在のタイミングインデックスを返す
 * offsetSec: 音声の先頭無音や全体ズレを補正するオフセット（秒）
 */
export function useAudioHighlighter(
  audio: HTMLAudioElement | null,
  timings?: TimingsJSON,
  offsetSec: number = 0
) {
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const currentTimingIndexRef = useRef<number>(-1);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!audio || !timings?.items?.length) {
      setHighlightedIndex(-1);
      return;
    }

    const items = timings.items;

    const updateHighlight = () => {
      const currentTime = audio.currentTime + offsetSec;

      // 🎯 SIMPLE SEQUENTIAL: 順番通り進行（最も確実な方法）
      let foundIndex = currentTimingIndexRef.current;
      
      // 初期状態
      if (foundIndex < 0 && items.length > 0) {
        foundIndex = 0;
      }
      
      // 現在の単語の範囲をチェック
      if (foundIndex >= 0 && foundIndex < items.length) {
        const currentWord = items[foundIndex];
        
        // 現在の単語の時間内ならそのまま（モバイル対応で短縮）
        if (currentTime >= currentWord.start && currentTime <= currentWord.end + 0.05) {
          // 現在の単語継続
        } 
        // 現在の単語を超えた場合は積極的に次に進む（モバイル対応）
        else if (currentTime > currentWord.end + 0.05) {
          // 次の単語に進む（1個ずつ）
          if (foundIndex < items.length - 1) {
            foundIndex++;
          }
        }
        // 現在の単語より前の場合はそのまま（戻らない）
      }

      // インデックスが変化した場合のみUIを更新
      if (currentTimingIndexRef.current !== foundIndex) {
        const previousIndex = currentTimingIndexRef.current;
        const jump = foundIndex - previousIndex;
        
        // スキップ検出（1回だけログ）
        if (jump > 1) {
          console.log(`❌ SKIP DETECTED: [${previousIndex}]→[${foundIndex}] (${jump} steps) at ${currentTime.toFixed(3)}s`);
          if (previousIndex >= 0 && foundIndex < items.length) {
            const prevWord = items[previousIndex];
            const currWord = items[foundIndex];
            console.log(`  Previous: "${prevWord?.text}" (${prevWord?.start}s-${prevWord?.end}s)`);
            console.log(`  Current: "${currWord?.text}" (${currWord?.start}s-${currWord?.end}s)`);
            console.log(`  Time gap: ${currWord?.start - prevWord?.end}s`);
          }
        }
        
        currentTimingIndexRef.current = foundIndex;
        setHighlightedIndex(foundIndex);
      }

      rafRef.current = requestAnimationFrame(updateHighlight);
    };

    const handlePlay = () => {
      rafRef.current = requestAnimationFrame(updateHighlight);
    };

    const handlePauseOrEnded = () => {
      cancelAnimationFrame(rafRef.current);
    };

    const handleSeeked = () => {
      // シーク直後にハイライトを即時更新
      updateHighlight();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePauseOrEnded);
    audio.addEventListener('ended', handlePauseOrEnded);
    audio.addEventListener('seeked', handleSeeked);

    // 初期状態で再生中の場合に対応
    if (!audio.paused && !audio.ended) {
      rafRef.current = requestAnimationFrame(updateHighlight);
    }

    // クリーンアップ
    return () => {
      cancelAnimationFrame(rafRef.current);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePauseOrEnded);
      audio.removeEventListener('ended', handlePauseOrEnded);
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, [audio, timings, offsetSec]);

  return {
    currentTimingIndex: highlightedIndex,
  };
}

/**
 * フォールバック用：タイミングデータがない場合の均等割りハイライト
 */
export function useUniformHighlighter(
  audio: HTMLAudioElement | null,
  totalTokens: number,
  fallbackDuration?: number
) {
  const [currentTokenIndex, setCurrentTokenIndex] = useState<number>(-1);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!audio || totalTokens <= 0) return;

    const duration = audio.duration || fallbackDuration || 60;
    const timePerToken = duration / totalTokens;

    const updateHighlight = () => {
      const currentTime = audio.currentTime;
      const tokenIndex = Math.floor(currentTime / timePerToken);
      const clampedIndex = Math.max(-1, Math.min(tokenIndex, totalTokens - 1));

      if (clampedIndex !== currentTokenIndex) {
        setCurrentTokenIndex(clampedIndex);
      }

      rafRef.current = requestAnimationFrame(updateHighlight);
    };

    const handlePlay = () => {
      rafRef.current = requestAnimationFrame(updateHighlight);
    };

    const handlePauseOrEnded = () => {
      cancelAnimationFrame(rafRef.current);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePauseOrEnded);
    audio.addEventListener('ended', handlePauseOrEnded);

    if (!audio.paused && !audio.ended) {
      rafRef.current = requestAnimationFrame(updateHighlight);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePauseOrEnded);
      audio.removeEventListener('ended', handlePauseOrEnded);
    };
  }, [audio, totalTokens, fallbackDuration]); // 依存配列からcurrentTokenIndexを削除

  return currentTokenIndex;
}
