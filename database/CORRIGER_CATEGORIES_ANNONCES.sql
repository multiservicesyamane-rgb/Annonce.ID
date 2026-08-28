-- ============================================================
-- CORRECTION DES ANNONCES DANS LA MAUVAISE CATÉGORIE
-- À exécuter dans Supabase → SQL Editor.
-- ============================================================

-- Ce script utilise des mots-clés fréquents dans les titres et descriptions
-- pour réaffecter les annonces mal classées à leur catégorie correcte.

-- 1. IMMOBILIER
UPDATE public.listings
SET 
  category_slug = 'immobilier',
  category = CASE 
    WHEN title ILIKE '%appartement%' OR title ILIKE '%studio%' THEN 'Appartements'
    WHEN title ILIKE '%villa%' THEN 'Villas'
    WHEN title ILIKE '%terrain%' OR title ILIKE '%parcelle%' THEN 'Terrains'
    WHEN title ILIKE '%chambre%' THEN 'Chambres'
    ELSE 'Maisons'
  END
WHERE category_slug != 'immobilier' 
  AND (
    title ILIKE '%appartement%' OR 
    title ILIKE '%villa%' OR 
    title ILIKE '%terrain%' OR 
    title ILIKE '%parcelle%' OR
    title ILIKE '%studio%'
  );

-- 2. VÉHICULES & TRANSPORT
UPDATE public.listings
SET 
  category_slug = 'vehicules',
  category = CASE 
    WHEN title ILIKE '%moto%' OR title ILIKE '%scooter%' OR title ILIKE '%tmax%' THEN 'Motos & Scooters'
    WHEN title ILIKE '%camion%' THEN 'Camions'
    ELSE 'Voitures'
  END
WHERE category_slug != 'vehicules' 
  AND (
    title ILIKE '%voiture%' OR 
    title ILIKE '%toyota%' OR 
    title ILIKE '%peugeot%' OR 
    title ILIKE '%hyundai%' OR 
    title ILIKE '%ford%' OR 
    title ILIKE '%nissan%' OR 
    title ILIKE '%moto%' OR
    title ILIKE '%scooter%' OR
    title ILIKE '%mercedes%' OR
    title ILIKE '%bmw%'
  );

-- 3. TÉLÉPHONES & MULTIMÉDIA (Électronique)
UPDATE public.listings
SET 
  category_slug = 'electronique',
  category = CASE 
    WHEN title ILIKE '%iphone%' OR title ILIKE '%samsung%' OR title ILIKE '%tecno%' OR title ILIKE '%infinix%' OR title ILIKE '%redmi%' OR title ILIKE '%smartphone%' THEN 'Smartphones'
    WHEN title ILIKE '%pc%' OR title ILIKE '%ordinateur%' OR title ILIKE '%macbook%' OR title ILIKE '%hp%' OR title ILIKE '%dell%' OR title ILIKE '%lenovo%' THEN 'Ordinateurs'
    WHEN title ILIKE '%tv%' OR title ILIKE '%télévision%' OR title ILIKE '%smart tv%' THEN 'Téléviseurs'
    WHEN title ILIKE '%ps4%' OR title ILIKE '%ps5%' OR title ILIKE '%playstation%' THEN 'Consoles de jeux'
    ELSE 'Autre'
  END
WHERE category_slug != 'electronique' 
  AND (
    title ILIKE '%iphone%' OR 
    title ILIKE '%samsung%' OR 
    title ILIKE '%tecno%' OR 
    title ILIKE '%infinix%' OR 
    title ILIKE '%macbook%' OR 
    title ILIKE '%ordinateur%' OR 
    title ILIKE '%pc portable%' OR 
    title ILIKE '%ps4%' OR 
    title ILIKE '%ps5%' OR 
    title ILIKE '%télévision%'
  );

-- 4. MAISON & ÉLECTROMÉNAGER
UPDATE public.listings
SET 
  category_slug = 'maison',
  category = CASE 
    WHEN title ILIKE '%frigo%' OR title ILIKE '%réfrigérateur%' THEN 'Réfrigérateurs'
    WHEN title ILIKE '%climatiseur%' OR title ILIKE '%clim%' THEN 'Climatiseurs'
    WHEN title ILIKE '%lit%' OR title ILIKE '%matelas%' THEN 'Lits'
    WHEN title ILIKE '%canapé%' OR title ILIKE '%salon%' THEN 'Salons'
    ELSE 'Autre'
  END
WHERE category_slug != 'maison' 
  AND (
    title ILIKE '%frigo%' OR 
    title ILIKE '%réfrigérateur%' OR 
    title ILIKE '%climatiseur%' OR 
    title ILIKE '%matelas%' OR 
    title ILIKE '%canapé%'
  )
  AND category_slug != 'immobilier'; -- Éviter les confusions avec l'immobilier

-- 5. EMPLOI & RECRUTEMENT
UPDATE public.listings
SET 
  category_slug = 'emploi',
  category = 'Autre'
WHERE category_slug != 'emploi' 
  AND (
    title ILIKE '%recherche emploi%' OR 
    title ILIKE '%recrutement%' OR 
    title ILIKE '%offre d''emploi%' OR 
    title ILIKE '%stage%' OR 
    title ILIKE '%cv%'
  );

-- Message de succès
SELECT 'Correction des catégories effectuée avec succès.' as resultat;
