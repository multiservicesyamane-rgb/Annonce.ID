-- Parrainage : qui a parrainé l'utilisateur + ses points cumulés.
-- À exécuter dans Supabase → SQL Editor.
alter table public.profiles add column if not exists referred_by uuid;
alter table public.profiles add column if not exists referral_points integer not null default 0;
