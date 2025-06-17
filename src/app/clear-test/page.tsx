"use client"

import { useEffect, useState } from "react"

export default function ClearTestPage() {
  const [cleared, setCleared] = useState(false)

  const clearAllTestData = () => {
    // Clear all test and mail related data
    localStorage.removeItem("letterText")
    localStorage.removeItem("mailTested")
    localStorage.removeItem("history")
    localStorage.removeItem("notified")
    localStorage.removeItem("clickedWords")
    
    // Set elapsedReadingTime to trigger notification (30+ minutes)
    localStorage.setItem("elapsedReadingTime", (31 * 60 * 1000).toString()) // 31 minutes in ms
    
    console.log('🧹 Cleared all test data and set elapsedReadingTime to 31 minutes')
    setCleared(true)
  }

  const checkCurrentData = () => {
    const letterText = localStorage.getItem("letterText")
    const elapsedTime = localStorage.getItem("elapsedReadingTime")
    const notified = localStorage.getItem("notified")
    
    console.log('📊 Current localStorage state:')
    console.log('letterText:', letterText)
    console.log('elapsedReadingTime:', elapsedTime, '(', parseInt(elapsedTime || '0') / 60000, 'minutes )')
    console.log('notified:', notified)
  }

  useEffect(() => {
    checkCurrentData()
  }, [])

  return (
    <div className="p-8 text-center">
      <div className="text-2xl mb-6">
        🧹 Test Data Clear & Mail Test
      </div>
      
      <div className="space-y-4 mb-8">
        <button 
          onClick={clearAllTestData}
          className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 block mx-auto"
        >
          🗑️ Clear All Test Data & Set 31min Reading Time
        </button>
        
        <button 
          onClick={checkCurrentData}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 block mx-auto"
        >
          📊 Check Current Data (Console)
        </button>
      </div>

      {cleared && (
        <div className="bg-green-100 border border-green-400 text-green-800 rounded p-4 mb-6">
          ✅ All test data cleared! 
          <br />
          elapsedReadingTime set to 31 minutes to trigger notification.
          <br />
          <br />
          Next steps:
          <br />
          1. Go to /reading page
          <br />
          2. Mail notification should appear automatically
          <br />
          3. Click notification to generate AI mail
        </div>
      )}

      <div className="text-sm text-gray-600 space-y-2">
        <p>This page clears all test data and sets up conditions for mail notification.</p>
        <p>Check console for current localStorage state.</p>
        <p>
          <a href="/reading" className="text-blue-600 hover:underline">→ Go to Reading Page</a>
        </p>
      </div>
    </div>
  )
}