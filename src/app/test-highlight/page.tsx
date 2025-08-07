'use client';

import React, { useState, useRef, useEffect } from 'react';
import TTSButton from '@/components/TTSButton';
import { useAudioHighlighter } from '@/hooks/useAudioHighlighter';
import { tokenizeForReading } from '@/lib/tokenize';
import { buildTimingToTokenMap } from '@/lib/align';
import { textFromTimings } from '@/lib/textFromTimings';
import type { TimingsJSON } from '@/types/highlight';

export default function TestHighlightPage() {
  // 🎵 音声ハイライト用の状態
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTimings, setCurrentTimings] = useState<TimingsJSON | null>(null);
  const [testText, setTestText] = useState<string>(
    'Yesterday I went to the beautiful park near my house. The weather was absolutely perfect for a long relaxing walk. I saw many colorful flowers blooming everywhere in the garden. Finally I bought some delicious ice cream from the vendor.'
  );
  const [logs, setLogs] = useState<string[]>([]);
  
  // 🎚️ オフセット調整機能
  const [offsetSec, setOffsetSec] = useState<number>(0);
  const [debugStats, setDebugStats] = useState<any>(null);

  // 🎯 ハイライト制御（オフセット対応）
  const { currentTimingIndex } = useAudioHighlighter(audioRef.current, currentTimings, offsetSec);
  
  // デバッグ: currentTimingsの変更を監視
  useEffect(() => {
    console.log('🚀🚀🚀 TEST PAGE: currentTimings changed:', {
      hasTimings: !!currentTimings,
      source: currentTimings?.source,
      model: currentTimings?.model,
      itemsCount: currentTimings?.items?.length,
      firstWordDuration: currentTimings?.items?.[0] ? 
        `${(currentTimings.items[0].end - currentTimings.items[0].start).toFixed(3)}s` : 'N/A'
    });
  }, [currentTimings]);
  
  // トークン配列とマッピング
  const tokens = tokenizeForReading(testText);
  const timingToTokenMap = currentTimings ? buildTimingToTokenMap(currentTimings, tokens) : new Map();
  
  // 現在のハイライト位置
  const highlightedTokenIndex = currentTimingIndex >= 0 && timingToTokenMap.has(currentTimingIndex) 
    ? timingToTokenMap.get(currentTimingIndex)! 
    : -1;

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  // 💾 localStorage によるオフセット保存・復元
  const contentId = 'highlight-test';
  const textHash = 'test-hash'; // 実際は generateTextHash(testText) を使用
  const offsetKey = `reading-offset:${contentId}:${textHash}`;

  useEffect(() => {
    // オフセット復元
    const savedOffset = localStorage.getItem(offsetKey);
    if (savedOffset) {
      const offset = Number(savedOffset);
      if (Number.isFinite(offset)) {
        setOffsetSec(offset);
        addLog(`🔄 Offset restored: ${offset.toFixed(2)}s`);
      }
    }
  }, [offsetKey]);

  useEffect(() => {
    // オフセット保存
    if (offsetSec !== 0) {
      localStorage.setItem(offsetKey, String(offsetSec));
    }
  }, [offsetSec, offsetKey]);

  // 🎯 rAF + スロットリングによるデバッグ情報更新
  const lastRenderRef = useRef(0);
  useEffect(() => {
    if (!isAudioPlaying || !audioRef.current) return;

    const updateDebugStats = (now: number) => {
      if (now - lastRenderRef.current >= 100) { // 100ms間隔
        // Basic debug info without getStats
        const stats = {
          currentTime: audioRef.current?.currentTime || 0,
          currentIndex: currentTimingIndex,
          timestamp: Date.now()
        };
        setDebugStats(stats);
        lastRenderRef.current = now;
      }
      
      if (isAudioPlaying) {
        requestAnimationFrame(updateDebugStats);
      }
    };

    const rafId = requestAnimationFrame(updateDebugStats);
    return () => cancelAnimationFrame(rafId);
  }, [isAudioPlaying, currentTimingIndex]);

  // 🎚️ オフセット制御
  const handleOffsetChange = (newOffset: number) => {
    setOffsetSec(newOffset);
    addLog(`🎚️ Offset adjusted: ${newOffset.toFixed(2)}s`);
  };

  const handleOffsetReset = () => {
    setOffsetSec(0);
    localStorage.removeItem(offsetKey);
    addLog(`🔄 Offset reset to 0.00s`);
  };

  // 🎵 TTS生成完了時のハンドラー
  const handleTTSGenerated = (data: { audioUrl: string; contentId: string; textHash: string; timings: TimingsJSON }) => {
    try {
      console.log('🟪🟪🟪 HANDLER CALLED (console.log): onGenerated received data with timings=' + (!!data.timings));
      addLog(`🟪🟪🟪 HANDLER CALLED: onGenerated received data with timings=${!!data.timings}`);
    if (data.timings && data.timings.items && data.timings.items.length > 0) {
      console.log(`🟪🟪🟪 TTS Generated: ${data.timings.granularity} mode, ${data.timings.items.length} items (${data.timings.source})`);
      console.log(`🟪🟪🟪 CALLING setCurrentTimings with:`, data.timings);
      setCurrentTimings(data.timings);
      console.log(`🟪🟪🟪 setCurrentTimings COMPLETED`);
      addLog(`🎵 TTS Generated: ${data.timings.granularity} mode, ${data.timings.items.length} items (${data.timings.source})`);
    } else {
      console.log(`🟪🟪🟪 TTS Generated but timings failed (items.length === 0) - creating fallback`);
      addLog(`⚠️ TTS Generated but timings failed (items.length === 0) - creating fallback`);
      // 緊急時のみフォールバック：API が完全に失敗した場合のみ
      createFallbackTimings();
    }
    
    if (audioRef.current) {
      audioRef.current.src = data.audioUrl;
      
      // 音声メタデータ読み込み後の処理：フォールバックの場合のみ実際の長さで調整
      const audio = audioRef.current;
      
      console.log(`🟥🟥🟥 AUDIO SETUP: src set, waiting for metadata...`);
      console.log(`🟥🟥🟥 DATA TIMINGS SOURCE: ${data.timings?.source || 'none'}`);
      addLog(`🟥🟥🟥 AUDIO SETUP: src set, waiting for metadata...`);
      addLog(`🟥🟥🟥 DATA TIMINGS SOURCE: ${data.timings?.source || 'none'}`);
      
      const handleLoadedMetadata = () => {
        console.log(`🔴🔴🔴 LOADEDMETADATA EVENT FIRED, duration: ${audio.duration?.toFixed(1) || 'unknown'}s`);
        addLog(`🔴🔴🔴 LOADEDMETADATA EVENT FIRED, duration: ${audio.duration?.toFixed(1) || 'unknown'}s`);
        
        if (audio.duration && !isNaN(audio.duration) && data.timings && data.timings.source === 'fallback') {
          const actualDuration = audio.duration;
          console.log(`🔴🔴🔴 ACTUAL AUDIO DURATION: ${actualDuration.toFixed(1)}s - adjusting fallback timings`);
          addLog(`🔴🔴🔴 ACTUAL AUDIO DURATION: ${actualDuration.toFixed(1)}s - adjusting fallback timings`);
          
          // フォールバックタイミングの場合、実際の音声長で再計算
          const words = testText.split(/\s+/).filter(w => w.trim());
          const timePerWord = actualDuration / words.length;
          
          console.log(`🔴🔴🔴 RECALCULATING: ${words.length} words, ${actualDuration.toFixed(1)}s, ${timePerWord.toFixed(3)}s per word`);
          addLog(`🔴🔴🔴 RECALCULATING: ${words.length} words, ${actualDuration.toFixed(1)}s, ${timePerWord.toFixed(3)}s per word`);
          
          const adjustedTimings: TimingsJSON = {
            granularity: 'word',
            items: words.map((word, i) => ({
              i,
              text: word,
              start: i * timePerWord,
              end: (i + 1) * timePerWord,
            })),
            source: 'fallback-adjusted', // ✅ 調整済みを示す新しいsource
            model: 'fallback-actual-duration',
            createdAt: new Date().toISOString(),
          };
          
          console.log(`🔴🔴🔴 CALLING setCurrentTimings with adjusted timings:`, adjustedTimings);
          console.log(`🔴🔴🔴 NEW SOURCE VALUE: "${adjustedTimings.source}" (should be "fallback-adjusted")`);
          setCurrentTimings(adjustedTimings);
          
          // 状態更新を確認するために短い遅延後にチェック
          setTimeout(() => {
            console.log(`🎯🎯🎯 VERIFICATION: React state updated successfully`);
            console.log(`🎯🎯🎯 currentTimings:`, { 
              hasTimings: !!currentTimings, 
              source: currentTimings?.source, 
              itemsLength: currentTimings?.items?.length,
              firstItem: currentTimings?.items?.[0]
            });
          }, 100);
          
          console.log(`🟢🟢🟢 SUCCESS: Adjusted timings applied: ${words.length} words, ${actualDuration.toFixed(1)}s total`);
          addLog(`🟢🟢🟢 SUCCESS: Adjusted timings applied: ${words.length} words, ${actualDuration.toFixed(1)}s total`);
        } else {
          console.log(`🟡🟡🟡 METADATA ADJUSTMENT SKIPPED: duration=${audio.duration?.toFixed(1)}, source=${data.timings?.source}`);
          addLog(`🟡🟡🟡 METADATA ADJUSTMENT SKIPPED: duration=${audio.duration?.toFixed(1)}, source=${data.timings?.source}`);
        }
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      
      // 既に読み込み済みの場合は即座に実行
      if (audio.readyState >= 1) {
        addLog(`🔵🔵🔵 AUDIO ALREADY LOADED, triggering metadata handler immediately`);
        handleLoadedMetadata();
      }
    }
    } catch (error) {
      console.error('🟥🟥🟥 FATAL ERROR in handleTTSGenerated:', error);
      addLog(`🟥🟥🟥 FATAL ERROR: ${error.message}`);
    }
  };

  const createFallbackTimings = (actualDuration?: number) => {
    // ⚠️ 緊急時のみ使用：API timings が完全に失敗した場合（items.length === 0）
    addLog(`⚠️ FALLBACK MODE: Creating uniform timings (API failed)`);
    
    const words = testText.split(/\s+/).filter(w => w.trim());
    
    let duration: number;
    if (actualDuration) {
      duration = actualDuration;
      addLog(`📊 Using actual duration: ${duration.toFixed(1)}s`);
    } else {
      // より速めの推定（OpenAI TTS-1は約200 WPM）
      const wordsPerSecond = 3.3; // 200 WPM ≈ 3.3 WPS
      duration = words.length / wordsPerSecond;
      addLog(`📊 Estimated duration: ${words.length} words, ${duration.toFixed(1)}s (200 WPM)`);
    }
    
    const timePerWord = duration / words.length;
    
    const fallbackTimings: TimingsJSON = {
      granularity: 'word',
      items: words.map((word, i) => ({
        i,
        text: word,
        start: i * timePerWord,
        end: (i + 1) * timePerWord,
      })),
      source: actualDuration ? 'fallback-adjusted' : 'fallback', // ✅ 実測値で調整済みか区別
      model: actualDuration ? 'fallback-actual' : 'fallback-estimated',
      createdAt: new Date().toISOString(),
    };
    
    setCurrentTimings(fallbackTimings);
    addLog(`🔧 ${actualDuration ? 'Adjusted' : 'Initial'} FALLBACK timings: ${words.length} words, ${duration.toFixed(1)}s`);
  };

  // 🎯 テキストレンダリング（ハイライト対応）
  const renderTestText = () => {
    return tokens.map((token, index) => {
      const isHighlighted = index === highlightedTokenIndex;
      const isWord = token.isWord;
      
      return (
        <span
          key={index}
          className={`${isWord ? 'tap-target' : ''} ${
            isHighlighted ? 'audio-highlight' : ''
          } ${isAudioPlaying && isWord ? 'cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: isHighlighted ? 'rgba(255, 230, 150, 0.8)' : 'transparent',
            transition: 'background-color 0.1s ease',
            padding: '0 1px',
            borderRadius: '2px',
            cursor: isAudioPlaying && isWord ? 'not-allowed' : 'default'
          }}
          onClick={() => {
            if (!isAudioPlaying && isWord) {
              addLog(`📝 Word clicked: "${token.text}"`);
            }
          }}
        >
          {token.text}
        </span>
      );
    });
  };

  // デバッグ情報の更新
  useEffect(() => {
    if (currentTimingIndex >= 0 && currentTimings) {
      const timingItem = currentTimings.items[currentTimingIndex];
      const tokenIndex = highlightedTokenIndex;
      const currentTime = audioRef.current?.currentTime || 0;
      addLog(`🎯 Highlight: timing[${currentTimingIndex}] → token[${tokenIndex}] "${timingItem?.text}" @${currentTime.toFixed(1)}s`);
    }
  }, [currentTimingIndex, highlightedTokenIndex]);

  // 診断情報のリアルタイム更新（再生中のみ）
  const [, forceUpdate] = useState({});
  useEffect(() => {
    if (isAudioPlaying) {
      const interval = setInterval(() => {
        forceUpdate({});
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isAudioPlaying]);

  const diagnosticInfo = {
    // 基本情報
    tokensCount: tokens.length,
    wordTokensCount: tokens.filter(t => t.isWord).length,
    timingsCount: currentTimings?.items?.length || 0,
    mappingSize: timingToTokenMap.size,
    
    // ハイライト状態
    currentTiming: currentTimingIndex,
    currentToken: highlightedTokenIndex,
    granularity: currentTimings?.granularity || 'none',
    
    // 音声情報 (デバッグ統計から取得)
    audioCurrentTime: debugStats?.currentTime?.toFixed(1) || audioRef.current?.currentTime?.toFixed(1) || '0.0',
    adjustedCurrentTime: debugStats?.adjustedCurrentTime?.toFixed(1) || '0.0',
    offsetSec: offsetSec.toFixed(2),
    audioDuration: audioRef.current?.duration?.toFixed(1) || '?',
    playbackRate: debugStats?.playbackRate?.toFixed(1) || audioRef.current?.playbackRate?.toFixed(1) || '1.0',
    
    // 同期精度
    currentWord: debugStats?.currentWord || '',
    drift: debugStats?.drift?.toFixed(1) || '0.0',
    
    // ハッシュ情報
    textHash: textHash,
    fallbackFlag: (currentTimings?.source === 'openai-transcribe') ? '✅ WHISPER' :
                  (currentTimings?.source === 'fallback-adjusted') ? '⚡ ADJUSTED' : 
                  (currentTimings?.source === 'fallback') ? '⚠️ FALLBACK' : '❓ UNKNOWN',
    
    // Phase 7品質評価用の詳細情報
    phase7Quality: {
      avgWordDuration: currentTimings?.items?.length > 0 ? 
        `${((currentTimings.items[currentTimings.items.length - 1]?.end || 0) / currentTimings.items.length).toFixed(3)}s` : 'N/A',
      totalDuration: currentTimings?.items?.length > 0 ? 
        `${(currentTimings.items[currentTimings.items.length - 1]?.end || 0).toFixed(1)}s` : 'N/A',
      wordsPerSecond: currentTimings?.items?.length > 0 && currentTimings.items[currentTimings.items.length - 1]?.end ? 
        `${(currentTimings.items.length / currentTimings.items[currentTimings.items.length - 1].end).toFixed(1)} WPS` : 'N/A',
      uniformTiming: currentTimings?.source === 'fallback-adjusted' ? 'YES (均等割り)' : 'NO'
    },
    
    // 対応精度
    mappingCoverage: currentTimings?.items?.length ? 
      `${timingToTokenMap.size}/${currentTimings.items.length} (${((timingToTokenMap.size / currentTimings.items.length) * 100).toFixed(1)}%)` : 
      'N/A'
  };

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${isAudioPlaying ? 'audio-playing' : ''}`}>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        preload="none"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">🎵 音声同期ハイライトテスト</h1>
        <p className="text-gray-600 mb-6">
          TTS音声生成→タイムスタンプ作成→ハイライト同期の完全テスト
        </p>

        {/* Test Text Input */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <label className="block font-medium mb-2">テストテキスト:</label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-3 border rounded-md resize-none h-20"
            placeholder="テスト用の英語テキストを入力してください..."
          />
        </div>

        {/* Controls */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-4 mb-4">
            <TTSButton
              text={testText}
              contentId="highlight-test"
              variant="primary"
              audioRef={audioRef}
              onPlayingChange={setIsAudioPlaying}
              onGenerated={(data) => {
                console.log('🟩🟩🟩 DIRECT CALLBACK TEST: onGenerated called with data:', data);
                console.log('🟩🟩🟩 DIRECT CALLBACK TEST: timings exists?', !!data.timings);
                console.log('🟩🟩🟩 DIRECT CALLBACK TEST: timings items count?', data.timings?.items?.length);
                try {
                  console.log('🟦🟦🟦 ABOUT TO CALL handleTTSGenerated');
                  handleTTSGenerated(data);
                  console.log('🟦🟦🟦 handleTTSGenerated CALL COMPLETED');
                } catch (error) {
                  console.error('🟥🟥🟥 ERROR in handleTTSGenerated:', error);
                  console.error('🟥🟥🟥 ERROR stack:', error.stack);
                }
              }}
            />
            
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                isAudioPlaying ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {isAudioPlaying ? '🔊 再生中' : '⏹️ 停止中'}
              </span>
              
              {currentTimings && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {currentTimings.granularity} モード ({currentTimings.model})
                </span>
              )}
              
              {audioRef.current && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  ⏱️ {audioRef.current.duration ? `${audioRef.current.duration.toFixed(1)}s` : '読込中'}
                </span>
              )}
            </div>
          </div>

          {/* Offset Adjustment Controls */}
          {currentTimings && (
            <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3">🎚️ オフセット微調整</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-blue-800">-0.5s</label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={offsetSec}
                    onChange={(e) => handleOffsetChange(Number(e.target.value))}
                    className="w-32"
                  />
                  <label className="text-sm font-medium text-blue-800">+0.5s</label>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-mono">
                    {offsetSec.toFixed(2)}s
                  </span>
                  <button
                    onClick={handleOffsetReset}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                音声の先頭無音やエンコード差による遅れ/先行を調整できます
              </p>
            </div>
          )}

          {/* Audio Playing Indicator */}
          {isAudioPlaying && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mb-4">
              <p className="text-yellow-700">
                🔊 <strong>音声再生中</strong> - 単語タップは無効化されています
              </p>
            </div>
          )}
        </div>

        {/* Highlighted Text Display */}
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="font-medium mb-3">ハイライト表示:</h2>
          <div className="text-lg leading-8 p-4 bg-gray-50 rounded border min-h-[100px]">
            {renderTestText()}
          </div>
        </div>

        {/* Diagnostic Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium mb-3">📊 診断情報</h2>
            <dl className="space-y-1 text-sm">
              {Object.entries(diagnosticInfo).filter(([key]) => key !== 'phase7Quality').map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-600">{key}:</dt>
                  <dd className="font-mono">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          
          {/* Phase 7 Quality Evaluation */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium mb-3">🎯 Phase 7 品質評価</h2>
            {diagnosticInfo.phase7Quality && (
              <dl className="space-y-1 text-sm">
                {Object.entries(diagnosticInfo.phase7Quality).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="text-gray-600">{key}:</dt>
                    <dd className="font-mono">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
        
        {/* Real-time Sync Analysis (during playback) */}
        {isAudioPlaying && currentTimings && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-yellow-900 mb-2">🎵 リアルタイム同期分析</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-yellow-700">現在の単語:</span>
                <div className="font-mono font-bold text-yellow-900">
                  {currentTimingIndex >= 0 && currentTimings.items[currentTimingIndex] ? 
                    `"${currentTimings.items[currentTimingIndex].text}"` : 'None'}
                </div>
              </div>
              <div>
                <span className="text-yellow-700">期待時間:</span>
                <div className="font-mono font-bold text-yellow-900">
                  {currentTimingIndex >= 0 && currentTimings.items[currentTimingIndex] ? 
                    `${currentTimings.items[currentTimingIndex].start.toFixed(1)}s - ${currentTimings.items[currentTimingIndex].end.toFixed(1)}s` : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-yellow-700">実際時間:</span>
                <div className="font-mono font-bold text-yellow-900">
                  {audioRef.current ? `${audioRef.current.currentTime.toFixed(1)}s` : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-yellow-700">ズレ:</span>
                <div className={`font-mono font-bold ${
                  Math.abs(parseFloat(debugStats?.drift || '0')) > 0.2 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {debugStats?.drift || '0.0'}s
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-yellow-600">
              💡 <strong>品質判定:</strong> ズレが±0.2秒以内なら良好、±0.5秒以内なら許容範囲、それ以上は要改善
            </div>
          </div>
        )}

        {/* Execution Logs */}
        <div className="mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium mb-3">📝 実行ログ</h2>
            <div className="h-40 overflow-y-auto bg-gray-50 p-2 rounded text-sm font-mono">
              {logs.length === 0 ? (
                <p className="text-gray-500">ログはここに表示されます...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">📋 テスト手順</h3>
          <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
            <li><strong>音声生成</strong>: 「音声を聞く」ボタンをクリック</li>
            <li><strong>ハイライト確認</strong>: 再生中に現在の単語が黄色になるか確認</li>
            <li><strong>タップ無効化</strong>: 再生中は単語クリックが効かないか確認</li>
            <li><strong>精度確認</strong>: 音声と視覚ハイライトの同期度合いを確認</li>
            <li><strong>速度変更</strong>: ⚙️ボタンで再生速度変更時の同期確認</li>
          </ol>
        </div>

        {/* Manual Supabase Setup Warning */}
        <div className="mt-6 bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-medium text-orange-900 mb-2">⚠️ 事前設定が必要</h3>
          <p className="text-orange-800 text-sm mb-2">
            完全動作には Supabase の <code>timings</code> バケット作成が必要です:
          </p>
          <ol className="text-orange-700 text-sm space-y-1 list-decimal list-inside ml-4">
            <li>Supabase Dashboard → Storage → Create Bucket: <code>timings</code></li>
            <li>SQL Editor で RLS ポリシー設定:
              <pre className="mt-1 p-2 bg-orange-100 rounded text-xs overflow-x-auto">
{`create policy "public can read timings"
on storage.objects for select to anon
using (bucket_id = 'timings');`}
              </pre>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}