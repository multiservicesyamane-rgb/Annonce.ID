-- ============================================================
--  Wanteermako — Commande par WhatsApp (produits affiliés)
--  À exécuter dans Supabase → SQL Editor.
--
--  Ajoute la colonne order_whatsapp : le numéro WhatsApp vers lequel
--  le bouton « Commander » renvoie le client (au lieu du lien affilié).
--
--  Logique du bouton sur la fiche produit :
--   1) si order_whatsapp est rempli → bouton « Commander sur WhatsApp »
--   2) sinon si external_url est rempli → bouton « Acheter sur <site> »
--   3) sinon → contact normal (WhatsApp vendeur / message)
-- ============================================================

alter table public.listings add column if not exists order_whatsapp text;

-- FIN
