'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function IntroPage() {
  const router = useRouter()
  const [visibleLines, setVisibleLines] = useState(0)

  const lines = [
    '今から世界一周の旅に出ます。',
    'たくさん読むほど遠くの国に行けるので、',
    'どうか旅を手伝ってください。'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((prev) => Math.min(prev + 1, lines.length))
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <Image
        src="/images/narita-cat.jpg" // ←実際のパスに変更してください
        alt="成田空港にいるネコ"
        fill
        className="object-cover opacity-80"
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-white text-xl space-y-2 text-center px-4">
        {lines.slice(0, visibleLines).map((line, i) => (
          <p key={i} className="fade-in">
            {line}
          </p>
        ))}
      </div>
      {visibleLines === lines.length && (
        <button
          onClick={() => router.push('/map')}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-orange-400 text-white py-2 px-6 rounded-xl text-lg animate-wiggle"
        >
          次に進む
        </button>
      )}
    </div>
  )
}
