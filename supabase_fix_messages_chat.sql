-- ============================================================
-- MIGRATION FIX : Messages + Chat + Publication (Wanteermako)
-- Exécutez ce script dans le SQL Editor de Supabase
-- ============================================================

-- 1. Rendre listing_id nullable (pour les discussions sans annonce liée)
ALTER TABLE public.messages ALTER COLUMN listing_id DROP NOT NULL;

-- 2. Rendre content nullable (pour les messages média : image, audio, etc.)
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- 3. Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;

-- 4. Activer le Realtime sur la table messages (obligatoire pour le chat en temps réel)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 5. S'assurer que les RLS policies existent
-- SELECT : l'utilisateur voit ses messages (envoyés OU reçus)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Les utilisateurs voient leurs propres messages'
  ) THEN
    CREATE POLICY "Les utilisateurs voient leurs propres messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;
END $$;

-- INSERT : l'utilisateur peut envoyer un message (sender_id = son propre ID)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Les utilisateurs peuvent envoyer des messages'
  ) THEN
    CREATE POLICY "Les utilisateurs peuvent envoyer des messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

-- UPDATE : le destinataire peut marquer comme lu
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Les destinataires peuvent marquer comme lu'
  ) THEN
    CREATE POLICY "Les destinataires peuvent marquer comme lu" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
  END IF;
END $$;

-- 6. Index pour accélérer les requêtes de chat
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id, created_at DESC);

-- ============================================================
-- VÉRIFICATION : Testez que tout marche en exécutant :
-- SELECT * FROM public.messages LIMIT 5;
-- ============================================================
