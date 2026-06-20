-- ─────────────────────────────────────────────────────────────
-- BOUTIQUE = automatique dès qu'un vendeur publie une annonce.
-- (OPTIONNEL) À exécuter dans Supabase → SQL Editor.
-- ─────────────────────────────────────────────────────────────

-- La boutique apparaît dans /boutiques DÈS que le vendeur a >= 1 annonce active.
-- Cette colonne sert UNIQUEMENT d'option pour MASQUER sa boutique :
--   has_boutique = true  (défaut) → visible si le vendeur a des annonces
--   has_boutique = false          → masquée même avec des annonces
-- Sans cette colonne, tout fonctionne aussi (tout le monde est visible par défaut).
alter table public.profiles
  add column if not exists has_boutique boolean default true;
