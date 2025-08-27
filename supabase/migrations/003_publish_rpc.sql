-- RPC to publish scheduled articles whose published_at <= now()
create or replace function public.publish_due_articles()
returns void
language sql
as $$
  update public.articles
     set status = 'published'
   where status = 'scheduled'
     and published_at <= now();
$$;

