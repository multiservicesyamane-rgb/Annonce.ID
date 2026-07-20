-- ============================================================
--  CORRECTIF URGENT : RÉPARER LA CRÉATION DE COMPTE
--  À exécuter dans Supabase → SQL Editor.
--
--  PROBLÈME : la fonction handle_new_user (déclenchée à chaque
--  inscription) tentait d'insérer dans des colonnes INEXISTANTES
--  de public.profiles (email / name / avatar). Résultat : toute
--  inscription échouait avec « Database error creating new user ».
--
--  Schéma réel de profiles (vérifié le 20/07/2026) :
--    id, full_name, avatar_url, phone, free_ads_remaining (def 2),
--    referral_points (def 0), role (def user), etc.
--
--  CORRECTIF : recréer handle_new_user avec les VRAIES colonnes,
--  sans aucun boost offert (décision du 20/07/2026). Toutes les
--  autres colonnes ont des valeurs par défaut → rien d'autre à fournir.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      'Utilisateur ' || substring(new.id::text, 1, 6)
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.phone
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- S'assurer que le trigger est bien branché sur les nouvelles inscriptions.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

select 'handle_new_user corrigé. Les inscriptions doivent refonctionner, sans boost offert.' as resultat;
