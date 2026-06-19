-- ════════════════════════════════════════════════════════════════════════
--  CAMPAGNE IA 2025 — Module marketing (Facebook / Instagram / WhatsApp)
--  Adapté en PostgreSQL (Supabase). À exécuter dans SQL Editor.
--  N'AFFECTE PAS les tables existantes (annonces, plans, paiements).
-- ════════════════════════════════════════════════════════════════════════

-- Statistiques sociales quotidiennes
create table if not exists public.campaign_daily_stats (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  platform text not null,                 -- facebook | instagram | whatsapp
  views int default 0,
  new_followers int default 0,
  engagement_rate numeric(5,2) default 0,
  clicks_to_site int default 0,
  is_viral boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_camp_stats_date on public.campaign_daily_stats (date desc);

-- Posts publiés via Make.com
create table if not exists public.campaign_posts (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid,
  platform text not null,                 -- facebook | instagram | whatsapp | all
  caption text,
  image_url text,
  post_url text,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text default 'draft',            -- draft | scheduled | published | boosted
  reach int default 0,
  reactions int default 0,
  shares int default 0,
  make_scenario_id text,
  created_at timestamptz default now()
);
create index if not exists idx_camp_posts_status on public.campaign_posts (status, created_at desc);

-- Boosts sponsorisés (liés aux PLANS EXISTANTS via plan_key)
create table if not exists public.campaign_boosts (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid,
  user_id uuid,
  plan_key text,                          -- référence au plan existant du site
  duration_days int default 7,
  budget_fcfa int default 5000,
  platform text default 'both',           -- facebook | instagram | both
  status text default 'pending',          -- pending | active | completed
  started_at timestamptz,
  ended_at timestamptz,
  reach_total int default 0,
  created_at timestamptz default now()
);

-- Influenceurs
create table if not exists public.campaign_influenceurs (
  id uuid primary key default gen_random_uuid(),
  nom text,
  plateforme text,
  handle text,
  followers int default 0,
  collaboration_type text default 'barter', -- barter | paid
  cout_fcfa int default 0,
  status text default 'contacte',           -- contacte | actif | termine
  reach_genere int default 0,
  created_at timestamptz default now()
);

-- Rapports hebdomadaires
create table if not exists public.campaign_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  week_start date,
  total_views int default 0,
  total_new_followers int default 0,
  avg_engagement_rate numeric(5,2) default 0,
  total_clicks int default 0,
  best_post_id uuid,
  revenue_fcfa int default 0,
  boosts_sold int default 0,
  notes text,
  created_at timestamptz default now()
);

-- Accès via routes serveur (service role). RLS activé sans policy publique.
alter table public.campaign_daily_stats   enable row level security;
alter table public.campaign_posts         enable row level security;
alter table public.campaign_boosts        enable row level security;
alter table public.campaign_influenceurs  enable row level security;
alter table public.campaign_weekly_reports enable row level security;
