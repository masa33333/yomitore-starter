'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateLetter } from '@/utils/generateLetter';
import { saveLetterToStorage } from '@/lib/letterStorage';
import { useTranslation } from '@/hooks/useTranslation';
import { getCurrentMapImage, getFallbackMapImage, getCurrentCity } from '@/utils/mapImageUtils';
import { mapQuizLevelToGenerationLevel } from '@/utils/getEnglishText';

export default function MapPage() {
  const router = useRouter();
  const { t } = useTranslation();
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
    
    console.log('📊 Current progress:', { totalWords: storedTotalWords, mapImage });

    const shouldGenerateLetter = () => {
      const visitedCities = JSON.parse(localStorage.getItem('visitedCities') || '[]');
      const lastCity = localStorage.getItem('lastCity');
      const generatedCities = JSON.parse(localStorage.getItem('generatedCities') || '[]');
      return lastCity && !generatedCities.includes(lastCity);
    };

    const generateAndSaveLetter = async () => {
      const lastCity = localStorage.getItem('lastCity');
      const quizLevel = parseInt(localStorage.getItem('vocabLevel') || localStorage.getItem('vocabularyLevel') || '5', 10);
      const userLevel = mapQuizLevelToGenerationLevel(quizLevel);

      if (!lastCity) return;

      try {
        console.log(`🗾 Map: Generating letter with Quiz Lv.${quizLevel} → Generation Lv.${userLevel}`);
        const letterText = await generateLetter(lastCity, userLevel.toString());
        
        // Convert old letter format to new letter storage format
        saveLetterToStorage({
          type: "letter",
          fromCity: "Previous City",
          toCity: lastCity,
          level: userLevel,
          jp: "都市からの手紙です。", // You may want to generate Japanese content too
          en: {
            [userLevel]: letterText.body
          },
          wordCount: letterText.body.split(/\s+/).length,
          duration: 0,
          wpm: 0
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


  return (
    <div className="min-h-screen flex items-center justify-center relative">

      {/* 目的地表示ポップアップ */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40">
        <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-6 py-3 border border-gray-200 transition-all duration-1000 ${
          showDestination ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
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
      <div className="size-full flex items-center justify-center overflow-hidden">
        <Image
          src={currentMapImage}
          alt={`Current journey map - ${getCurrentCity(totalWords)}`}
          width={1200}
          height={800}
          className="size-full object-cover"
          style={{
            objectPosition: 'center',
            scale: '3',
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
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => router.push('/quiz')}
            className="animate-pulse rounded-xl bg-orange-400 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:animate-none hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            レベル判定に進む
          </button>
        </div>
      )}
    </div>
  );
}