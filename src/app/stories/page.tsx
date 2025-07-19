'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { getGenerationLevelName } from '@/utils/getEnglishText';

// Supabaseクライアントの初期化は実際に必要な時だけ行う
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase環境変数が設定されていません - 静的データ使用');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

interface Story {
  slug: string;
  title: string;
}

export default function StoriesPage() {
  // 利用可能なストーリー一覧
  const [stories, setStories] = useState<Story[]>([
    { slug: 'notting-hill', title: 'ノッティングヒルの恋人 (Notting Hill)' },
    { slug: 'bucket-list', title: '最高の人生の見つけ方 (The Bucket List)' },
    { slug: 'river_stream/ep1', title: 'River Stream' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(3);
  const [showLevelSelector, setShowLevelSelector] = useState<boolean>(false);
  const [hasBookmark, setHasBookmark] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window === 'undefined') return; // サーバーサイドでは実行しない
    
    // 保存されたレベルを読み込み
    try {
      const savedLevel = localStorage.getItem('level') || localStorage.getItem('fixedLevel');
      if (savedLevel) {
        const levelNumber = Number(savedLevel);
        if (!isNaN(levelNumber) && levelNumber >= 1 && levelNumber <= 3) {
          setSelectedLevel(levelNumber);
        }
      }
    } catch (error) {
      console.error('語彙レベル読み込みエラー:', error);
    }

    // しおり確認
    const bookmarkData = localStorage.getItem('reading_bookmark');
    console.log('🔍 STORIES PAGE - Checking bookmark data:', {
      bookmarkData: bookmarkData,
      hasData: !!bookmarkData,
      length: bookmarkData?.length || 0
    });
    
    if (bookmarkData) {
      try {
        const bookmark = JSON.parse(bookmarkData);
        console.log('📖 Bookmark found on stories page:', bookmark);
        console.log('🔥 Setting hasBookmark to TRUE');
        setHasBookmark(true);
      } catch (error) {
        console.error('しおりデータ解析エラー:', error);
      }
    } else {
      console.log('❌ No bookmark data found');
      setHasBookmark(false);
    }

    // URL パラメータで resume モードをチェック
    const urlParams = new URLSearchParams(window.location.search);
    const resumeMode = urlParams.get('resume') === '1';
    if (resumeMode && bookmarkData) {
      console.log('🔄 Stories page: Resume mode detected, redirecting to reading...');
      const bookmark = JSON.parse(bookmarkData);
      window.location.href = `/reading?slug=${bookmark.slug}&level=${bookmark.level}&resume=1`;
    }
  }, []);

  // レベル変更処理
  const handleLevelChange = (newLevel: number) => {
    setSelectedLevel(newLevel);
    
    // localStorageに保存
    localStorage.setItem('level', newLevel.toString());
    localStorage.setItem('fixedLevel', newLevel.toString());
    localStorage.setItem('vocabLevel', newLevel.toString());
    localStorage.setItem('vocabularyLevel', newLevel.toString());
    
    console.log(`📊 ストーリーページ: レベル${newLevel}に設定`);
    setShowLevelSelector(false);
  };

  // 現在は静的データを使用しているためfetchStories関数は不要

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-active mx-auto mb-4"></div>
          <p className="text-text-secondary">ストーリーを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary-active text-white px-4 py-2 rounded-md hover:bg-primary-hover"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              タイトル一覧
            </h1>
            <p className="text-text-secondary">
              お好きなストーリーを選んで読書を始めましょう
            </p>
          </div>

          {/* 語彙レベル選択セクション */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-bold">
                語彙レベル：{getGenerationLevelName(selectedLevel)}
              </span>
              <button
                onClick={() => setShowLevelSelector(!showLevelSelector)}
                className="text-gray-800 hover:text-gray-600 underline text-sm"
              >
                レベル変更
              </button>
            </div>
            
            {/* レベル選択UI */}
            {showLevelSelector && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">語彙レベルを選択してください：</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { level: 1, label: '初級', description: '基本語彙のみ' },
                    { level: 2, label: '中級', description: '日常語彙' },
                    { level: 3, label: '上級', description: '幅広い語彙' }
                  ].map(({ level, label, description }) => (
                    <button
                      key={level}
                      onClick={() => handleLevelChange(level)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedLevel === level 
                          ? 'bg-[#FFB86C] text-[#1E1E1E]' 
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-bold">Lv.{level}</div>
                        <div className="text-xs">{label}</div>
                        <div className="text-xs opacity-75">{description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>


          {/* Resume ボタン */}
          {hasBookmark && (
            <div className="mb-6 text-center">
              <button
                onClick={() => {
                  const bookmarkData = localStorage.getItem('reading_bookmark');
                  if (bookmarkData) {
                    const bookmark = JSON.parse(bookmarkData);
                    window.location.href = `/reading?slug=${bookmark.slug}&level=${bookmark.level}&resume=1`;
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-md transition-colors"
              >
                📖 前回の続きを読む
              </button>
            </div>
          )}

          {/* ストーリーカード */}
          {stories.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <Link
                  key={story.slug}
                  href={`/reading?slug=${story.slug}&level=${selectedLevel}`}
                  className="group"
                >
                  <div className="bg-gray-100 rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-inactive rounded-full flex items-center justify-center mr-4">
                        <span className="text-2xl">📖</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary-active transition-colors">
                          {story.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                ストーリーがありません
              </h3>
              <p className="text-text-secondary mb-6">
                まだストーリーが登録されていません
              </p>
            </div>
          )}

          {/* 戻るボタン */}
          <div className="text-center mt-8">
            <Link
              href="/choose"
              className="inline-flex items-center px-6 py-3 bg-gray-200 text-text-primary rounded-md hover:bg-gray-300 transition-colors"
            >
              ← 戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}