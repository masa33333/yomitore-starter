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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateAndPlayAudio = async () => {
    if (!text.trim()) {
      setError('再生するテキストがありません');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'TTS生成に失敗しました');
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);
      
      // 音声を自動再生
      if (audioRef.current) {
        audioRef.current.src = data.audioUrl;
        await audioRef.current.play();
        setIsPlaying(true);
      }
      
    } catch (err) {
      console.error('TTS Error:', err);
      setError(err instanceof Error ? err.message : '音声生成でエラーが発生しました');
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