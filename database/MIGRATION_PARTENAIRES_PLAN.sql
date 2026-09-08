-- ============================================================
-- Partenaires : l'abonnement (plan + echeance)
--
-- A executer dans Supabase > SQL Editor. Re-executable sans risque.
--
-- ── Pourquoi ce petit fichier a part ────────────────────────────────────
-- MIGRATION_PARTENAIRES.sql a DEJA tourne sur cette base : les tables
-- `partenaires`, `partenaire_points` et `partenaire_missions` existent, avec
-- `code` et `agence`. Seules manquent les deux colonnes ajoutees ensuite,
-- quand le modele « abonnement » a ete retenu.
--
-- Relancer le gros fichier ferait la meme chose — il est entierement
-- rejouable. Celui-ci evite juste d'avoir a relire cent trente lignes pour
-- verifier qu'elles ne cassent rien.
-- ============================================================

-- L'abonnement souscrit : 'starter' ou 'agence'. Vide tant qu'aucun n'a ete
-- paye — un candidat existe avant d'avoir regle quoi que ce soit.
alter table partenaires
  add column if not exists plan text not null default '';

-- Jusqu'a quand l'abonnement court.
--
-- L'encaissement se fait a la main, par Wave ou en especes. Sans echeance, le
-- statut « actif » vaudrait a vie et couper reposerait sur la memoire de
-- l'administrateur. Un abonnement que personne ne pense a arreter n'est pas
-- un abonnement, c'est un cadeau.
alter table partenaires
  add column if not exists expire_at timestamptz;

-- La chaine vide doit rester acceptee, sinon les fiches deja creees — toutes
-- sans plan — violeraient la contrainte au moment de l'ajouter.
alter table partenaires drop constraint if exists partenaires_plan_chk;
alter table partenaires add  constraint partenaires_plan_chk
  check (plan in ('', 'starter', 'agence'));

-- Verification : la requete doit rendre deux lignes, `plan` et `expire_at`.
-- select column_name, data_type
-- from information_schema.columns
-- where table_name = 'partenaires' and column_name in ('plan', 'expire_at');
