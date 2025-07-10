'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Story {
  slug: string;
  title: string;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchStories();
  }, []);

  async function fetchStories() {
    try {
      setLoading(true);
      
      // Level 1で代表取得（タイトル一覧のため）
      const { data, error } = await supabase
        .from('stories')
        .select('slug, title')
        .eq('level', 1)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabaseからの取得に失敗、フォールバックストーリーを使用:', error);
        // Supabaseが利用できない場合のフォールバックストーリー
        const fallbackStories = [
          {
            slug: 'notting-hill',
            title: 'Notting Hill'
          }
        ];
        setStories(fallbackStories);
        setLoading(false);
        return;
      }

      setStories(data || []);
    } catch (err) {
      console.error('ストーリー取得エラー:', err);
      console.log('フォールバックストーリーを使用します');
      
      // エラー時もフォールバックストーリーを表示
      const fallbackStories = [
        {
          slug: 'notting-hill',
          title: 'Notting Hill'
        }
      ];
      setStories(fallbackStories);
    } finally {
      setLoading(false);
    }
  }

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
            onClick={fetchStories}
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
              📚 ストーリー一覧
            </h1>
            <p className="text-text-secondary">
              お好きなストーリーを選んで読書を始めましょう
            </p>
          </div>

          {/* ストーリーカード */}
          {stories.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <Link
                  key={story.slug}
                  href={`/reading?slug=${story.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 border border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-primary-inactive rounded-full flex items-center justify-center mr-4">
                        <span className="text-2xl">📖</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary-active transition-colors">
                          {story.title}
                        </h3>
                        <p className="text-text-secondary text-sm">
                          レベル別対応
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-primary-active font-medium">
                        読む →
                      </span>
                      <div className="flex space-x-1">
                        {[1, 2, 3].map((level) => (
                          <span
                            key={level}
                            className={`w-2 h-2 rounded-full ${
                              level <= 3 ? 'bg-primary-active' : 'bg-gray-300'
                            }`}
                          />
                        ))}
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