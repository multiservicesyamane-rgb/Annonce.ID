-- ============================================================
--  AnnoncesWest — Migration B2B (Super Admin opérationnel)
--  À exécuter UNE FOIS dans Supabase → SQL Editor.
--  Crée toutes les tables nécessaires pour brancher le super
--  admin sur des données réelles (CRM, ambassadeurs, employés,
--  campagnes, points) + corrige les colonnes/tables manquantes.
-- ============================================================

-- 1) Colonnes manquantes sur listings (publication + filtres)
alter table listings
  add column if not exists price_type text,
  add column if not exists region text,
  add column if not exists commune text,
  add column if not exists custom_commune text,
  add column if not exists specs jsonb default '{}'::jsonb,
  add column if not exists featured boolean default false;

-- 2) Paiements / boosts (IPN PayTech)
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  amount integer,
  ref_command text,
  status text,
  type text,
  created_at timestamptz default now()
);

-- 3) CRM — Prospects (équipe commerciale)
create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  city text,
  email text,
  phone text,
  whatsapp text,
  status text default 'new',           -- new|ct|int|rdv|cli|ref
  pack text,                            -- Basic|Pro|Premium|Enterprise
  assigned_to uuid references auth.users(id),
  notes text,
  next_followup date,
  created_at timestamptz default now()
);

-- 4) Employés (équipe commerciale)
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  role text,
  monthly_target integer default 3,
  created_at timestamptz default now()
);

-- 5) Ambassadeurs (parrainage)
create table if not exists ambassadors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  ref_code text unique,
  level text default 'bronze',         -- bronze|argent|or|diamant
  clients_count integer default 0,
  commission_total integer default 0,
  clicks integer default 0,
  created_at timestamptz default now()
);

-- 6) Campagnes marketing
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  channel text,                        -- email|whatsapp|both
  sent integer default 0,
  opened integer default 0,
  replied integer default 0,
  status text default 'active',        -- active|planned|done
  created_at timestamptz default now()
);

-- 7) Journal de points (fidélité)
create table if not exists points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text,
  points integer,
  created_at timestamptz default now()
);

-- 8) Leads (génération de prospects depuis les annonces)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  listing_id text,
  seller_id uuid references auth.users(id),
  name text,
  phone text,
  email text,
  budget text,
  message text,
  score integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
--  RLS (Row Level Security)
--  Lecture par les utilisateurs connectés ; écriture côté
--  serveur (service role) ou via policies dédiées plus tard.
-- ============================================================
alter table purchases      enable row level security;
alter table prospects      enable row level security;
alter table employees      enable row level security;
alter table ambassadors    enable row level security;
alter table campaigns      enable row level security;
alter table points_ledger  enable row level security;
alter table leads          enable row level security;

-- Achats : chacun voit les siens
drop policy if exists "own purchases" on purchases;
create policy "own purchases" on purchases for select using (auth.uid() = user_id);

-- Lecture authentifiée pour les tables B2B (à restreindre aux admins en prod)
do $$ begin
  perform 1;
  -- prospects
  drop policy if exists "read prospects" on prospects;
  create policy "read prospects" on prospects for select using (auth.role() = 'authenticated');
  drop policy if exists "write prospects" on prospects;
  create policy "write prospects" on prospects for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  -- ambassadors
  drop policy if exists "read ambassadors" on ambassadors;
  create policy "read ambassadors" on ambassadors for select using (auth.role() = 'authenticated');
  -- campaigns
  drop policy if exists "read campaigns" on campaigns;
  create policy "read campaigns" on campaigns for select using (auth.role() = 'authenticated');
  -- employees
  drop policy if exists "read employees" on employees;
  create policy "read employees" on employees for select using (auth.role() = 'authenticated');
end $$;

-- ============================================================
--  Index de performance (échelle 20 000+ annonces)
-- ============================================================
create index if not exists idx_listings_status_created    on listings (status, created_at desc);
create index if not exists idx_listings_cat_status_created on listings (category_slug, status, created_at desc);
create index if not exists idx_listings_user              on listings (user_id);
create index if not exists idx_prospects_status           on prospects (status);
create index if not exists idx_prospects_assigned         on prospects (assigned_to);

-- ============================================================
--  Compteur de vues atomique (contourne RLS proprement)
-- ============================================================
create or replace function increment_views(listing_id text)
returns void language sql security definer set search_path = public as $$
  update listings set views = coalesce(views, 0) + 1 where id::text = listing_id;
$$;
grant execute on function increment_views(text) to anon, authenticated;

-- FIN — Après exécution, le super admin et la publication sont 100% opérationnels.
