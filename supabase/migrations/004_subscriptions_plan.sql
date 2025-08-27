-- Add plan column to subscriptions for access control
alter table public.subscriptions
  add column if not exists plan text
  check (plan in ('free','pro','plus'))
  default 'free';

