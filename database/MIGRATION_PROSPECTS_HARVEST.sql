-- ============================================================
--  MIGRATION : RÉCOLTE QUOTIDIENNE DE PROSPECTS (CRON)
--  À exécuter UNE FOIS dans Supabase → SQL Editor.
--  Additive uniquement.
--
--  Le cron /api/cron/prospect-harvest scrape chaque jour un petit
--  lot Google Maps (rotation secteurs × villes), l'importe ici,
--  puis extrait les emails des sites web par tranches.
--
--  - source_url / image_url : fiche Google Maps (site web, photo)
--  - email_checked_at : marque les fiches dont le site a déjà été
--    visité pour extraction d'email (évite de retenter sans fin)
-- ============================================================

alter table public.prospects
  add column if not exists source_url text,
  add column if not exists image_url text,
  add column if not exists email_checked_at timestamptz;

create index if not exists idx_prospects_email_check
  on public.prospects (created_at)
  where email is null and email_checked_at is null;

select 'Colonnes de récolte ajoutées. Le cron prospect-harvest est opérationnel.' as resultat;
