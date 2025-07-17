'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function TrophyImageTestPage() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Trophy Image Test</h1>
      
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Bronze Trophy Test</h2>
        
        <div className="mb-4">
          <p>Image Status: {imageLoaded ? '✅ Loaded' : imageError ? '❌ Failed' : '⏳ Loading...'}</p>
          {imageError && <p className="text-red-500">Error: {imageError}</p>}
        </div>
        
        <div className="flex gap-6">
          {/* Original Image */}
          <div className="text-center">
            <h3 className="font-semibold mb-2">Original Image</h3>
            <Image
              src="/images/trophy-c.png"
              alt="Bronze Trophy"
              width={200}
              height={200}
              className="drop-shadow-2xl"
              onLoad={() => {
                setImageLoaded(true);
                console.log('✅ Bronze trophy image loaded successfully');
              }}
              onError={(e) => {
                const errorMsg = 'Failed to load bronze trophy image';
                setImageError(errorMsg);
                console.error('❌ Bronze trophy image failed to load:', e);
              }}
            />
          </div>
          
          {/* With Silver Filter */}
          <div className="text-center">
            <h3 className="font-semibold mb-2">Silver Filter</h3>
            <Image
              src="/images/trophy-c.png"
              alt="Silver Trophy"
              width={200}
              height={200}
              className="drop-shadow-2xl brightness-150 saturate-0"
              style={{ filter: 'brightness(150%) saturate(0%)' }}
            />
          </div>
          
          {/* With Gold Filter */}
          <div className="text-center">
            <h3 className="font-semibold mb-2">Gold Filter</h3>
            <Image
              src="/images/trophy-c.png"
              alt="Gold Trophy"
              width={200}
              height={200}
              className="drop-shadow-2xl"
              style={{ filter: 'hue-rotate(45deg) saturate(150%)' }}
            />
          </div>
          
          {/* With Platinum Filter */}
          <div className="text-center">
            <h3 className="font-semibold mb-2">Platinum Filter</h3>
            <Image
              src="/images/trophy-c.png"
              alt="Platinum Trophy"
              width={200}
              height={200}
              className="drop-shadow-2xl"
              style={{ filter: 'brightness(200%) contrast(150%)' }}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Other Images Test</h2>
        
        <div className="flex gap-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Coin (Known Working)</h3>
            <Image
              src="/images/coin.png"
              alt="Coin"
              width={150}
              height={150}
              className="drop-shadow-2xl"
            />
          </div>
          
          <div className="text-center">
            <h3 className="font-semibold mb-2">Stamp (Known Working)</h3>
            <Image
              src="/images/stamp.png"
              alt="Stamp"
              width={150}
              height={150}
              className="drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}