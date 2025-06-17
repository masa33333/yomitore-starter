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
      
      const timer = setTimeout(() => setVisible(false), 10000); // 10秒で自動非表示
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  const handleClick = async () => {
    console.log('📧 MailNotification clicked - starting mail generation...');
    
    // Check current letterText before generation
    const currentLetterText = localStorage.getItem('letterText');
    console.log('📧 Current letterText before generation:', currentLetterText);
    
    // Clear ALL potential conflicting data
    localStorage.removeItem('letterText');
    localStorage.removeItem('mailTested');
    localStorage.removeItem('diary:1'); // Clear any cached diary data
    console.log('📧 Cleared existing letterText and test data');
    
    try {
      // Generate in-flight mail content
      const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
      const totalReadingTime = parseInt(localStorage.getItem('elapsedReadingTime') || '0', 10);
      
      console.log('📧 Generation parameters:', { userLevel, totalReadingTime });
      
      const mailContent = await generateInFlightMail({
        fromCity: "Tokyo",
        toCity: "Seoul",
        milestoneMinutes: Math.round(totalReadingTime / 60000), // Convert ms to minutes
        level: userLevel,
      });

      console.log('📧 AI Mail generated successfully:', mailContent);

      // Calculate word count from generated content
      const wordCount = mailContent.en.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
      const estimatedDuration = wordCount * 60000 / 200; // Assume 200 WPM reading speed (ms)
      const estimatedWPM = Math.round(wordCount / (estimatedDuration / 60000));

      // Save mail to storage with proper type and structure
      const mailData = {
        type: "mail" as const,
        jp: mailContent.jp,
        en: {
          [userLevel]: mailContent.en
        },
        fromCity: "Tokyo",
        toCity: "Seoul",
        catName: catName,
      };
      
      console.log('📧 About to save mailData to letterText:', mailData);
      saveLetterToStorage(mailData);
      
      // Verify it was saved correctly
      const savedLetterText = localStorage.getItem('letterText');
      console.log('📧 Verified saved letterText:', savedLetterText);
      
      // Double-check the parsed data
      try {
        const parsedData = JSON.parse(savedLetterText || '{}');
        console.log('📧 Parsed saved data:', parsedData);
        console.log('📧 Mail type check:', parsedData.type === 'mail');
        console.log('📧 Mail content preview:', parsedData.en?.[userLevel]?.substring(0, 100) + '...');
      } catch (parseError) {
        console.error('📧 Failed to parse saved data:', parseError);
      }

      // Save to history with proper metrics
      saveToHistory({
        type: "mail",
        title: `In-flight from Tokyo to Seoul`,
        contentJP: mailContent.jp,
        contentEN: mailContent.en,
        level: userLevel,
        wordCount: wordCount,
        duration: estimatedDuration,
        wpm: estimatedWPM,
        fromCity: "Tokyo",
        toCity: "Seoul",
        milestone: Math.round(totalReadingTime / 60000), // Convert ms to minutes
      });

      console.log('📧 AI Mail saved to storage and history:', { 
        wordCount, 
        estimatedDuration, 
        estimatedWPM,
        content: mailContent 
      });
      
      // Navigate to letter page
      router.push('/letter?new=1');
    } catch (error) {
      console.error('Failed to generate AI mail, using fallback:', error);
      
      // Fallback: Save a more realistic mail structure with proper metrics
      const userLevel = parseInt(localStorage.getItem('vocabLevel') || '1', 10);
      const totalReadingTime = parseInt(localStorage.getItem('elapsedReadingTime') || '0', 10);
      
      const fallbackEnglish = `Hello from high above the clouds!

I'm writing to you during my flight from Tokyo to Seoul. The view from up here is absolutely breathtaking! I can see the vast Pacific Ocean stretching endlessly below us.

The flight attendant just served some delicious fish - exactly what a traveling cat like me needs. I've been thinking about all the reading you've been doing, and it fills my heart with joy.

Your dedication to reading is what makes this incredible journey possible. Every word you read gives me the strength to fly further and discover new places.

I can't wait to share more adventures with you from Seoul. Keep reading, my dear friend!

Love,
${catName}`;

      const fallbackJapanese = `雲の上からこんにちは！

東京からソウルへの飛行中に手紙を書いています。ここからの景色は本当に息をのむほど美しいです！眼下には果てしなく続く太平洋が見えます。

客室乗務員さんがおいしいお魚を出してくれました。旅するネコの私にはぴったりです。あなたがずっと読書を続けてくれていることを思うと、心が喜びでいっぱいになります。

あなたの読書への献身が、この素晴らしい旅を可能にしているのです。あなたが読む一つ一つの言葉が、私がより遠くまで飛び、新しい場所を発見する力を与えてくれます。

ソウルからもっと多くの冒険をあなたと分かち合えるのが楽しみです。読書を続けてくださいね、親愛なる友よ！

愛を込めて、
${catName}`;

      // Calculate word count for fallback content
      const wordCount = fallbackEnglish.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
      const estimatedDuration = wordCount * 60000 / 200; // Assume 200 WPM reading speed (ms)
      const estimatedWPM = Math.round(wordCount / (estimatedDuration / 60000));

      const fallbackMailData = {
        type: "mail" as const,
        jp: fallbackJapanese,
        en: {
          [userLevel]: fallbackEnglish
        },
        fromCity: "Tokyo",
        toCity: "Seoul",
        catName: catName,
      };

      console.log('📧 About to save fallback mailData to letterText:', fallbackMailData);
      saveLetterToStorage(fallbackMailData);
      
      // Verify fallback was saved correctly
      const savedFallbackLetterText = localStorage.getItem('letterText');
      console.log('📧 Verified saved fallback letterText:', savedFallbackLetterText);
      
      // Double-check the parsed fallback data
      try {
        const parsedData = JSON.parse(savedFallbackLetterText || '{}');
        console.log('📧 Parsed fallback data:', parsedData);
        console.log('📧 Fallback type check:', parsedData.type === 'mail');
        console.log('📧 Fallback content preview:', parsedData.en?.[userLevel]?.substring(0, 100) + '...');
      } catch (parseError) {
        console.error('📧 Failed to parse fallback data:', parseError);
      }

      // Save fallback to history with proper metrics
      saveToHistory({
        type: "mail",
        title: `In-flight from Tokyo to Seoul (Fallback)`,
        contentJP: fallbackJapanese,
        contentEN: fallbackEnglish,
        level: userLevel,
        wordCount: wordCount,
        duration: estimatedDuration,
        wpm: estimatedWPM,
        fromCity: "Tokyo",
        toCity: "Seoul",
        milestone: Math.round(totalReadingTime / 60000),
      });

      console.log('📧 Fallback mail saved:', { wordCount, estimatedDuration, estimatedWPM });
      
      router.push('/letter?new=1');
    }
  };

  return (
    <div
      onClick={handleClick}
      className="fixed top-5 right-5 bg-gray-100 border border-gray-300 text-black px-4 py-2 rounded shadow-lg z-50 animate-bounce cursor-pointer hover:bg-gray-200 transition"
    >
      📩 {notificationTitle}（クリックして読む）
    </div>
  );
}