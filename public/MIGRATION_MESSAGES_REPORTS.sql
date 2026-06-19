-- ════════════════════════════════════════════════════════════════
-- Messagerie (chat acheteur↔vendeur) + Signalements d'annonces
-- ════════════════════════════════════════════════════════════════

-- ───────── MESSAGES ─────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  receiver_id uuid not null,
  listing_id uuid,
  content text,
  media_url text,
  type text not null default 'text',   -- text | image | file
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_sender on public.messages (sender_id);
create index if not exists idx_messages_receiver on public.messages (receiver_id);
create index if not exists idx_messages_pair on public.messages (sender_id, receiver_id, created_at);

alter table public.messages enable row level security;

-- Lire uniquement mes conversations
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Envoyer uniquement en mon nom
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = sender_id);

-- Marquer comme lu (les messages qui me sont destinés)
drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages
  for update using (auth.uid() = receiver_id);

-- Temps réel (Supabase Realtime)
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when others then null; end $$;

-- ───────── REPORTS (signalements) ─────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  reason text not null,
  details text,
  contact text,
  status text not null default 'open',  -- open | reviewed | closed
  created_at timestamptz not null default now()
);
create index if not exists idx_reports_status on public.reports (status, created_at desc);

-- Accès géré par routes serveur (service role). RLS activé sans policy publique.
alter table public.reports enable row level security;

-- ───────── STORAGE : bucket chat_media (pièces jointes du chat) ─────────
-- À créer manuellement : Supabase → Storage → New bucket → "chat_media" → Public.
-- (Le bucket "images" est créé automatiquement par /api/upload.)
