'use client';

import React, { useState, useRef, useEffect } from 'react';

type PlaybackSpeed = 'slow' | 'normal' | 'fast';

interface TTSButtonProps {
  text: string;
  contentId: string;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export default function TTSButton({ 
  text, 
  contentId, 
  className = '', 
  variant = 'primary' 
}: TTSButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>('normal');
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 再生速度の倍率マップ
  const speedRates = {
    slow: 0.75,
    normal: 1.0,
    fast: 1.25
  };

  // 速度設定をlocalStorageから読み込み・保存
  useEffect(() => {
    const savedSpeed = localStorage.getItem('tts-playback-speed') as PlaybackSpeed;
    if (savedSpeed && Object.keys(speedRates).includes(savedSpeed)) {
      setPlaybackSpeed(savedSpeed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tts-playback-speed', playbackSpeed);
    // 現在再生中の音声にも即座に適用
    if (audioRef.current) {
      audioRef.current.playbackRate = speedRates[playbackSpeed];
    }
  }, [playbackSpeed]);

  // 外側クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSpeedSelector) {
        const target = event.target as Element;
        if (!target.closest('.speed-selector-container')) {
          setShowSpeedSelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpeedSelector]);

  const generateAndPlayAudio = async () => {
    if (!text.trim()) {
      setError('再生するテキストがありません');
      return;
    }

    // モバイル環境チェック
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const deviceInfo = { 
      isMobile, 
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      textLength: text.length
    };
    
    console.log('📱 Device info:', deviceInfo);

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎵 TTS API call starting:', { 
        textLength: text.length, 
        contentId, 
        apiUrl: '/api/tts' 
      });

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          contentId: contentId
        }),
      });

      console.log('🎵 TTS API response:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🎵 TTS API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        const errorMessage = errorData.error || 
          `TTS生成に失敗しました (${response.status}: ${response.statusText})`;
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);
      
      // 音声を自動再生（モバイル対応）
      if (audioRef.current) {
        audioRef.current.src = data.audioUrl;
        // 再生速度を設定
        audioRef.current.playbackRate = speedRates[playbackSpeed];
        
        try {
          // モバイルでは自動再生が制限される場合があるため、ユーザーアクションが必要
          await audioRef.current.play();
          setIsPlaying(true);
          console.log('✅ Audio autoplay successful at', speedRates[playbackSpeed] + 'x speed');
        } catch (playError) {
          console.warn('⚠️ Autoplay failed (expected on mobile):', playError);
          // モバイルでは自動再生が失敗することが正常なので、エラーにはしない
          console.log('📱 Please tap the play button to start audio');
        }
      }
      
    } catch (err) {
      console.error('TTS Error:', err);
      const errorMessage = err instanceof Error ? err.message : '音声生成でエラーが発生しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        // 再生速度を設定してから再生
        audioRef.current.playbackRate = speedRates[playbackSpeed];
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio play error:', err);
        setError('音声の再生に失敗しました');
      }
    }
  };

  const changeSpeed = (newSpeed: PlaybackSpeed) => {
    setPlaybackSpeed(newSpeed);
    setShowSpeedSelector(false);
  };

  const getSpeedLabel = (speed: PlaybackSpeed) => {
    switch (speed) {
      case 'slow': return '遅い (0.75x)';
      case 'normal': return '普通 (1.0x)';
      case 'fast': return '速い (1.25x)';
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = () => {
    setError('音声ファイルの読み込みに失敗しました');
    setIsPlaying(false);
  };

  const baseClasses = "inline-flex items-center rounded-md font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-primary-inactive text-text-primary hover:opacity-80 focus:ring-primary-inactive",
    secondary: "bg-primary-inactive text-text-primary hover:opacity-80 focus:ring-primary-inactive"
  };

  const disabledClasses = "bg-gray-300 text-gray-500 cursor-not-allowed";

  return (
    <div className="inline-block relative speed-selector-container">
      {/* Main TTS Button */}
      <div className="flex items-center gap-2">
        {!audioUrl ? (
          <button
            onClick={generateAndPlayAudio}
            disabled={isLoading || !text.trim()}
            className={`${baseClasses} px-4 py-2 ${
              isLoading || !text.trim() 
                ? disabledClasses 
                : variantClasses[variant]
            }`}
            title="音声を生成して再生"
          >
            {isLoading ? (
              <>
                <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-current"></div>
                生成中...
              </>
            ) : (
              <>
                音声を聞く
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={togglePlayPause}
              className={`${baseClasses} px-4 py-2 ${variantClasses[variant]}`}
              title={isPlaying ? "一時停止" : `再生する (${getSpeedLabel(playbackSpeed)})`}
            >
              {isPlaying ? "一時停止" : "再生する"}
            </button>
            
            {/* Speed Selector Button */}
            <button
              onClick={() => setShowSpeedSelector(!showSpeedSelector)}
              className={`${baseClasses} px-2 py-2 text-sm ${variantClasses[variant]} ${
                showSpeedSelector ? 'bg-opacity-80' : ''
              }`}
              title="再生速度を変更"
            >
              ⚙️
            </button>
          </>
        )}
      </div>

      {/* Speed Selector Dropdown */}
      {showSpeedSelector && audioUrl && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
          <div className="py-1">
            {Object.keys(speedRates).map((speed) => (
              <button
                key={speed}
                onClick={() => changeSpeed(speed as PlaybackSpeed)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                  playbackSpeed === speed ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                {getSpeedLabel(speed as PlaybackSpeed)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}


      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="none"
        style={{ display: 'none' }}
      />
    </div>
  );
}