'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateLetter } from '@/utils/generateLetter';
import { saveLetterToStorage } from '@/lib/letterStorage';
import CatMap from '@/components/CatMap';
import cities from '@/data/cities.json';
import { useTranslation } from '@/hooks/useTranslation';

export default function MapPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showIntro, setShowIntro] = useState(false);
  const [mapIntroShown, setMapIntroShown] = useState(true);

  // 都市座標（東京とソウル）- 地図上の正確な位置
  const cityCoordinates = {
    Tokyo: { x: '87%', y: '45%' }, // 日本列島中央（本州）の位置 - 視覚的に最適化
    Seoul: { x: '82%', y: '38%' }  // 朝鮮半島中央部（東京の左上）
  };

  useEffect(() => {
    // 初回ユーザー向けガイド表示判定
    const mapIntroShownValue = localStorage.getItem('mapIntroShown') === 'true';
    console.log('🗺️ Map intro check:', { mapIntroShown: mapIntroShownValue, willShow: !mapIntroShownValue });
    
    setMapIntroShown(mapIntroShownValue);
    
    if (!mapIntroShownValue) {
      console.log('✨ Showing map intro popup');
      setShowIntro(true);
      // 初回表示時はネコを東京（語数0）に配置
      localStorage.setItem('wordCount', '0');
      localStorage.setItem('lastCity', '東京');
    }

    const shouldGenerateLetter = () => {
      const visitedCities = JSON.parse(localStorage.getItem('visitedCities') || '[]');
      const lastCity = localStorage.getItem('lastCity');
      const generatedCities = JSON.parse(localStorage.getItem('generatedCities') || '[]');
      return lastCity && !generatedCities.includes(lastCity);
    };

    const generateAndSaveLetter = async () => {
      const lastCity = localStorage.getItem('lastCity');
      const vocabLevel = localStorage.getItem('vocabLevel') || 'B1';

      if (!lastCity) return;

      try {
        const letterText = await generateLetter(lastCity, vocabLevel);
        
        // Convert old letter format to new letter storage format
        const userLevel = parseInt(vocabLevel, 10);
        saveLetterToStorage({
          type: "letter",
          jp: "都市からの手紙です。", // You may want to generate Japanese content too
          en: {
            [userLevel]: letterText.body
          },
          city: lastCity
        });

        // 都市画像がすでに生成済みなら読み込む（またはあとで実装）
        const cityImage = localStorage.getItem(`cityImage:${lastCity}`) || '';
        localStorage.setItem('cityImage', cityImage);

        // 生成済都市を記録
        const generatedCities = JSON.parse(localStorage.getItem('generatedCities') || '[]');
        generatedCities.push(lastCity);
        localStorage.setItem('generatedCities', JSON.stringify(generatedCities));
      } catch (error) {
        console.error('手紙生成に失敗しました:', error);
      }
    };

    if (shouldGenerateLetter()) {
      generateAndSaveLetter();
    }
  }, []);

  const handleStartQuiz = () => {
    // localStorage に初回ガイド表示済みフラグを保存
    localStorage.setItem('mapIntroShown', 'true');
    setMapIntroShown(true);
    setShowIntro(false);
    // 語彙レベル判定画面に遷移
    router.push('/quiz');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* 初回ユーザー向けガイドオーバーレイ */}
      {showIntro && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl shadow-lg p-6 max-w-sm w-full mx-4 text-center">
            <div className="mb-4">
              <div className="space-y-3 text-white drop-shadow-lg">
                <p 
                  className="text-lg leading-relaxed font-bold"
                  dangerouslySetInnerHTML={{
                    __html: t('map_popup').replace(/\n/g, '<br/>')
                  }}
                />
                <p 
                  className="text-lg leading-relaxed font-bold"
                  dangerouslySetInnerHTML={{
                    __html: t('map_instruction').replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            </div>
            <button
              onClick={handleStartQuiz}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              {t('map_quiz_button')}
            </button>
          </div>
        </div>
      )}

      {/* 既存の地図表示 */}
      <CatMap mapIntroShown={mapIntroShown} />


      {/* 追加要素：ソウルの目的地アイコン */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 text-4xl fade-in"
        style={{
          left: cityCoordinates.Seoul.x,
          top: cityCoordinates.Seoul.y,
        }}
      >
        🎌
      </div>

      {/* 追加要素：東京→ソウルを結ぶ赤い点線 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          x1={cityCoordinates.Tokyo.x}
          y1={cityCoordinates.Tokyo.y}
          x2={cityCoordinates.Seoul.x}
          y2={cityCoordinates.Seoul.y}
          stroke="#ef4444"
          strokeWidth="3"
          strokeDasharray="10,5"
          className="opacity-80"
        />
      </svg>
    </div>
  );
}