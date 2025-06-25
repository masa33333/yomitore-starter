🚀 ReadingPage コンポーネント レンダリング開始
🚀 searchParams 存在確認: true
 GET /reading?mode=story&genre=Mystery&tone=Lighthearted&feeling=Empowerment&level=6 200 in 741ms
 ○ Compiling /api/create-story ...
 ✓ Compiled /api/create-story in 674ms (593 modules)
🚀 [create-story] API呼び出し開始
🔑 [create-story] API Key status: SET
🔑 [create-story] API Key length: 21
🔑 [create-story] API Key prefix: sk-proj
🔍 APIキー詳細チェック:
  - apiKey exists: true
  - apiKey type: string
  - apiKey value: "sk-proj-あなたのAPIキーをここに"
  - starts with sk-: true
🚀 [create-story] API呼び出し開始
🔑 [create-story] API Key status: SET
🔑 [create-story] API Key length: 21
🔑 [create-story] API Key prefix: sk-proj
🔍 APIキー詳細チェック:
  - apiKey exists: true
  - apiKey type: string
  - apiKey value: "sk-proj-あなたのAPIキーをここに"
  - starts with sk-: true
[create-story] 受信パラメータ: {
  genre: 'Mystery',
  tone: 'Lighthearted',
  feeling: 'Empowerment',
  level: 6
}
[create-story] ストーリー生成リクエスト: {
  genre: 'Mystery',
  tone: 'Lighthearted',
  feeling: 'Empowerment',
  level: 6
}
[create-story] プロンプト: 
語彙レベル: 6
テーマ: Mystery
得たい感情: Empowerment
表現スタイル: Lighthearted
主人公の性別: 男性

この条件に基づいて英語の読み物を1つ作成し、以下のstrict JSON形式で出力してください：

{
  "title": "The Shadow in the Forest",
  "content": [
    "David always loved the forest behind his house. It was a place of peace and quiet, where he could escape from the ...
🔄 [OpenAI API] 呼び出し開始
🔄 [OpenAI API] システムメッセージ: You are a professional English creative writer specializing in educational content for intermediate ...
🔄 [OpenAI API] ユーザープロンプト: 
語彙レベル: 6
テーマ: Mystery
得たい感情: Empowerment
表現スタイル: Lighthearted
主人公の性別: 男性

この条件に基づいて英語の読み物を1つ作成し、以下のstrict JSON形式で出力してください：

{
  "title": "The Shadow in the Forest",
  "content": [
    "David always l...
[create-story] 受信パラメータ: {
  genre: 'Mystery',
  tone: 'Lighthearted',
  feeling: 'Empowerment',
  level: 7
}
[create-story] ストーリー生成リクエスト: {
  genre: 'Mystery',
  tone: 'Lighthearted',
  feeling: 'Empowerment',
  level: 7
}
[create-story] プロンプト: 
語彙レベル: 7
テーマ: Mystery
得たい感情: Empowerment
表現スタイル: Lighthearted
主人公の性別: 女性

この条件に基づいて英語の読み物を1つ作成し、以下のstrict JSON形式で出力してください：

{
  "title": "The Shadow in the Forest",
  "content": [
    "David always loved the forest behind his house. It was a place of peace and quiet, where he could escape from the ...
🔄 [OpenAI API] 呼び出し開始
🔄 [OpenAI API] システムメッセージ: You are a professional English creative writer specializing in educational content for intermediate ...
🔄 [OpenAI API] ユーザープロンプト: 
語彙レベル: 7
テーマ: Mystery
得たい感情: Empowerment
表現スタイル: Lighthearted
主人公の性別: 女性

この条件に基づいて英語の読み物を1つ作成し、以下のstrict JSON形式で出力してください：

{
  "title": "The Shadow in the Forest",
  "content": [
    "David always l...
[OpenAI API] 呼び出し失敗: {
  error: TypeError: Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.
      at async callOpenAI (src/app/api/create-story/route.ts:39:23)
      at async POST (src/app/api/create-story/route.ts:133:24)
    37 |     console.log('🔄 [OpenAI API] ユーザープロンプト:', userPrompt.substring(0, 200) + '...');
    38 |     
  > 39 |     const completion = await openai.chat.completions.create({
       |                       ^
    40 |       model: "gpt-3.5-turbo",
    41 |       messages: [
    42 |         { ,
  message: 'Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.',
  stack: 'TypeError: Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.\n' +
    '    at webidl.converters.ByteString (node:internal/deps/undici/undici:3889:17)\n' +
    '    at _Headers.append (node:internal/deps/undici/undici:8861:35)\n' +
    '    at buildHeaders (webpack-internal:///(rsc)/./node_modules/openai/internal/headers.mjs:67:31)\n' +
    '    at OpenAI.authHeaders (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:175:84)\n' +
    '    at OpenAI.buildHeaders (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:476:18)\n' +
    '    at OpenAI.buildRequest (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:445:33)\n' +
    '    at OpenAI.makeRequest (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:243:44)\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at async callOpenAI (webpack-internal:///(rsc)/./src/app/api/create-story/route.ts:25:28)\n' +
    '    at async POST (webpack-internal:///(rsc)/./src/app/api/create-story/route.ts:130:29)\n' +
    '    at async AppRouteRouteModule.do (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:26:34112)\n' +
    '    at async AppRouteRouteModule.handle (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:26:41338)\n' +
    '    at async doRender (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1518:42)\n' +
    '    at async DevServer.renderToResponseWithComponentsImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1920:28)\n' +
    '    at async DevServer.renderPageComponent (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:2408:24)\n' +
    '    at async DevServer.renderToResponseImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:2445:32)\n' +
    '    at async DevServer.pipeImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1008:25)\n' +
    '    at async NextNodeServer.handleCatchallRenderRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/next-server.js:305:17)\n' +
    '    at async DevServer.handleRequestImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:900:17)\n' +
    '    at async /Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/dev/next-dev-server.js:371:20\n' +
    '    at async Span.traceAsyncFn (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/trace/trace.js:157:20)\n' +
    '    at async DevServer.handleRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/dev/next-dev-server.js:368:24)\n' +
    '    at async invokeRender (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:237:21)\n' +
    '    at async handleRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:428:24)\n' +
    '    at async requestHandlerImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:452:13)\n' +
    '    at async Server.requestListener (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/start-server.js:158:13)'
}
[OpenAI API] 呼び出し失敗: {
  error: TypeError: Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.
      at async callOpenAI (src/app/api/create-story/route.ts:39:23)
      at async POST (src/app/api/create-story/route.ts:133:24)
    37 |     console.log('🔄 [OpenAI API] ユーザープロンプト:', userPrompt.substring(0, 200) + '...');
    38 |     
  > 39 |     const completion = await openai.chat.completions.create({
       |                       ^
    40 |       model: "gpt-3.5-turbo",
    41 |       messages: [
    42 |         { ,
  message: 'Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.',
  stack: 'TypeError: Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.\n' +
    '    at webidl.converters.ByteString (node:internal/deps/undici/undici:3889:17)\n' +
    '    at _Headers.append (node:internal/deps/undici/undici:8861:35)\n' +
    '    at buildHeaders (webpack-internal:///(rsc)/./node_modules/openai/internal/headers.mjs:67:31)\n' +
    '    at OpenAI.authHeaders (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:175:84)\n' +
    '    at OpenAI.buildHeaders (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:476:18)\n' +
    '    at OpenAI.buildRequest (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:445:33)\n' +
    '    at OpenAI.makeRequest (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:243:44)\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at async callOpenAI (webpack-internal:///(rsc)/./src/app/api/create-story/route.ts:25:28)\n' +
    '    at async POST (webpack-internal:///(rsc)/./src/app/api/create-story/route.ts:130:29)\n' +
    '    at async AppRouteRouteModule.do (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:26:34112)\n' +
    '    at async AppRouteRouteModule.handle (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:26:41338)\n' +
    '    at async doRender (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1518:42)\n' +
    '    at async DevServer.renderToResponseWithComponentsImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1920:28)\n' +
    '    at async DevServer.renderPageComponent (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:2408:24)\n' +
    '    at async DevServer.renderToResponseImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:2445:32)\n' +
    '    at async DevServer.pipeImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1008:25)\n' +
    '    at async NextNodeServer.handleCatchallRenderRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/next-server.js:305:17)\n' +
    '    at async DevServer.handleRequestImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:900:17)\n' +
    '    at async /Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/dev/next-dev-server.js:371:20\n' +
    '    at async Span.traceAsyncFn (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/trace/trace.js:157:20)\n' +
    '    at async DevServer.handleRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/dev/next-dev-server.js:368:24)\n' +
    '    at async invokeRender (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:237:21)\n' +
    '    at async handleRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:428:24)\n' +
    '    at async requestHandlerImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:452:13)\n' +
    '    at async Server.requestListener (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/start-server.js:158:13)'
}
[create-story] エラー内容: {
  error: TypeError: Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.
      at async callOpenAI (src/app/api/create-story/route.ts:39:23)
      at async POST (src/app/api/create-story/route.ts:133:24)
    37 |     console.log('🔄 [OpenAI API] ユーザープロンプト:', userPrompt.substring(0, 200) + '...');
    38 |     
  > 39 |     const completion = await openai.chat.completions.create({
       |                       ^
    40 |       model: "gpt-3.5-turbo",
    41 |       messages: [
    42 |         { ,
  message: 'Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.',
  stack: 'TypeError: Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.\n' +
    '    at webidl.converters.ByteString (node:internal/deps/undici/undici:3889:17)\n' +
    '    at _Headers.append (node:internal/deps/undici/undici:8861:35)\n' +
    '    at buildHeaders (webpack-internal:///(rsc)/./node_modules/openai/internal/headers.mjs:67:31)\n' +
    '    at OpenAI.authHeaders (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:175:84)\n' +
    '    at OpenAI.buildHeaders (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:476:18)\n' +
    '    at OpenAI.buildRequest (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:445:33)\n' +
    '    at OpenAI.makeRequest (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:243:44)\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at async callOpenAI (webpack-internal:///(rsc)/./src/app/api/create-story/route.ts:25:28)\n' +
    '    at async POST (webpack-internal:///(rsc)/./src/app/api/create-story/route.ts:130:29)\n' +
    '    at async AppRouteRouteModule.do (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:26:34112)\n' +
    '    at async AppRouteRouteModule.handle (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:26:41338)\n' +
    '    at async doRender (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1518:42)\n' +
    '    at async DevServer.renderToResponseWithComponentsImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1920:28)\n' +
    '    at async DevServer.renderPageComponent (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:2408:24)\n' +
    '    at async DevServer.renderToResponseImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:2445:32)\n' +
    '    at async DevServer.pipeImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1008:25)\n' +
    '    at async NextNodeServer.handleCatchallRenderRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/next-server.js:305:17)\n' +
    '    at async DevServer.handleRequestImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:900:17)\n' +
    '    at async /Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/dev/next-dev-server.js:371:20\n' +
    '    at async Span.traceAsyncFn (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/trace/trace.js:157:20)\n' +
    '    at async DevServer.handleRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/dev/next-dev-server.js:368:24)\n' +
    '    at async invokeRender (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:237:21)\n' +
    '    at async handleRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:428:24)\n' +
    '    at async requestHandlerImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:452:13)\n' +
    '    at async Server.requestListener (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/start-server.js:158:13)',
  type: 'object',
  name: 'TypeError'
}
[create-story] エラー内容: {
  error: TypeError: Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.
      at async callOpenAI (src/app/api/create-story/route.ts:39:23)
      at async POST (src/app/api/create-story/route.ts:133:24)
    37 |     console.log('🔄 [OpenAI API] ユーザープロンプト:', userPrompt.substring(0, 200) + '...');
    38 |     
  > 39 |     const completion = await openai.chat.completions.create({
       |                       ^
    40 |       model: "gpt-3.5-turbo",
    41 |       messages: [
    42 |         { ,
  message: 'Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.',
  stack: 'TypeError: Cannot convert argument to a ByteString because the character at index 15 has a value of 12354 which is greater than 255.\n' +
    '    at webidl.converters.ByteString (node:internal/deps/undici/undici:3889:17)\n' +
    '    at _Headers.append (node:internal/deps/undici/undici:8861:35)\n' +
    '    at buildHeaders (webpack-internal:///(rsc)/./node_modules/openai/internal/headers.mjs:67:31)\n' +
    '    at OpenAI.authHeaders (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:175:84)\n' +
    '    at OpenAI.buildHeaders (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:476:18)\n' +
    '    at OpenAI.buildRequest (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:445:33)\n' +
    '    at OpenAI.makeRequest (webpack-internal:///(rsc)/./node_modules/openai/client.mjs:243:44)\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at async callOpenAI (webpack-internal:///(rsc)/./src/app/api/create-story/route.ts:25:28)\n' +
    '    at async POST (webpack-internal:///(rsc)/./src/app/api/create-story/route.ts:130:29)\n' +
    '    at async AppRouteRouteModule.do (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:26:34112)\n' +
    '    at async AppRouteRouteModule.handle (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:26:41338)\n' +
    '    at async doRender (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1518:42)\n' +
    '    at async DevServer.renderToResponseWithComponentsImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1920:28)\n' +
    '    at async DevServer.renderPageComponent (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:2408:24)\n' +
    '    at async DevServer.renderToResponseImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:2445:32)\n' +
    '    at async DevServer.pipeImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:1008:25)\n' +
    '    at async NextNodeServer.handleCatchallRenderRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/next-server.js:305:17)\n' +
    '    at async DevServer.handleRequestImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/base-server.js:900:17)\n' +
    '    at async /Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/dev/next-dev-server.js:371:20\n' +
    '    at async Span.traceAsyncFn (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/trace/trace.js:157:20)\n' +
    '    at async DevServer.handleRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/dev/next-dev-server.js:368:24)\n' +
    '    at async invokeRender (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:237:21)\n' +
    '    at async handleRequest (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:428:24)\n' +
    '    at async requestHandlerImpl (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/router-server.js:452:13)\n' +
    '    at async Server.requestListener (/Users/nakajimamasahiro/Downloads/yomitore-starter/node_modules/next/dist/server/lib/start-server.js:158:13)',
  type: 'object',
  name: 'TypeError'
}
 POST /api/create-story 500 in 1733ms
 POST /api/create-story 500 in 2161ms
 GET /reading?mode=story&genre=Mystery&tone=Lighthearted&feeling=Empowerment&level=6 200 in 1891ms
