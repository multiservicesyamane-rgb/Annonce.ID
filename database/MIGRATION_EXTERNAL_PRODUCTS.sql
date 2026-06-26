-- ============================================================
--  Wanteermako — Produits externes (Chariow, AliExpress, etc.)
--  À exécuter dans Supabase → SQL Editor.
--
--  Ajoute 2 colonnes sur les annonces :
--   • external_url : le lien de vente sur l'autre site
--   • source       : le nom du site (chariow / aliexpress / ...)
--
--  Quand external_url est rempli, la fiche produit affiche un bouton
--  « Acheter sur ... » qui renvoie DIRECTEMENT vers le site externe.
-- ============================================================

alter table public.listings add column if not exists external_url text;
alter table public.listings add column if not exists source text;

-- FIN
