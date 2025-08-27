-- Daily Reading schema (articles, article_levels, user_reads, user_streaks, subscriptions)
-- Note: This migration assumes Supabase Auth is enabled (auth.users exists)

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

-- RLS policies for user-owned tables
alter table public.user_reads enable row level security;
alter table public.user_streaks enable row level security;
alter table public.subscriptions enable row level security;

create policy if not exists user_reads_isolation on public.user_reads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists user_streaks_isolation on public.user_streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists subscriptions_isolation on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at trigger helper
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

create trigger if not exists trg_articles_updated_at before update on public.articles
for each row execute function public.set_updated_at();

create trigger if not exists trg_subscriptions_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

-- Helpful indexes
create index if not exists idx_articles_published_at on public.articles(published_at desc);
create index if not exists idx_articles_status on public.articles(status);
create index if not exists idx_levels_article on public.article_levels(article_id);
create index if not exists idx_user_reads_user on public.user_reads(user_id);

