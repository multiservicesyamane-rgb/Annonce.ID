-- ============================================================
-- MIGRATION : EXPIRATION AUTOMATIQUE DES ANNONCES
-- À exécuter dans Supabase → SQL Editor.
-- ============================================================

-- 1. Ajouter la colonne expires_at si elle n'existe pas
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2. Définir une date d'expiration par défaut pour les nouvelles annonces (30 jours)
ALTER TABLE public.listings 
ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

-- 3. Mettre à jour les annonces existantes 
-- (Les annonces actives existantes expireront 30 jours après leur création)
UPDATE public.listings
SET expires_at = created_at + interval '30 days'
WHERE expires_at IS NULL;

-- 4. Pour cacher automatiquement les annonces expirées,
-- Nous mettons à jour la politique de sécurité (RLS) pour la lecture (SELECT) :
-- (Attention: supprime l'ancienne règle SELECT pour la recréer avec la condition d'expiration)

DROP POLICY IF EXISTS "Annonces actives visibles par tous" ON public.listings;
DROP POLICY IF EXISTS "Public listings are viewable by everyone" ON public.listings;

CREATE POLICY "Public listings are viewable by everyone" 
ON public.listings FOR SELECT 
USING (
  status = 'active' 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Note : Les utilisateurs propriétaires peuvent toujours voir leurs annonces (même expirées)
-- grâce à la politique "Users can view their own listings" qui doit déjà exister.

SELECT 'Expiration automatique ajoutée avec succès. Les annonces expireront après 30 jours.' as resultat;
