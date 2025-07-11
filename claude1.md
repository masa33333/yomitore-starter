・ポップアップ式辞書機能

ポップアップ方式なら “しきい値だけ決めて半自動” で実装できます
大変そうに見えますが、作業をビルド時（オフライン）に寄せる と意外とシンプルです。ポイントは ①難語を決める → ②意味を紐付ける → ③フロントで表示 の 3 ステップだけ。

1️⃣ しきい値の決め方
レベル	NGSL 範囲	難語扱いの目安
Level 1 (A1+A2)	0–1800	rank > 1800 をポップアップ対象
Level 2 (B1)	0–3000	rank > 3000
Level 3 (B2)	0–3500	rank > 3500 もしくは CEFR C1 語

固定テーブルなのでフロント側で計算不要。ビルド時にタグ付けすれば終わり。

2️⃣ 意味（ヒント）の用意
A. 既製辞書を優先
staticDictionary.json

json
コードをコピーする
{ "paparazzi": "news photographers", "embarrassed": "feeling shy" }
B. 辞書にない語はワンショットで補完
Node スクリプトで難語リストを抽出：

ts
コードをコピーする
const unknown = difficultWords.filter(w => !dict[w]);
OpenAI (gpt-3.5) にバッチで

txt
コードをコピーする
Give a ≤4-word easy English meaning for: paparazzi, phenomenal, ...
返ってきた JSON を辞書に追記 → キャッシュ完了。

一度作れば再利用、API コストは月数十円レベル。

3️⃣ ストーリー JSON に “index” だけ埋め込む
json
コードをコピーする
{
  "tokens": ["Will", "opened", "the", "door", "and", "met", "paparazzi", "."],
  "glossary": [
    { "index": 6, "word": "paparazzi", "hint": "news photographers" }
  ]
}
hint 文そのもの を本文へ埋め込まないので行間が崩れない。

Token 分割は既存 split(/\b/) で OK。

4️⃣ フロント実装は 20 行＋ポップアップ UI
tsx
コードをコピーする
<span
  key={i}
  onClick={g && (() => setHint({ ...g, x, y }))}
  className={g ? 'text-blue-600 cursor-help' : ''}
>
  {token}
</span>
難語だけ cursor-help を付け、タップで shadcn/ui の Popover。

ポップアップの中身は hint 一行だけなので設計が単純。

レベルごとの色を変えたい場合は CSS の utility class を三つ用意すれば済む。

5️⃣ 開発・運用コスト
作業	工数目安
ビルド用 Node スクリプト作成	2-3 h
既成辞書収集＋1回目の自動補完	1 h
フロント Popover 実装	1 h
QA（語彙ハイライト＆ポップ確認）	1 h

一度パイプラインを作れば 新しいストーリーを追加するときは
「日本語あらすじ → OpenAI で英語化 → スクリプト実行 → Supabase upsert」の一手順だけ。

🐾 まとめ（emoji）
🗂 ビルド時に難語タグ付け＋辞書バインド → ランタイム処理ゼロ

🔍 しきい値は NGSL rank だけでOK、ユーザーが増えても変更不要

💬 ポップアップ は span + Popover の最小実装で十分

💸 API コスト：初回辞書補完のみ、月数十円レベル

⏱ 工数：半日でプロトタイプ、1 日以内に本番導入も可能

こうすれば Wordwise のように HTML 行間をいじらず、軽量＆メンテ容易 な語注機能が実装できます！


------------------------

“しおり機能” 実装指示書

0. ゴール
/reading で単語を ダブルタップすると赤くマーキング → ポップアップ「ここで一時中断しますか？」

Yes を押すとテキストを閉じてトップへ戻る。同時に しおり情報を保存

トップに 「前回の続きを読む」 ボタン出現

ボタンを押すと該当ストーリーを開き、しおり単語の位置まで自動スクロール

コンテンツはぼかした状態で 「読書を再開する」 ボタン表示 → クリックでぼかし解除 & 読書再開（ダブルタップした単語は赤で示す）

しおりは 1 件だけ保持（上書き方式）

1. データ保存仕様
localStorage.key = reading_bookmark

値は JSON 文字列

json
コードをコピーする
{
  "slug": "notting-hill",   // ストーリー識別子
  "level": 2,               // 1|2|3
  "tokenIndex": 473         // ダブルタップした単語の index
}
しおり削除は「読書を再開する」ボタン押下時に removeItem

2. /reading 改修
2-1 トークン span に index 属性
tsx
コードをコピーする
<span
  key={i}
  data-idx={i}
  onClick={handleTap}
  className={clsx(isHard && 'cursor-help', bookmarkIdx===i && 'bookmark-token')}
/>
2-2 ダブルタップ検知
ts
コードをコピーする
let lastTap = 0;
function handleTap(e) {
  const now = Date.now();
  if (now - lastTap < 300) {           // 2 回目
    const idx = Number(e.currentTarget.dataset.idx);
    setConfirm({ idx, x: e.clientX, y: e.clientY });
  }
  lastTap = now;
}
2-3 確認ポップアップ
Radix Dialog で実装

「ここで一時中断しますか？」 → はい / いいえ

はい

localStorage.setItem('reading_bookmark', JSON.stringify({slug,level,tokenIndex:idx}))

router.push('/choose')

文字色は CSS .bookmark-token{ color:#d00; }

3. トップページ改修
tsx
コードをコピーする
const bm = JSON.parse(localStorage.getItem('reading_bookmark')||'null');
{bm && (
  <Button onClick={()=>router.push(`/reading?slug=${bm.slug}&resume=1`)}
  >前回の続きを読む</Button>
)}
4. /reading 再開モード
tsx
コードをコピーする
const resume = router.query.resume==='1';
const bm = JSON.parse(localStorage.getItem('reading_bookmark')||'null');
useEffect(()=>{
  if(resume && bm && bm.tokenIndex!=null){
     document.querySelector(`[data-idx='${bm.tokenIndex}']`)
        ?.scrollIntoView({behavior:'auto',block:'center'});
     setOverlay(true);
  }
},[]);
overlay 状態

全文を <div className={overlay && 'blur-[4px] pointer-events-none'}> で包む

画面中央に ResumeDialog （shadcn AlertDialog）

ボタン 「読書を再開する」 →

setOverlay(false)

document.querySelector('.bookmark-token')?.focus()

localStorage.removeItem('reading_bookmark')

5. CSS 追加
css
コードをコピーする
.bookmark-token   { color: #d00; text-decoration: underline; }
.blur-[4px]       { filter: blur(4px); }
6. 作業順序
git checkout -b feat/bookmark

/reading でトークン span に data-idx 追加

ダブルタップロジック & 確認ポップアップ追加

トップページに「前回の続きを読む」ボタン追加

/reading 再開モード (resume param) 実装

CSS と Radix UI ダイアログ用コンポーネント追加

e2e：

ダブルタップ→保存→トップ移動

「前回の…」→ 自動スクロール＆ぼかし → 再開

PR → ステージング → 本番

備考

ダブルタップ判定 300 ms は iOS/Android で実測し調整可。

縦長ページでスクロールがズレる場合は requestAnimationFrame で遅延実行。

---

## 🔧 実装時の補足情報 (2025-07-11追記)

### 現在のシステム状況
- **ReadingClient**: `/src/app/reading/ReadingClient.tsx` にメイン実装
- **単語分割**: `renderClickableText()` 関数で `/(\s+|[.!?;:,\-\u2013\u2014()"])/` パターンで分割済み
- **クリック処理**: Event Delegation方式で実装済み (`handleTextClick`, `handleTextTouch`)
- **単語要素**: `<span className="clickable-word">` でスタイリング済み

### 既存の単語処理構造
```tsx
// L1018-1042: renderClickableText内の単語処理
const words = part.split(/(\s+|[.!?;:,\-\u2013\u2014()"])/);
words.map((word, wordIndex) => {
  if (/^[a-zA-Z]+$/.test(word)) {
    return (
      <span
        key={`${partIndex}-${wordIndex}`}
        className="clickable-word cursor-pointer hover:bg-yellow-200/50"
        data-word={word}
      >
        {word}
      </span>
    );
  }
});
```

### 実装時の修正ポイント

#### 1. tokenIndex計算の追加
現在は `partIndex-wordIndex` のkeyを使用しているが、しおり機能には **連続したtokenIndex** が必要。
```tsx
// 修正必要: 全体を通したtoken番号を計算
let globalTokenIndex = 0;
// 各単語spanに data-idx={globalTokenIndex} を追加
```

#### 2. ダブルタップ検知の統合
既存のタッチ処理(`handleTextTouch`)とクリック処理(`handleTextClick`)にダブルタップ判定を追加。

#### 3. トップページは `/choose/page.tsx`
しおり復帰ボタンは `/src/app/choose/page.tsx` に追加する。

#### 4. URLパラメータ処理
既存の `/reading?slug=xxx&level=xxx` 形式に `&resume=1` を追加。
現在の searchParams処理: `const params = await searchParams || {};`

#### 5. 必要な新規コンポーネント
- `BookmarkDialog.tsx` - 中断確認ポップアップ
- `ResumeDialog.tsx` - 読書再開ダイアログ
- CSS追加: `.bookmark-token`, `.blur-[4px]`

#### 6. localStorage管理
```ts
interface BookmarkData {
  slug: string;
  level: number; 
  tokenIndex: number;
}
```

### Next.js 15対応注意点
- `searchParams`は非同期: `const params = await searchParams;`
- `useRouter`は`next/navigation`から: `import { useRouter } from 'next/navigation';`

### 実装順序の詳細
1. **tokenIndex追加**: `renderClickableText`でglobalTokenIndex計算
2. **ダブルタップ検知**: 既存タッチ処理に300ms判定追加
3. **BookmarkDialog**: 中断確認UI作成
4. **localStorage保存**: 中断時のデータ保存
5. **choose/page.tsx**: 復帰ボタン追加
6. **reading再開モード**: resume=1パラメータ処理
7. **ResumeDialog**: ぼかし状態+再開UI
8. **スクロール処理**: scrollIntoView実装
9. **CSS追加**: bookmark-token, blur効果
10. **E2E テスト**: 中断→復帰の完全フロー


回答
🛠 技術面
1. slug 取得方法

/reading では searchParams.slug（router.query.slug など）を正式ルートとしてください。

initialData から逆算する必要はありません。常に URL クエリを信頼します。

2. level 取得／保存

■ 方針変更

しおり JSON に “その時点の level” を固定で保存し、再開時は必ずその level を使う。

現在の localStorage.vocabLevel には 影響させない（＝後でユーザーが /choose でレベルを上げ下げしても、しおり側は変わらない）。

👉 実装変更点
しおり保存

ts
コードをコピーする
localStorage.setItem(
  'reading_bookmark',
  JSON.stringify({ slug, level: userLevel, tokenIndex: idx })
);
userLevel は /reading 入場時に確定した値をそのまま記録。

「前回の続きを読む」ボタン

URL に level=<bookmark.level> を付与して遷移

tsx
コードをコピーする
router.push(`/reading?slug=${bm.slug}&level=${bm.level}&resume=1`);
/reading 側では

ts
コードをコピーする
const level = Number(searchParams.level)   // ← これを DB クエリに使用
レベル変更としおり競合

すでに同じ slug で異なる level のしおりが存在するときは
「この作品には以前 Level X のしおりがあります。上書きしますか？」

Yes → bookmark 上書き

No → しおり作成キャンセル

読書再開後のレベル UI

ページ右上などに “You are reading: Level X” を小さく表示しておくと混乱を防げる。

/choose で別レベルを選び直しても、しおり側のレベルは保持されたまま。



3. tokenIndex の定義範囲

英語テキスト全体をトークン化した配列（tokens[]）の連番 indexを使用します。

段落ごとにリセットしません。

句読点もトークン列に含めている場合はそのまま数えて OK。

日本語訳ブロックが将来入る場合は日本語トークンを除外し、英語部分だけ連番にしてください。

📱 UX 面
4. シングル vs. ダブルタップの競合

シングルタップ → 辞書ポップアップ

ダブルタップ → しおり確認ダイアログ

300 ms 以内の 2 回連続タップをダブルタップと判定。

シングルタップ処理は setTimeout で 300 ms 遅延実行し、後からダブルタップが来たらキャンセルする方法が確実。

5. 赤マーキングの持続時間

再開後、赤色マーキングは 3 秒後に自動で消す実装にしてください。

ts
コードをコピーする
if(resume){
  setTimeout(()=> removeBookmarkClass(), 3000);
}
6. 複数ストーリーでの上書き確認

既に reading_bookmark が存在し、slug が異なる場合は
「別のストーリーでもしおりを使用中です。上書きしますか？」 ダイアログを表示。

Yes → 既存しおりを上書き。

No → 新規しおりを作成せず処理終了。

7. 中断時も読了処理と同じ統計計算

しおり作成時点で

wordsRead = tokenIndex

readingTime = now - sessionStart

wpm = wordsRead / (readingTime / 60_000)

これらを通常の読了保存ロジックに流してください（例: ProgressService.saveSession()）。

つまり「しおり中断」でもダッシュボードに総語数・平均 WPM が積算されます。


1. tokenIndex 計算方法
全段落を通した連番に統一してください。

実装案（簡略）：

tsx
コードをコピーする
let globalIdx = 0;
paragraphs.map((p, pIdx) => {
  const words = splitIntoTokens(p);          // 句読点も含む
  return words.map((w, wIdx) => {
    const thisIdx = globalIdx++;
    return <span data-idx={thisIdx} ...>{w}</span>;
  });
});
既存の wordIndex はローカルインデックスとして残しても構いませんが、
しおり用には data-idx={globalIdx} を必ず付与します。

2. 中断時の統計計算 (wordsRead)
語数（英単語のみ） で集計してください。

方法：

ts
コードをコピーする
const wordsRead = tokens
  .slice(0, tokenIndex)
  .filter(t => /^[A-Za-z]+$/.test(t)).length;
tokenIndex は 句読点 を含む連番で OK。

統計を出す直前に正規表現 /^[A-Za-z]+$/ で英単語だけを数えます。

3. レベル競合ダイアログ表示タイミング
ダブルタップ直後（handleTap 内でダブルタップ判定に成功したタイミング）に、
既存しおりが同じ slug かつ 異なる level の場合にのみ表示します。

ts
コードをコピーする
const bm = JSON.parse(localStorage.getItem('reading_bookmark')||'null');
if (bm && bm.slug === slug && bm.level !== userLevel) {
   showOverwriteDialog(bm.level, userLevel);
   return;     // ユーザー選択後に saveBookmark or cancel
}
UI 文言例：
「この作品には以前 Level {bm.level} のしおりがあります。
新しい Level {userLevel} で上書きしますか？」

4. resume=1 パラメータの除去タイミング
「読書を再開する」ボタン押下時に除去します。

実装例（Next.js router）：

ts
コードをコピーする
const handleResume = () => {
  setOverlay(false);
  localStorage.removeItem('reading_bookmark');
  const { slug, level } = router.query;
  router.replace(`/reading?slug=${slug}&level=${level}`, undefined, { shallow: true });
};
router.replace を使い履歴を汚さずクエリを上書き。

以降 F5 しても resume=1 は付かない状態になります。

