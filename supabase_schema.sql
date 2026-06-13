-- =======================================================================================
-- SCHEMA INITIAL POUR ANNONCE.ID (SUPABASE)
-- Copiez ce code et collez-le dans le "SQL Editor" de votre tableau de bord Supabase
-- =======================================================================================

-- 1. Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLE : PROFILES (Utilisateurs / Vendeurs)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  avatar TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  is_pro BOOLEAN DEFAULT false,
  rating NUMERIC(3, 2) DEFAULT 0.0,
  sales INTEGER DEFAULT 0,
  free_ads_remaining INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Active le Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- ==========================================
-- TABLE : LISTINGS (Annonces)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  price_type TEXT DEFAULT 'fixe',
  category TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  location TEXT NOT NULL,
  image TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}'::jsonb,
  
  -- Boosts & Visibilité
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'rejected')),
  is_premium BOOLEAN DEFAULT false,
  premium_until TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour listings
CREATE POLICY "Listings are viewable by everyone." ON public.listings FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view all their own listings." ON public.listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own listings." ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own listings." ON public.listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own listings." ON public.listings FOR DELETE USING (auth.uid() = user_id);


-- ==========================================
-- TABLE : TRANSACTIONS (Paiements PayTech)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'FCFA',
  method TEXT NOT NULL,
  boost_type TEXT NOT NULL, -- 'premium', 'une', etc.
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  ref_paytech TEXT UNIQUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour transactions
CREATE POLICY "Users can view their own transactions." ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions." ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Update only by secure backend/webhook
CREATE POLICY "Users cannot update transactions." ON public.transactions FOR UPDATE USING (false);


-- ==========================================
-- FONCTION : UPDATE UPDATED_AT TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_listings_modtime BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


-- ==========================================
-- FONCTION : HANDLE NEW USER SIGNUP
-- ==========================================
-- Insère automatiquement un profil quand un user s'inscrit via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, email, name, avatar)
  VALUES (
    new.id,
    new.phone,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Utilisateur ' || substring(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
