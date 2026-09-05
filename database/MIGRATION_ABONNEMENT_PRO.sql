-- ============================================================
-- ABONNEMENT DE L'ESPACE PRO (devis / factures)
--
-- A EXECUTER dans Supabase -> SQL Editor.
--
-- Pourquoi une table a part, et pas les colonnes `subscription_*` de
-- `profiles` : celles-ci portent deja l'abonnement BOUTIQUE PRO, qui vend de
-- la visibilite sur les annonces. L'Espace Pro vend un outil de facturation.
-- Ce sont deux produits, deux prix, deux echeances : les faire cohabiter dans
-- les memes colonnes rendrait impossible d'etre abonne a l'un sans l'autre,
-- et le premier paiement ecraserait la date de fin du second.
--
-- Idempotent : relancer ce fichier ne coute rien.
-- ============================================================

create table if not exists pro_subscriptions (
  user_id      uuid primary key,
  -- 'mensuel' ou 'annuel'. Le gratuit n'est PAS une ligne ici : l'absence de
  -- ligne vaut gratuit, sinon il faudrait en creer une a chaque inscription.
  plan         text not null,
  -- Tant que cette date est dans le futur, l'abonnement est actif. On ne
  -- supprime jamais la ligne a l'expiration : l'historique sert au support et
  -- au reabonnement en un clic.
  expires_at   timestamptz not null,
  -- D'ou vient l'activation : 'chariow' (paiement en ligne) ou 'admin'
  -- (encaissement en especes, geste commercial). Sans cette trace, impossible
  -- de rapprocher les abonnements des ventes Chariow.
  source       text not null default 'chariow',
  -- Reference de la vente Chariow, pour le rapprochement comptable.
  sale_id      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_pro_subscriptions_expires
  on pro_subscriptions (expires_at desc);

alter table pro_subscriptions enable row level security;

-- Chacun lit son propre abonnement — l'interface doit pouvoir afficher
-- « il vous reste 12 jours » sans passer par une route serveur.
-- L'ECRITURE n'est jamais permise depuis le navigateur : elle appartient au
-- webhook Chariow et a l'admin, tous deux en service_role. Sans cette
-- asymetrie, n'importe qui s'offrirait un abonnement a vie depuis sa console.
drop policy if exists pro_subscriptions_select_own on pro_subscriptions;
create policy pro_subscriptions_select_own on pro_subscriptions
  for select to authenticated using (auth.uid() = user_id);

-- ============================================================
-- Compteur de pieces du mois
--
-- Le quota gratuit se compte sur les FACTURES, pas sur les devis : un devis
-- ne prouve rien tant qu'il n'est pas accepte, et bloquer la porte d'entree
-- ferait fuir avant l'essai. La requete ci-dessous est celle que lit
-- lib/proBilling.ts ; elle est ecrite ici pour rester avec le schema.
--
--   select count(*) from pro_invoices
--   where user_id = ... and created_at >= date_trunc('month', now());
--
-- Index dedie : sans lui, ce compte devient un balayage complet de la table
-- des qu'il y aura du volume, et il est appele a CHAQUE creation de facture.
-- ============================================================
create index if not exists idx_pro_invoices_user_created
  on pro_invoices (user_id, created_at desc);

-- FIN
