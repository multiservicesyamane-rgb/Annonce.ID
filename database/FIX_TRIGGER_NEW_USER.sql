-- ════════════════════════════════════════════════════════════════
-- CORRECTIF : "Database error creating new user"
-- Le trigger handle_new_user insérait dans des colonnes inexistantes
-- (name, avatar, email) → toute inscription (email/Google/admin) échouait.
-- On le réécrit avec les BONNES colonnes (full_name, avatar_url) + on
-- protège chaque étape pour qu'une inscription ne soit JAMAIS bloquée.
-- À exécuter dans Supabase → SQL Editor → RUN.
-- ════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Création du profil (colonnes réelles : full_name, avatar_url)
  begin
    insert into public.profiles (id, full_name, avatar_url)
    values (
      new.id,
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(coalesce(new.email, ''), '@', 1),
        'Utilisateur ' || substring(new.id::text, 1, 6)
      ),
      new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (id) do nothing;
  exception when others then
    -- on n'empêche jamais la création du compte
    null;
  end;

  -- Pack de bienvenue (optionnel : ignoré si la fonction n'existe pas)
  begin
    perform public.grant_welcome_credits(new.id);
  exception when others then
    null;
  end;

  return new;
end;
$$ language plpgsql security definer;

-- S'assurer que le trigger est bien branché
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
