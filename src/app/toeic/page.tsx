import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';
import { getGenerationLevelName } from '@/utils/getEnglishText'; // 追加

interface Passage {
  id: string;
  title: string;
  description: string;
  slug: string;
  level: number; // 追加
}

export default function ToeicPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(3); // 追加
  const [showLevelSelector, setShowLevelSelector] = useState<boolean>(false); // 追加

  useEffect(() => {
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

    const fetchPassages = async () => {
      try {
        const response = await fetch('/api/toeic-passages');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Passage[] = await response.json();
        setPassages(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchPassages();
  }, []);

  // レベル変更処理
  const handleLevelChange = (newLevel: number) => {
    setSelectedLevel(newLevel);
    
    // localStorageに保存
    localStorage.setItem('level', newLevel.toString());
    localStorage.setItem('fixedLevel', newLevel.toString());
    localStorage.setItem('vocabLevel', newLevel.toString());
    localStorage.setItem('vocabularyLevel', newLevel.toString());
    
    console.log(`📊 TOEICページ: レベル${newLevel}に設定`);
    setShowLevelSelector(false);
  };

  const handlePassageSelect = (slug: string) => {
    router.push(`/reading?slug=${slug}&level=${selectedLevel}`); // levelパラメータを追加
  };

  if (error) {
    return (
      <main className="mx-auto max-w-4xl p-4 min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading passages: {error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-4 min-h-screen">
      <div className="mb-6 mt-8">
        <h1 className="text-xl font-bold mb-4">{t('choose.toeic.title')}</h1>
        <p className="text-gray-600">{t('choose.toeic.desc')}</p>
      </div>

      {/* 語彙レベル選択セクション */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-bold">
            語彙レベル：{getGenerationLevelName(selectedLevel)}
          </span>
          <button
            type="button"
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

      <div className="grid grid-cols-1 gap-4">
        {passages.length > 0 ? (
          passages.map((passage) => (
            <button
              key={passage.id}
              onClick={() => handlePassageSelect(passage.slug)}
              className="w-full rounded-xl bg-white p-6 text-left text-gray-800 transition-colors hover:bg-gray-100 border border-gray-200"
            >
              <h3 className="mb-1 text-lg font-semibold">{passage.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{passage.description}</p>
            </button>
          ))
        ) : (
          <p>No TOEIC passages found.</p>
        )}
      </div>
    </main>
  );
}