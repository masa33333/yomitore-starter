'use client';

// components/CatMap.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { visitedCities } from '@/data/visitedCities';
import { getNextUnreachedCity } from '@/lib/getNextCity';

export default function CatMap({ mapIntroShown = true }: { mapIntroShown?: boolean }) {
  // 語数データをstateで管理
  const [wordCount, setWordCount] = useState<number>(0);
  // ネコの名前をstateで管理
  const [catName, setCatName] = useState<string>('Your cat');
  const [lang, setLang] = useState<string>('en');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // 都市名（日本語⇔英語）切り替え関数
  const cityNameMap: { [key: string]: { en: string; ja: string } } = {
    '東京': { en: 'Tokyo', ja: '東京' },
    'ロンドン': { en: 'London', ja: 'ロンドン' },
    'ニューヨーク': { en: 'New York', ja: 'ニューヨーク' },
    'ナイロビ': { en: 'Nairobi', ja: 'ナイロビ' },
    'シドニー': { en: 'Sydney', ja: 'シドニー' },
  };

  function getCityName(name: string) {
    return cityNameMap[name]?.[lang] || name;
  }

  // 表示文言（tオブジェクト）- langを使用
  const t = {
    currentLocation: lang === 'ja' ? 'の現在地' : 'current location',
    wordCountLabel: lang === 'ja' ? 'これまでに読んだワード数' : 'Words read',
    visitedCities: lang === 'ja' ? 'これまでに訪れた都市' : 'Cities you\'ve visited',
    wordsUnit: lang === 'ja' ? '語' : 'words',
    nextDestination: lang === 'ja' ? '次の目的地' : 'Next destination',
    wordsRemaining: lang === 'ja' ? 'あと' : 'more',
  };

  // 初期化と言語変更監視
  useEffect(() => {
    const storedLang = localStorage.getItem('language') || 'en';
    setLang(storedLang);

    const checkLangChange = () => {
      const currentLang = localStorage.getItem('language') || 'en';
      if (currentLang !== lang) {
        setLang(currentLang);
      }
    };

    const interval = setInterval(checkLangChange, 100);

    return () => clearInterval(interval);
  }, [lang]);

  // 他のデータを読み込み
  useEffect(() => {
    const savedWordCount = localStorage.getItem('wordCount');
    const savedCatName = localStorage.getItem('catName') || 'Your cat';
    
    setCatName(savedCatName);
    setWordCount(savedWordCount ? parseInt(savedWordCount, 10) : 0);
    setIsLoaded(true);
  }, []);

  // 都市データ（外部ファイルから読み込み）
  const cities = visitedCities;

  // 現在の都市を決定（初回時は東京に固定）
  const currentCity = wordCount === 0 
    ? cities[0] // 初回時（語数0）は強制的に東京
    : cities.filter(city => city.words <= wordCount).slice(-1)[0] || cities[0];

  // 訪問済み都市を取得（最低でも最初の都市は含める）
  const visitedCitiesList = cities.filter(city => city.words <= wordCount);
  if (visitedCitiesList.length === 0) {
    visitedCitiesList.push(cities[0]); // 最初の都市（東京）を必ず含める
  }

  // ネコの位置スタイル
  const catStyle = {
    left: currentCity?.x || '50%',
    top: currentCity?.y || '50%',
  };

  // 現在地情報カードの位置判定
  const isLowerHalf = parseFloat(currentCity?.y || '0') > 50;

  // 次の目的地を取得
  const nextCity = getNextUnreachedCity(wordCount);
  const remainingWords = nextCity ? nextCity.requiredWords - wordCount : 0;

  // 新しい都市到達判定と通知保存
  useEffect(() => {
    if (currentCity) {
      const lastCity = localStorage.getItem('lastCity');
      
      // 前回と異なる都市に到達した場合
      if (lastCity !== currentCity.name) {
        console.log('🎯 新しい都市に到達:', { 
          previousCity: lastCity, 
          newCity: currentCity.name 
        });
        
        // 新しい手紙通知を保存
        localStorage.setItem('newLetter', currentCity.name);
        // 現在の都市を記録
        localStorage.setItem('lastCity', currentCity.name);
      }
    }
  }, [currentCity]);


  // ローディング中は何も表示しない
  if (!isLoaded) {
    return <div className="relative w-full h-screen bg-slate-50"></div>;
  }

  return (
    <div className="relative w-full h-screen bg-slate-50">
      {/* ③ 読了語数の通知バー（上部） - 初回時は非表示 */}
      {mapIntroShown && wordCount > 0 && (
        <div className="absolute top-4 left-4 right-4 bg-orange-100 border border-orange-300 text-black text-sm md:text-base font-semibold text-center p-2 rounded-md z-10 space-y-1">
          <div>
            {lang === 'ja' 
              ? `これまでに読んだワード数：${wordCount.toLocaleString()} 語`
              : `You have read ${wordCount.toLocaleString()} ${t.wordsUnit}!`}
          </div>
          {nextCity && (
            <div className="text-black text-sm">
              {lang === 'ja'
                ? `${t.nextDestination}：${nextCity.cityName}（${t.wordsRemaining} ${remainingWords.toLocaleString()} ${t.wordsUnit}）`
                : `${t.nextDestination}: ${nextCity.englishName} (${remainingWords.toLocaleString()} ${t.wordsRemaining} ${t.wordsUnit})`}
            </div>
          )}
        </div>
      )}

      {/* 背景の世界地図 */}
      <img
        src="/images/world-map.png"
        alt="World Map"
        className="w-full h-full object-cover opacity-90"
      />
      
      {/* 猫アイコン */}
      <img
        src="/images/cat-icon.png"
        alt="Cat Traveler"
        className="absolute w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
        style={catStyle}
      />

      {/* 現在地情報カード（ネコのすぐ上に小型表示） */}
      {currentCity && (
        <div
          className={`absolute z-10 transform -translate-x-1/2 ${
            isLowerHalf ? '-translate-y-[160%]' : 'translate-y-[80%]'
          } w-max bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-6 py-4`}
          style={{
            left: currentCity.x,
            top: currentCity.y,
          }}
        >
          <p className="text-base font-semibold text-gray-800">
            {lang === 'ja'
              ? `${catName}${t.currentLocation}：${getCityName(currentCity.name)}`
              : `${catName}'s ${t.currentLocation}: ${getCityName(currentCity.name)}`}
          </p>
        </div>
      )}

      {/* 訪問都市履歴 - 初回時は非表示 */}
      {mapIntroShown && wordCount > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-h-24 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-3">{t.visitedCities}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 🧾 3. 訪問都市の記録カード（下部） */}
            {visitedCitiesList.map((city, index) => (
              <div 
                key={index}
                className="p-2 rounded bg-white/90 text-xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-gray-700">{getCityName(city.name)}</span>
                  <span className="text-gray-500 text-xs">{(city.words || 0).toLocaleString()} {t.wordsUnit}</span>
                </div>
                <p className="text-gray-600 text-xs italic">"{city.letter?.[lang] || city.letter?.en}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}