'use client';
console.log("VocabularyQuiz loaded");

import React, { useState, useEffect } from 'react';
import { vocabularyData } from '../data/vocabularyData';
import { useRouter } from 'next/navigation';

type Question = {
  question: string;
  answer: string;
  options: string[];
};

export function VocabularyQuiz() {
  const router = useRouter();
  const [currentLevel, setCurrentLevel] = useState(6);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finalLevel, setFinalLevel] = useState<number | null>(null);

  useEffect(() => {
    const levelData = vocabularyData.find((d) => d.level === currentLevel);
    if (levelData) {
      const shuffled = [...levelData.questions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, 15));
    }
  }, [currentLevel]);

  


  const handleAnswer = (choice: string) => {
    if (selectedAnswer) return;

    const isCorrect = choice === questions[currentIndex].answer;
    const newScore = isCorrect ? score + 1 : score;

    setSelectedAnswer(choice);

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setScore(newScore);
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
      } else {
        const determinedLevel =
          newScore >= 13 ? Math.min(7, currentLevel + 1) :
          newScore <= 7 ? Math.max(3, currentLevel - 1) :
          currentLevel;

        setScore(newScore);
        setFinalLevel(determinedLevel);
        setFinished(true);
      }
    }, 1000);
  };

  const handleRetry = () => {
    setScore(0);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setFinished(false);
    setFinalLevel(null);
  };

  const handleProceed = () => {
    if (finalLevel !== null) {
      router.push(`/choose?level=${finalLevel}`);
    }
  };

  if (questions.length === 0) return <p className="text-center">Loading...</p>;

  if (finished && finalLevel !== null) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">結果</h2>
        <p className="mb-2">正解数: {score} / {questions.length}</p>
        <p className="mb-2">あなたの語彙レベルは: {finalLevel}（最高7）</p>
        <button
          onClick={handleProceed}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2"
        >
          今日の読み物を決める
        </button>
        <button
          onClick={handleRetry}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          再テストする
        </button>
      </div>
    );
  } else {
    const q = questions[currentIndex];

    return (
      <div className="max-w-2xl mx-auto p-4">
        <h2 className="text-lg font-semibold mb-2">
          語彙レベルチェックテスト ({currentIndex + 1} / {questions.length})
        </h2>
        <p className="mb-4 text-xl font-bold">{q.question}</p>
        <div className="grid gap-2">
          {q.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              disabled={!!selectedAnswer}
              className={`px-4 py-2 rounded border
                ${selectedAnswer === option
                  ? option === q.answer
                    ? 'bg-green-200 border-green-500'
                    : 'bg-red-200 border-red-500'
                  : 'bg-white hover:bg-gray-100 border-gray-300'}
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }
}
