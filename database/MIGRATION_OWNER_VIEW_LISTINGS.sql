-- ============================================================
--  Wanteermako — Le propriétaire voit & gère TOUTES ses annonces
--  À exécuter dans Supabase → SQL Editor.
--
--  Problème : la règle de sécurité (RLS) ne laissait voir que les
--  annonces « active ». Du coup les produits inactifs (désactivés,
--  brouillons…) étaient INVISIBLES même pour leur propriétaire →
--  impossible de les retrouver dans « Gérer mes annonces ».
--
--  Cette migration ajoute les règles pour qu'un vendeur connecté
--  voie, modifie et supprime TOUTES ses propres annonces, quel que
--  soit leur statut. Le public continue de ne voir que les actives.
-- ============================================================

alter table public.listings enable row level security;

-- Le propriétaire voit TOUTES ses annonces (active, inactive, draft, sold...)
drop policy if exists "owner_select_all_listings" on public.listings;
create policy "owner_select_all_listings" on public.listings
  for select using (auth.uid() = user_id);

-- Le public voit les annonces actives (on (re)met la règle au cas où)
drop policy if exists "public_select_active_listings" on public.listings;
create policy "public_select_active_listings" on public.listings
  for select using (status = 'active');

-- Le propriétaire modifie ses annonces (activer / désactiver / éditer)
drop policy if exists "owner_update_listings" on public.listings;
create policy "owner_update_listings" on public.listings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Le propriétaire supprime ses annonces
drop policy if exists "owner_delete_listings" on public.listings;
create policy "owner_delete_listings" on public.listings
  for delete using (auth.uid() = user_id);

-- Le propriétaire crée ses annonces
drop policy if exists "owner_insert_listings" on public.listings;
create policy "owner_insert_listings" on public.listings
  for insert with check (auth.uid() = user_id);

-- FIN — Reconnecte-toi sur le site, puis ouvre « Gérer mes annonces » → onglet « Hors ligne ».
