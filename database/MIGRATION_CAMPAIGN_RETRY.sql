-- ============================================================
--  MIGRATION : REPRISE SUR ÉCHEC DES PUBLICATIONS SOCIALES
--  À exécuter UNE FOIS dans Supabase → SQL Editor.
--  Additive uniquement : ne touche à aucune colonne existante.
--
--  Contexte (audit du 19/07/2026) :
--  - campaign_posts existe (108 posts, Telegram + Facebook) mais un
--    post "failed" restait failed pour toujours, sans trace d'erreur.
--  - Ces colonnes permettent au cron auto-publish de retenter les
--    échecs (max 3 tentatives, espacées de 6 h).
-- ============================================================

alter table public.campaign_posts
  add column if not exists attempts integer not null default 0,
  add column if not exists error_message text,
  add column if not exists next_attempt_at timestamptz;

-- Index partiel : le cron ne cherche que les posts en échec à retenter.
create index if not exists idx_camp_posts_retry
  on public.campaign_posts (next_attempt_at)
  where status = 'failed';

select 'Colonnes de reprise ajoutées. Le cron auto-publish retentera les posts en échec.' as resultat;
