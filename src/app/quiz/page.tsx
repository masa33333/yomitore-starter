'use client';
import { VocabularyQuiz } from '@/components/VocabularyQuiz';

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 overflow-y-auto">
      <div className="container mx-auto">
        <VocabularyQuiz />
      </div>
    </div>
  );
}
