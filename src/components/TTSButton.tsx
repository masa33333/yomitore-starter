'use client';

import React, { useState, useRef } from 'react';

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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    
    // モバイル用デバッグ情報を追加
    setDebugInfo([
      `Device: ${isMobile ? 'Mobile' : 'Desktop'}`,
      `Platform: ${navigator.platform}`,
      `Text length: ${text.length}`,
      `Starting TTS request...`
    ]);

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

      // モバイル用デバッグ情報を更新
      setDebugInfo(prev => [...prev, 
        `API Response: ${response.status} ${response.statusText}`,
        `Success: ${response.ok}`
      ]);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🎵 TTS API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        const errorMessage = errorData.error || 
          `TTS生成に失敗しました (${response.status}: ${response.statusText})`;
        
        // モバイル用エラー情報を追加
        setDebugInfo(prev => [...prev, 
          `ERROR: ${errorMessage}`,
          `Error details: ${JSON.stringify(errorData)}`
        ]);
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);
      
      // 音声を自動再生（モバイル対応）
      if (audioRef.current) {
        audioRef.current.src = data.audioUrl;
        
        try {
          // モバイルでは自動再生が制限される場合があるため、ユーザーアクションが必要
          await audioRef.current.play();
          setIsPlaying(true);
          console.log('✅ Audio autoplay successful');
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
      
      // モバイル用最終エラー情報
      setDebugInfo(prev => [...prev, `FINAL ERROR: ${errorMessage}`]);
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
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio play error:', err);
        setError('音声の再生に失敗しました');
      }
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
    <div className="inline-block">
      {/* Main TTS Button */}
      {!audioUrl ? (
        <button
          onClick={generateAndPlayAudio}
          disabled={isLoading || !text.trim()}
          className={`${baseClasses} ${className} ${
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
        <button
          onClick={togglePlayPause}
          className={`${baseClasses} ${className} ${variantClasses[variant]}`}
          title={isPlaying ? "一時停止" : "再生する"}
        >
          {isPlaying ? "一時停止" : "再生する"}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Debug Info Display (for mobile debugging) */}
      {debugInfo.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-gray-500">Debug Info</summary>
          <div className="mt-1 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700">
            {debugInfo.map((info, index) => (
              <div key={index} className="mb-1">{info}</div>
            ))}
          </div>
        </details>
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