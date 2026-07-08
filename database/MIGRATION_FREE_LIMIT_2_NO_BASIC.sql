-- ============================================================
-- Wanteermako — 2 annonces gratuites + suppression Basic
-- À exécuter dans Supabase → SQL Editor.
-- ============================================================

alter table public.profiles add column if not exists free_ads_remaining integer default 2;
alter table public.profiles alter column free_ads_remaining set default 2;

-- Les comptes existants ne doivent pas avoir plus de 2 annonces gratuites.
update public.profiles
set free_ads_remaining = 2
where free_ads_remaining is null or free_ads_remaining > 2;

-- L'offre Basic/Standard n'est plus utilisée.
delete from public.boost_credits
where boost_key = 'basic' and source = 'gift';

-- FIN
