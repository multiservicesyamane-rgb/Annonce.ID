-- ============================================================
--  MIGRATION : SUIVI DES EMAILS DE PROSPECTION (CRM)
--  À exécuter UNE FOIS dans Supabase → SQL Editor.
--  Additive uniquement.
--
--  - email_sent_at : date d'envoi de l'email de prospection
--    (empêche le double envoi + alimente le plafond quotidien 15/jour)
--  - email_opt_out : prospect ayant répondu « STOP » — jamais recontacté
-- ============================================================

alter table public.prospects
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_opt_out boolean not null default false;

-- Sert au comptage « emails envoyés aujourd'hui » (plafond quotidien).
create index if not exists idx_prospects_email_sent
  on public.prospects (email_sent_at);

select 'Suivi email ajouté. Le bouton 📧 du CRM est opérationnel (plafond 15/jour).' as resultat;
