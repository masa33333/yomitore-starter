import { useEffect } from 'react';
import { ARRIVAL_WORDS, IN_FLIGHT_MINUTES, DEFAULT_IN_FLIGHT_MINUTES } from "@/constants/progress";
import { getTotalWords, getTotalMinutes, getCurrentLeg } from "@/lib/progressUtils";
import { sendArrivalMail } from "@/lib/sendArrivalMail";
import { sendInFlightMail } from "@/lib/sendInFlightMail";
import { hasArrivalMail } from "@/lib/arrivalMailUtils";

/**
 * プログレス監視フック
 * 語数と読書時間を定期的にチェックして、適切なタイミングでメール送信
 */
export function useProgressWatcher() {
  useEffect(() => {
    console.log('📊 Progress watcher started');
    
    const interval = setInterval(() => {
      try {
        const words = getTotalWords();          // 累計語数
        const minutes = getTotalMinutes();      // 累計読書分
        const { fromCity, toCity } = getCurrentLeg();
        
        console.log('📊 Progress check:', { words, minutes, fromCity, toCity });
        
        /* ① 到着判定 */
        if (toCity && toCity !== 'Unknown') {
          const arrivalThreshold = ARRIVAL_WORDS[toCity];
          const hasArrivalFlag = hasArrivalMail(toCity);
          
          if (!hasArrivalFlag && words >= arrivalThreshold) {
            console.log(`🏙️ Arrival threshold reached for ${toCity} (${words}/${arrivalThreshold} words)`);
            sendArrivalMail(toCity).catch(error => {
              console.error('🏙️ Failed to send arrival mail:', error);
            });
          }
        }
        
        /* ② 道中判定 */
        if (fromCity && toCity && fromCity !== 'Unknown' && toCity !== 'Unknown') {
          const leg = `${fromCity}-${toCity}`;
          const milestones = IN_FLIGHT_MINUTES[leg] || DEFAULT_IN_FLIGHT_MINUTES;
          const sent = JSON.parse(localStorage.getItem(`inFlightSent:${leg}`) || "[]");
          
          console.log(`✈️ Checking in-flight mail for ${leg}:`, { 
            minutes, 
            milestones, 
            sent,
            pendingMilestones: milestones.filter(m => minutes >= m && !sent.includes(m))
          });
          
          milestones
            .filter(m => minutes >= m && !sent.includes(m))
            .forEach(m => {
              console.log(`✈️ Sending in-flight mail for ${leg} at ${m} minutes`);
              sendInFlightMail(leg, m).catch(error => {
                console.error(`✈️ Failed to send in-flight mail for ${leg} at ${m} minutes:`, error);
              });
            });
        }
        
      } catch (error) {
        console.error('📊 Error in progress watcher:', error);
      }
    }, 60 * 1000); // 1分ごと
    
    // クリーンアップ
    return () => {
      console.log('📊 Progress watcher stopped');
      clearInterval(interval);
    };
  }, []);
}