-- ============================================================
--  Wanteermako — Pack de bienvenue (offre de lancement)
--  À exécuter dans Supabase → SQL Editor.
--
--  Offre à CHAQUE compte 7 boosts gratuits :
--     • 5 × Standard   (basic)   — 7 jours chacun
--     • 1 × Premium    (premium) — 14 jours
--     • 1 × À la Une   (alaune)  — 30 jours
--
--  Les crédits arrivent dans le dashboard (« Mes crédits ») et
--  s'appliquent sur n'importe quelle annonce du vendeur.
--  Source = 'gift' pour les distinguer des achats.
--
--  ⚠️ Les annonces BASIQUES (gratuites) restent illimitées : ce pack
--     offre la POSSIBILITÉ de mettre des annonces en avant gratuitement.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1) Fonction réutilisable : crédite un utilisateur du pack de bienvenue
--    (ne fait rien s'il l'a déjà reçu → pas de double cadeau)
-- ──────────────────────────────────────────────────────────
create or replace function public.grant_welcome_credits(p_user_id uuid)
returns void as $$
begin
  -- Déjà offert ? on sort.
  if exists (
    select 1 from public.boost_credits
    where user_id = p_user_id and source = 'gift'
  ) then
    return;
  end if;

  -- 5 × Standard (basic)
  insert into public.boost_credits (user_id, boost_key, boost_name, duration_days, source)
  select p_user_id, 'basic', '🚀 Standard (offert)', 7, 'gift'
  from generate_series(1, 5);

  -- 1 × Premium
  insert into public.boost_credits (user_id, boost_key, boost_name, duration_days, source)
  values (p_user_id, 'premium', '⭐ Premium (offert)', 14, 'gift');

  -- 1 × À la Une
  insert into public.boost_credits (user_id, boost_key, boost_name, duration_days, source)
  values (p_user_id, 'alaune', '🔥 À la Une (offert)', 30, 'gift');
end;
$$ language plpgsql security definer;

-- ──────────────────────────────────────────────────────────
-- 2) Brancher l'offre sur l'inscription (chaque NOUVEAU compte la reçoit)
--    On recrée handle_new_user en gardant la création du profil + l'offre.
-- ──────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
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

  -- Pack de bienvenue
  perform public.grant_welcome_credits(new.id);

  return new;
end;
$$ language plpgsql security definer;

-- (Le trigger on_auth_user_created existe déjà ; on s'assure qu'il est branché)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────
-- 3) Offrir aussi le pack aux comptes DÉJÀ inscrits (rétroactif)
-- ──────────────────────────────────────────────────────────
do $$
declare u record;
begin
  for u in select id from auth.users loop
    perform public.grant_welcome_credits(u.id);
  end loop;
end $$;

-- FIN — Vérifier : select boost_key, count(*) from boost_credits where source='gift' group by boost_key;
