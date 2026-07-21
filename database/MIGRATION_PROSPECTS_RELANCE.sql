-- ============================================================
-- RELANCE HEBDOMADAIRE DES PROSPECTS (Wanteermako)
-- À exécuter dans Supabase → SQL Editor.
-- ============================================================
-- Ajoute un compteur d'envois pour :
--   1) plafonner le nombre de relances par entreprise (anti-spam) ;
--   2) permettre de relancer chaque semaine tant que le plafond
--      n'est pas atteint (le cron s'appuie dessus).
-- Idempotent : ré-exécutable sans erreur.

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS email_sent_count integer NOT NULL DEFAULT 0;

-- Aligne les prospects déjà contactés (1 email envoyé) pour qu'ils
-- soient comptés à 1, et donc éligibles à une relance — pas à 0.
UPDATE public.prospects
   SET email_sent_count = 1
 WHERE email_sent_at IS NOT NULL
   AND email_sent_count = 0;

SELECT 'Migration relance OK — colonne email_sent_count prête.' AS resultat;
