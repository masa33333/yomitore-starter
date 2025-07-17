/** src/components/RewardDisplay.tsx */
import { RewardState } from "@/types/reward";
import Image from "next/image";

const ICON = {
  coin: "/images/coin.png",
  bronze: "/images/trophy-c.png",
  silver: "/images/trophy-c.png", // 暫定的に同じ画像を使用
  gold: "/images/trophy-c.png",   // 暫定的に同じ画像を使用
  platinum: "/images/trophy-c.png", // 暫定的に同じ画像を使用
} as const;

type Props = { name: string; reward: RewardState };

export default function RewardDisplay({ name, reward }: Props) {
  const getFilterClass = (type: keyof typeof ICON) => {
    switch (type) {
      case 'bronze': return '';
      case 'silver': return 'brightness-150 saturate-0';
      case 'gold': return 'hue-rotate-45 saturate-150';
      case 'platinum': return 'brightness-200 contrast-150';
      default: return '';
    }
  };

  const renderRewardIcon = (type: keyof typeof ICON, count: number) => {
    if (count === 0) return null;
    
    const icon = ICON[type];
    const isImage = icon.startsWith('/images/');
    const filterClass = getFilterClass(type);
    
    if (count <= 4) {
      // 4個以下は個別表示
      return Array.from({ length: count }, (_, i) => (
        <span key={`${type}-${i}`} className="inline-block">
          {isImage ? (
            <Image 
              src={icon} 
              alt={type}
              width={20}
              height={20}
              className={`inline-block mx-0.5 ${filterClass}`}
            />
          ) : (
            <span className="mx-0.5">{icon}</span>
          )}
        </span>
      ));
    } else {
      // 5個以上は ×数 表記
      return (
        <span className="inline-flex items-center">
          {isImage ? (
            <Image 
              src={icon} 
              alt={type}
              width={20}
              height={20}
              className={`inline-block ${filterClass}`}
            />
          ) : (
            <span>{icon}</span>
          )}
          <span className="ml-1">×{count}</span>
        </span>
      );
    }
  };

  return (
    <span className="inline-flex items-center max-w-full overflow-x-auto whitespace-nowrap">
      {name}
      <span className="ml-1 inline-flex items-center space-x-1">
        {renderRewardIcon('platinum', reward.platinum)}
        {renderRewardIcon('gold', reward.gold)}
        {renderRewardIcon('silver', reward.silver)}
        {renderRewardIcon('bronze', reward.bronze)}
        {renderRewardIcon('coin', reward.coin)}
      </span>
    </span>
  );
}