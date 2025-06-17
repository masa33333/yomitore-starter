'use client';

import { useState } from 'react';

export default function DiaryCard({ diary }: { diary: any }) {
  const [showJP, setShowJP] = useState(false);
  
  // 詳細デバッグ用ログ
  console.log("📝 Diary全体:", diary);
  console.log("📝 diary.en:", diary?.en);
  console.log("📝 diary.jp:", diary?.jp);
  console.log("📝 diary.photoTier:", diary?.photoTier);
  
  if (diary?.en) {
    console.log("📝 diary.en.split('\\n\\n'):", diary.en.split('\n\n'));
    console.log("📝 diary.en の文字列表現:", JSON.stringify(diary.en));
    console.log("📝 diary.en に \\n\\n が含まれているか:", diary.en.includes('\n\n'));
  }
  
  if (diary?.jp) {
    console.log("📝 diary.jp.split('\\n\\n'):", diary.jp.split('\n\n'));
    console.log("📝 diary.jp の文字列表現:", JSON.stringify(diary.jp));
    console.log("📝 diary.jp に \\n\\n が含まれているか:", diary.jp.includes('\n\n'));
  }

  // データの存在確認とフォールバック
  if (!diary) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-md max-w-2xl mx-auto">
      <div className="text-sm text-gray-500 flex justify-between mb-2">
        <span>{diary.location || 'Unknown Location'}</span>
        <span>{diary.createdAt || 'Unknown Date'}</span>
      </div>

      {/* 英文と日本語訳（段落ごとに交互表示） */}
      <div className="mb-6">
        {diary.en ? (
          (() => {
            const enParagraphs = diary.en.split('\n\n').filter(p => p.trim() !== '');
            const jpParagraphs = diary.jp ? diary.jp.split('\n\n').filter(p => p.trim() !== '') : [];
            
            console.log("🔍 DiaryCard - enParagraphs:", enParagraphs);
            console.log("🔍 DiaryCard - jpParagraphs:", jpParagraphs);
            console.log("🔍 DiaryCard - showJP状態:", showJP);
            
            return enParagraphs.map((en, i) => (
              <div key={i} className="mb-4">
                <p className="text-lg text-gray-800">{en}</p>
                {showJP && jpParagraphs[i] && (
                  <p className="text-base text-gray-500 mt-1">{jpParagraphs[i]}</p>
                )}
              </div>
            ));
          })()
        ) : (
          <p className="text-lg leading-relaxed text-gray-800 font-medium mb-4">
            日記の内容を読み込み中...
          </p>
        )}
      </div>

      {/* photoTier に応じた画像表示 - "none"以外の場合のみ表示 */}
      {diary.photoTier && diary.photoTier !== "none" && (
        <div className="mb-6">
          <img 
            src="/images/stock_cat_diary.png" 
            alt="Cat diary illustration" 
            className="w-full h-auto rounded-md" 
          />
        </div>
      )}

      <button
        onClick={() => setShowJP(!showJP)}
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        日本語訳を見る
      </button>

    </div>
  );
}