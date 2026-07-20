-- ════════════════════════════════════════════════════════════════
--  Wanteermako — Schéma initial (section 16 du brief)
--  À exécuter dans Supabase > SQL Editor, OU via `supabase db push`.
-- ════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm; -- recherche full-text / similarité

-- ───────── COUNTRIES ─────────
create table if not exists countries (
  code        text primary key,
  name        text not null,
  dial_code   text not null,
  capital     text,
  currency    text not null default 'FCFA',
  flag        text,
  is_active   boolean not null default true
);

-- ───────── USERS (profil applicatif, lié à auth.users) ─────────
create table if not exists users (
  id           uuid primary key default uuid_generate_v4(),
  auth_id      uuid unique references auth.users(id) on delete cascade,
  phone        text unique not null,
  email        text,
  first_name   text,
  last_name    text,
  avatar_url   text,
  country_code text references countries(code),
  city         text,
  bio          text,
  is_pro       boolean not null default false,
  is_verified  boolean not null default false,
  role         text not null default 'user' check (role in ('user','admin')),
  rating       numeric(2,1) default 0,
  sales_count  int default 0,
  created_at   timestamptz not null default now()
);

-- ───────── OTP CODES ─────────
create table if not exists otp_codes (
  id         uuid primary key default uuid_generate_v4(),
  phone      text not null,
  code       text not null,
  expires_at timestamptz not null,
  used       boolean not null default false,
  attempts   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_otp_phone on otp_codes(phone);

-- ───────── CATEGORIES (arborescence + champs dynamiques) ─────────
create table if not exists categories (
  id            uuid primary key default uuid_generate_v4(),
  parent_id     uuid references categories(id) on delete cascade,
  slug          text unique not null,
  name          text not null,
  icon          text,
  fields_schema jsonb default '[]'::jsonb,
  sort_order    int default 0
);

-- ───────── LISTINGS ─────────
create table if not exists listings (
  id               bigint generated always as identity primary key,
  user_id          uuid references users(id) on delete cascade,
  category_id      uuid references categories(id),
  title            text not null,
  slug             text not null,
  description      text,
  price            numeric(14,2),
  price_type       text default 'fixe' check (price_type in ('fixe','negociable','gratuit','echange')),
  condition        text,
  country_code     text references countries(code),
  city             text,
  district         text,
  address          text,
  lat              double precision,
  lng              double precision,
  attributes       jsonb default '{}'::jsonb,
  status           text not null default 'active' check (status in ('active','pending','expired','suspended')),
  boost_type       text check (boost_type in ('premium','une','pack')),
  boost_expires_at timestamptz,
  views            int not null default 0,
  favorites_count  int not null default 0,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz default (now() + interval '30 days')
);
create index if not exists idx_listings_filter on listings(country_code, city, category_id, status);
create index if not exists idx_listings_boost on listings(boost_type, boost_expires_at);
create index if not exists idx_listings_search on listings using gin (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(description,'')));

-- ───────── LISTING IMAGES ─────────
create table if not exists listing_images (
  id         uuid primary key default uuid_generate_v4(),
  listing_id bigint references listings(id) on delete cascade,
  url        text not null,
  sort_order int default 0,
  is_cover   boolean default false
);

-- ───────── FAVORITES ─────────
create table if not exists favorites (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references users(id) on delete cascade,
  listing_id bigint references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);

-- ───────── MESSAGES ─────────
create table if not exists messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null,
  sender_id       uuid references users(id) on delete cascade,
  receiver_id     uuid references users(id) on delete cascade,
  listing_id      bigint references listings(id) on delete set null,
  body            text not null,
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ───────── REVIEWS ─────────
create table if not exists reviews (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  bigint references listings(id) on delete set null,
  reviewer_id uuid references users(id) on delete cascade,
  seller_id   uuid references users(id) on delete cascade,
  rating      int check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

-- ───────── PAYMENTS ─────────
create table if not exists payments (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references users(id) on delete cascade,
  listing_id   bigint references listings(id) on delete set null,
  amount       numeric(14,2) not null,
  method       text,
  boost_type   text,
  status       text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  provider_ref text,
  created_at   timestamptz not null default now()
);

-- ───────── AD BANNERS (zones annonceurs, section 15) ─────────
create table if not exists ad_banners (
  id                uuid primary key default uuid_generate_v4(),
  advertiser        text,
  title             text,
  image_url         text,
  link_url          text,
  slot              text not null,
  target_countries  text[] default '{}',
  target_categories text[] default '{}',
  starts_at         timestamptz,
  ends_at           timestamptz,
  impressions       int not null default 0,
  clicks            int not null default 0,
  status            text not null default 'active' check (status in ('active','planned','paused'))
);

-- ───────── REPORTS ─────────
create table if not exists reports (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  bigint references listings(id) on delete cascade,
  reporter_id uuid references users(id) on delete set null,
  reason      text,
  status      text not null default 'open' check (status in ('open','resolved','ignored')),
  created_at  timestamptz not null default now()
);

-- ───────── ADMIN LOGS (audit) ─────────
create table if not exists admin_logs (
  id          uuid primary key default uuid_generate_v4(),
  admin_id    uuid references users(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  created_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════
--  RLS (Row Level Security) — règles de base
-- ════════════════════════════════════════════════════════════════
alter table listings        enable row level security;
alter table listing_images  enable row level security;
alter table favorites       enable row level security;
alter table messages        enable row level security;
alter table users           enable row level security;

-- Lecture publique des annonces actives
drop policy if exists "listings lisibles" on listings;
create policy "listings lisibles" on listings
  for select using (status = 'active');

drop policy if exists "images lisibles" on listing_images;
create policy "images lisibles" on listing_images for select using (true);

-- Un utilisateur gère ses propres annonces
drop policy if exists "gerer ses annonces" on listings;
create policy "gerer ses annonces" on listings
  for all using (auth.uid() = (select auth_id from users where users.id = listings.user_id));

-- Profil : chacun lit/modifie le sien ; lecture publique des infos vendeur
drop policy if exists "profil public" on users;
create policy "profil public" on users for select using (true);
drop policy if exists "modifier son profil" on users;
create policy "modifier son profil" on users for update using (auth.uid() = auth_id);
