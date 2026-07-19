-- ============================================================
--  MIGRATION : QUALIFICATION IA DES PROSPECTS (CRM)
--  À exécuter UNE FOIS dans Supabase → SQL Editor.
--  Additive uniquement : ne touche à aucune colonne existante.
--
--  - score : pertinence commerciale 0-100 (générée par Gemini, ou
--    heuristique de repli sans clé API).
--  - accroche_whatsapp : premier message WhatsApp personnalisé,
--    utilisé par le bouton 💬 du CRM Super Admin (lien wa.me pré-rempli).
-- ============================================================

alter table public.prospects
  add column if not exists score integer,
  add column if not exists accroche_whatsapp text;

create index if not exists idx_prospects_score
  on public.prospects (score desc nulls last);

select 'Colonnes de qualification ajoutées. Utilisez le bouton « Qualifier IA » du CRM.' as resultat;
