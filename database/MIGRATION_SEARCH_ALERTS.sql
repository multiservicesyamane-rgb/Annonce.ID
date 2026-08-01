-- ============================================================================
-- Alertes de recherche (T8) : l'utilisateur enregistre des critères et reçoit
-- un email (+ notif in-app) à chaque nouvelle annonce active correspondante.
-- À exécuter dans Supabase → SQL Editor.
-- ============================================================================

-- 1) Table des alertes
create table if not exists search_alerts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  email         text,                 -- destinataire (copié du profil à la création)
  category_slug text,                 -- null = toutes catégories
  location      text,                 -- null = partout (ex. "Dakar", "Keur Massar")
  price_min     bigint not null default 0,
  price_max     bigint,               -- null = pas de plafond
  keyword       text,                 -- optionnel (recherche titre/description)
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_search_alerts_active on search_alerts(active) where active;

-- 2) Chaque annonce n'est traitée qu'UNE fois par le matcher (évite les doublons d'emails)
alter table listings add column if not exists alerts_sent_at timestamptz;

-- 3) RLS : chacun gère SES alertes ; le matching serveur passe par le service role (bypass RLS)
alter table search_alerts enable row level security;

drop policy if exists "alerts_select_own" on search_alerts;
create policy "alerts_select_own" on search_alerts
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "alerts_insert_own" on search_alerts;
create policy "alerts_insert_own" on search_alerts
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "alerts_update_own" on search_alerts;
create policy "alerts_update_own" on search_alerts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "alerts_delete_own" on search_alerts;
create policy "alerts_delete_own" on search_alerts
  for delete to authenticated using (auth.uid() = user_id);
