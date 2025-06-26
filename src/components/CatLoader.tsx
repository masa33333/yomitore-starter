'use client';

import Player from 'react-lottie-player';
import { useEffect, useState } from 'react';

export default function CatLoader() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/lottie/cat-typing.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Failed to load animation:', error));
  }, []);

  if (!animationData) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-[#F6F0E9]/80 backdrop-blur-sm">
        <div className="w-[200px] h-[200px] bg-[#FFB86C]/20 rounded-full flex items-center justify-center">
          <div className="text-[#7E6944] text-4xl">🐱</div>
        </div>
        <p className="text-sm text-[#7E6944]">Generating your story…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-[#F6F0E9]/80 backdrop-blur-sm">
      <Player 
        play 
        loop 
        animationData={animationData} 
        style={{ width: 200, height: 200 }} 
      />
      <p className="text-sm text-[#7E6944]">Generating your story…</p>
    </div>
  );
}