-- ============================================================
--  CENTRE DE NOTIFICATIONS
--  À exécuter dans Supabase → SQL Editor. Additif.
--
--  Table `notifications` : fil persistant par utilisateur.
--  Types : message | listing_approved | listing_sold | listing_expired
--
--  Déclenchement :
--   • message           → via /api/notify/message (code)
--   • listing_approved  → trigger (pending → active)
--   • listing_sold      → trigger (→ sold)
--   • listing_expired   → balayage cron (lib/notifications)
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  title text not null,
  body text,
  url text,
  listing_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user
  on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;

-- L'utilisateur voit et met à jour (marque lu) SES notifications.
-- L'insertion se fait via triggers/service role (security definer) → pas de policy insert publique.
drop policy if exists notif_select_own on public.notifications;
create policy notif_select_own on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists notif_update_own on public.notifications;
create policy notif_update_own on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notif_delete_own on public.notifications;
create policy notif_delete_own on public.notifications
  for delete using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────
-- Trigger : notifier le vendeur quand son annonce est approuvée ou vendue.
-- (L'expiration est gérée par le balayage cron pour éviter un afflux sur
--  l'historique déjà expiré.)
-- ──────────────────────────────────────────────────────────
create or replace function public.notify_listing_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'active' and old.status = 'pending' then
      insert into public.notifications (user_id, type, title, body, url, listing_id)
      values (new.user_id, 'listing_approved', '✅ Annonce en ligne',
        'Ton annonce « ' || coalesce(new.title, 'sans titre') || ' » est maintenant publiée et visible.',
        '/dashboard?panel=ads', new.id);
    elsif new.status = 'sold' then
      insert into public.notifications (user_id, type, title, body, url, listing_id)
      values (new.user_id, 'listing_sold', '📦 Annonce vendue',
        'Ton annonce « ' || coalesce(new.title, 'sans titre') || ' » est marquée vendue. Félicitations !',
        '/dashboard?panel=ads', new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_listing_status on public.listings;
create trigger trg_notify_listing_status
  after update of status on public.listings
  for each row execute procedure public.notify_listing_status();

-- ──────────────────────────────────────────────────────────
-- Diffusion : à chaque annonce PUBLIÉE (status active), notifier TOUS les
-- utilisateurs (sauf le vendeur). Idempotent : une annonce n'est diffusée
-- qu'une seule fois (garde `not exists`), même si elle repasse active plus tard.
-- Une seule requête INSERT ... SELECT → efficace.
-- ──────────────────────────────────────────────────────────
create or replace function public.broadcast_new_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active'
     and not exists (select 1 from public.notifications where listing_id = new.id and type = 'new_listing') then
    insert into public.notifications (user_id, type, title, body, url, listing_id)
    select p.id, 'new_listing', '🆕 Nouvelle annonce',
           'Une nouvelle annonce vient d''être publiée : « ' || coalesce(new.title, 'sans titre') || ' ». Découvre-la !',
           coalesce('/' || nullif(new.slug, ''), '/annonce/' || new.id),
           new.id
    from public.profiles p
    where p.id is distinct from new.user_id;
  end if;
  return new;
end;
$$;

-- Se déclenche à la création (INSERT) d'une annonce active ET quand une annonce
-- passe au statut active (UPDATE OF status). Ne se déclenche PAS sur les autres
-- updates (ex : incrément des vues) → pas de surcharge.
drop trigger if exists trg_broadcast_new_listing on public.listings;
create trigger trg_broadcast_new_listing
  after insert or update of status on public.listings
  for each row execute procedure public.broadcast_new_listing();

select 'Table notifications + triggers (statut vendeur + diffusion) créés.' as resultat;
