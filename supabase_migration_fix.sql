-- ==============================================================================
-- Annonce.ID - Migration corrective (Dashboard Diagnostic)
-- Exécutez ce script dans l'éditeur SQL de votre dashboard Supabase.
-- ==============================================================================

-- 1. Ajouter la colonne "bio" à la table profiles (manquante)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Ajouter les colonnes "type" et "media_url" à la table messages (manquantes)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;

-- 3. Rendre listing_id nullable dans messages (pour les discussions sans annonce)
ALTER TABLE public.messages ALTER COLUMN listing_id DROP NOT NULL;
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- 4. Créer la table campagnes_pub (utilisée par le Dashboard mais absente du schéma)
CREATE TABLE IF NOT EXISTS public.campagnes_pub (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hero TEXT,
    footer TEXT,
    catalogue TEXT,
    product TEXT,
    url TEXT,
    weeks INTEGER DEFAULT 1,
    start_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Créer la table purchases (achats/transactions — remplace le localStorage)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ref_command VARCHAR(100),
    type VARCHAR(100) NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. RLS pour les nouvelles tables
ALTER TABLE public.campagnes_pub ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- campagnes_pub : lecture publique (pour afficher les bannières), écriture par le proprio
CREATE POLICY "Public campaigns are viewable by everyone" ON public.campagnes_pub FOR SELECT USING (true);
CREATE POLICY "Users can create campaigns" ON public.campagnes_pub FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.campagnes_pub FOR UPDATE USING (auth.uid() = user_id);

-- purchases : lecture/écriture par le proprio uniquement
CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Ajouter la colonne social_links à profiles (pour les réseaux sociaux de la boutique)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- 8. Ajouter la colonne alert_prefs à profiles (pour les préférences d'alertes)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alert_prefs JSONB DEFAULT '{"messages":true,"expired":true,"stats":false,"search":true,"promos":false}'::jsonb;
