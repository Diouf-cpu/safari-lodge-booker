
-- Members table (annual subscribers)
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  subscription_start DATE NOT NULL DEFAULT CURRENT_DATE,
  subscription_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Admins can insert members" ON public.members FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update members" ON public.members FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete members" ON public.members FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Waitlist requests
CREATE TABLE public.waitlist_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  park_id TEXT NOT NULL,
  park_name TEXT NOT NULL,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'waitlist',
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  staff_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create waitlist requests" ON public.waitlist_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can view waitlist requests" ON public.waitlist_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'accountant'));
CREATE POLICY "Admins can update waitlist requests" ON public.waitlist_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_waitlist_requests_updated_at BEFORE UPDATE ON public.waitlist_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifications (reservation tab feed)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  related_id UUID,
  related_kind TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view notifications" ON public.notifications FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'accountant'));
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete notifications" ON public.notifications FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- New fields on bookings for BOGA Reserve
ALTER TABLE public.bookings
  ADD COLUMN guest_count INTEGER,
  ADD COLUMN per_person_rate NUMERIC,
  ADD COLUMN nationality TEXT,
  ADD COLUMN id_number TEXT,
  ADD COLUMN booking_type TEXT NOT NULL DEFAULT 'company';

ALTER TABLE public.booking_groups
  ADD COLUMN booker_type TEXT NOT NULL DEFAULT 'company',
  ADD COLUMN expiry_warning_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN member_id UUID;

-- Function to compute member status from dates
CREATE OR REPLACE FUNCTION public.member_current_status(_subscription_end DATE)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _subscription_end < CURRENT_DATE THEN 'expired'
    WHEN _subscription_end <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'active'
  END
$$;
