'use client';
console.log("VocabularyQuiz loaded");

import React, { useState, useEffect } from 'react';
import { vocabularyData, VocabularyItem, AdaptiveTestState } from '../data/vocabularyData';
import { useRouter } from 'next/navigation';

type Question = {
  word: string;
  meaning: string;
  options: string[];
  correctAnswer: string;
};

export function VocabularyQuiz() {
  const router = useRouter();
  const [testState, setTestState] = useState<AdaptiveTestState>({
    currentLevel: 5,
    questionCount: 0,
    correctAnswers: 0,
    maxStableLevel: 1,
    usedWords: [],
    levelHistory: []
  });
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [finalLevel, setFinalLevel] = useState<number | null>(null);

  // 語彙レベルをCEFRレベルに変換
  const mapToCEFRLevel = (vocabLevel: number): 'A1' | 'A2' | 'B1' | 'B2' => {
    if (vocabLevel <= 2) return 'A1';
    if (vocabLevel <= 4) return 'A2';
    if (vocabLevel <= 7) return 'B1';
    return 'B2';
  };

  // テストを終了する関数
  const finishTest = () => {
    try {
      // 安定して正解した最高レベルを計算
      const stableLevel = calculateMaxStableLevel();
      const cefrLevel = mapToCEFRLevel(stableLevel);
      setFinalLevel(stableLevel);
      setFinished(true);
      
      // ローカルストレージに保存
      localStorage.setItem('vocabularyLevel', stableLevel.toString());
      localStorage.setItem('vocabLevel', stableLevel.toString());
      localStorage.setItem('userLevel', cefrLevel); // CEFR レベルを保存
      
      // 開発用: レベル履歴をコンソールに出力
      console.log('レベル変化履歴:', testState.levelHistory);
      console.log('最終語彙レベル:', stableLevel);
      console.log('CEFR レベル:', cefrLevel);
    } catch (error) {
      console.error('テスト終了処理エラー:', error);
      setFinalLevel(5); // デフォルト値
      setFinished(true);
    }
  };

  // 安定して正解した最高レベルを計算
  const calculateMaxStableLevel = () => {
    let maxStable = 1;
    
    // レベル履歴から連続で正解したレベルを見つける
    for (let level = 1; level <= 10; level++) {
      const levelResults = testState.levelHistory.filter(h => h.level === level);
      if (levelResults.length >= 2) {
        const correctCount = levelResults.filter(h => h.correct).length;
        const accuracy = correctCount / levelResults.length;
        
        if (accuracy >= 0.7) { // 70%以上の正答率
          maxStable = level;
        }
      }
    }
    
    return Math.max(maxStable, testState.maxStableLevel);
  };

  // 次の問題を生成する関数（最新の状態を取得）
  const generateNextQuestion = (currentState?: AdaptiveTestState) => {
    const state = currentState || testState;
    
    console.log('📝 generateNextQuestion 呼び出し:', { 
      questionCount: state.questionCount, 
      currentLevel: state.currentLevel,
      finished 
    });

    if (state.questionCount >= 15) {
      console.log('✅ 15問完了、テスト終了');
      finishTest();
      return;
    }

    const levelKey = `level${state.currentLevel}` as keyof typeof vocabularyData;
    const levelWords = vocabularyData[levelKey];
    
    console.log('📚 語彙データ確認:', { levelKey, hasWords: !!levelWords, wordsCount: levelWords?.length });
    
    if (!levelWords) {
      console.error('❌ 語彙データが見つかりません:', levelKey);
      finishTest();
      return;
    }

    // 使用済みの単語を除外してランダムに選択
    const availableWords = levelWords.filter(item => 
      !state.usedWords.includes(item.word)
    );
    
    console.log('🎯 利用可能な単語数:', availableWords.length);
    
    if (availableWords.length === 0) {
      // 使用済み単語をリセットして再選択
      console.log('🔄 使用済み単語リセット');
      const randomItem = levelWords[Math.floor(Math.random() * levelWords.length)];
      createQuestion(randomItem, true); // リセットフラグ
    } else {
      const randomItem = availableWords[Math.floor(Math.random() * availableWords.length)];
      createQuestion(randomItem, false);
    }
  };

  // 問題を作成する関数
  const createQuestion = (item: VocabularyItem, resetUsedWords: boolean = false) => {
    console.log('🎲 問題作成:', item.word);
    
    const shuffledOptions = [...item.options].sort(() => Math.random() - 0.5);
    
    setCurrentQuestion({
      word: item.word,
      meaning: item.meaning,
      options: shuffledOptions,
      correctAnswer: item.meaning
    });

    setTestState(prev => ({
      ...prev,
      usedWords: resetUsedWords ? [item.word] : [...prev.usedWords, item.word]
    }));
  };

  // 初回実行のためのuseEffect
  useEffect(() => {
    try {
      generateNextQuestion();
    } catch (error) {
      console.error('初期問題生成エラー:', error);
      finishTest();
    }
  }, []);

  


  const handleAnswer = (choice: string) => {
    if (selectedAnswer || !currentQuestion) return;

    const isCorrect = choice === currentQuestion.correctAnswer;
    setSelectedAnswer(choice);

    // テスト状態を更新
    const newTestState = {
      ...testState,
      questionCount: testState.questionCount + 1,
      correctAnswers: isCorrect ? testState.correctAnswers + 1 : testState.correctAnswers,
      levelHistory: [...testState.levelHistory, { level: testState.currentLevel, correct: isCorrect }]
    };

    // レベル調整
    let newLevel = testState.currentLevel;
    if (isCorrect && newLevel < 10) {
      newLevel = Math.min(10, testState.currentLevel + 1);
      newTestState.maxStableLevel = Math.max(newTestState.maxStableLevel, newLevel);
    } else if (!isCorrect && newLevel > 1) {
      newLevel = Math.max(1, testState.currentLevel - 1);
    }
    
    newTestState.currentLevel = newLevel;

    setTimeout(() => {
      setTestState(newTestState);
      setSelectedAnswer(null);
      setCurrentQuestion(null); // 次の問題を生成するため
      // 次の問題を生成（更新された状態を渡す）
      setTimeout(() => {
        generateNextQuestion(newTestState);
      }, 100);
    }, 1500);
  };

  const handleRetry = () => {
    setTestState({
      currentLevel: 5,
      questionCount: 0,
      correctAnswers: 0,
      maxStableLevel: 1,
      usedWords: [],
      levelHistory: []
    });
    setSelectedAnswer(null);
    setFinished(false);
    setFinalLevel(null);
    setCurrentQuestion(null);
  };

  const handleProceed = () => {
    if (finalLevel !== null) {
      router.push('/choose');
    }
  };

  if (!currentQuestion && !finished) {
    return <p className="text-center">問題を準備中...</p>;
  }

  if (finished && finalLevel !== null) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-6 text-black">判定結果</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <p className="mb-2 text-black">正解数: {testState.correctAnswers} / {testState.questionCount}</p>
          <p className="mb-2 text-lg text-black font-bold">
            あなたの語彙レベル: {finalLevel} （最高10）
          </p>
          <p className="text-sm text-gray-600">
            このレベルが読み物生成に使用されます
          </p>
        </div>
        
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleProceed}
            className="bg-orange-400 hover:bg-orange-500 text-white rounded-xl text-lg px-6 py-2 transition-colors duration-200"
          >
            読み物を生成する
          </button>
          <button
            onClick={handleRetry}
            className="bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl text-lg px-6 py-2 transition-colors duration-200"
          >
            再テスト
          </button>
        </div>
      </div>
    );
  }

  if (currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">
              適応型語彙テスト ({testState.questionCount + 1} / 15)
            </h2>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              レベル {testState.currentLevel}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((testState.questionCount + 1) / 15) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6 mb-4">
          <p className="mb-2 text-sm text-gray-600">この単語の意味は？</p>
          <p className="mb-6 text-2xl font-bold text-center">{currentQuestion.word}</p>
          
          <div className="grid gap-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                className={`px-4 py-3 rounded-lg border transition-all duration-200
                  ${selectedAnswer === option
                    ? option === currentQuestion.correctAnswer
                      ? 'bg-green-100 border-green-500 text-green-800'
                      : 'bg-red-100 border-red-500 text-red-800'
                    : selectedAnswer && option === currentQuestion.correctAnswer
                      ? 'bg-green-100 border-green-500 text-green-800'
                      : 'bg-white hover:bg-gray-50 border-gray-300'}
                  ${selectedAnswer ? 'cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          正解すると難易度が上がり、不正解だと下がります
        </div>
      </div>
    );
  }

  return null;
}
