-- (OPTIONNEL) Colonne "vendeur vérifié" sur les profils.
-- Sans elle, le site marche quand même ; avec elle, le badge « ✓ Vérifié »
-- et le bouton « Vérifier » de l'admin fonctionnent.
-- À exécuter dans Supabase → SQL Editor.

alter table public.profiles
  add column if not exists is_verified boolean default false;
