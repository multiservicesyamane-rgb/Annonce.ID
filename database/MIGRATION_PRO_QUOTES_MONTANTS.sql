-- ============================================================
-- CONTRAINTES DE MONTANTS SUR LES DEVIS
--
-- A EXECUTER dans Supabase -> SQL Editor.
--
-- Pourquoi : MIGRATION_MON_ACTIVITE.sql a pose ces garde-fous sur
-- pro_invoices (montants positifs, remise <= sous-total, TVA 0-100) mais
-- pas sur pro_quotes. Or un devis est la SOURCE de la facture : accepte, il
-- est converti automatiquement (convertAcceptedQuote). Un montant negatif ou
-- une remise superieure au sous-total y passait donc sans bruit, pour se
-- transformer en facture invalide -- ou en ecriture rejetee de l'autre cote,
-- au moment ou le client vient justement d'accepter.
--
-- Les memes regles des deux cotes : ce que la facture refuse, le devis le
-- refuse aussi.
--
-- Idempotent : relancer ce fichier ne coute rien.
-- ============================================================

-- Verification A LANCER D'ABORD. Elle doit renvoyer 0 ligne : toute ligne
-- renvoyee est un devis que la contrainte rejettera, et l'ajout echouerait.
-- Corriger ces devis (ou les supprimer s'ils sont des brouillons de test)
-- avant de poursuivre.
--
-- select id, number, subtotal, discount, tax_amount, total, tax_rate
--   from pro_quotes
--  where subtotal < 0 or discount < 0 or discount > subtotal
--     or tax_amount < 0 or total < 0
--     or tax_rate < 0 or tax_rate > 100;

alter table pro_quotes drop constraint if exists pro_quotes_amounts_chk;
alter table pro_quotes add  constraint pro_quotes_amounts_chk
  check (
    subtotal   >= 0 and
    discount   >= 0 and discount <= subtotal and
    tax_amount >= 0 and
    total      >= 0
  );

-- Pas de `paid_amount` ici : un devis ne s'encaisse pas. Le suivi du
-- paiement commence a la facture, et lui seul.

alter table pro_quotes drop constraint if exists pro_quotes_tax_rate_chk;
alter table pro_quotes add  constraint pro_quotes_tax_rate_chk
  check (tax_rate >= 0 and tax_rate <= 100);
