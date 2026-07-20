-- ════════════════════════════════════════════════════════════════════════
--  WANTEERMAKO — CONFIGURATION COMPLÈTE DE LA BASE (à exécuter UNE fois)
--  Comment faire :
--   1. Supabase → ton projet → menu de gauche « SQL Editor »
--   2. Bouton « + New query »
--   3. Copie-colle TOUT ce fichier
--   4. Clique « Run » (en bas à droite)
--  Ce script est SANS DANGER : on peut le relancer plusieurs fois (idempotent).
-- ════════════════════════════════════════════════════════════════════════

-- ───────────────────────── 1) COLONNES MANQUANTES ─────────────────────────

-- profiles
alter table public.profiles add column if not exists free_premium boolean default false;
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists social_links jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists alert_prefs jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists credits integer default 0;
alter table public.profiles add column if not exists is_pro boolean default false;
alter table public.profiles add column if not exists subscription_plan text;
alter table public.profiles add column if not exists subscription_category text;
alter table public.profiles add column if not exists plan_key text;
alter table public.profiles add column if not exists subscription_expires_at timestamptz;
alter table public.profiles add column if not exists plan_expires_at timestamptz;
alter table public.profiles add column if not exists free_ads_remaining integer default 2;
alter table public.profiles alter column free_ads_remaining set default 2;
update public.profiles set free_ads_remaining = 2 where free_ads_remaining is null or free_ads_remaining > 2;

-- listings
alter table public.listings add column if not exists price_type text;
alter table public.listings add column if not exists region text;
alter table public.listings add column if not exists commune text;
alter table public.listings add column if not exists custom_commune text;
alter table public.listings add column if not exists specs jsonb;
alter table public.listings add column if not exists premium boolean default false;
alter table public.listings add column if not exists is_premium boolean default false;
alter table public.listings add column if not exists featured boolean default false;
alter table public.listings add column if not exists is_featured boolean default false;
alter table public.listings add column if not exists boost_key text;
alter table public.listings add column if not exists premium_until timestamptz;
alter table public.listings add column if not exists boost_expires_at timestamptz;

-- purchases (achats / encaissements)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  amount integer default 0,
  ref_command text,
  status text default 'success',
  type text,
  method text,
  plan_key text,
  plan_name text,
  expires_at timestamptz,
  created_at timestamptz default now()
);
alter table public.purchases add column if not exists method text;
alter table public.purchases add column if not exists plan_key text;
alter table public.purchases add column if not exists plan_name text;
alter table public.purchases add column if not exists expires_at timestamptz;
create unique index if not exists idx_purchases_ref_command_unique on public.purchases (ref_command) where ref_command is not null;

-- paramètres globaux (tarifs, toggles) gérés depuis le super admin
create table if not exists public.app_settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.app_settings enable row level security;

-- tables B2B (employés, campagnes) + colonnes utilisées par l'admin
create table if not exists public.employees ( id uuid primary key default gen_random_uuid(), created_at timestamptz default now() );
alter table public.employees add column if not exists name text;
alter table public.employees add column if not exists role text;
alter table public.employees add column if not exists phone text;
alter table public.employees add column if not exists monthly_target integer default 3;

create table if not exists public.campaigns ( id uuid primary key default gen_random_uuid(), created_at timestamptz default now() );
alter table public.campaigns add column if not exists name text;
alter table public.campaigns add column if not exists sector text;
alter table public.campaigns add column if not exists channel text;
alter table public.campaigns add column if not exists status text default 'active';
alter table public.campaigns add column if not exists sent integer default 0;
alter table public.campaigns add column if not exists opened integer default 0;
alter table public.campaigns add column if not exists replied integer default 0;

-- ───────────────────────── 2) CRÉDITS BOOST ─────────────────────────
create table if not exists public.boost_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  boost_key text not null,
  boost_name text,
  duration_days int not null default 30,
  status text not null default 'available',
  listing_id uuid,
  source text default 'cash',
  created_at timestamptz not null default now(),
  used_at timestamptz,
  expires_at timestamptz
);
create index if not exists idx_boost_credits_user on public.boost_credits (user_id, status);
alter table public.boost_credits enable row level security;

-- ───────────────────────── 3) MESSAGERIE ─────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  receiver_id uuid not null,
  listing_id uuid,
  content text,
  media_url text,
  type text not null default 'text',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
-- colonnes ajoutées si la table messages existait déjà sans elles
alter table public.messages add column if not exists listing_id uuid;
alter table public.messages add column if not exists content text;
alter table public.messages add column if not exists media_url text;
alter table public.messages add column if not exists type text default 'text';
alter table public.messages add column if not exists read boolean default false;
create index if not exists idx_messages_pair on public.messages (sender_id, receiver_id, created_at);
alter table public.messages enable row level security;

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = sender_id);
drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages for update using (auth.uid() = receiver_id);
do $$ begin alter publication supabase_realtime add table public.messages; exception when others then null; end $$;

-- ───────────────────────── 4) SIGNALEMENTS ─────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  reason text not null,
  details text,
  contact text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;

-- ------------------------- 5) STOCKAGE D'IMAGES (buckets) -------------------------
-- images reste public pour annonces/avatars. chat_media est prive et servi via URLs signees.
insert into storage.buckets (id, name, public) values ('images', 'images', true)
  on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public) values ('chat_media', 'chat_media', false)
  on conflict (id) do update set public = false;

-- Lecture publique uniquement des images publiques.
drop policy if exists "wmk_public_read" on storage.objects;
create policy "wmk_public_read" on storage.objects
  for select using (bucket_id = 'images');

-- Lecture chat limitee au proprietaire du chemin userId/...
drop policy if exists "wmk_chat_owner_read" on storage.objects;
create policy "wmk_chat_owner_read" on storage.objects
  for select to authenticated using (
    bucket_id = 'chat_media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Upload limite au chemin controle par l'utilisateur.
drop policy if exists "wmk_auth_upload" on storage.objects;
create policy "wmk_auth_upload" on storage.objects
  for insert to authenticated with check (
    (bucket_id = 'images' and split_part(name, '/', 2) = auth.uid()::text)
    or (bucket_id = 'chat_media' and split_part(name, '/', 1) = auth.uid()::text)
  );

-- Mise a jour/remplacement limite au meme chemin utilisateur.
drop policy if exists "wmk_auth_update" on storage.objects;
create policy "wmk_auth_update" on storage.objects
  for update to authenticated using (
    (bucket_id = 'images' and split_part(name, '/', 2) = auth.uid()::text)
    or (bucket_id = 'chat_media' and split_part(name, '/', 1) = auth.uid()::text)
  ) with check (
    (bucket_id = 'images' and split_part(name, '/', 2) = auth.uid()::text)
    or (bucket_id = 'chat_media' and split_part(name, '/', 1) = auth.uid()::text)
  );

-- Termine. La banniere, les avatars, le chat et les paiements manuels fonctionnent.
