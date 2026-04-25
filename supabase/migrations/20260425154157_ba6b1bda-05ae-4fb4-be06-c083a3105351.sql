ALTER TABLE public.flat_listings
  ADD CONSTRAINT flat_listings_profile_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bazaar_products
  ADD CONSTRAINT bazaar_products_profile_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;