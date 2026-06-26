-- ============================================================
--  Wanteermako — Livraison à Dakar pour tous les produits importés
--  À exécuter dans Supabase → SQL Editor (peut se relancer sans risque).
-- ============================================================

update public.listings
set location = 'Dakar'
where source = 'aliexpress';

-- Vérifier : select title, location, price from public.listings where source='aliexpress';
