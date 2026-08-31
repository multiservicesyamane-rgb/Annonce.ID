-- ============================================================
-- CATALOGUE DE PRESTATIONS
--
-- A EXECUTER dans Supabase -> SQL Editor.
--
-- Pourquoi : chaque devis se tapait de zero, au pouce, sur un telephone.
-- Or un menuisier refait les quinze memes prestations toute l'annee. Cette
-- table garde ses lignes habituelles pour qu'un devis se compose en quelques
-- tapes au lieu de plusieurs minutes de saisie.
--
-- Le catalogue est une COMMODITE DE SAISIE, jamais une reference : une ligne
-- ajoutee a un devis en est RECOPIEE, comme les rubriques (voir lib/pro).
-- Changer un prix ici ne doit pas reecrire un devis deja envoye.
--
-- Idempotent : relancer ce fichier ne coute rien.
-- ============================================================

create table if not exists pro_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  label        text not null,
  unit_price   bigint not null default 0,
  -- Unite facultative (« m² », « jour », « piece ») : elle sert au rappel a
  -- l'ecran, pas au document — le tableau de facturation a deja sa colonne Qte.
  unit         text,
  -- Frequence d'usage : le catalogue se trie du plus utilise au moins utilise,
  -- sinon il devient une liste a faire defiler des la trentieme ligne.
  uses         integer not null default 0,
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_pro_items_user on pro_items (user_id);

-- Pas deux fois la meme prestation : « Pose de carrelage » et « pose de
-- carrelage » sont la meme ligne. Sans cet index, le bouton « enregistrer les
-- lignes de ce devis » remplirait le catalogue de doublons a chaque devis.
create unique index if not exists idx_pro_items_label
  on pro_items (user_id, lower(label));

alter table pro_items enable row level security;

-- Memes regles que les autres tables pro_* : chacun ne voit que ses lignes.
-- Les routes /api/pro/* passent par service_role et filtrent TOUJOURS sur
-- user_id ; ces policies protegent l'acces direct depuis le navigateur.
drop policy if exists pro_items_select_own on pro_items;
create policy pro_items_select_own on pro_items
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pro_items_insert_own on pro_items;
create policy pro_items_insert_own on pro_items
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists pro_items_update_own on pro_items;
create policy pro_items_update_own on pro_items
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists pro_items_delete_own on pro_items;
create policy pro_items_delete_own on pro_items
  for delete to authenticated using (auth.uid() = user_id);
