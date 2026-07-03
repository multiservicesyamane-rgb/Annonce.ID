-- Wanteermako — Qualite annonces / doublons / moderation imports
-- A executer dans Supabase SQL Editor avant de compter sur les colonnes en production.

alter table public.listings
  add column if not exists duplicate_key text,
  add column if not exists moderation_reason text,
  add column if not exists source_language text;

create index if not exists idx_listings_duplicate_key
  on public.listings (user_id, duplicate_key)
  where duplicate_key is not null and status in ('active', 'pending');

create index if not exists idx_listings_moderation_reason
  on public.listings (status, created_at desc)
  where status = 'pending' and moderation_reason is not null;
