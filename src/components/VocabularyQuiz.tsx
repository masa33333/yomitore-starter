'use client';
console.log("VocabularyQuiz loaded");

import React, { useState, useEffect, useCallback } from 'react';
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
    currentLevel: 3,
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
  const [showInstructions, setShowInstructions] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 語彙レベルをCEFRレベルに変換
  const mapToCEFRLevel = (vocabLevel: number): 'A1' | 'A2' | 'B1' | 'B2' => {
    if (vocabLevel <= 2) return 'A1';
    if (vocabLevel <= 4) return 'A2';
    if (vocabLevel <= 7) return 'B1';
    return 'B2';
  };

  // クイズレベル（1-10）を生成レベル（1-5）にマップ
  const mapQuizLevelToGenerationLevel = (quizLevel: number): number => {
    if (quizLevel <= 2) return 1;      // Quiz 1-2  → Lv.1 (初級 A1)
    if (quizLevel <= 4) return 2;      // Quiz 3-4  → Lv.2 (初中級 A2) 
    if (quizLevel <= 6) return 3;      // Quiz 5-6  → Lv.3 (中級 B1)
    if (quizLevel <= 8) return 4;      // Quiz 7-8  → Lv.4 (中上級 B2)
    return 5;                          // Quiz 9-10 → Lv.5 (上級 C1+)
  };

  // 最終的な語彙レベルを計算する関数
  const calculateFinalLevel = useCallback((levelHistory: any[], correctAnswers: number, questionCount: number) => {
    // 全体の正答率ベースの判定
    const overallAccuracy = correctAnswers / questionCount;
    
    // 安定して正解できる最高レベルを計算（連続正解分析）
    let stableLevel = 1;
    
    // レベル別の正解率を計算
    const levelStats: { [key: number]: { correct: number, total: number } } = {};
    for (const entry of levelHistory) {
      if (!levelStats[entry.level]) {
        levelStats[entry.level] = { correct: 0, total: 0 };
      }
      levelStats[entry.level].total++;
      if (entry.correct) {
        levelStats[entry.level].correct++;
      }
    }
    
    // 各レベルで70%以上の正答率があるかチェック
    for (let level = 1; level <= 10; level++) {
      const stats = levelStats[level];
      if (stats && stats.total >= 1) { // 最低1問はそのレベルを経験
        const accuracy = stats.correct / stats.total;
        if (accuracy >= 0.7) { // 70%以上の正答率
          stableLevel = level;
        }
      }
    }
    
    // 全体正答率による調整（保守的に）
    let finalLevel: number;
    
    if (overallAccuracy >= 0.85) {
      // 85%以上: 安定レベル + 1
      finalLevel = Math.min(10, stableLevel + 1);
    } else if (overallAccuracy >= 0.75) {
      // 75%以上: 安定レベル
      finalLevel = stableLevel;
    } else if (overallAccuracy >= 0.6) {
      // 60%以上: 安定レベル - 1
      finalLevel = Math.max(1, stableLevel - 1);
    } else if (overallAccuracy >= 0.5) {
      // 50%以上: 安定レベル - 2
      finalLevel = Math.max(1, stableLevel - 2);
    } else {
      // 50%未満: 大幅減点
      finalLevel = Math.max(1, Math.min(2, stableLevel - 3));
    }
    
    // 正解数による下限制限（より厳格に）
    let minLevel = 1;
    if (correctAnswers >= 13) {
      minLevel = 8; // 13問以上で生成Lv.4
    } else if (correctAnswers >= 11) {
      minLevel = 6; // 11問以上で生成Lv.3
    } else if (correctAnswers >= 9) {
      minLevel = 4; // 9問以上で生成Lv.2
    } else if (correctAnswers >= 6) {
      minLevel = 2; // 6問以上で生成Lv.1
    }
    
    finalLevel = Math.max(minLevel, finalLevel);
    finalLevel = Math.min(10, finalLevel);
    
    console.log('📊 レベル計算詳細:', {
      correctAnswers,
      questionCount,
      overallAccuracy: (overallAccuracy * 100).toFixed(1) + '%',
      stableLevel,
      minLevel,
      finalLevel,
      levelStats,
      levelHistory: levelHistory.map(h => `L${h.level}:${h.correct ? '○' : '×'}`).join(' ')
    });
    
    return finalLevel;
  }, []);

  // テストを終了する関数
  const finishTest = useCallback((currentState?: AdaptiveTestState) => {
    try {
      const state = currentState || testState;
      
      // 新しいロジックで最終レベルを計算
      const finalQuizLevel = calculateFinalLevel(state.levelHistory, state.correctAnswers, state.questionCount);
      const cefrLevel = mapToCEFRLevel(finalQuizLevel);
      setFinalLevel(finalQuizLevel);
      setFinished(true);
      
      // 生成用レベル（1-5）を計算
      const generationLevel = mapQuizLevelToGenerationLevel(finalQuizLevel);
      
      // ローカルストレージに保存
      // クイズレベル（1-10）を保存
      localStorage.setItem('vocabularyLevel', finalQuizLevel.toString());
      localStorage.setItem('vocabLevel', finalQuizLevel.toString());
      
      // 生成レベル（1-5）を保存
      localStorage.setItem('level', generationLevel.toString());
      localStorage.setItem('fixedLevel', generationLevel.toString());
      
      localStorage.setItem('userLevel', cefrLevel); // CEFR レベルを保存
      localStorage.setItem('quizCompleted', 'true'); // クイズ完了フラグ
      
      // 開発用: レベル履歴をコンソールに出力
      console.log('📊 レベルマッピング結果:');
      console.log('  内部クイズレベル (1-10):', finalQuizLevel);
      console.log('  表示用生成レベル (1-5):', generationLevel);
      console.log('  CEFR レベル:', cefrLevel);
      console.log('レベル変化履歴:', state.levelHistory);
    } catch (error) {
      console.error('テスト終了処理エラー:', error);
      setFinalLevel(5); // デフォルト値
      setFinished(true);
    }
  }, [calculateFinalLevel, mapToCEFRLevel, mapQuizLevelToGenerationLevel]);

  // 次の問題を生成する関数（最新の状態を取得）
  const generateNextQuestion = useCallback((currentState?: AdaptiveTestState) => {
    const state = currentState || testState;
    
    console.log('📝 generateNextQuestion 呼び出し:', { 
      questionCount: state.questionCount, 
      currentLevel: state.currentLevel,
      usedWordsCount: state.usedWords.length,
      finished 
    });

    if (state.questionCount >= 15) {
      console.log('✅ 15問完了、テスト終了');
      finishTest(state);
      return;
    }

    // 複数レベルから単語を探索して重複を防ぐ
    let selectedItem: VocabularyItem | null = null;
    const searchLevels = [state.currentLevel];
    
    // 現在のレベルで見つからない場合は近隣レベルも探索
    if (state.currentLevel > 1) searchLevels.push(state.currentLevel - 1);
    if (state.currentLevel < 10) searchLevels.push(state.currentLevel + 1);
    
    for (const level of searchLevels) {
      const levelKey = `level${level}` as keyof typeof vocabularyData;
      const levelWords = vocabularyData[levelKey];
      
      if (!levelWords) continue;
      
      // 使用済みの単語を除外
      const availableWords = levelWords.filter(item => 
        !state.usedWords.includes(item.word)
      );
      
      console.log(`📚 レベル${level}: 利用可能単語数 ${availableWords.length}/${levelWords.length}`);
      
      if (availableWords.length > 0) {
        selectedItem = availableWords[Math.floor(Math.random() * availableWords.length)];
        console.log(`✅ レベル${level}から選択: ${selectedItem.word}`);
        break;
      }
    }
    
    if (!selectedItem) {
      // すべてのレベルで使用済みの場合は、現在レベルからランダム選択
      const levelKey = `level${state.currentLevel}` as keyof typeof vocabularyData;
      const levelWords = vocabularyData[levelKey];
      if (levelWords && levelWords.length > 0) {
        selectedItem = levelWords[Math.floor(Math.random() * levelWords.length)];
        console.log('🔄 重複回避のため、使用済み単語リストをリセット');
        setTestState(prev => ({ ...prev, usedWords: [] }));
      }
    }
    
    if (selectedItem) {
      createQuestion(selectedItem, false);
    } else {
      console.error('❌ 問題が生成できません');
      finishTest(state);
    }
  }, [finishTest]);

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

  // クライアントサイド確認
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初回実行のためのuseEffect
  useEffect(() => {
    if (!showInstructions && isClient && !currentQuestion && !finished) {
      try {
        generateNextQuestion();
      } catch (error) {
        console.error('初期問題生成エラー:', error);
        finishTest();
      }
    }
  }, [showInstructions, isClient, currentQuestion, finished, generateNextQuestion, finishTest]);

  const handleStartQuiz = () => {
    setShowInstructions(false);
  };

  // 開発用スキップ機能
  const handleDevSkip = (level: number) => {
    console.log(`🚀 開発用スキップ: クイズレベル ${level} に設定`);
    
    // 開発用クイックスタートでは、選択したレベル（1-5）をそのまま使用
    // level が 1-5 の範囲内であることを確認
    const generationLevel = Math.min(Math.max(level, 1), 5);
    
    // ローカルストレージに保存
    // 開発用では生成レベルをそのまま保存
    localStorage.setItem('vocabularyLevel', generationLevel.toString());
    localStorage.setItem('vocabLevel', generationLevel.toString());
    localStorage.setItem('level', generationLevel.toString());
    localStorage.setItem('fixedLevel', generationLevel.toString());
    
    localStorage.setItem('quizCompleted', 'true');
    
    // CEFR レベルも設定
    const cefrLevel = generationLevel <= 2 ? 'A1' : generationLevel <= 3 ? 'A2' : generationLevel <= 4 ? 'B2' : 'C1';
    localStorage.setItem('userLevel', cefrLevel);
    
    // 完了状態に設定
    setFinalLevel(generationLevel);
    setFinished(true);
    
    console.log(`📊 開発用設定完了:`);
    console.log(`  選択レベル: ${level}`);
    console.log(`  生成レベル (1-5): ${generationLevel}`);
    console.log(`  CEFR レベル: ${cefrLevel}`);
    console.log(`  🎯 選択したレベルがそのまま適用されます`);
  };

  


  const handleAnswer = (choice: string) => {
    if (selectedAnswer || !currentQuestion) return;

    const isCorrect = choice === currentQuestion.correctAnswer;
    setSelectedAnswer(choice);

    console.log(`📝 回答: ${currentQuestion.word} -> ${choice} (${isCorrect ? '正解' : '不正解'})`);

    // テスト状態を更新
    const newTestState = {
      ...testState,
      questionCount: testState.questionCount + 1,
      correctAnswers: isCorrect ? testState.correctAnswers + 1 : testState.correctAnswers,
      levelHistory: [...testState.levelHistory, { level: testState.currentLevel, correct: isCorrect }]
    };

    // より保守的なレベル調整
    let newLevel = testState.currentLevel;
    if (isCorrect) {
      // 正解時は1レベル上昇（最大10）
      newLevel = Math.min(10, testState.currentLevel + 1);
    } else {
      // 不正解時は1レベル下降（最小1）
      newLevel = Math.max(1, testState.currentLevel - 1);
    }
    
    newTestState.currentLevel = newLevel;

    console.log(`📊 レベル変化: ${testState.currentLevel} -> ${newLevel} (正答: ${newTestState.correctAnswers}/${newTestState.questionCount})`);

    setTimeout(() => {
      setTestState(newTestState);
      setSelectedAnswer(null);
      setCurrentQuestion(null);
      // 次の問題を生成（更新された状態を渡す）
      setTimeout(() => {
        generateNextQuestion(newTestState);
      }, 100);
    }, 1500);
  };

  const handleRetry = () => {
    setTestState({
      currentLevel: 3,
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

  if (!isClient) {
    return <p className="text-center">読み込み中...</p>;
  }

  if (!currentQuestion && !finished && !showInstructions) {
    return <p className="text-center">問題を準備中...</p>;
  }

  if (finished && finalLevel !== null) {
    return (
      <div className="text-center">
        <h2 className="mb-6 text-2xl font-bold text-black">判定結果</h2>
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-2 text-black">正解数: {testState.correctAnswers} / {testState.questionCount}</p>
          <p className="mb-2 text-lg font-bold text-black">
            あなたの語彙レベル: {finalLevel} （最高5）
          </p>
          <p className="text-sm text-gray-600">
            このレベルで読み物を生成します
          </p>
        </div>
        
        
        <div className="flex justify-center gap-4">
          <button
            onClick={handleProceed}
            className="rounded-xl bg-orange-400 px-6 py-2 text-lg text-white transition-colors duration-200 hover:bg-orange-500"
          >
            読み物を生成する
          </button>
          <button
            onClick={handleRetry}
            className="rounded-xl bg-orange-100 px-6 py-2 text-lg text-orange-700 transition-colors duration-200 hover:bg-orange-200"
          >
            再テスト
          </button>
        </div>
      </div>
    );
  }

  // 説明表示中
  if (showInstructions) {
    return (
      <div className="relative">
        {/* 背景のクイズ画面をぼやかす */}
        <div className="max-w-2xl mx-auto p-4 blur-sm">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">
                適応型語彙テスト (1 / 15)
              </h2>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                レベル 5
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: "6.67%" }}
              />
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-6 mb-4">
            <p className="mb-2 text-sm text-gray-600">この単語の意味は？</p>
            <p className="mb-6 text-2xl font-bold text-center">sample</p>
            
            <div className="grid gap-3">
              {['選択肢1', '選択肢2', '選択肢3', '選択肢4'].map((option, idx) => (
                <button
                  key={idx}
                  className="px-4 py-3 rounded-lg border bg-white border-gray-300"
                  disabled
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

        {/* 説明ポップアップ */}
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
            <h3 className="text-2xl font-bold mb-6 mt-4 text-gray-800">語彙レベル判定</h3>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              これから15問の単語の問題を出します。<br/>
              表示された単語の意味としてふさわしいものを選択肢から選んでください。
            </p>
            <div className="space-y-4">
              <button
                onClick={handleStartQuiz}
                className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                テストを始める
              </button>
              
              {/* 開発用スキップボタン */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">開発用クイックスタート:</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleDevSkip(level)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-3 py-2 rounded text-sm transition-colors"
                    >
                      Lv.{level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
                      ? 'bg-page-bg border-primary-active text-text-primary'
                      : 'bg-red-100 border-red-500 text-red-800'
                    : selectedAnswer && option === currentQuestion.correctAnswer
                      ? 'bg-page-bg border-primary-active text-text-primary'
                      : 'bg-white hover:bg-gray-50 border-gray-300'}
                  ${selectedAnswer ? 'cursor-not-allowed' : 'cursor-pointer hover:border-[#FFE1B5]'}
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
