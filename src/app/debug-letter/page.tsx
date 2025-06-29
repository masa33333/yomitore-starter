'use client';

import { useState } from 'react';
import { getStaticLetter, getAvailableCities } from '@/data/staticLetters';

export default function DebugLetterPage() {
  const [result, setResult] = useState<string>('');

  const checkStaticLetterStatus = () => {
    const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
    const totalWords = parseInt(localStorage.getItem('wordCountTotal') || '0', 10);
    const availableCities = getAvailableCities();
    
    let targetCity = 'tokyo';
    if (totalWords >= 2000) {
      targetCity = 'beijing';
    } else if (totalWords >= 1000) {
      targetCity = 'seoul';
    }
    
    const staticLetter = getStaticLetter(targetCity, userLevel);
    
    setResult(`
📊 Static Letter System Status:
User Level: ${userLevel}
Total Words: ${totalWords.toLocaleString()}
Target City: ${targetCity}
Available Cities: ${availableCities.join(', ')}

📮 Static Letter for ${targetCity}:
Found: ${staticLetter ? '✅ Yes' : '❌ No'}
${staticLetter ? `Word Count: ${staticLetter.en.trim().split(/\s+/).length}` : ''}
${staticLetter ? `Content Preview: ${staticLetter.en.substring(0, 150)}...` : ''}
    `);
  };

  const testAllLevels = () => {
    const cities = ['tokyo', 'seoul', 'beijing'];
    let report = '📋 All Levels Test Report:\n\n';
    
    cities.forEach(city => {
      report += `🏙️ ${city.toUpperCase()}:\n`;
      for (let level = 1; level <= 5; level++) {
        const letter = getStaticLetter(city, level);
        const wordCount = letter ? letter.en.trim().split(/\s+/).length : 0;
        report += `  Level ${level}: ${letter ? '✅' : '❌'} (${wordCount} words)\n`;
      }
      report += '\n';
    });
    
    setResult(report);
  };

  const clearAllData = () => {
    localStorage.removeItem('wordCountTotal');
    localStorage.removeItem('vocabLevel');
    localStorage.removeItem('letterText');
    
    setResult('🗑️ Progress data cleared - refresh page to test from beginning');
  };

  return (
    <main className="min-h-screen bg-[#FFF9F0] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🔧 Debug: Static Letter System
        </h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="space-y-4">
            <button
              onClick={checkStaticLetterStatus}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
            >
              🔍 Check Static Letter Status
            </button>
            
            <button
              onClick={testAllLevels}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
            >
              📋 Test All Cities & Levels
            </button>
            
            <button
              onClick={clearAllData}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
            >
              🗑️ Clear Progress Data
            </button>
          </div>
          
          {result && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-2">Result:</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result}</pre>
            </div>
          )}
          
          <div className="text-center">
            <a 
              href="/letter"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              📮 Go to Letter Page
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}