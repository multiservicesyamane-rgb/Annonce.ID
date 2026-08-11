-- ============================================================
-- ESPACE PRO — PROFIL D'ENTREPRISE + RUBRIQUES DE DEVIS
--
-- A executer dans Supabase > SQL Editor. Re-executable sans risque.
-- Complete database/MIGRATION_MON_ACTIVITE.sql.
--
-- REMPLACE database/MIGRATION_QUOTE_SECTIONS.sql, qui n'avait jamais ete
-- execute : tout son contenu est repris ici. Un seul script a lancer.
--
-- Deux sujets :
--   1. Le profil d'entreprise — ce qui habille les pieces comptables :
--      logo, signature, cachet, modele de document. Jusqu'ici l'en-tete
--      retombait sur l'avatar de la boutique d'annonces, et la signature
--      n'etait qu'un trait imprime sur le papier.
--   2. Les rubriques reutilisables des devis.
-- ============================================================

-- ------------------------------------------------------------
-- 1) PROFIL D'ENTREPRISE
--
-- Les trois images sont des URL du bucket `pro-docs` (public en lecture,
-- chemin aleatoire), pas des donnees encodees : une signature en base64
-- dans la table serait rechargee a chaque lecture de reglages, et gonflerait
-- inutilement chaque reponse de l'API.
-- ------------------------------------------------------------
alter table pro_settings add column if not exists logo_url      text;
alter table pro_settings add column if not exists signature_url text;
alter table pro_settings add column if not exists stamp_url     text;

-- Modele du document imprime : un theme nomme + une couleur d'accent
-- facultative qui l'emporte sur celle du theme.
alter table pro_settings add column if not exists doc_template text not null default 'classique';
alter table pro_settings add column if not exists doc_accent   text;

-- Mention manuscrite accompagnant la signature (« Le prestataire », le nom
-- du signataire, sa qualite...). Sans elle, une signature scannee flotte
-- sans indiquer QUI signe.
alter table pro_settings add column if not exists signature_label text;

-- Themes autorises : la base refuse une valeur inventee, sinon le document
-- retomberait silencieusement sur un rendu par defaut sans que personne ne
-- comprenne pourquoi.
alter table pro_settings drop constraint if exists pro_settings_doc_template_chk;
alter table pro_settings add  constraint pro_settings_doc_template_chk
  check (doc_template in ('classique', 'moderne', 'bande', 'epure', 'officiel'));

-- Couleur d'accent : hexadecimal a 6 chiffres, ou rien. Une chaine libre
-- finirait injectee telle quelle dans un attribut de style du document.
alter table pro_settings drop constraint if exists pro_settings_doc_accent_chk;
alter table pro_settings add  constraint pro_settings_doc_accent_chk
  check (doc_accent is null or doc_accent ~ '^#[0-9A-Fa-f]{6}$');

-- ------------------------------------------------------------
-- 2) RUBRIQUES DE DEVIS
--
-- Reglees une fois par le professionnel, puis RECOPIEES dans chaque devis.
-- Le devis ne les REFERENCE pas : sinon, retoucher ses conditions par defaut
-- reecrirait le contenu de devis deja envoyes et acceptes.
--
-- Forme attendue :
--   [{ "key": "...", "title": "...", "icon": "...", "enabled": true,
--      "items": [{ "label": "...", "body": "..." }] }]
-- ------------------------------------------------------------
alter table pro_settings add column if not exists quote_sections jsonb not null default '[]'::jsonb;
alter table pro_quotes   add column if not exists sections       jsonb not null default '[]'::jsonb;

alter table pro_settings drop constraint if exists pro_settings_quote_sections_chk;
alter table pro_settings add  constraint pro_settings_quote_sections_chk
  check (jsonb_typeof(quote_sections) = 'array');

alter table pro_quotes drop constraint if exists pro_quotes_sections_chk;
alter table pro_quotes add  constraint pro_quotes_sections_chk
  check (jsonb_typeof(sections) = 'array');

-- Borne de volume : ces rubriques finissent sur un document imprime.
alter table pro_settings drop constraint if exists pro_settings_quote_sections_size_chk;
alter table pro_settings add  constraint pro_settings_quote_sections_size_chk
  check (jsonb_array_length(quote_sections) <= 8);

alter table pro_quotes drop constraint if exists pro_quotes_sections_size_chk;
alter table pro_quotes add  constraint pro_quotes_sections_size_chk
  check (jsonb_array_length(sections) <= 8);

-- ------------------------------------------------------------
-- 3) Rafraichit le cache de l'API (sinon les colonnes restent invisibles)
-- ------------------------------------------------------------
notify pgrst, 'reload schema';

select 'Profil d''entreprise et rubriques de devis prets.' as resultat;
