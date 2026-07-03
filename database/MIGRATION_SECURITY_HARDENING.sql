-- ============================================================
-- Wanteermako - Durcissement Supabase / RLS
-- A executer dans Supabase > SQL Editor.
--
-- Objectif:
-- - retirer les anciennes policies "using (true) with check (true)"
--   qui ouvraient les donnees internes a la cle anon publique;
-- - forcer les actions Super Admin a passer par les routes serveur
--   avec SUPABASE_SERVICE_ROLE_KEY;
-- - garder les lectures publiques necessaires au site.
-- ============================================================

-- 1) Tables B2B internes: acces public ferme.
do $$
declare
  t text;
begin
  foreach t in array array[
    'prospects',
    'ambassadors',
    'employees',
    'campaigns',
    'points_ledger',
    'leads'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.prospects') is not null then
    drop policy if exists "b2b_all_prospects" on public.prospects;
    drop policy if exists "read prospects" on public.prospects;
    drop policy if exists "write prospects" on public.prospects;
  end if;
  if to_regclass('public.ambassadors') is not null then
    drop policy if exists "b2b_all_ambassadors" on public.ambassadors;
    drop policy if exists "read ambassadors" on public.ambassadors;
  end if;
  if to_regclass('public.employees') is not null then
    drop policy if exists "b2b_all_employees" on public.employees;
    drop policy if exists "read employees" on public.employees;
  end if;
  if to_regclass('public.campaigns') is not null then
    drop policy if exists "b2b_all_campaigns" on public.campaigns;
    drop policy if exists "read campaigns" on public.campaigns;
  end if;
  if to_regclass('public.points_ledger') is not null then
    drop policy if exists "b2b_all_points" on public.points_ledger;
  end if;
  if to_regclass('public.leads') is not null then
    drop policy if exists "b2b_all_leads" on public.leads;
  end if;
end $$;

-- 2) Profils: plus d'ecriture publique globale.
do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;

    drop policy if exists "admin_update_profiles" on public.profiles;
    drop policy if exists "profiles_select_public" on public.profiles;
    drop policy if exists "profiles_insert_own" on public.profiles;
    drop policy if exists "profiles_update_own" on public.profiles;

    -- Le site affiche les vendeurs publiquement. Attention: RLS ne masque pas
    -- les colonnes; eviter les colonnes sensibles dans profiles.
    create policy "profiles_select_public" on public.profiles
      for select using (true);

    create policy "profiles_insert_own" on public.profiles
      for insert with check (auth.uid() = id);

    create policy "profiles_update_own" on public.profiles
      for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- 3) Annonces: lecture publique des actives, ecriture seulement proprietaire.
do $$
begin
  if to_regclass('public.listings') is not null then
    alter table public.listings enable row level security;

    drop policy if exists "listings lisibles" on public.listings;
    drop policy if exists "gerer ses annonces" on public.listings;
    drop policy if exists "public_select_active_listings" on public.listings;
    drop policy if exists "owner_select_all_listings" on public.listings;
    drop policy if exists "owner_insert_listings" on public.listings;
    drop policy if exists "owner_update_listings" on public.listings;
    drop policy if exists "owner_delete_listings" on public.listings;

    create policy "public_select_active_listings" on public.listings
      for select using (status = 'active');

    create policy "owner_select_all_listings" on public.listings
      for select using (auth.uid() = user_id);

    create policy "owner_insert_listings" on public.listings
      for insert with check (auth.uid() = user_id);

    create policy "owner_update_listings" on public.listings
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

    create policy "owner_delete_listings" on public.listings
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 4) Tables sensibles accessibles via routes serveur uniquement.
do $$
declare
  t text;
begin
  foreach t in array array[
    'reports',
    'app_settings',
    'boost_credits',
    'whatsapp_ai_messages',
    'admin_logs'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- 5) Achats: chaque utilisateur peut lire ses achats; ecriture via serveur.
do $$
begin
  if to_regclass('public.purchases') is not null then
    alter table public.purchases enable row level security;
    drop policy if exists "own purchases" on public.purchases;
    drop policy if exists "purchases_select_own" on public.purchases;
    create policy "purchases_select_own" on public.purchases
      for select using (auth.uid() = user_id);
  end if;
end $$;

-- 6) Favoris: chaque utilisateur gere uniquement ses favoris.
do $$
begin
  if to_regclass('public.favorites') is not null then
    alter table public.favorites enable row level security;
    drop policy if exists "favorites_select_own" on public.favorites;
    drop policy if exists "favorites_insert_own" on public.favorites;
    drop policy if exists "favorites_delete_own" on public.favorites;
    create policy "favorites_select_own" on public.favorites
      for select using (auth.uid() = user_id);
    create policy "favorites_insert_own" on public.favorites
      for insert with check (auth.uid() = user_id);
    create policy "favorites_delete_own" on public.favorites
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 7) Tables de reference publiques en lecture seule.
do $$
begin
  if to_regclass('public.categories') is not null then
    alter table public.categories enable row level security;
    drop policy if exists "categories_select_public" on public.categories;
    create policy "categories_select_public" on public.categories
      for select using (true);
  end if;

  if to_regclass('public.countries') is not null then
    alter table public.countries enable row level security;
    drop policy if exists "countries_select_public" on public.countries;
    create policy "countries_select_public" on public.countries
      for select using (true);
  end if;

  if to_regclass('public.reviews') is not null then
    alter table public.reviews enable row level security;
    drop policy if exists "reviews_select_public" on public.reviews;
    drop policy if exists "reviews_insert_auth" on public.reviews;
    create policy "reviews_select_public" on public.reviews
      for select using (true);
    create policy "reviews_insert_auth" on public.reviews
      for insert with check (auth.uid() = reviewer_id);
  end if;
end $$;

-- 8) Requete de controle: tables publiques sans RLS encore actives.
select
  n.nspname as schema,
  c.relname as table,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false
order by c.relname;
