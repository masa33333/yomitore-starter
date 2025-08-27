# 読みトレ：Daily Reading 統合 仕様書 v1.0（2025-08-25）

作成者：ChatGPT（GPT-5 Thinking）
対象読者：プロダクトオーナー、エンジニア（Next.js + TS + Supabase）、デザイナー、運用担当、コンテンツ編集者、**Codex CLI**

---

## 0. ゴール / 非ゴール

### ゴール

* 既存「読みトレ」に **第3の柱：Daily Reading（毎日追加型コンテンツ）** を統合し、

  * 毎日1本（3レベル：L1≈80語 / L2≈100語 / L3≈120語）を配信
  * アプリ内で「今日の1本」＋「アーカイブ」を無限に読める
  * 既読・語数・WPM・Streak（連続日数）を計測
  * 既存の「猫の旅」進行（スタンプ/コイン/手紙）へ語数を反映
  * 任意で **メール配信**（Gmail登録ユーザー）

### 非ゴール

* 既存の物語生成・読み物生成の大改修（軽いUI回遊導線の追加は含む）
* アプリ外プラットフォーム（note/Substack）運用の詳細（導線想定のみ）
* 完全自動のファクトチェック（初期は簡易＋人間最終確認）

---

## 1. 主要ユーザーストーリー

* U1：学習者として、毎朝アプリ（またはメール）で「今日の1本」を知り、3分で読み切りたい。
* U2：学習者として、レベル（L1/L2/L3）を簡単に切り替え、同一テーマを段階的に理解したい。
* U3：学習者として、読了語数・WPM・Streakが伸びるのを視覚的に確認したい。
* U4：学習者として、過去の記事をカテゴリ/タグ/レベルで探して多読したい。
* U5：運用者として、1週間分のDailyを予約投稿し、毎朝自動公開したい。

---

## 2. 体験設計（情報設計 / 画面遷移）

### 2.1 トップ（`/`）

* ヒーロー：**今日の1本**（タイトル・カテゴリ・語数・TTS・「読む」ボタン）
* 3カード：

  1. 物語を作る  2) 読み物を作る  3) **Daily Reading**
* 右（または下段）：累計語数・今月語数・Streak・次の都市到着までの残語数

### 2.2 Daily（`/daily`）

* タブ：**今日**｜**アーカイブ**
* 今日タブ：

  * レベル切替（L1/L2/L3）+ 各語数表示
  * 本文（辞書ポップアップ / WPMタイマー / TTS）
  * 完了ボタン → Streak更新 → CTA（もう一度読む / レベルを上げる / 他を読む）
* アーカイブ：カテゴリ・タグ・レベル・未読/既読フィルタ、年月ピッカー、並び替え（新着/人気/短い順）

### 2.3 通知設定（`/settings/notifications`）

* Gmail OAuth登録、メール配信 ON/OFF、配信時刻（既定 07:00 Asia/Bangkok）、希望レベル（複数可）
* テスト送信ボタン

### 2.4 既存ページの回遊導線

* `/reading` `/story` のフッターに「今日の1本」ショートカット

---

## 3. コンテンツ仕様

* 1日1テーマ、**3レベル**（L1≈80±10 / L2≈100±15 / L3≈120±15語）
* テーマ例：ライフハック / 健康 / 心理 / ビジネス思考（出典は一次研究・PD・一般的事実）
* 著作権ポリシー：**特定書籍の固有表現や章立てを模倣しない**。事実主張には `source_refs` にURL/DOI等を記録。
* 語彙ポリシー（NGSLベース／2025-06-26合意）：

  * Level 1：NGSL 1–500 ≧80%、501–1000 ≤20%
  * Level 2：NGSL 1–1000 ≧80%、1001–1500 ≤20%
  * Level 3：NGSL 1–1500 自由、必要に応じ上位語彙も少量容認

---

## 4. データモデル（Supabase / Postgres）

> 既存DBに追加。RLS有効。

### 4.1 ER 図（テキスト）

* `articles` 1 - n `article_levels`
* `articles` 1 - n `article_stats_daily`（任意）
* `users` 1 - n `user_reads`
* `users` 1 - 1 `user_streaks`
* `users` 1 - 1 `subscriptions`

### 4.2 DDL（マイグレーション）

```sql
-- 001_daily_schema.sql
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text check (category in ('lifehack','health','psychology','business')) not null,
  tags text[] default '{}',
  published_at timestamptz,
  status text check (status in ('draft','scheduled','published')) not null default 'draft',
  hero_image_url text,
  source_refs jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_levels (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  level int not null check (level in (1,2,3)),
  word_count int not null,
  reading_time_sec int not null,
  body_md text not null,
  audio_url text,
  glossary jsonb,
  created_at timestamptz not null default now(),
  unique(article_id, level)
);

create table if not exists public.user_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  level int not null check (level in (1,2,3)),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  wpm numeric,
  words_read int default 0,
  bookmarked boolean default false,
  liked boolean default false
);

create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_read_date date
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_opt_in boolean not null default false,
  preferred_time time,
  level_pref int[] check (level_pref <@ array[1,2,3]),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.user_reads enable row level security;
alter table public.user_streaks enable row level security;
alter table public.subscriptions enable row level security;

create policy user_reads_isolation on public.user_reads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy user_streaks_isolation on public.user_streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy subscriptions_isolation on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 更新トリガー
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

create trigger trg_articles_updated_at before update on public.articles
for each row execute function public.set_updated_at();

create trigger trg_subscriptions_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();
```

### 4.3 インデックス（必要に応じて）

```sql
create index if not exists idx_articles_published_at on public.articles(published_at desc);
create index if not exists idx_articles_status on public.articles(status);
create index if not exists idx_levels_article on public.article_levels(article_id);
create index if not exists idx_user_reads_user on public.user_reads(user_id);
```

---

## 5. 型定義（`/types/daily.ts` 抜粋）

```ts
export type Category = 'lifehack' | 'health' | 'psychology' | 'business';

export interface Article {
  id: string; slug: string; title: string; category: Category;
  tags: string[]; published_at: string | null; status: 'draft'|'scheduled'|'published';
  hero_image_url?: string; source_refs: any[];
}

export interface ArticleLevel {
  id: string; article_id: string; level: 1|2|3; word_count: number;
  reading_time_sec: number; body_md: string; audio_url?: string | null; glossary?: any;
}

export interface DailyTodayResponse {
  article: Article;
  levels: Record<'1'|'2'|'3', ArticleLevel>;
  userRead?: { started_at: string; finished_at?: string; level?: 1|2|3 };
}
```

---

## 6. API 設計（Next.js App Router）

* `GET /api/daily/today`

  * 目的：本日公開済みの記事セットとレベル本文を返す
  * ロジック：`articles.status='published' and date_trunc('day', published_at AT TIME ZONE 'Asia/Bangkok') = current_date AT TIME ZONE 'Asia/Bangkok'`
* `GET /api/daily/archive?limit=20&offset=0&category=&level=&query=&month=2025-08`
* `GET /api/articles/[slug]`（記事メタ+ユーザー既読状況）
* `GET /api/articles/[slug]/level/[1|2|3]`（本文）
* `POST /api/reads/start` `{ article_id, level }`
* `POST /api/reads/finish` `{ read_id, finished_at?, wpm, words_read }`
* `POST /api/bookmark` `{ article_id, level, on }`
* `POST /api/like` `{ article_id, on }`
* `GET /api/settings/subscription` / `POST /api/settings/subscription`

### 6.1 例：`/api/daily/today/route.ts`

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const TZ = 'Asia/Bangkok';

export async function GET() {
  const supabase = createClient();
  const now = new Date();
  const zoned = utcToZonedTime(now, TZ);
  const start = new Date(zoned); start.setHours(0,0,0,0);
  const end = new Date(zoned); end.setHours(23,59,59,999);

  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('status','published')
    .gte('published_at', zonedTimeToUtc(start, TZ).toISOString())
    .lte('published_at', zonedTimeToUtc(end, TZ).toISOString())
    .order('published_at', { ascending: false })
    .limit(1);

  if (!articles?.length) return NextResponse.json({ article: null }, { status: 200 });
  const article = articles[0];
  const { data: levels } = await supabase
    .from('article_levels')
    .select('*')
    .eq('article_id', article.id);

  const grouped: any = { '1': null, '2': null, '3': null };
  levels?.forEach(l => grouped[String(l.level)] = l);

  return NextResponse.json({ article, levels: grouped });
}
```

---

## 7. スケジューリング / 配信

### 7.1 公開スケジュール

* **公開時刻**：毎日 07:00 Asia/Bangkok（可変）
* 実装：Vercel Cron or Supabase Scheduler

  * エンドポイント：`/api/admin/publish-daily`（管理者のみ）
  * 動作：`status='scheduled' and published_at <= now()` を `published` に更新 → ISR再検証

### 7.2 メール配信

* 送信時刻：ユーザー設定（既定 07:00 Asia/Bangkok）
* 送信バッチ：

  1. 0:05 に当日記事が存在するか確認
  2. サブスクONユーザーへキュー作成（希望レベルを本文に）
  3. 既定時刻に一括送信
* 件名例：`[Yomitore] 今日の英語1本（L1/L2/L3）`
* 本文：冒頭100字 + CTA → `/daily`

---

## 8. Streak & WPM 仕様

### 8.1 WPM

* `WPM = words_read / (reading_seconds / 60)`
* `words_read` は本文の `word_count` を採用（ペナルティなし）

### 8.2 Streak（日付境界）

* タイムゾーン：**Asia/Bangkok**
* ロジック：

  * 初回完了：`current_streak = 1; longest = 1; last_read_date = today`
  * 翌日も完了：`current_streak += 1; longest = max(longest, current_streak)`
  * 1日以上空く：`current_streak = 1; last_read_date = today`
* 判定は `finished_at` の現地日付で行う

---

## 9. UI 仕様（要件）

* レベル切替はタブUI（L1/L2/L3）で1タップ切替、各タブに語数バッジ
* 読了時モーダル：

  * A) もう一度読む  B) レベルを上げる  C) 他を読む（アーカイブ）
* 進捗ウィジェット：

  * 累計語数、今月語数、Streak、次の都市到着までの残語数
* アクセス制御：

  * 無料：最新L1 + アーカイブ直近3件（L1のみ）
  * Pro：全レベル・アーカイブ無制限・TTS
  * Plus：メール配信・レポート

---

## 10. セキュリティ / 権利 / プライバシー

* Supabase RLS：`user_reads`/`user_streaks`/`subscriptions` は本人のみ参照可
* APIキー（TTS/AI）：サーバー側のみ保持
* 著作権：PD作品や一次研究の事実を自作解説化。固有表現コピー禁止
* ログ：PII最小化。メールは配信同意（opt-in）を分離

---

## 11. 計測（Event 設計）

* `daily_opened` { article\_id, from: 'email'|'home'|'footer' }
* `daily_level_switched` { from\_level, to\_level }
* `daily_completed` { article\_id, level, seconds, wpm }
* `archive_filter_used` { filters }
* `streak_updated` { new\_value }

---

## 12. 料金プラン（初期）

* Free：最新L1 + 直近3件 L1 / TTSなし
* Pro（¥980/月）：L1-L3/無制限/TTS/バッジ
* Plus（¥1,480/月）：Pro + メール配信 + 月次レポート + 特別レター

---

## 13. コンテンツ生成ワークフロー（運用）

1. 週次でテーマを7本確定（カテゴリ/タグ付）
2. 3レベル原稿をAI生成（**下記プロンプト雛形**）
3. 語数・NGSL比率・禁則チェック（自動）
4. 人間最終チェック（5分/本）
5. `status='scheduled'` で登録（`published_at` 設定）
6. 翌朝自動公開 + メール送信

### 13.1 生成プロンプト雛形（内部）

```
役割: 英語多読教材ライター。対象: 日本の成人学習者。
出力: 同一テーマを L1/L2/L3 の3段階で、指示語数±許容誤差、Markdownで。
禁則: 具体的書籍の固有表現・章立て・比喩の模倣禁止。事実主張は一般化。
語彙: NGSLポリシー順守（L1:1–500≧80% 等）。
L1: 80±10語。短文中心。具体例1つ。抽象語回避。
L2: 100±15語。理由＋例2つ。接続詞(because/however/therefore)。
L3: 120±15語。抽象化＋応用1。最後に 1問の自己問答。
出力形式:
# Title
## Level 1 (≈80 words)
...
## Level 2 (≈100 words)
...
## Level 3 (≈120 words)
...
```

---

## 14. Codex CLI 向け実装タスクリスト（順序）

**T1. DB マイグレーション**

* 新規SQL `supabase/migrations/001_daily_schema.sql` を追加し適用

**T2. 型とSDK**

* `/types/daily.ts` 追加
* 既存 Supabase クライアントラッパ（`/lib/supabase/server.ts`）流用

**T3. API ルート**

* `app/api/daily/today/route.ts`（上記サンプル）
* `app/api/daily/archive/route.ts`
* `app/api/reads/{start,finish}/route.ts`
* `app/api/settings/subscription/{GET,POST}/route.ts`

**T4. UI**

* `app/daily/page.tsx`：タブ（今日/アーカイブ）、カード一覧、フィルタ
* `app/daily/[slug]/page.tsx`：詳細、レベルタブ、完了モーダル
* 共通：進捗ウィジェット、フッターCTA

**T5. スケジューラ**

* Vercel Cron → `vercel.json` に下記を追加：

```json
{
  "crons": [
    { "path": "/api/admin/publish-daily", "schedule": "0 7 * * *" }
  ]
}
```

* `app/api/admin/publish-daily/route.ts` 実装（管理者チェック）

**T6. メール配信**

* 送信サービス選定（例：Resend/自前SMTP）
* `app/api/admin/send-daily-email/route.ts`（内部用）
* テンプレ（件名/本文/CTA）

**T7. 計測**

* `analytics.track()` フックをDaily主要イベントに埋め込む

**T8. アクセス制御**

* プラン判定ミドルウェア（無料/Pro/Plus）
* UI上のロック表示と誘導

**T9. QA / E2E**

* Playwrightで `publish→today表示→完了→streak更新` の一連を自動化

---

## 15. .env（例）

```
NEXT_PUBLIC_APP_NAME=Yomitore
TIMEZONE=Asia/Bangkok
EMAIL_FROM=noreply@yomitore.app
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
TTS_PROVIDER=...
OPENAI_API_KEY=...
```

---

## 16. 受け入れ基準（Acceptance Criteria）

* [ ] 07:00 (Asia/Bangkok) に当日記事が自動で `published` になり `/daily` に出現する
* [ ] L1/L2/L3 の語数が仕様範囲内
* [ ] 完了時に `user_reads` が作成・更新され、WPMが保存される
* [ ] 当日の完了で Streak が正しく増加（境界テスト含む）
* [ ] 無料ユーザーは最新L1と直近3件のみ閲覧可、Pro以上は制限なし
* [ ] メール配信ONユーザーへ当日朝に配信され、CTAで `/daily` に遷移

---

## 17. テスト項目（抜粋）

* タイムゾーン境界（23:59→00:01）でのStreak更新
* 公開前（scheduled）と公開後（published）の表示切替
* 語数/WPMの一貫性、離脱→再開時の再計測
* 未ログイン状態でのアクセス制御
* メール購読の再オプトイン/オプトアウト

---

## 18. ロールアウト / フィードバック

* β（2週間）：Pro無償開放、アンケート収集
* v1.0：課金ゲートON、TTS追加
* v1.1：LINE通知、簡易レコメンド

---

## 19. リスクと緩和

* コンテンツ枯渇 → 週次まとめ生成 + 予約投稿
* 著作権 → 固有表現コピー禁止・出典保存・監査ログ
* メール到達率 → DKIM/SPF設定、ハード/ソフトバウンス処理

---

## 20. 付録：管理用クエリ例

```sql
-- 今日公開された記事
select * from articles
 where status='published'
   and (published_at at time zone 'Asia/Bangkok')::date = (now() at time zone 'Asia/Bangkok')::date
 order by published_at desc;

-- Streak更新の確認
select * from user_streaks where user_id = '...';
```

---

以上。**Codex CLI** は T1→T9 の順で実装を進め、適宜この仕様書に基づき型・API・UIを補完してください。設計変更が必要な場合は本書に追記（変更履歴を更新）してから着手すること。


認証/RLS

Supabase Authを採用。auth.users 参照で既存方針どおり。

lib/supabase/server.ts で getUser() 相当から user.id を取得してRLSに流用、でOK。

タイムゾーン

.env の TIMEZONE=Asia/Tokyo を単一の真実源に。

すべての日時境界・公開判定・月次フィルタは process.env.TIMEZONE を参照（ハードコード禁止）。

DDL確定（articles / article_levels）

tags: text[]

source_refs: jsonb（中身は配列想定だが型はjsonbで柔軟に）

published_at: timestamptz

仕様書に載せたSQL全文をそのままベースに実装でOK（後述の追加テーブル差分だけ追記）。

article_stats_daily

初期スコープ外（後回し）。将来の分析強化で追加。

いいね/ブクマ

ブクマやLikeは「読了前」でも付けたい要件があるため、専用テーブルを追加します（levelは任意）：

create table if not exists public.article_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  level int check (level in (1,2,3)),
  created_at timestamptz not null default now(),
  primary key (user_id, article_id, level)
);
alter table public.article_bookmarks enable row level security;
create policy ab_isolation on public.article_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.article_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  level int check (level in (1,2,3)),
  created_at timestamptz not null default now(),
  primary key (user_id, article_id, level)
);
alter table public.article_likes enable row level security;
create policy al_isolation on public.article_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


既存の user_reads.bookmarked/liked は将来削除候補（互換のため今は残置可）。

メール送信基盤

Resend を採用。.env: EMAIL_PROVIDER=resend, RESEND_API_KEY=..., EMAIL_FROM=noreply@yomitore.app。

HTMLテンプレは templates/email/daily.html.ts に実装（件名/本文/CTAを関数化）。

TTS / audio

オンデマンド生成＋キャッシュ保存（初回要求時に生成→audio_url を article_levels に保存）。

プロバイダは env で切替：TTS_PROVIDER=openai|elevenlabs。

権限制御：TTSは Pro/Plusで有効、FreeはUIは表示するが押下でアップグレード導線。

アクセス制御（プラン）

プランは専用テーブルを追加：

create table if not exists public.user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free','pro','plus')) default 'free',
  expires_at timestamptz
);
alter table public.user_plans enable row level security;
create policy up_isolation on public.user_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


無料制限（「最新L1 + 直近3件L1」）はAPI層で絞り込み。UIはロック表示＋誘導のみ。

スラッグ/一意制約

articles.slug は UNIQUE（既に指定済み）。

レベル本文取得は slug基準で運用（/articles/[slug]/level/[1|2|3]）。

計測基盤

PostHog 採用（既存ラッパ analytics.track() を PostHogに紐づけ）。

送信は非同期fire-and-forget、失敗時はリトライ不要（ログのみ残す）。

読了処理のレベル不一致

reads.start と異なるレベルで finish された場合、最後に表示中のレベルで上書き（level を更新）。

1記事につき同日に複数レベル完了した場合はレコードを分ける（start 発火時に新規作成）。

アーカイブ検索の月別フィルタ

YYYY-MM → TIMEZONE基準（= Asia/Tokyo）で月初〜月末の範囲にマップ。

ISR再検証

publish-daily 実行時に revalidateTag('daily') を呼び出し、対象は /, /daily, /daily/[slug] を同タグで運用。

既存UIへの導線（文言）

/reading /story フッター右側：

日本語：「今日の1本（Daily）」

英語：“Today’s Daily”

ボタン（Button size="sm"）で /daily へ。

レベル語数の自動検証

公開前ジョブでバリデーション（scheduler or 管理画面保存時に実行）。

閾値：仕様値に対し ±20%でエラー（公開ブロック）、±10–20%は警告（保存OK/公開可）。

L1: 80語基準 → 許容 64–96（警告）、<64 or >96 でエラー

L2: 100語基準 → 許容 80–120（警告）、<80 or >120 でエラー

L3: 120語基準 → 許容 96–144（警告）、<96 or >144 でエラー

追加で更新したDDLまとめ（差分）

article_bookmarks, article_likes, user_plans の3テーブル追加（上記SQL）。

.env に TIMEZONE=Asia/Tokyo を追加し、コードは必ずenv参照で実装。

この回答でブロッカーは解消できるはず。Codex側はこの決定に沿って実装を進めてOKです。必要なら、/api ルートの雛形や revalidateTag('daily') 実装例もすぐ出します。