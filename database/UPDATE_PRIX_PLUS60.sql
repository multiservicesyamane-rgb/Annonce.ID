-- ============================================================
--  Wanteermako — Ajouter +60% sur le prix des produits AliExpress
--  À exécuter dans Supabase → SQL Editor.
--
--  Augmente le prix de CHAQUE produit importé de 60 % (frais de
--  livraison + marge), arrondi au 500 FCFA le plus proche.
--
--  ⚠️⚠️ À LANCER UNE SEULE FOIS ⚠️⚠️
--  Si tu le relances, ça rajoute encore +60% par-dessus (×1,6 à chaque fois).
-- ============================================================

update public.listings
set price = (greatest(500, round((price::numeric * 1.60) / 500) * 500))::bigint::text
where source = 'aliexpress'
  and price ~ '^[0-9]+$';

-- Vérifier le résultat :
-- select title, price from public.listings where source='aliexpress' order by created_at desc;
