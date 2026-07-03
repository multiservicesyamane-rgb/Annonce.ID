-- WhatsApp IA: journal des messages entrants/sortants.
-- Optionnel mais recommande pour eviter les doubles reponses si Meta renvoie un webhook.

create table if not exists public.whatsapp_ai_messages (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  phone text not null,
  direction text not null check (direction in ('in', 'out')),
  body text,
  response_source text,
  payload jsonb default '{}'::jsonb,
  status text not null default 'received',
  error text,
  created_at timestamptz not null default now(),
  unique (message_id, direction)
);

create index if not exists idx_whatsapp_ai_messages_phone_created
  on public.whatsapp_ai_messages (phone, created_at desc);

alter table public.whatsapp_ai_messages enable row level security;

-- Pas de policy publique: la route serveur utilise SUPABASE_SERVICE_ROLE_KEY.
