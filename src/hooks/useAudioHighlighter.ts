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
      
      // モバイル判定（1回だけ）
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator?.userAgent || '');
      
      // モバイル専用デバッグ（5回に1回だけ表示）
      if (isMobile && Math.random() < 0.2) {
        console.log(`📱 MOBILE DEBUG: audioTime=${audio.currentTime.toFixed(2)}s, offset=${offsetSec}s, adjustedTime=${currentTime.toFixed(2)}s`);
      }

      // 🎯 SIMPLE SEQUENTIAL: 順番通り進行（最も確実な方法）
      let foundIndex = currentTimingIndexRef.current;
      
      // 初期状態 + モバイル強制進行
      if (foundIndex < 0 && items.length > 0) {
        foundIndex = 0;
      }
      
      // モバイル専用: 音声開始後5秒経っても最初の単語にいる場合は強制進行
      if (isMobile && foundIndex === 0 && currentTime > 5.0 && items.length > 10) {
        foundIndex = Math.min(10, items.length - 1); // 10語目まで一気に進む
        console.log('📱 MOBILE FORCE JUMP: 初期停止を検出、10語目まで強制進行');
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
          if (isMobile) {
            // モバイル: 遅延がひどい場合は大幅ジャンプ
            let jumpSize = 2;
            const timeLag = currentTime - currentWord.end;
            if (timeLag > 3.0) jumpSize = 5; // 3秒以上遅れている場合は5語ジャンプ
            else if (timeLag > 1.5) jumpSize = 3; // 1.5秒以上遅れている場合は3語ジャンプ
            
            foundIndex = Math.min(foundIndex + jumpSize, items.length - 1);
            console.log(`📱 MOBILE JUMP: ${jumpSize}語ジャンプ (遅延: ${timeLag.toFixed(1)}s)`);
          } else {
            // Web版: 1語ずつ
            if (foundIndex < items.length - 1) {
              foundIndex++;
            }
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

      // モバイル対応：超高頻度で更新
      if (isMobile) {
        // モバイルでは8ms (125fps) の超高頻度タイマーで並行実行
        setTimeout(() => {
          if (!audio.paused && !audio.ended) {
            updateHighlight();
          }
        }, 8);
        // さらに16msタイマーも並行実行（ダブル監視）
        setTimeout(() => {
          if (!audio.paused && !audio.ended) {
            updateHighlight();
          }
        }, 16);
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
