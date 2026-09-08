-- ============================================================
-- Espace Partenaire — gagner sa vie avec Wanteermako
--
-- L'idee : des etudiants, des chomeurs, des particuliers qui creent des CV,
-- des devis et des factures POUR D'AUTRES, avec le site comme atelier. Ils
-- trouvent le client, ils facturent leur service, et le document se fabrique
-- ici.
--
-- ── L'entree est GRATUITE, et c'est un choix ────────────────────────────
-- La premiere idee etait d'exiger l'achat d'un plan avant de donner les
-- strategies. Elle se retourne contre le produit : on demanderait a quelqu'un
-- SANS argent — un etudiant, un chomeur — de payer avant d'avoir gagne le
-- premier franc. On ne garderait que ceux qui avaient deja de l'argent,
-- c'est-a-dire pas la cible.
--
-- Ce qui retient un partenaire, ce n'est pas un peage a l'entree : c'est que
-- les documents se FABRIQUENT ici. Il trouve son client, mais pour livrer il
-- passe par le site. Il ne peut pas partir avec l'outil.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Le partenaire
-- ------------------------------------------------------------
create table if not exists partenaires (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  -- Code de parrainage, porte dans les liens partages : ?ref=XXXXXX
  code        text not null unique,
  statut      text not null default 'candidat',
  -- Ce qu'il declare savoir faire : sert a lui envoyer les bonnes demandes.
  metiers     text[] not null default '{}',
  ville       text not null default '',
  telephone   text not null default '',
  -- Points cumules : partages, filleuls inscrits, missions livrees.
  points      integer not null default 0,
  notes       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- candidat  : a postule, pas encore forme
-- actif     : forme, peut recevoir des missions
-- suspendu  : ecarte (qualite, comportement)
alter table partenaires drop constraint if exists partenaires_statut_chk;
alter table partenaires add  constraint partenaires_statut_chk
  check (statut in ('candidat', 'actif', 'suspendu'));

create index if not exists partenaires_statut_idx on partenaires (statut, created_at desc);

-- ------------------------------------------------------------
-- 2) Les points
--
-- Journal, et non un simple compteur : sans l'historique, impossible de
-- repondre a « pourquoi j'ai 40 points ? » — et un partenaire qui ne
-- comprend pas son solde n'y croit pas.
-- ------------------------------------------------------------
create table if not exists partenaire_points (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  motif       text not null,
  points      integer not null,
  -- Ce qui a declenche le gain : un filleul, une mission, un partage.
  reference   text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists partenaire_points_user_idx
  on partenaire_points (user_id, created_at desc);

-- ------------------------------------------------------------
-- 3) Les missions
--
-- Un client trouve par le partenaire, ou confie par Wanteermako. C'est la
-- piece qui rend le programme verifiable : sans elle, « il a trouve un
-- client » reste une affirmation.
-- ------------------------------------------------------------
create table if not exists partenaire_missions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  client_nom  text not null default '',
  besoin      text not null default '',
  -- Ce que le partenaire facture a SON client, en FCFA.
  montant     integer not null default 0,
  statut      text not null default 'ouverte',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table partenaire_missions drop constraint if exists partenaire_missions_statut_chk;
alter table partenaire_missions add  constraint partenaire_missions_statut_chk
  check (statut in ('ouverte', 'livree', 'payee', 'annulee'));

create index if not exists partenaire_missions_user_idx
  on partenaire_missions (user_id, created_at desc);

-- ------------------------------------------------------------
-- 4) RLS
--
-- Meme regle que les autres modules : les routes serveur s'authentifient avec
-- la session du navigateur puis ecrivent avec la clef service_role en
-- filtrant TOUJOURS sur user_id. Aucune policy publique — le navigateur ne
-- lit jamais ces tables en direct.
-- ------------------------------------------------------------
alter table partenaires          enable row level security;
alter table partenaire_points    enable row level security;
alter table partenaire_missions  enable row level security;

-- ------------------------------------------------------------
-- 5) Mise a jour de updated_at
-- ------------------------------------------------------------
create or replace function partenaires_touch() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists partenaires_touch_trg on partenaires;
create trigger partenaires_touch_trg before update on partenaires
  for each row execute function partenaires_touch();

drop trigger if exists partenaire_missions_touch_trg on partenaire_missions;
create trigger partenaire_missions_touch_trg before update on partenaire_missions
  for each row execute function partenaires_touch();
