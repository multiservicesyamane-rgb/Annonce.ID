-- ============================================================
-- Wanteermako - Durcissement Supabase / RLS (volet 2)
-- A executer dans Supabase > SQL Editor.
-- Complement de MIGRATION_SECURITY_HARDENING.sql.
--
-- Corrige :
-- 1. Tables encore sans RLS (otp_codes, payments, ad_banners, ...)
--    -> filet de securite : RLS active sur TOUTES les tables public.
-- 2. Policies heritees trop permissives (insert client sur
--    transactions/purchases, lecture publique de la table users
--    qui expose phone/email, campagnes_pub lisible en entier).
-- 3. Fonctions SECURITY DEFINER sans search_path fixe
--    (warning "Function Search Path Mutable" du Security Advisor).
-- 4. Fonctions sensibles appelables en RPC par la cle anon.
--
-- Idempotent : re-executable sans erreur.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Filet de securite : RLS actif sur toutes les tables public.
--    Les tables sans policy deviennent accessibles UNIQUEMENT via
--    les routes serveur (SUPABASE_SERVICE_ROLE_KEY), qui ignorent RLS.
--    Couvre notamment : otp_codes, payments, ad_banners, users.
-- ------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity = false
  loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 2) otp_codes / payments : RLS active en (1), AUCUNE policy
--    -> lisibles et modifiables uniquement via le service role.
--    (Les codes OTP et numeros de telephone ne doivent JAMAIS
--    etre accessibles avec la cle anon.)
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 3) transactions : lecture de ses propres lignes seulement,
--    plus AUCUNE ecriture cote client (les paiements sont
--    enregistres par les webhooks serveur PayTech/Wave/CinetPay).
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.transactions') is not null then
    drop policy if exists "Users can insert their own transactions." on public.transactions;
    drop policy if exists "Users cannot update transactions." on public.transactions;
    drop policy if exists "transactions_select_own" on public.transactions;
    drop policy if exists "Users can view their own transactions." on public.transactions;
    create policy "transactions_select_own" on public.transactions
      for select using (auth.uid() = user_id);
  end if;
end $$;

-- ------------------------------------------------------------
-- 3b) listings : la policy heritee "viewable by everyone" exposait
--     TOUTES les annonces (y compris non publiees). On la remplace
--     par lecture publique des actives + lecture proprietaire.
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.listings') is not null then
    drop policy if exists "Public listings are viewable by everyone" on public.listings;
    drop policy if exists "Public listings are viewable by everyone." on public.listings;
    drop policy if exists "public_select_active_listings" on public.listings;
    drop policy if exists "owner_select_all_listings" on public.listings;

    create policy "public_select_active_listings" on public.listings
      for select using (status = 'active');

    create policy "owner_select_all_listings" on public.listings
      for select using (auth.uid() = user_id);
  end if;
end $$;

-- ------------------------------------------------------------
-- 3c) profiles : une seule policy de lecture publique (les doublons
--     herites sont supprimes). Lecture publique voulue : le site
--     affiche les vendeurs.
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.profiles') is not null then
    drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
    drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
    drop policy if exists "profiles_select_public" on public.profiles;

    create policy "profiles_select_public" on public.profiles
      for select using (true);
  end if;
end $$;

-- ------------------------------------------------------------
-- 4) purchases : suppression des policies heritees qui laissaient
--    le client inserer ses propres achats (fraude possible).
--    La lecture "purchases_select_own" du volet 1 reste en place.
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.purchases') is not null then
    drop policy if exists "Users can create purchases" on public.purchases;
    drop policy if exists "Users can view own purchases" on public.purchases;
    -- garantie que la lecture proprietaire existe
    drop policy if exists "purchases_select_own" on public.purchases;
    create policy "purchases_select_own" on public.purchases
      for select using (auth.uid() = user_id);
  end if;
end $$;

-- ------------------------------------------------------------
-- 5) campagnes_pub : lecture publique limitee aux campagnes
--    actives ; le proprietaire voit et gere les siennes.
--    (Avant : toutes les campagnes de tous les comptes lisibles.)
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.campagnes_pub') is not null then
    -- La table historique a pu etre creee sans user_id : on l'ajoute,
    -- avec auth.uid() par defaut pour que les inserts du Dashboard
    -- (qui n'envoient pas user_id) restent valides.
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'campagnes_pub'
        and column_name = 'user_id'
    ) then
      alter table public.campagnes_pub
        add column user_id uuid default auth.uid();
    end if;

    drop policy if exists "Public Access" on public.campagnes_pub;
    drop policy if exists "Public campaigns are viewable by everyone" on public.campagnes_pub;
    drop policy if exists "Users can create campaigns" on public.campagnes_pub;
    drop policy if exists "Users can update own campaigns" on public.campagnes_pub;
    drop policy if exists "campagnes_select_active_or_own" on public.campagnes_pub;
    drop policy if exists "campagnes_insert_own" on public.campagnes_pub;
    drop policy if exists "campagnes_update_own" on public.campagnes_pub;
    drop policy if exists "campagnes_delete_own" on public.campagnes_pub;

    create policy "campagnes_select_active_or_own" on public.campagnes_pub
      for select using (status = 'active' or auth.uid() = user_id);

    create policy "campagnes_insert_own" on public.campagnes_pub
      for insert with check (auth.uid() = user_id);

    create policy "campagnes_update_own" on public.campagnes_pub
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

    create policy "campagnes_delete_own" on public.campagnes_pub
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ------------------------------------------------------------
-- 6) Table legacy "users" (schema 0001_init) : la lecture publique
--    exposait phone + email de tous les comptes. Le site utilise
--    "profiles" ; on restreint donc "users" a son proprietaire.
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.users') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'users'
         and column_name = 'auth_id'
     ) then
    drop policy if exists "profil public" on public.users;
    drop policy if exists "modifier son profil" on public.users;
    drop policy if exists "users_select_own" on public.users;
    drop policy if exists "users_update_own" on public.users;

    create policy "users_select_own" on public.users
      for select using (auth.uid() = auth_id);

    create policy "users_update_own" on public.users
      for update using (auth.uid() = auth_id) with check (auth.uid() = auth_id);
  end if;
end $$;

-- ------------------------------------------------------------
-- 7) ad_banners : lecture publique des bannieres actives,
--    gestion via routes serveur uniquement.
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.ad_banners') is not null then
    drop policy if exists "ad_banners_select_active" on public.ad_banners;
    create policy "ad_banners_select_active" on public.ad_banners
      for select using (status = 'active');
  end if;
end $$;

-- ------------------------------------------------------------
-- 8) Fonctions : search_path fixe (Security Advisor
--    "Function Search Path Mutable") + memes definitions.
-- ------------------------------------------------------------
create or replace function public.grant_welcome_credits(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Deja offert ? on sort (pas de double cadeau).
  if exists (
    select 1 from public.boost_credits
    where user_id = p_user_id and source = 'gift'
  ) then
    return;
  end if;

  insert into public.boost_credits (user_id, boost_key, boost_name, duration_days, source)
  values (p_user_id, 'premium', '⭐ Premium (offert)', 7, 'gift');

  insert into public.boost_credits (user_id, boost_key, boost_name, duration_days, source)
  values (p_user_id, 'alaune', '🔥 À la Une (offert)', 30, 'gift');
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, email, name, avatar)
  values (
    new.id,
    new.phone,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Utilisateur ' || substring(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  perform public.grant_welcome_credits(new.id);

  return new;
end;
$$;

create or replace function public.update_modified_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 9) Ces fonctions ne doivent pas etre appelables en RPC avec la
--    cle anon (grant_welcome_credits creerait des credits cadeaux
--    a la demande). Seul le trigger / service role les utilise.
--    increment_views reste volontairement appelable (compteur de vues).
-- ------------------------------------------------------------
revoke execute on function public.grant_welcome_credits(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ------------------------------------------------------------
-- 10) Controle final (un seul tableau) :
--     - lignes "SANS RLS"     : il ne doit y en avoir AUCUNE ;
--     - lignes "PUBLIC(true)" : seules les lectures publiques voulues
--       (profiles, listing_images, categories, countries, reviews).
-- ------------------------------------------------------------
select 'SANS RLS' as type, c.relname as detail, '' as cmd
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false
union all
select 'PUBLIC(true)', tablename || ' — ' || policyname, cmd::text
from pg_policies
where schemaname = 'public'
  and qual = 'true'
order by 1, 2;
