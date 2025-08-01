「読みトレ」スタンプカード機能 実装計画書
🎯 プロジェクト概要
目的
英語をやり直す大人向け多読アプリに、継続学習を支援するスタンプカード機能を実装する。
ターゲットユーザー

英語初中級者の大人
1日15-30分の学習時間
継続が課題の学習者

既存機能との統合

ネコが世界を旅する（語数に応じて）
現地からメールが届く
ユーザーの興味に合わせた自動生成コンテンツ＋物語

📊 基本設計
スタンプカードの階層構造
1スタンプ = 1話読了（約200語）
├── スタンプ（基本単位）
│   └── 1話読了でスタンプ1個
├── カード（中期目標）
│   └── 50スタンプで1枚完成
├── コイン（進捗の可視化）
│   └── 20スタンプごとに1枚
└── トロフィー（長期目標）
    ├── ブロンズ：5枚のカード完成（約50,000語）
    ├── シルバー：5個のブロンズ（約250,000語）
    ├── ゴールド：5個のシルバー（約1,250,000語）
    └── プラチナ：4個のゴールド（約5,000,000語）
ビジュアルデザイン

カードは「旅のルートマップ」形式
10スタンプごとにメール配信
カード完成 = 1つの旅の完結

🚀 実装機能詳細
1. 即時フィードバック機能
typescript// スタンプ獲得時の演出
- 足跡アニメーション（ぽんっと出現）
- 褒め言葉ランダム表示（"Nice!", "Great!", "Fantastic!"等）
- 5の倍数で特別エフェクト（キラキラ演出）
- 効果音（オプション）
2. 連続ログインボーナス
typescript// 報酬体系
3日連続：ボーナススタンプ+1
7日連続：特別な切手デザイン解放
14日連続：ネコの特別アクセサリー解放
30日連続：「旅の思い出アルバム」1ページ追加
3. デイリー達成システム
typescript// 毎日の小さな目標
- 今日の最初の1話：「スタートスタンプ」
- 1日3話達成：「デイリーボーナススタンプ」（同じものを読んでも回数にカウント）
- 週末チャレンジ：土日に5話読むとボーナス
4. 挫折防止機能
typescript// おかえりボーナス
- 3日以上ログインが空いても責めない
- 「また会えて嬉しい！」の温かいメッセージ
- 復帰ボーナススタンプ進呈
5. 進捗の可視化
typescript// 常時表示要素
- 現在のスタンプ数／50
- 次の目的地まで：あと○スタンプ
- 今月の読了語数
- 連続ログイン日数
💾 データ構造
ユーザーデータ
typescriptinterface UserProgress {
  // 基本データ
  totalStamps: number;          // 累計スタンプ数
  totalWords: number;           // 累計読了語数
  currentCardStamps: number;    // 現在のカード内スタンプ数（0-49）
  completedCards: number;       // 完成したカード枚数
  
  // コイン・トロフィー
  bronzeCoins: number;          // ブロンズコイン数
  bronzeTrophies: number;       // ブロンズトロフィー数
  silverTrophies: number;       // シルバートロフィー数
  goldTrophies: number;         // ゴールドトロフィー数
  platinumTrophies: number;     // プラチナトロフィー数
  
  // 連続ログイン
  consecutiveLoginDays: number;  // 連続ログイン日数
  lastLoginDate: string;        // 最終ログイン日
  
  // デイリー達成
  dailyStoriesRead: number;     // 今日読んだ話数
  dailyFirstStoryBonus: boolean; // 今日の最初の話ボーナス取得済み
  dailyGoalAchieved: boolean;   // デイリー目標達成済み
  
  // メール管理
  unreadMails: Mail[];          // 未読メール
  mailHistory: Mail[];          // メール履歴
}

interface Mail {
  id: string;
  stationName: string;          // 到着した都市名
  title: string;                // メールタイトル
  content: string;              // メール本文（英語）
  imageUrl: string;             // ご当地画像URL
  receivedAt: string;           // 受信日時
  isRead: boolean;              // 既読フラグ
}
📝 実装TODO
Phase 1: 基本機能（必須）

 スタンプカードUIコンポーネント作成

 旅ルートマップ形式のデザイン
 50マスの進捗表示
 現在地のハイライト


 スタンプ獲得ロジック実装

 1話読了 = 1スタンプ
 データベース更新処理


 即時フィードバック実装

 足跡アニメーション
 語数カウントアップ
 褒め言葉表示



Phase 2: 継続支援機能

 連続ログインボーナス実装

 ログイン日数カウント
 報酬付与ロジック


 デイリー達成システム

 日次リセット処理
 ボーナススタンプ付与


 おかえりボーナス

 復帰検知ロジック
 温かいメッセージ表示



Phase 3: メール・トロフィー機能

 ご当地メール機能

 10スタンプごとの配信
 メール一覧画面
 未読管理


 トロフィーシステム

 各種トロフィー表示
 プロフィール統合
 獲得演出



Phase 4: 拡張機能（余裕があれば）

 難易度自動調整
 月間ランキング（匿名）
 みんなの旅マップ
 プッシュ通知（リマインダー）

🛠 技術仕様
プラットフォーム

iOS/Android両対応
React Native使用想定

必要なAPI
typescript// 既存APIへの追加
POST /api/stories/{storyId}/complete
GET /api/users/{userId}/progress
PUT /api/users/{userId}/stamps
GET /api/users/{userId}/mails
アニメーション

React Native Animatedまたはreact-native-reanimated使用
Lottieアニメーション検討（スタンプ獲得演出）

📌 注意事項

大人の学習者向け配慮

過度にゲーム的にしない
シンプルで分かりやすいUI
挫折を責めない温かい設計


パフォーマンス

スタンプ獲得は即座に反映
オフライン時の考慮


段階的リリース

Phase 1から順次実装
ユーザーフィードバックを反映



1️⃣ React Native（Expo）導入は必要か？
🅰 当面は PWA（現行 Next.js）のまま強化

追加学習ゼロ。ホーム画面追加で擬似ネイティブ体験は確保。

🅱 将来 Expo Router（React Native Web 対応）へ移行する選択肢を残す

app ディレクトリ構造が Next.js と近く、“1コードで Web / iOS / Android” を実現できる。

移行時は UI ライブラリの置き換え（shadcn/ui → Tamagui など）と API 層の切り出し が鍵。

✅ 結論：短期は PWA、機能が安定したら Expo でモバイル版を追加する二段階が安全。

2️⃣ 既存ロジックとの連携
🏷️ 語数カウントや読了フックは /lib/readingUtils.ts など共通関数として抽出し、Web でも RN でも同じファイルを import する。

🌐 読書完了時の更新 API を /api/progress に一本化し、RN 側も fetch で叩くだけにする。

🗂️ グローバルステート管理は React Context か Zustand を採用し、totalWords や stamps をどの画面でも参照できるようにする。

3️⃣ データ保存の方針
🔌 オフライン：現行の localStorage（Expo なら AsyncStorage）で即時書き込み → オフラインでも動作を保証。

☁️ オンライン同期：後段で Supabase を導入し、user_progress テーブルに自動同期。

🔄 初回ログイン時マイグレーション：ローカルに残っている totalWords 等を Supabase に INSERT／CONFLICT UPDATE して整合性を取る。

4️⃣ UI／UX の方向性
🎨 デザインは“シンプル＋落ち着いた色味”を維持して“大人でも恥ずかしくない”見た目に。

🎮 足あとスタンプや演出は ON/OFF トグルを追加し、ゲーミフィケーションが苦手な人は非表示に切り替え可能にする。

🚀 読了演出は 1.5 秒程度のトースト＋プログレスバー にとどめ、フル画面アニメはスキップできる設計に。

✅ まとめ
まずは PWAを磨く → Expo 対応は中期タスク。

語数計算・読了フックを共通ロジック化し、Web/RN 両対応を見据える。

localStorage → Supabase の二段保存で既存ユーザーを切らさずにクラウド同期へ移行。

大人向け UI を保ちつつ、ゲーム要素は可視化＆トグルで調整。



# スタンプカード UI の実装指示

## 目的
- 「読みトレ」で読了数を可視化するスタンプカードを表示する
- デザインは `/public/images/card.png` の画像右側を参考に
- 上部にオレンジ地#FFA453に茶色#6E3129の文字で「Stamp Card」
- その下の欄の色は#fcd8a8、黒字で「一つ読むごとにスタンプ進呈。20個たまると〜からメールが届きます。」〜には付けた名前を。テキストの右には茶：#6E3129の円、その中にネコの画像`/public/images/cat-icon.png` 
  - 20 マス（5 列 × 4 行）、枠線は茶：#6E3129
  - スタンプ未取得：白
  - スタンプ取得：**肉球アイコン**  
    （肉球は `/public/images/stamp.png`を利用）

## 技術条件
- **Next.js (App Router) + Tailwind CSS + TypeScript**
- UI ライブラリは **shadcn/ui** を優先
- 1 コンポーネントにまとめ、再利用できるよう Props で制御  
  - `filledCount: number` – 押されたスタンプ数 (0–20)
  - `onComplete?: () => void` – 20 個埋まった直後に呼び出すコールバック
- アニメーションは **Framer Motion** で “スタンプがポン” とスケールイン
- 画像アセット
  - `/public/images/stamp.png`（黒い肉球ロゴ）を `<Image>` で読み込む  
    - サイズ 40 × 40 px に調整
- レスポンシブ
  - 横幅 320 px で収まるよう `w-[320px]` 固定
  - モバイル優先、PC では中央寄せ

## コード例のフォーマット
- すべて **```tsx** ```** 内に収める（日本語コメント可）
- 余計な解説文はコード外に一行で簡潔に書く


## バグ発生
現在スタンプの累計が133個、で、33/20とな
  ってる。つまり20で次のスタンプカードに行
  くべきところが、切り替わらずにずっと数字
  が増えている状態。修正して。

⏺ 問題を確認しました。スタンプカードの表示
  が「33/20」となっているのは、20個でカー
  ド完成するはずなのに正しく切り替わってい
  ない状態ですね。

  まず現在の問題を詳しく調べます：

⏺ Update Todos
  ⎿ ☐ スタンプカード表示の修正 -          
      20個でカード切り替わりが動作しない
      問題を解決
    ☐ カード完成ロジックが正しく動作する
      ことを確認

⏺ Search(pattern: "currentCardStamps.*20",
         glob: "**/*.tsx", output_mode:
        "content")
  ⎿  Found 0 lines 

⏺ Search(pattern: "currentCardStamps",
        glob: "**/*.ts*", output_mode:
        "content")
  ⎿  Found 146 lines (ctrl+r to expand)

⏺ 問題が見つかりました！コードを見ると、st
  amp.mdの仕様とコードが混在しています：

  1. stamp.md仕様: 20個でカード完成
  2. 現在のコード: 50個でカード完成（% 
  50、Math.floor(totalStamps / 50)）

  この不整合を修正する必要があります。NewS
  tampCardコンポーネントも20個想定で作られ
  ているので、全体を20個仕様に統一します：

⏺ Update(src/lib/readingProgress.ts)
  ⎿ Updated src/lib/readingProgress.ts    
    with 2 additions and 2 removals
      58          if (parsed.totalStamps 
           !== expectedStamps) {
      59            // Stamp count 
           mismatch detected - correcting 
           silently
      60            parsed.totalStamps = 
           expectedStamps;
      61 -          
    parsed.currentCardStamps =
    expectedStamps % 50;
         - parsed.currentCardStamps = 
         - expectedStamps % 50;
      62 -          parsed.completedCards 
    = Math.floor(expectedStamps / 50);
         - = Math.floor(expectedStamps / 
         - 50);
      61 +          
    parsed.currentCardStamps =
    expectedStamps % 20; // 
    20個でカード完成
         + parsed.currentCardStamps = 
         + expectedStamps % 20; // 
         + 20個でカード完成
      62 +          parsed.completedCards 
    = Math.floor(expectedStamps / 20);
         + = Math.floor(expectedStamps / 
         + 20);
      63            // 
           修正したデータを保存
      64            
           saveUserProgress(parsed);
      65          }

⏺ Update(src/lib/readingProgress.ts)
  ⎿ Updated src/lib/readingProgress.ts    
    with 2 additions and 2 removals
      102        // 
    レガシーデータは既存の
            completedReadings値を使用
      103        const legacyReadings = 
            
    parseInt(localStorage.getItem(
            'completedReadings') || '0', 
            10);
      104        progress.totalStamps = 
            legacyReadings;
      105 -      
    progress.currentCardStamps =
    progress.totalStamps % 50;
          - progress.currentCardStamps = 
          - progress.totalStamps % 50;
      106 -      progress.completedCards 
    = Math.floor(progress.totalStamps /
    50);
          -  
    Math.floor(progress.totalStam
          - ps / 50);
      105 +      
    progress.currentCardStamps =
    progress.totalStamps % 20; // 
    20個でカード完成
          + progress.currentCardStamps = 
          + progress.totalStamps % 20; // 
          + 20個でカード完成
      106 +      progress.completedCards 
    = Math.floor(progress.totalStamps /
    20);
          +  
    Math.floor(progress.totalStam
          + ps / 20);
      107      }
      108      
      109      // データ整合性チェック - 
            
    語数とスタンプ数の論理的チェッ
            ク