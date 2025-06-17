export interface VisitedCity {
  name: string;
  x: string;
  y: string;
  words: number;
  letter: { en: string; ja: string };
}

export const visitedCities: VisitedCity[] = [
  {
    name: '東京',
    x: '70%',
    y: '45%',
    words: 0,
    letter: {
      en: 'Welcome to Tokyo. This is where your journey begins.',
      ja: 'ようこそ東京へ。ここから旅が始まります。'
    }
  },
  {
    name: 'ロンドン',
    x: '35%',
    y: '35%',
    words: 10000,
    letter: {
      en: 'Foggy London, a city fragrant with history.',
      ja: '霧のロンドン、歴史が香る街。'
    }
  },
  {
    name: 'ニューヨーク',
    x: '25%',
    y: '40%',
    words: 20000,
    letter: {
      en: 'Welcome to the city that never sleeps.',
      ja: '眠らない街へようこそ。'
    }
  },
  {
    name: 'ナイロビ',
    x: '58%',
    y: '57%',
    words: 30000,
    letter: {
      en: 'A story of people living with the savanna.',
      ja: 'サバンナと共に暮らす人々の物語。'
    }
  },
  {
    name: 'シドニー',
    x: '85%',
    y: '80%',
    words: 40000,
    letter: {
      en: 'A breezy city by the sea, gateway to Australia.',
      ja: '海の香りが迎えるオーストラリアの玄関口。'
    }
  }
];