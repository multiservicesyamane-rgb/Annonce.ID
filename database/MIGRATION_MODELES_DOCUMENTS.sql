-- ============================================================
-- MODELES DE DOCUMENT : DE 5 A 10
--
-- A EXECUTER dans Supabase -> SQL Editor, AVANT d'utiliser les nouveaux
-- modeles. Sans cette migration, choisir « Colonne », « Ardoise »,
-- « Gestion », « Artisan » ou « Recu » dans le profil d'entreprise est
-- REJETE par la base : la contrainte posee par MIGRATION_ESPACE_PRO.sql ne
-- connait que les cinq premiers. L'ecran afficherait une erreur d'ecriture
-- sans dire pourquoi.
--
-- La liste doit rester identique a DOC_TEMPLATES dans lib/pro.ts. Cette
-- contrainte n'est pas une precaution decorative : elle empeche qu'un
-- identifiant invente (script, console SQL, appel direct a l'API) fasse
-- retomber silencieusement le document sur un rendu par defaut, sans que
-- personne ne comprenne pourquoi la facture ne ressemble plus a rien.
--
-- Idempotent : relancer ce fichier ne coute rien.
-- ============================================================

-- Sans le drop prealable, l'ajout echouerait sur une contrainte homonyme.
alter table pro_settings drop constraint if exists pro_settings_doc_template_chk;

alter table pro_settings add constraint pro_settings_doc_template_chk
  check (doc_template in (
    -- Les cinq d'origine : rien ne bouge pour les comptes existants.
    'classique',
    'moderne',
    'bande',
    'epure',
    'officiel',
    -- Les cinq nouveaux.
    'colonne',   -- barre de couleur sur le cote
    'ardoise',   -- bandeau sombre, tableau quadrille
    'gestion',   -- tout quadrille, pour les longues factures
    'artisan',   -- encadre, lignes alternees
    'recu'       -- tout centre, tableau compact
  ));

-- Verification : doit renvoyer 0 ligne. Toute ligne renvoyee porte un modele
-- que la contrainte refuse desormais — a corriger avant de relancer.
-- select user_id, doc_template from pro_settings
--   where doc_template is not null
--     and doc_template not in ('classique','moderne','bande','epure','officiel',
--                              'colonne','ardoise','gestion','artisan','recu');
