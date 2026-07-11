-- ============================================================
-- Prospects B2B : colonnes image + lien de l'annonce source
-- A executer dans Supabase > SQL Editor (idempotent).
-- Permet d'afficher la PHOTO du produit et de rouvrir l'annonce
-- d'origine (CoinAfrique / Expat-Dakar / Jiji) depuis le Super Admin.
-- ============================================================
do $$
begin
  if to_regclass('public.prospects') is not null then
    alter table public.prospects add column if not exists image_url  text;
    alter table public.prospects add column if not exists source_url text;
  end if;
end $$;
