-- ============================================================
-- MA CARRIERE — CV, LETTRE DE MOTIVATION, DEMANDE D'EMPLOI
--
-- A executer dans Supabase > SQL Editor. Re-executable sans risque.
--
-- Deux tables seulement :
--   1. career_documents — les documents rediges par l'utilisateur.
--   2. career_usage     — le journal des passages de generation IA, qui
--                         sert a compter le quota mensuel du compte gratuit.
--
-- Tant que ce script n'a pas tourne, le module reste accessible : les routes
-- /api/carriere/* detectent l'absence des tables et renvoient une liste vide
-- avec `needsMigration`, exactement comme les routes /api/pro/*.
-- ============================================================

-- ------------------------------------------------------------
-- 1) LES DOCUMENTS
--
-- Le contenu est un jsonb et non une vingtaine de colonnes : un CV, une
-- lettre et une demande n'ont presque aucun champ en commun, et les formes
-- bougeront encore. La structure est decrite et validee en TypeScript
-- (lib/carriere.ts), pas par le schema.
--
-- `template` ne concerne que les CV ; il reste a sa valeur par defaut pour
-- les deux autres documents plutot que de creer une table par type.
-- ------------------------------------------------------------
create table if not exists career_documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null,
  title       text not null default '',
  template    text not null default 'moderne',
  content     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table career_documents drop constraint if exists career_documents_kind_chk;
alter table career_documents add  constraint career_documents_kind_chk
  check (kind in ('cv', 'lettre', 'demande'));

-- L'ecran « Mes documents » lit toujours par proprietaire, du plus recent au
-- plus ancien : c'est exactement l'index pose ici.
create index if not exists career_documents_user_idx
  on career_documents (user_id, updated_at desc);

-- ------------------------------------------------------------
-- 2) LE JOURNAL DES GENERATIONS
--
-- Une ligne par PASSAGE de l'assistant, pas par document produit : un
-- passage fabrique souvent un CV ET une lettre, et « Recommencer avec l'IA »
-- relance l'ensemble. Compter les documents ferait consommer deux unites
-- pour un seul essai, ce que personne ne comprend en regardant l'ecran.
--
-- On garde le journal plutot qu'un simple compteur remis a zero chaque mois :
-- un compteur ne dit pas QUAND le quota a ete consomme, et rend impossible
-- de repondre a un utilisateur qui conteste.
-- ------------------------------------------------------------
create table if not exists career_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null default 'cv',
  created_at  timestamptz not null default now()
);

create index if not exists career_usage_user_idx
  on career_usage (user_id, created_at desc);

-- ------------------------------------------------------------
-- 3) RLS
--
-- Les routes serveur s'authentifient avec la session du navigateur puis
-- ecrivent avec la clef service_role en filtrant toujours sur user_id. Ces
-- politiques sont la deuxieme barriere : elles protegent la table si un jour
-- une lecture passe par la clef anonyme.
--
-- career_usage n'a volontairement AUCUNE politique d'ecriture : seule la
-- route serveur, qui detient la clef service_role, peut consommer du quota.
-- Un client capable d'inserer ses propres lignes pourrait aussi bien
-- s'accorder des generations gratuites en n'en inserant jamais.
-- ------------------------------------------------------------
alter table career_documents enable row level security;
alter table career_usage     enable row level security;

drop policy if exists career_documents_owner on career_documents;
create policy career_documents_owner on career_documents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists career_usage_read on career_usage;
create policy career_usage_read on career_usage
  for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4) DATE DE MODIFICATION
--
-- « Modifie il y a 2 jours » figure sur chaque carte de la liste : sans ce
-- declencheur, updated_at resterait fige a la creation et l'ecran mentirait.
-- ------------------------------------------------------------
create or replace function career_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists career_documents_touch on career_documents;
create trigger career_documents_touch
  before update on career_documents
  for each row execute function career_touch_updated_at();
