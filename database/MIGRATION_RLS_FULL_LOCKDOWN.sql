-- ============================================================
-- Wanteermako — VERROUILLAGE RLS COMPLET (toutes les 14 tables)
-- A executer dans Supabase > SQL Editor.
--
-- Contexte : l'audit Supabase signale 14 tables sans RLS :
--   User, Post (listings), Product, PaymentRequest, otp_codes,
--   payments, ad_banners, reviews, reports, admin_logs,
--   categories, countries, listing_images, favorites, messages…
--
-- CE SCRIPT :
--   1) Active RLS sur CHAQUE table publique (filet de securite)
--   2) Cree les policies AVANT ou juste apres l'activation
--      → aucune perte d'acces pour l'app
--   3) Est 100% idempotent (re-executable sans erreur)
--   4) L'admin back-office utilise SUPABASE_SERVICE_ROLE_KEY
--      (bypass RLS) → toujours fonctionnel
--
-- IMPORTANT : Executez ce script EN ENTIER, pas morceau par morceau.
-- ============================================================

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  PHASE 1 : POLICIES SPECIFIQUES PAR TABLE                ║
-- ║  On cree les policies AVANT le filet de securite global   ║
-- ║  pour ne jamais couper l'acces a l'app.                  ║
-- ╚═══════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────
-- 1) PROFILES : lecture publique (vendeurs), ecriture proprietaire
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;

    drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
    drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
    drop policy if exists "Users can insert their own profile" on public.profiles;
    drop policy if exists "Users can update own profile" on public.profiles;
    drop policy if exists "admin_update_profiles" on public.profiles;
    drop policy if exists "profiles_select_public" on public.profiles;
    drop policy if exists "profiles_insert_own" on public.profiles;
    drop policy if exists "profiles_update_own" on public.profiles;

    create policy "profiles_select_public" on public.profiles
      for select using (true);

    create policy "profiles_insert_own" on public.profiles
      for insert with check (auth.uid() = id);

    create policy "profiles_update_own" on public.profiles
      for update using (auth.uid() = id) with check (auth.uid() = id);
    -- PAS de policy update globale (using(true)) : l'admin passe par service_role
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 2) LISTINGS : lecture publique (actives), proprietaire gere tout
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.listings') is not null then
    alter table public.listings enable row level security;

    drop policy if exists "Public listings are viewable by everyone" on public.listings;
    drop policy if exists "Public listings are viewable by everyone." on public.listings;
    drop policy if exists "listings lisibles" on public.listings;
    drop policy if exists "gerer ses annonces" on public.listings;
    drop policy if exists "Users can create listings" on public.listings;
    drop policy if exists "Users can update own listings" on public.listings;
    drop policy if exists "Users can delete own listings" on public.listings;
    drop policy if exists "public_select_active_listings" on public.listings;
    drop policy if exists "owner_select_all_listings" on public.listings;
    drop policy if exists "owner_insert_listings" on public.listings;
    drop policy if exists "owner_update_listings" on public.listings;
    drop policy if exists "owner_delete_listings" on public.listings;

    -- Public : seules les annonces actives
    create policy "public_select_active_listings" on public.listings
      for select using (status = 'active');

    -- Proprietaire : voit TOUTES ses annonces (active, inactive, draft, sold…)
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

-- ─────────────────────────────────────────────────────────────
-- 3) CATEGORIES : lecture publique, ecriture admin (service_role)
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.categories') is not null then
    alter table public.categories enable row level security;

    drop policy if exists "Les categories sont publiques" on public.categories;
    drop policy if exists "categories_select_public" on public.categories;

    create policy "categories_select_public" on public.categories
      for select using (true);
    -- Ecriture : service_role uniquement (insert/update/delete admin)
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 4) COUNTRIES : lecture publique, ecriture admin
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.countries') is not null then
    alter table public.countries enable row level security;

    drop policy if exists "countries_select_public" on public.countries;

    create policy "countries_select_public" on public.countries
      for select using (true);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 5) FAVORITES : chaque utilisateur gere uniquement les siens
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.favorites') is not null then
    alter table public.favorites enable row level security;

    drop policy if exists "Les utilisateurs peuvent voir leurs favoris" on public.favorites;
    drop policy if exists "Les utilisateurs peuvent ajouter des favoris" on public.favorites;
    drop policy if exists "Les utilisateurs peuvent supprimer leurs favoris" on public.favorites;
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

-- ─────────────────────────────────────────────────────────────
-- 6) MESSAGES : chacun voit ses conversations, envoie en son nom
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.messages') is not null then
    alter table public.messages enable row level security;

    drop policy if exists "Les utilisateurs voient leurs propres messages" on public.messages;
    drop policy if exists "Les utilisateurs peuvent envoyer des messages" on public.messages;
    drop policy if exists "Les destinataires peuvent marquer comme lu" on public.messages;
    drop policy if exists "messages_select_own" on public.messages;
    drop policy if exists "messages_insert_own" on public.messages;
    drop policy if exists "messages_update_own" on public.messages;

    create policy "messages_select_own" on public.messages
      for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

    create policy "messages_insert_own" on public.messages
      for insert with check (auth.uid() = sender_id);

    create policy "messages_update_own" on public.messages
      for update using (auth.uid() = receiver_id);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 7) REVIEWS : lecture publique, ecriture par le reviewer
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.reviews') is not null then
    alter table public.reviews enable row level security;

    drop policy if exists "Les avis sont publics" on public.reviews;
    drop policy if exists "Les utilisateurs authentifiés peuvent ajouter des avis" on public.reviews;
    drop policy if exists "reviews_select_public" on public.reviews;
    drop policy if exists "reviews_insert_auth" on public.reviews;

    create policy "reviews_select_public" on public.reviews
      for select using (true);

    create policy "reviews_insert_auth" on public.reviews
      for insert with check (auth.uid() = reviewer_id);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 8) REPORTS : ecriture authentifiee, lecture admin (service_role)
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.reports') is not null then
    alter table public.reports enable row level security;

    drop policy if exists "Les utilisateurs authentifiés peuvent signaler" on public.reports;
    drop policy if exists "reports_insert_auth" on public.reports;

    -- Permettre aux utilisateurs de signaler (insert)
    -- La colonne reporter_id peut etre nullable dans certaines versions du schema
    create policy "reports_insert_auth" on public.reports
      for insert with check (true);
    -- Lecture : service_role uniquement (admin back-office)
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 9) PURCHASES : chaque utilisateur voit ses achats, ecriture serveur
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.purchases') is not null then
    alter table public.purchases enable row level security;

    drop policy if exists "own purchases" on public.purchases;
    drop policy if exists "Users can create purchases" on public.purchases;
    drop policy if exists "Users can view own purchases" on public.purchases;
    drop policy if exists "Les utilisateurs peuvent voir leurs achats" on public.purchases;
    drop policy if exists "purchases_select_own" on public.purchases;

    create policy "purchases_select_own" on public.purchases
      for select using (auth.uid() = user_id);
    -- Ecriture : webhooks/admin via service_role uniquement
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 10) LISTING_IMAGES : lecture publique, ecriture proprietaire
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.listing_images') is not null then
    alter table public.listing_images enable row level security;

    drop policy if exists "images lisibles" on public.listing_images;
    drop policy if exists "listing_images_select_public" on public.listing_images;

    create policy "listing_images_select_public" on public.listing_images
      for select using (true);
    -- Ecriture : via service_role ou le proprietaire de l'annonce
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 11) USERS (table legacy 0001_init) : proprietaire voit/modifie
--     le sien. NE PAS exposer phone/email publiquement.
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.users') is not null then
    alter table public.users enable row level security;

    drop policy if exists "profil public" on public.users;
    drop policy if exists "modifier son profil" on public.users;
    drop policy if exists "users_select_own" on public.users;
    drop policy if exists "users_update_own" on public.users;

    -- Le site utilise public.profiles ; la table users ne doit
    -- etre accessible qu'a son proprietaire (contient phone/email)
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users'
        and column_name = 'auth_id'
    ) then
      create policy "users_select_own" on public.users
        for select using (auth.uid() = auth_id);
      create policy "users_update_own" on public.users
        for update using (auth.uid() = auth_id) with check (auth.uid() = auth_id);
    end if;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 12) OTP_CODES : AUCUNE policy → service_role uniquement
--     (ne JAMAIS exposer les codes OTP via la cle anon)
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.otp_codes') is not null then
    alter table public.otp_codes enable row level security;
    -- Pas de policy : acces uniquement via service_role
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 13) PAYMENTS : AUCUNE policy → service_role uniquement
--     (transactions financieres = webhooks serveur)
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.payments') is not null then
    alter table public.payments enable row level security;
    -- Pas de policy : acces uniquement via service_role
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 14) AD_BANNERS : lecture des bannieres actives, gestion admin
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.ad_banners') is not null then
    alter table public.ad_banners enable row level security;

    drop policy if exists "ad_banners_select_active" on public.ad_banners;

    create policy "ad_banners_select_active" on public.ad_banners
      for select using (status = 'active');
    -- Ecriture : service_role uniquement
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 15) ADMIN_LOGS : service_role uniquement (audit)
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.admin_logs') is not null then
    alter table public.admin_logs enable row level security;
    -- Pas de policy : acces uniquement via service_role
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 16) TRANSACTIONS : lecture de ses propres lignes
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.transactions') is not null then
    alter table public.transactions enable row level security;

    drop policy if exists "Users can insert their own transactions." on public.transactions;
    drop policy if exists "Users cannot update transactions." on public.transactions;
    drop policy if exists "Users can view their own transactions." on public.transactions;
    drop policy if exists "transactions_select_own" on public.transactions;

    create policy "transactions_select_own" on public.transactions
      for select using (auth.uid() = user_id);
    -- Ecriture : service_role (webhooks paiement)
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 17) APP_SETTINGS : service_role uniquement
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.app_settings') is not null then
    alter table public.app_settings enable row level security;
    -- Pas de policy : lecture/ecriture admin via service_role
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 18) BOOST_CREDITS : service_role uniquement
--     (les credits sont geres par les routes serveur /api/credits)
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.boost_credits') is not null then
    alter table public.boost_credits enable row level security;
    -- Pas de policy : acces via service_role
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 19) WHATSAPP_AI_MESSAGES : service_role uniquement
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.whatsapp_ai_messages') is not null then
    alter table public.whatsapp_ai_messages enable row level security;
    -- Pas de policy : webhook serveur uniquement
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 20) PUSH_SUBSCRIPTIONS : proprietaire gere les siennes
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.push_subscriptions') is not null then
    alter table public.push_subscriptions enable row level security;

    drop policy if exists "push_select_own" on public.push_subscriptions;
    drop policy if exists "push_insert_own" on public.push_subscriptions;
    drop policy if exists "push_delete_own" on public.push_subscriptions;

    create policy "push_select_own" on public.push_subscriptions
      for select using (auth.uid() = user_id);

    create policy "push_insert_own" on public.push_subscriptions
      for insert with check (auth.uid() = user_id);

    create policy "push_delete_own" on public.push_subscriptions
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 21) TABLES B2B : acces interne ferme (service_role uniquement)
--     prospects, ambassadors, employees, campaigns, points_ledger, leads
-- ─────────────────────────────────────────────────────────────
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

-- Supprimer les anciennes policies trop permissives sur B2B
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
-- B2B : pas de policy → service_role uniquement

-- ─────────────────────────────────────────────────────────────
-- 22) TABLES CAMPAGNE IA : service_role uniquement
-- ─────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'campaign_daily_stats',
    'campaign_posts',
    'campaign_boosts',
    'campaign_influenceurs',
    'campaign_weekly_reports',
    'campagnes_pub'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- Supprimer les anciennes policies trop permissives sur campagnes_pub
do $$
begin
  if to_regclass('public.campagnes_pub') is not null then
    drop policy if exists "Public Access" on public.campagnes_pub;
    drop policy if exists "Public campaigns are viewable by everyone" on public.campagnes_pub;
    drop policy if exists "Users can create campaigns" on public.campagnes_pub;
    drop policy if exists "Users can update own campaigns" on public.campagnes_pub;
    drop policy if exists "campagnes_select_active_or_own" on public.campagnes_pub;
    drop policy if exists "campagnes_insert_own" on public.campagnes_pub;
    drop policy if exists "campagnes_update_own" on public.campagnes_pub;
    drop policy if exists "campagnes_delete_own" on public.campagnes_pub;
    -- Pas de nouvelle policy : admin via service_role
  end if;
end $$;

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  PHASE 2 : FILET DE SECURITE GLOBAL                      ║
-- ║  Active RLS sur TOUTE table publique oubliee ci-dessus.   ║
-- ║  Sans policy = acces service_role uniquement.             ║
-- ╚═══════════════════════════════════════════════════════════╝
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
    raise notice 'RLS activé sur table oubliee : %', r.relname;
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end $$;

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  PHASE 3 : SECURISER LES FONCTIONS                       ║
-- ║  search_path fixe + revoke RPC sensibles                  ║
-- ╚═══════════════════════════════════════════════════════════╝

-- grant_welcome_credits : ne doit JAMAIS etre appelable via RPC anon
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid
             where n.nspname = 'public' and p.proname = 'grant_welcome_credits') then
    revoke execute on function public.grant_welcome_credits(uuid) from public, anon, authenticated;
  end if;
exception when others then null;
end $$;

-- handle_new_user : trigger uniquement
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid
             where n.nspname = 'public' and p.proname = 'handle_new_user') then
    revoke execute on function public.handle_new_user() from public, anon, authenticated;
  end if;
exception when others then null;
end $$;

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  PHASE 4 : MASQUER L'EMAIL DES PROFILS (cle anon)        ║
-- ╚═══════════════════════════════════════════════════════════╝
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
  ) then
    revoke select (email) on public.profiles from anon;
  end if;
end $$;

-- ╔═══════════════════════════════════════════════════════════╗
-- ║  PHASE 5 : VERIFICATION FINALE                           ║
-- ║  Cette requete doit retourner ZERO lignes "SANS RLS".     ║
-- ╚═══════════════════════════════════════════════════════════╝
select 'SANS RLS' as type,
       c.relname as detail,
       'ALTER TABLE public.' || c.relname || ' ENABLE ROW LEVEL SECURITY;' as fix
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false
order by c.relname;

-- Affiche aussi les policies "using(true)" actives (pour verification manuelle)
select 'POLICY OUVERTE' as type,
       tablename || ' → ' || policyname as detail,
       'Verifier si cette lecture publique est voulue' as fix
from pg_policies
where schemaname = 'public'
  and qual = 'true'
order by tablename, policyname;

-- ✅ FIN — Si la premiere requete retourne 0 lignes, toutes les tables sont protegees.
-- Le back-office admin (SuperAdminApp) continue de fonctionner car il passe par
-- /api/admin/users qui utilise SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
-- ===================================================================
-- PHASE STORAGE : BUCKETS ET POLICIES
-- ===================================================================
insert into storage.buckets (id, name, public) values ('images', 'images', true)
  on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public) values ('chat_media', 'chat_media', false)
  on conflict (id) do update set public = false;

drop policy if exists "wmk_public_read" on storage.objects;
create policy "wmk_public_read" on storage.objects
  for select using (bucket_id = 'images');

drop policy if exists "wmk_chat_owner_read" on storage.objects;
create policy "wmk_chat_owner_read" on storage.objects
  for select to authenticated using (
    bucket_id = 'chat_media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "wmk_auth_upload" on storage.objects;
create policy "wmk_auth_upload" on storage.objects
  for insert to authenticated with check (
    (bucket_id = 'images' and split_part(name, '/', 2) = auth.uid()::text)
    or (bucket_id = 'chat_media' and split_part(name, '/', 1) = auth.uid()::text)
  );

drop policy if exists "wmk_auth_update" on storage.objects;
create policy "wmk_auth_update" on storage.objects
  for update to authenticated using (
    (bucket_id = 'images' and split_part(name, '/', 2) = auth.uid()::text)
    or (bucket_id = 'chat_media' and split_part(name, '/', 1) = auth.uid()::text)
  ) with check (
    (bucket_id = 'images' and split_part(name, '/', 2) = auth.uid()::text)
    or (bucket_id = 'chat_media' and split_part(name, '/', 1) = auth.uid()::text)
  );

-- Idempotence des webhooks paiement.
create unique index if not exists idx_purchases_ref_command_unique on public.purchases (ref_command) where ref_command is not null;
