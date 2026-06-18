-- ============================================================
--  Annonce.ID — VIP gratuit (annonces Premium offertes)
--  À exécuter dans Supabase → SQL Editor.
--
--  Ajoute le drapeau `free_premium` sur les comptes. Quand il est
--  activé (depuis l'admin → Utilisateurs → 🎁 VIP gratuit), les
--  annonces du vendeur passent automatiquement en Premium, sans
--  paiement ni limite d'annonces gratuites.
-- ============================================================

alter table profiles add column if not exists free_premium boolean default false;
-- Image de couverture de la boutique (dashboard → Ma Boutique)
alter table profiles add column if not exists cover_url text;

-- (Optionnel) Permettre au Super Admin (accès par mot de passe côté app)
-- de modifier les profils des autres utilisateurs — sinon le bouton
-- "🎁 VIP gratuit" et "🚀 Pro" échouent (RLS propriétaire uniquement).
-- ⚠️ Ouvre l'écriture des profils via la clé publique : acceptable au
--    démarrage (derrière l'admin), à durcir avec une vraie auth admin.
drop policy if exists "admin_update_profiles" on profiles;
create policy "admin_update_profiles" on profiles for update using (true) with check (true);

-- FIN
