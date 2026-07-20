-- ============================================================
--  DÉSACTIVATION DU PACK DE BIENVENUE EN BOOSTS
--  À exécuter dans Supabase → SQL Editor.
--
--  Décision du 20/07/2026 : les nouveaux comptes ne reçoivent PLUS
--  de boosts gratuits. Seules les 2 annonces gratuites restent.
--  Motif : le pack (jusqu'à 7 boosts/compte, dont À la Une 7 500 F)
--  bradait les offres payantes et sabotait le modèle PRO/boost.
--
--  SÛRETÉ : on neutralise uniquement grant_welcome_credits (rendue
--  neutre). handle_new_user continue de l'appeler mais elle ne fait
--  plus rien → la CRÉATION DU PROFIL n'est pas touchée, l'inscription
--  fonctionne normalement.
-- ============================================================

create or replace function public.grant_welcome_credits(p_user_id uuid)
returns void as $$
begin
  -- Pack de bienvenue désactivé : aucun boost offert aux nouveaux comptes.
  return;
end;
$$ language plpgsql security definer;

-- ── Vérification post-exécution ─────────────────────────────
-- 1) La fonction est bien neutre :
--    select public.grant_welcome_credits(gen_random_uuid());  -- ne crée rien
--
-- 2) DIAGNOSTIC (colle le résultat si tu veux qu'on confirme) : s'assurer que
--    handle_new_user n'offre pas de boosts EN DEHORS de cette fonction.
--    select pg_get_functiondef('public.handle_new_user'::regproc);
--    → Si tu y vois des « insert into boost_credits » directs, préviens-moi :
--      il faudra un correctif ciblé (sans toucher la création du profil).

select 'Pack de bienvenue désactivé. Teste une inscription : le compte ne doit recevoir AUCUN boost.' as resultat;
