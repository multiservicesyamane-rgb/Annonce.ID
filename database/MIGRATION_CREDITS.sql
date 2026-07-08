-- ────────────────────────────────────────────────────────────────
-- Crédits boost : un client peut ACHETER des boosts (espèces via admin,
-- ou en ligne) sans avoir d'annonce, puis les UTILISER plus tard sur
-- ses annonces. Chaque ligne = 1 bon de boost.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.boost_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  boost_key text not null,            -- premium / alaune / vip
  boost_name text,                    -- libellé lisible
  duration_days int not null default 30,
  status text not null default 'available',  -- available | used
  listing_id uuid,                    -- rempli quand le crédit est utilisé
  source text default 'cash',         -- cash | online | gift
  created_at timestamptz not null default now(),
  used_at timestamptz,
  expires_at timestamptz              -- expiration du boost une fois utilisé
);

create index if not exists idx_boost_credits_user on public.boost_credits (user_id);
create index if not exists idx_boost_credits_status on public.boost_credits (user_id, status);

-- Accès : tout passe par des routes serveur (clé service_role) qui vérifient
-- la session de l'utilisateur. On garde donc RLS activé sans policy publique.
alter table public.boost_credits enable row level security;
