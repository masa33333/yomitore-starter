📚 Reading generation request (new JP→EN flow): {
  level: 1,
  mode: 'reading',
  status: 'resolved_model',
  value: '{"mode":"reading","topic":"村上春樹","level":"1"}',
  reason: null,
  _response: {
    _bundlerConfig: null,
    _serverReferenceConfig: null,
    _moduleLoading: null,
    _chunks: {},
    _stringDecoder: {},
    _rowState: 0,
    _rowID: 0,
    _rowTag: 0,
    _rowLength: 0,
    _buffer: [],
    _closed: true,
    _closedReason: {},
    _debugRootOwner: null,
    _debugRootStack: null,
    _debugRootTask: {},
    _replayConsole: true,
    _rootEnvironmentName: 'Server'
  },
  _debugInfo: null
}
📝 Generating content for level 1 {
  mode: 'reading',
  topic: '',
  theme: '',
  genre: '',
  tone: '',
  feeling: '',
  useNewFlow: true
}
🇯🇵 Generating reading content for topic: "general reading"
🎌 Generating Japanese content with OpenAI API for topic: general reading
📚 Reading generation request (new JP→EN flow): {
  level: 1,
  mode: 'reading',
  status: 'resolved_model',
  value: '{"mode":"reading","topic":"村上春樹","level":"1"}',
  reason: null,
  _response: {
    _bundlerConfig: null,
    _serverReferenceConfig: null,
    _moduleLoading: null,
    _chunks: {},
    _stringDecoder: {},
    _rowState: 0,
    _rowID: 0,
    _rowTag: 0,
    _rowLength: 0,
    _buffer: [],
    _closed: true,
    _closedReason: {},
    _debugRootOwner: null,
    _debugRootStack: null,
    _debugRootTask: {},
    _replayConsole: true,
    _rootEnvironmentName: 'Server'
  },
  _debugInfo: null
}
📝 Generating content for level 1 {
  mode: 'reading',
  topic: '',
  theme: '',
  genre: '',
  tone: '',
  feeling: '',
  useNewFlow: true
}
🇯🇵 Generating reading content for topic: "general reading"
🎌 Generating Japanese content with OpenAI API for topic: general reading
🏗️ Server Component executing with params: Promise {
  <pending>,
  mode: [Getter/Setter],
  topic: [Getter/Setter],
  level: [Getter/Setter],
  [Symbol(async_id_symbol)]: 347783,
  [Symbol(trigger_async_id_symbol)]: 347777,
  [Symbol(kResourceStore)]: {
    isStaticGeneration: false,
    page: '/reading/page',
    fallbackRouteParams: null,
    route: '/reading',
    incrementalCache: IncrementalCache {
      locks: Map(0) {},
      hasCustomCacheHandler: false,
      dev: true,
      disableForTestmode: false,
      minimalMode: false,
      requestHeaders: [Object],
      requestProtocol: 'http',
      allowedRevalidateHeaderKeys: undefined,
      prerenderManifest: [Object],
      cacheControls: [SharedCacheControls],
      fetchCacheKeyPrefix: '',
      cacheHandler: [FileSystemCache]
    },
    cacheLifeProfiles: {
      default: [Object],
      seconds: [Object],
      minutes: [Object],
      hours: [Object],
      days: [Object],
      weeks: [Object],
      max: [Object]
    },
    isRevalidate: false,
    isPrerendering: undefined,
    fetchCache: undefined,
    isOnDemandRevalidate: false,
    isDraftMode: false,
    requestEndedState: { ended: false },
    isPrefetchRequest: false,
    buildId: 'development',
    reactLoadableManifest: {},
    assetPrefix: '',
    afterContext: AfterContext {
      workUnitStores: Set(0) {},
      waitUntil: [Function (anonymous)],
      onClose: [Function: bound onClose],
      onTaskError: undefined,
      callbackQueue: [EventEmitter]
    },
    dynamicIOEnabled: false,
    dev: true,
    previouslyRevalidatedTags: [],
    refreshTagsByCacheKind: Map(2) { 'default' => [Object], 'remote' => [Object] },
    fetchMetrics: [],
    forceDynamic: true
  },
  [Symbol(kResourceStore)]: undefined,
  [Symbol(kResourceStore)]: undefined,
  [Symbol(kResourceStore)]: undefined,
  [Symbol(kResourceStore)]: undefined,
  [Symbol(kResourceStore)]: {
    type: 'request',
    phase: 'render',
    implicitTags: { tags: [Array], expirationsByCacheKind: [Map] },
    url: {
      pathname: '/reading',
      search: '?mode=reading&topic=%E6%9D%91%E4%B8%8A%E6%98%A5%E6%A8%B9&level=1&_rsc=c83av'
    },
    rootParams: {},
    headers: [Getter],
    cookies: [Getter/Setter],
    mutableCookies: [Getter],
    userspaceMutableCookies: [Getter],
    draftMode: [Getter],
    renderResumeDataCache: null,
    isHmrRefresh: true,
    serverComponentsHmrCache: LRUCache {
      cache: Map(0) {},
      sizes: Map(0) {},
      totalSize: 0,
      maxSize: 52428800,
      calculateSize: [Function: length]
    }
  }
}
Error: Route "/reading" used `searchParams.slug`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
    at ReadingPage (src/app/reading/page.tsx:119:10)
  117 |   console.log('🏗️ Server Component executing with params:', params);
  118 |   
> 119 |   const { slug } = params;
      |          ^
  120 |   const mode = params.mode || 'reading';
  121 |   const isStoryMode = mode === 'story';
  122 |   const isPresetMode = !!slug;
Error: Route "/reading" used `searchParams.mode`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
    at ReadingPage (src/app/reading/page.tsx:120:22)
  118 |   
  119 |   const { slug } = params;
> 120 |   const mode = params.mode || 'reading';
      |                      ^
  121 |   const isStoryMode = mode === 'story';
  122 |   const isPresetMode = !!slug;
  123 |   
📝 読み物モード: 動的生成システムを使用 (initialData = null)
✅ Server Component data prepared: { mode: 'reading', hasInitialData: false, title: undefined }
Error: Route "/reading" used `searchParams._debugInfo`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
    at stringify (<anonymous>)
 GET /reading?mode=reading&topic=%E6%9D%91%E4%B8%8A%E6%98%A5%E6%A8%B9&level=1 200 in 1626ms
✅ Japanese content generated via OpenAI: [
  '日本の中学生が最も好きな科目が英語という結果が発表されました。調査では、英語が将来の夢や目標に繋がるという意見が多かったそうです。',
  '一方で、意外なことに、日本人の中学生の英語力はOECD加盟国の中で下位に位置していることが明らかになりました。外国語教育の充実が求められています。',
  'この結果から、日本の教育改革が叫ばれる中、英語教育の充実が重要性を増しています。将来を見据えるうえで、若い世代のグローバルな力を伸ばす取り組みが進むことが期待されます。'
]
🔤 Translating to English with Level 1 vocabulary control
🔤 Translating to English with OpenAI API
✅ English translation generated via OpenAI: [
  'It has been announced that the favorite subject among Japanese junior high school students is English. Many of them believe that English is connected to their future dreams and goals.',
  "On the other hand, surprisingly, it has become apparent that Japanese junior high school students' English proficiency ranks low among OECD member countries. There is a demand for improving foreign language education.",
  'As a result, amid calls for educational reform in Japan, the importance of enhancing English education is increasing. It is expected that efforts to strengthen the global abilities of the younger generation will progress for the future.'
]
✅ Fallback content generated: { title: 'General Reading', level: 1, wordCount: 99, mode: 'reading' }
 POST /api/generate-reading 200 in 7817ms
✅ Japanese content generated via OpenAI: [
  'ある研究チームが最近行った調査によると、多くの人が一日に何度もスマートフォンをチェックしていることが判明しました。実際、平均して1日に100回以上もスマホを見る人が少なくないそうです。あなたも周りを見てみると、意外と多くの人がスマートフォンと向き合っているのではないでしょうか？',
  '驚くべきことに、このようなスマートフォンへの依存は脳にも影響を与えていると言われています。脳内のドーパミンと呼ばれる物質がリリースされ、スマホをチェックすることで快楽を感じるようになるのだそうです。つまり、スマホ中毒と呼ばれる現象が実際に脳内で起こっているのです。',
  'このような研究結果から、我々がスマートフォンやインターネットとの関わり方を見直す必要性が示唆されます。常にスマホを手放せない状態では、脳の活性化が偏り、他の重要な活動や人間関係に悪影響を及ぼす可能性があると言えるでしょう。自分自身のスマホ使用を見つめ直し、バランスの取れた生活を送ることが重要なのかもしれません。'
]
🔤 Translating to English with Level 1 vocabulary control
🔤 Translating to English with OpenAI API
✅ English translation generated via OpenAI: [
  'According to a recent study conducted by a research team, it has been found that many people check their smartphones multiple times a day. In fact, there are quite a few people who look at their phones more than 100 times a day on average. If you look around, you may be surprised to see that many people are constantly facing their smartphones.',
  'Surprisingly, this dependence on smartphones is said to have an impact on the brain. A substance called dopamine is released in the brain, causing individuals to feel pleasure when checking their phones. This means that the phenomenon known as smartphone addiction is actually happening in the brain.',
  'Based on such research findings, it is suggested that we reevaluate how we interact with smartphones and the internet. Being in a constant state of not being able to let go of our phones may lead to a bias in brain activation, potentially negatively affecting other important activities and relationships. It may be important to reexamine our own smartphone usage and strive for a balanced life.'
]
✅ Fallback content generated: { title: 'General Reading', level: 1, wordCount: 176, mode: 'reading' }
 POST /api/generate-reading 200 in 16373ms