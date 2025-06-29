// 📄 /components/MailNotification.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateInFlightMail } from '@/lib/generateInFlightMail';
import { saveLetterToStorage, getLetterFromStorage } from '@/lib/letterStorage';
import { saveToHistory } from '@/lib/saveToHistory';

export default function MailNotification({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);
  const [catName, setCatName] = useState<string>('あなたのネコ');
  const [notificationTitle, setNotificationTitle] = useState<string>('手紙が届いています');
  const [blinkCount, setBlinkCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(true);
  const router = useRouter();

  // Get cat name and determine notification title based on letter type
  useEffect(() => {
    const savedCatName = localStorage.getItem('catName') || 'あなたのネコ';
    setCatName(savedCatName);
    
    // Get letter from storage to determine type
    const letterText = getLetterFromStorage();
    const type = letterText?.type || "letter"; // fallback to letter if type doesn't exist
    
    const title = type === "mail"
      ? `✉️ ${savedCatName} から未読メールが届いています`
      : `📮 ${savedCatName} から手紙が届いています`;
    
    setNotificationTitle(title);
  }, []);

  // 点滅カウンターのuseEffect
  useEffect(() => {
    if (show && visible) {
      setBlinkCount(0);
      setIsBlinking(true);
      
      const blinkInterval = setInterval(() => {
        setBlinkCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 8) { // 4回点滅 = 8回の切り替え
            clearInterval(blinkInterval);
            setIsBlinking(false);
            setVisible(false); // 即座に消す
            return newCount;
          }
          return newCount;
        });
      }, 500); // 0.5秒間隔で点滅
      
      return () => clearInterval(blinkInterval);
    }
  }, [show, visible]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Update notification title when notification is shown (in case letter type changed)
      const letterText = getLetterFromStorage();
      const type = letterText?.type || "letter";
      const savedCatName = localStorage.getItem('catName') || 'あなたのネコ';
      
      const title = type === "mail"
        ? `✉️ ${savedCatName} から未読メールが届いています`
        : `📮 ${savedCatName} から手紙が届いています`;
      
      setNotificationTitle(title);
    }
  }, [show]);

  if (!visible) return null;

  const handleClick = () => {
    console.log('📮 Letter notification clicked - navigating to letter page...');
    setVisible(false); // すぐに非表示にする
    router.push('/letter');
  };

  return (
    <div
      onClick={handleClick}
      className={`fixed top-5 right-5 bg-gray-100 border border-gray-300 text-black px-4 py-2 rounded shadow-lg z-50 cursor-pointer hover:bg-gray-200 transition font-bold ${
        isBlinking && blinkCount % 2 === 1 ? 'opacity-30' : 'opacity-100'
      }`}
    >
      📩 {notificationTitle}（クリックして読む）
    </div>
  );
}