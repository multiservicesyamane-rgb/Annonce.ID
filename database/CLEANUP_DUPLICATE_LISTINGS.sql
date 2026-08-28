-- ============================================================
-- SUPPRESSION DES ANNONCES DUPLIQUÉES (Wanteermako)
-- À exécuter dans Supabase → SQL Editor.
-- ============================================================

-- Cette requête conserve l'annonce la plus récente pour chaque
-- combinaison de (Auteur, Titre, Prix) et supprime les doublons plus anciens.

WITH legacy_duplicates_to_delete AS (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, title, price 
        ORDER BY created_at DESC
      ) as row_num
    FROM public.listings
  ) t
  WHERE row_num > 1
)
DELETE FROM public.listings
WHERE id IN (SELECT id FROM legacy_duplicates_to_delete);

-- Afficher un message de succès
SELECT 'Nettoyage des annonces dupliquées (basé sur le titre et le prix) terminé avec succès.' as resultat;
