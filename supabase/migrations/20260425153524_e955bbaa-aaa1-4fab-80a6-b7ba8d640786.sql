-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Enum for year of study
CREATE TYPE public.year_of_study AS ENUM ('1st', '2nd', '3rd', '4th', '5th');

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  college TEXT,
  course TEXT,
  year year_of_study,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========== USER ROLES (separate for security) ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ========== FLAT LISTINGS ==========
CREATE TABLE public.flat_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('have_room', 'need_room')),
  location TEXT NOT NULL,
  rent INTEGER NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('single', 'shared', 'pg')),
  gender_pref TEXT NOT NULL DEFAULT 'any' CHECK (gender_pref IN ('any', 'male', 'female')),
  roommates_count INTEGER NOT NULL DEFAULT 1 CHECK (roommates_count BETWEEN 1 AND 4),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  move_in_date DATE,
  description TEXT,
  contact_number TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  is_filled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flat_listings ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_flat_listings_created ON public.flat_listings(created_at DESC);
CREATE INDEX idx_flat_listings_user ON public.flat_listings(user_id);

-- ========== BAZAAR PRODUCTS ==========
CREATE TABLE public.bazaar_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('books', 'electronics', 'furniture', 'vehicles', 'clothes', 'sports', 'other')),
  price INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  condition TEXT NOT NULL CHECK (condition IN ('like_new', 'good', 'fair')),
  description TEXT,
  pickup_location TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  is_sold BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bazaar_products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_bazaar_created ON public.bazaar_products(created_at DESC);
CREATE INDEX idx_bazaar_user ON public.bazaar_products(user_id);

-- ========== REPORTS ==========
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('flat', 'bazaar')),
  listing_id UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ========== updated_at trigger ==========
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_flat_listings_updated_at BEFORE UPDATE ON public.flat_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bazaar_products_updated_at BEFORE UPDATE ON public.bazaar_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== Auto profile + role on signup ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, college, course, year, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'college',
    NEW.raw_user_meta_data->>'course',
    NULLIF(NEW.raw_user_meta_data->>'year', '')::year_of_study,
    NEW.raw_user_meta_data->>'phone'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== RLS POLICIES ==========

-- profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- flat_listings
CREATE POLICY "Flat listings viewable by everyone" ON public.flat_listings FOR SELECT USING (true);
CREATE POLICY "Students create own listings" ON public.flat_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own listings" ON public.flat_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own listings" ON public.flat_listings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins delete any listing" ON public.flat_listings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- bazaar_products
CREATE POLICY "Products viewable by everyone" ON public.bazaar_products FOR SELECT USING (true);
CREATE POLICY "Students create own products" ON public.bazaar_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own products" ON public.bazaar_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own products" ON public.bazaar_products FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins delete any product" ON public.bazaar_products FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- reports
CREATE POLICY "Users create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins view all reports" ON public.reports FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete reports" ON public.reports FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ========== STORAGE BUCKETS ==========
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('flat-photos', 'flat-photos', true),
  ('bazaar-photos', 'bazaar-photos', true);

-- Storage policies: public read, authenticated users upload to their own folder
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read flat photos" ON storage.objects FOR SELECT USING (bucket_id = 'flat-photos');
CREATE POLICY "Users upload own flat photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'flat-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own flat photos" ON storage.objects FOR UPDATE USING (bucket_id = 'flat-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own flat photos" ON storage.objects FOR DELETE USING (bucket_id = 'flat-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read bazaar photos" ON storage.objects FOR SELECT USING (bucket_id = 'bazaar-photos');
CREATE POLICY "Users upload own bazaar photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bazaar-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own bazaar photos" ON storage.objects FOR UPDATE USING (bucket_id = 'bazaar-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own bazaar photos" ON storage.objects FOR DELETE USING (bucket_id = 'bazaar-photos' AND auth.uid()::text = (storage.foldername(name))[1]);