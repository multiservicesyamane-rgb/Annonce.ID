-- ============================================================================
-- Vidéo de présentation (max 1 min 30) sur les annonces
-- À exécuter dans Supabase → SQL Editor (une seule fois).
-- ============================================================================

-- 1) Colonne "video" (URL publique de la vidéo) sur la table listings
alter table listings add column if not exists video text;

-- 2) Bucket de stockage public "videos"
--    50 Mo max par fichier, formats vidéo courants uniquement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos', 'videos', true, 52428800,
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
)
on conflict (id) do update
  set public             = true,
      file_size_limit    = 52428800,
      allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];

-- 3) Policies RLS sur storage.objects pour le bucket "videos"

-- Lecture publique (n'importe qui peut voir la vidéo d'une annonce)
drop policy if exists "videos public read" on storage.objects;
create policy "videos public read" on storage.objects
  for select
  using (bucket_id = 'videos');

-- Envoi réservé aux utilisateurs connectés, dans leur propre dossier
-- (le préfixe du chemin doit être leur user id : "<uid>/fichier.mp4")
drop policy if exists "videos user insert" on storage.objects;
create policy "videos user insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Suppression / remplacement de ses propres vidéos
drop policy if exists "videos user update" on storage.objects;
create policy "videos user update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "videos user delete" on storage.objects;
create policy "videos user delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
