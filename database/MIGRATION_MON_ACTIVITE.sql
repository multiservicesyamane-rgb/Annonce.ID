-- ============================================================
-- ESPACE FREELANCER — Mon Activite / Clients / Projets / Devis / Factures
-- A executer dans Supabase > SQL Editor. Re-executable sans risque.
-- Aucun bloc dynamique : chaque instruction est explicite.
--
-- Chaine fonctionnelle : Client > Projet > Devis > Acceptation > Facture
--                        > Paiement > Suivi dans Mon Activite
--
-- Montants : bigint en FCFA entiers (pas de centimes en zone UEMOA).
-- ============================================================

-- ============================================================
-- 1) CLIENTS
-- ============================================================
create table if not exists pro_clients (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  name          text not null,
  company       text,
  phone         text,
  email         text,
  city          text,
  sector        text,
  notes         text,
  tracking_code text not null,
  archived      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Colonnes ajoutees par la version complete (fiche client + facturation).
alter table pro_clients add column if not exists status       text not null default 'prospect';
alter table pro_clients add column if not exists address      text;
alter table pro_clients add column if not exists billing_name text;
alter table pro_clients add column if not exists tax_id       text;   -- NINEA / RCCM
alter table pro_clients add column if not exists updated_at   timestamptz not null default now();

create index if not exists idx_pro_clients_user   on pro_clients (user_id);
create index if not exists idx_pro_clients_status on pro_clients (user_id, status);
create unique index if not exists idx_pro_clients_code on pro_clients (tracking_code);

-- Statuts autorises : prospect / active / inactive
alter table pro_clients drop constraint if exists pro_clients_status_chk;
alter table pro_clients add  constraint pro_clients_status_chk
  check (status in ('prospect', 'active', 'inactive'));

-- ============================================================
-- 2) PROJETS
-- ============================================================
create table if not exists pro_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  client_id   uuid,
  name        text not null,
  description text,
  budget      bigint not null default 0,
  start_date  date,
  due_date    date,
  progress    smallint not null default 0,
  status      text not null default 'planned',
  tasks       jsonb not null default '[]'::jsonb,  -- [{label, done}]
  documents   jsonb not null default '[]'::jsonb,  -- [{name, url, size}]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_pro_projects_user   on pro_projects (user_id);
create index if not exists idx_pro_projects_client on pro_projects (client_id);
create index if not exists idx_pro_projects_status on pro_projects (user_id, status);

alter table pro_projects drop constraint if exists pro_projects_status_chk;
alter table pro_projects add  constraint pro_projects_status_chk
  check (status in ('planned', 'active', 'paused', 'done', 'cancelled'));

alter table pro_projects drop constraint if exists pro_projects_progress_chk;
alter table pro_projects add  constraint pro_projects_progress_chk
  check (progress >= 0 and progress <= 100);

-- ============================================================
-- 3) DEVIS
-- ============================================================
create table if not exists pro_quotes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  client_id     uuid,
  number        text,
  title         text not null,
  items         jsonb not null default '[]'::jsonb,
  total         bigint not null default 0,
  status        text not null default 'draft',
  valid_until   date,
  note          text,
  public_token  text not null,
  sent_at       timestamptz,
  accepted_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- Colonnes de la version complete : projet lie, remise, TVA, conditions.
alter table pro_quotes add column if not exists project_id  uuid;
alter table pro_quotes add column if not exists subtotal    bigint not null default 0;   -- HT avant remise
alter table pro_quotes add column if not exists discount    bigint not null default 0;   -- remise en FCFA
alter table pro_quotes add column if not exists tax_rate    numeric(5,2) not null default 0;  -- 0 ou 18 au Senegal
alter table pro_quotes add column if not exists tax_amount  bigint not null default 0;
alter table pro_quotes add column if not exists terms       text;    -- conditions de paiement
alter table pro_quotes add column if not exists viewed_at   timestamptz;
alter table pro_quotes add column if not exists refused_at  timestamptz;
alter table pro_quotes add column if not exists version     smallint not null default 1;
alter table pro_quotes add column if not exists updated_at  timestamptz not null default now();

create index if not exists idx_pro_quotes_user    on pro_quotes (user_id);
create index if not exists idx_pro_quotes_client  on pro_quotes (client_id);
create index if not exists idx_pro_quotes_project on pro_quotes (project_id);
create unique index if not exists idx_pro_quotes_token on pro_quotes (public_token);

-- 'viewed' = le client a ouvert le lien sans encore repondre.
alter table pro_quotes drop constraint if exists pro_quotes_status_chk;
alter table pro_quotes add  constraint pro_quotes_status_chk
  check (status in ('draft', 'sent', 'viewed', 'accepted', 'refused', 'expired'));

-- ============================================================
-- 4) FACTURES
-- ============================================================
create table if not exists pro_invoices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  client_id     uuid,
  project_id    uuid,
  quote_id      uuid,
  number        text,
  title         text not null,
  items         jsonb not null default '[]'::jsonb,
  subtotal      bigint not null default 0,
  discount      bigint not null default 0,
  tax_rate      numeric(5,2) not null default 0,
  tax_amount    bigint not null default 0,
  total         bigint not null default 0,
  paid_amount   bigint not null default 0,
  status        text not null default 'draft',
  issue_date    date not null default current_date,
  due_date      date,
  terms         text,
  public_token  text not null,
  sent_at       timestamptz,
  paid_at       timestamptz,
  reminded_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_pro_invoices_user    on pro_invoices (user_id);
create index if not exists idx_pro_invoices_client  on pro_invoices (client_id);
create index if not exists idx_pro_invoices_project on pro_invoices (project_id);
create index if not exists idx_pro_invoices_due     on pro_invoices (user_id, due_date);
create unique index if not exists idx_pro_invoices_token on pro_invoices (public_token);
-- Un devis ne peut donner qu'une seule facture (garde-fou anti double-clic).
create unique index if not exists idx_pro_invoices_quote on pro_invoices (quote_id) where quote_id is not null;

alter table pro_invoices drop constraint if exists pro_invoices_status_chk;
alter table pro_invoices add  constraint pro_invoices_status_chk
  check (status in ('draft', 'sent', 'partial', 'paid', 'late', 'cancelled'));

-- ============================================================
-- 5) PAIEMENTS (encaissements, y compris partiels)
-- ============================================================
create table if not exists pro_payments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  invoice_id  uuid not null,
  amount      bigint not null,
  method      text,
  note        text,
  paid_at     timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists idx_pro_payments_user    on pro_payments (user_id);
create index if not exists idx_pro_payments_invoice on pro_payments (invoice_id);

-- ============================================================
-- 6) IDENTITE PROFESSIONNELLE (en-tete des devis et factures)
--    La table `profiles` ne porte que l'identite « vitrine » du vendeur
--    (nom, ville, telephone). Une facture exige en plus une raison sociale,
--    un NINEA et une adresse : c'est l'objet de cette table, une ligne par
--    professionnel.
-- ============================================================
create table if not exists pro_settings (
  user_id         uuid primary key,
  business_name   text,
  tax_id          text,          -- NINEA / RCCM
  address         text,
  email           text,
  phone           text,
  payment_details text,          -- « Wave 77 000 00 00 », RIB, etc.
  default_terms   text,
  default_tax_rate numeric(5,2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- 7) EVENEMENTS (journal : historique des modifications + fil d'activite)
-- ============================================================
create table if not exists pro_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  entity      text not null,          -- client | project | quote | invoice | payment
  entity_id   uuid,
  kind        text not null,          -- created | updated | sent | viewed | accepted | ...
  message     text not null,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_pro_events_user   on pro_events (user_id, created_at desc);
create index if not exists idx_pro_events_entity on pro_events (entity, entity_id);

-- ============================================================
-- 8) SECURITE (RLS) : chaque professionnel ne voit que ses donnees.
-- Les pages publiques (devis/facture par lien a jeton) passent par la cle
-- service_role, qui contourne RLS : aucune policy publique n'est ouverte ici.
-- ============================================================

alter table pro_clients   enable row level security;
alter table pro_projects  enable row level security;
alter table pro_quotes    enable row level security;
alter table pro_invoices  enable row level security;
alter table pro_payments  enable row level security;
alter table pro_settings  enable row level security;
alter table pro_events    enable row level security;

-- --- pro_settings
drop policy if exists pro_settings_select_own on pro_settings;
create policy pro_settings_select_own on pro_settings
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pro_settings_insert_own on pro_settings;
create policy pro_settings_insert_own on pro_settings
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists pro_settings_update_own on pro_settings;
create policy pro_settings_update_own on pro_settings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --- pro_clients
drop policy if exists pro_clients_select_own on pro_clients;
create policy pro_clients_select_own on pro_clients
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pro_clients_insert_own on pro_clients;
create policy pro_clients_insert_own on pro_clients
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists pro_clients_update_own on pro_clients;
create policy pro_clients_update_own on pro_clients
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists pro_clients_delete_own on pro_clients;
create policy pro_clients_delete_own on pro_clients
  for delete to authenticated using (auth.uid() = user_id);

-- --- pro_projects
drop policy if exists pro_projects_select_own on pro_projects;
create policy pro_projects_select_own on pro_projects
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pro_projects_insert_own on pro_projects;
create policy pro_projects_insert_own on pro_projects
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists pro_projects_update_own on pro_projects;
create policy pro_projects_update_own on pro_projects
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists pro_projects_delete_own on pro_projects;
create policy pro_projects_delete_own on pro_projects
  for delete to authenticated using (auth.uid() = user_id);

-- --- pro_quotes
drop policy if exists pro_quotes_select_own on pro_quotes;
create policy pro_quotes_select_own on pro_quotes
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pro_quotes_insert_own on pro_quotes;
create policy pro_quotes_insert_own on pro_quotes
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists pro_quotes_update_own on pro_quotes;
create policy pro_quotes_update_own on pro_quotes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists pro_quotes_delete_own on pro_quotes;
create policy pro_quotes_delete_own on pro_quotes
  for delete to authenticated using (auth.uid() = user_id);

-- --- pro_invoices
drop policy if exists pro_invoices_select_own on pro_invoices;
create policy pro_invoices_select_own on pro_invoices
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pro_invoices_insert_own on pro_invoices;
create policy pro_invoices_insert_own on pro_invoices
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists pro_invoices_update_own on pro_invoices;
create policy pro_invoices_update_own on pro_invoices
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists pro_invoices_delete_own on pro_invoices;
create policy pro_invoices_delete_own on pro_invoices
  for delete to authenticated using (auth.uid() = user_id);

-- --- pro_payments
drop policy if exists pro_payments_select_own on pro_payments;
create policy pro_payments_select_own on pro_payments
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pro_payments_insert_own on pro_payments;
create policy pro_payments_insert_own on pro_payments
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists pro_payments_update_own on pro_payments;
create policy pro_payments_update_own on pro_payments
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists pro_payments_delete_own on pro_payments;
create policy pro_payments_delete_own on pro_payments
  for delete to authenticated using (auth.uid() = user_id);

-- --- pro_events (journal : lecture et ecriture, jamais de modification)
drop policy if exists pro_events_select_own on pro_events;
create policy pro_events_select_own on pro_events
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pro_events_insert_own on pro_events;
create policy pro_events_insert_own on pro_events
  for insert to authenticated with check (auth.uid() = user_id);

-- ============================================================
-- 9) STOCKAGE des documents de projet (contrats, briefs, livrables)
--
-- Bucket PUBLIC en lecture, comme les photos et videos du site : le chemin
-- contient un segment aleatoire, donc l'URL n'est pas devinable. C'est ce qui
-- permet au professionnel de partager un document par simple lien WhatsApp,
-- sans lien signe qui expire. Ne pas y deposer de piece confidentielle.
-- L'ECRITURE, elle, reste limitee au dossier personnel de chaque compte.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pro-docs', 'pro-docs', true, 10485760,
  array[
    'application/pdf',
    'image/png', 'image/jpeg', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
)
on conflict (id) do update
  set public          = true,
      file_size_limit = 10485760;

drop policy if exists "pro-docs public read" on storage.objects;
create policy "pro-docs public read" on storage.objects
  for select
  using (bucket_id = 'pro-docs');

drop policy if exists "pro-docs user insert" on storage.objects;
create policy "pro-docs user insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'pro-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "pro-docs user update" on storage.objects;
create policy "pro-docs user update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'pro-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "pro-docs user delete" on storage.objects;
create policy "pro-docs user delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'pro-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 9) Rafraichit le cache de l'API (sinon les tables restent invisibles)
-- ============================================================
notify pgrst, 'reload schema';
