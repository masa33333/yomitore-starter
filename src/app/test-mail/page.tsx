"use client"

import { useEffect } from "react"
import { saveToHistory } from "@/lib/saveToHistory"

export default function TestMailSave() {
  useEffect(() => {
    // 過去に保存しているかチェック（重複防止）
    const alreadySaved = localStorage.getItem("mailTested")
    if (alreadySaved) return

    // Only save to history, NOT to letterText (to avoid overwriting real notifications)
    saveToHistory({
      type: "mail",
      title: "In-flight from Tokyo to Seoul (Test)",
      contentJP: "東京からソウルに向かっています。窓の外には富士山が見えました。",
      contentEN: "I'm flying from Tokyo to Seoul. I saw Mt. Fuji outside the window.",
      level: 2,
      wordCount: 35,
      duration: 60000, // 1分間
      wpm: 35,
      fromCity: "Tokyo",
      toCity: "Seoul",
      milestone: 30,
    })

    // 保存済みフラグをセット（1回限り）
    localStorage.setItem("mailTested", "true")
    
    console.log('📧 Test mail saved to history only (not letterText)')
  }, [])

  const clearTestData = () => {
    localStorage.removeItem("mailTested")
    localStorage.removeItem("letterText")
    localStorage.removeItem("history")
    console.log('📧 Cleared all test data')
    window.location.reload()
  }

  return (
    <div className="p-8 text-center">
      <div className="text-xl mb-4">
        ✅ テスト用のmailデータを履歴に保存しました。
      </div>
      <div className="text-sm text-gray-600 mb-4">
        (letterTextは上書きしません)
      </div>
      <button 
        onClick={clearTestData}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        🗑️ テストデータをクリア
      </button>
    </div>
  )
}