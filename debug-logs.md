./src/app/api/articles/[slug]/level/[level]/route.ts:37:26
Type error: Cannot find name 'params'.
  35 |   if (artErr) {
  36 |     if (process.env.NODE_ENV !== 'production') {
> 37 |       const lvl = Number(params.level)
     |                          ^
  38 |       const table: Record<number, any> = {
  39 |         1: { id: 'lvl-1', article_id: 'sample-1', level: 1, word_count: 100, reading_time_sec: 150, body_md: '# Morning Focus at a Café (L1)\nI go to a small café in the morning. I order hot tea and sit by the window. I put my phone in my bag. I choose one simple task. I write a short plan on paper. I work for twenty minutes. When new ideas appear, I write them on a note and keep working. After the timer rings, I stand, stretch, and take a short break. I look at my plan and check one small box. Then I start the next block. The same tea, the same seat, and the same steps help my mind stay calm and focused.' },
  40 |         2: { id: 'lvl-2', article_id: 'sample-1', level: 2, word_count: 150, reading_time_sec: 210, body_md: '## Morning Focus at a Café (L2)\nEach morning, I visit a quiet café and create a small ritual to enter focus: the same seat, a cup of hot tea, and a paper checklist. Before working, I write one clear outcome for the next twenty-five minutes. During the block, I remove extra choices: the phone stays in my bag, extra tabs are closed, and only one file is on screen. When new ideas appear, I park them on a sticky note and return to the task. After the timer rings, I stretch and review: What moved forward? What slowed me down? If the task still feels heavy, I reduce its scope or lower the difficulty. Repeating this routine builds trust in myself and keeps my attention steady.' },
Next.js build worker exited with code: 1 and signal: null
 ELIFECYCLE  Command failed with exit code 1.
Error: Command "pnpm run build" exited with 1