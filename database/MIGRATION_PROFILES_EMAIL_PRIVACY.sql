-- ============================================================
-- Confidentialité : ne plus exposer l'email des profils
-- publiquement (via la clé anon).
-- A executer dans Supabase > SQL Editor (idempotent).
--
-- Contexte : la table public.profiles est lisible publiquement
-- (policy select using(true)) pour afficher les vendeurs. Or elle
-- contient une colonne `email`. On retire donc le DROIT de lecture
-- de cette colonne à la clé anon : PostgREST omet alors simplement
-- la colonne des réponses `select(*)` — l'affichage des vendeurs
-- continue de fonctionner, mais l'email n'est plus récupérable avec
-- la clé publique.
--
-- Le rôle `service_role` (routes serveur / super admin) conserve
-- l'accès complet. Le téléphone reste public (contact WhatsApp voulu).
-- ============================================================
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
  ) then
    revoke select (email) on public.profiles from anon;
    -- Décommente la ligne suivante pour bloquer AUSSI les comptes connectés
    -- (à faire seulement si la page /profil ne lit pas profiles.email) :
    -- revoke select (email) on public.profiles from authenticated;
  end if;
end $$;

-- Contrôle : liste les rôles ayant encore le droit de lire profiles.email
select grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
order by grantee;
