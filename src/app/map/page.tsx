'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateLetter } from '@/utils/generateLetter';
import { saveLetterToStorage } from '@/lib/letterStorage';
import { useTranslation } from '@/hooks/useTranslation';
import { getCurrentMapImage, getFallbackMapImage, getCurrentCity } from '@/utils/mapImageUtils';

export default function MapPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showIntro, setShowIntro] = useState(false);
  const [mapIntroShown, setMapIntroShown] = useState(true);
  const [currentMapImage, setCurrentMapImage] = useState<string>('/images/map/tokyo-seoul.png');
  const [totalWords, setTotalWords] = useState<number>(0);
  const [showDestination, setShowDestination] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    // Get total words read from localStorage
    const storedTotalWords = parseInt(localStorage.getItem('totalWordsRead') || '0', 10);
    setTotalWords(storedTotalWords);
    
    // Set current map image based on progress
    const mapImage = getCurrentMapImage(storedTotalWords);
    setCurrentMapImage(mapImage);
    
    // Check if this is first visit (vocabLevel not set or quiz not completed)
    const vocabLevel = localStorage.getItem('vocabLevel');
    const quizCompleted = localStorage.getItem('quizCompleted') === 'true';
    setIsFirstVisit(!vocabLevel || !quizCompleted);
    
    // 初回ユーザー向けガイド表示判定
    const mapIntroShownValue = localStorage.getItem('mapIntroShown') === 'true';
    console.log('🗺️ Map intro check:', { mapIntroShown: mapIntroShownValue, willShow: !mapIntroShownValue });
    console.log('📊 Current progress:', { totalWords: storedTotalWords, mapImage });
    
    setMapIntroShown(mapIntroShownValue);
    
    if (!mapIntroShownValue) {
      console.log('✨ Showing map intro popup');
      setShowIntro(true);
      // 初回表示時はネコを東京（語数0）に配置
      localStorage.setItem('totalWordsRead', '0');
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

    // 1秒後に目的地表示をフェードイン
    const destinationTimer = setTimeout(() => {
      setShowDestination(true);
    }, 1000);

    return () => {
      clearTimeout(destinationTimer);
    };
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

      {/* 目的地表示ポップアップ */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-40">
        <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-6 py-3 border border-gray-200 transition-all duration-1000 ${
          showDestination ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
        }`}>
          <p className="text-xl font-bold text-gray-800 text-center">
            最初の目的地はソウルです
          </p>
          <p className="text-base text-gray-700 text-center mt-1">
            {isFirstVisit 
              ? 'まずは自分に合った語彙レベルを見つけましょう'
              : `あと${(50000 - totalWords).toLocaleString()}語で到着します`
            }
          </p>
        </div>
      </div>

      {/* 動的地図画像の表示 */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <Image
          src={currentMapImage}
          alt={`Current journey map - ${getCurrentCity(totalWords)}`}
          width={1200}
          height={800}
          className="w-full h-full object-cover"
          style={{
            objectPosition: 'center',
            transform: 'scale(3)',
          }}
          onError={() => {
            console.warn(`Failed to load ${currentMapImage}, using fallback`);
            setCurrentMapImage(getFallbackMapImage());
          }}
          priority
        />
      </div>

      {/* 次に進むボタン（初回のみ） */}
      {isFirstVisit && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={() => router.push('/quiz')}
            className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 animate-pulse hover:animate-none"
          >
            次に進む
          </button>
        </div>
      )}
    </div>
  );
}