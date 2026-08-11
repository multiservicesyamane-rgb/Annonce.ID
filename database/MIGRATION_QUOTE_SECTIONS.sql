-- ============================================================
-- DEVIS — SECTIONS REUTILISABLES (processus, profil, conditions,
-- modalites de paiement, questions frequentes)
--
-- A executer dans Supabase > SQL Editor. Re-executable sans risque.
-- Complete database/MIGRATION_MON_ACTIVITE.sql.
--
-- POURQUOI :
--   Jusqu'ici un devis ne portait que deux champs libres (`terms`, `note`),
--   a retaper a chaque fois. Ce qui distingue un devis professionnel d'un
--   devis d'amateur, ce sont justement ces rubriques : comment je travaille,
--   qui je suis, mes conditions, comment on me paie. On les regle UNE fois.
--
-- POURQUOI DU JSONB ET PAS UNE TABLE :
--   Ces rubriques sont un reglage du professionnel. Elles sont toujours lues
--   en bloc, jamais filtrees ni triees individuellement. Une table imposerait
--   une jointure et une gestion d'ordre pour zero benefice. C'est le meme
--   choix que `pro_quotes.items`, deja en jsonb.
--
-- Forme attendue (validee par contrainte plus bas) :
--   [{ "key": "processus", "title": "...", "icon": "...", "enabled": true,
--      "items": [{ "label": "...", "body": "..." }] }]
-- ============================================================

-- ------------------------------------------------------------
-- 1) Les rubriques par defaut du professionnel
-- ------------------------------------------------------------
alter table pro_settings
  add column if not exists quote_sections jsonb not null default '[]'::jsonb;

-- ------------------------------------------------------------
-- 2) La COPIE figee dans chaque devis
--
--    Point capital : le devis ne REFERENCE pas les rubriques du profil, il
--    en garde une copie. Sinon, modifier ses conditions par defaut
--    reecrirait retroactivement des devis deja envoyes et acceptes — ce qui
--    contredirait la regle deja appliquee ici : une piece n'est plus
--    modifiable des lors qu'elle est engagee.
-- ------------------------------------------------------------
alter table pro_quotes
  add column if not exists sections jsonb not null default '[]'::jsonb;

-- ------------------------------------------------------------
-- 3) Garde-fous : la base refuse autre chose qu'un tableau
--    L'API assainit deja (sanitizeSections), mais une ecriture directe
--    depuis une console SQL ou un futur script ne passerait pas par elle.
-- ------------------------------------------------------------
alter table pro_settings drop constraint if exists pro_settings_quote_sections_chk;
alter table pro_settings add  constraint pro_settings_quote_sections_chk
  check (jsonb_typeof(quote_sections) = 'array');

alter table pro_quotes drop constraint if exists pro_quotes_sections_chk;
alter table pro_quotes add  constraint pro_quotes_sections_chk
  check (jsonb_typeof(sections) = 'array');

-- Borne de volume : ces rubriques finissent sur un document imprime. Sans
-- plafond, un collage massif ferait un devis de trente pages et alourdirait
-- chaque lecture de la page publique.
alter table pro_settings drop constraint if exists pro_settings_quote_sections_size_chk;
alter table pro_settings add  constraint pro_settings_quote_sections_size_chk
  check (jsonb_array_length(quote_sections) <= 8);

alter table pro_quotes drop constraint if exists pro_quotes_sections_size_chk;
alter table pro_quotes add  constraint pro_quotes_sections_size_chk
  check (jsonb_array_length(sections) <= 8);

-- ------------------------------------------------------------
-- 4) Rafraichit le cache de l'API (sinon les colonnes restent invisibles)
-- ------------------------------------------------------------
notify pgrst, 'reload schema';

select 'Sections de devis pretes. Les valeurs par defaut sont proposees par l''application, pas par le SQL.' as resultat;
