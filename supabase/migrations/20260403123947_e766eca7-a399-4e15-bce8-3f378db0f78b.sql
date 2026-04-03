
-- Companies table to persist company names
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert companies" ON public.companies FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Seed with existing companies
INSERT INTO public.companies (name) VALUES
  ('Elephant Trails Safari'), ('Shangana Safaris'), ('Wild Africa Safaris'),
  ('Bush View Tours'), ('Tony Mobile Safari'), ('Royale Wilderness'),
  ('Central Kalahari Safaris'), ('African Bush Lovers'), ('African Jacana Safaris'),
  ('Semunyeni Safaris'), ('Torn Nose Safaris'), ('Chase Africa'),
  ('Umpengu Safaris'), ('Ulinda Safaris'), ('African Bush Safaris'),
  ('Sky Theme Safaris'), ('Unlimited Safaris'), ('Temogo Safaris'),
  ('Thru The Looking Glass'), ('Most Travel / Dawn to Dusk');

-- Add per-site voucher number to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS site_voucher_no text;
