-- Booking groups: new fields
ALTER TABLE public.booking_groups
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS extended_once boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_kept_amount numeric,
  ADD COLUMN IF NOT EXISTS cancellation_refund_amount numeric,
  ADD COLUMN IF NOT EXISTS cancellation_type text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS posted_to_accounts_on date,
  ADD COLUMN IF NOT EXISTS edited_by uuid,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid;

-- Bookings: switch tracking + audit
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS original_site_id text,
  ADD COLUMN IF NOT EXISTS original_site_name text,
  ADD COLUMN IF NOT EXISTS original_arrival_date date,
  ADD COLUMN IF NOT EXISTS original_departure_date date,
  ADD COLUMN IF NOT EXISTS switched_at timestamptz,
  ADD COLUMN IF NOT EXISTS switched_by uuid,
  ADD COLUMN IF NOT EXISTS edited_by uuid,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Site blackouts
CREATE TABLE IF NOT EXISTS public.site_blackouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id text NOT NULL,
  site_id text NOT NULL,
  site_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_blackouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blackouts" ON public.site_blackouts
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert blackouts" ON public.site_blackouts
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update blackouts" ON public.site_blackouts
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete blackouts" ON public.site_blackouts
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers can view blackouts" ON public.site_blackouts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));

-- Booking audit log
CREATE TABLE IF NOT EXISTS public.booking_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid,
  booking_id uuid,
  voucher_no text,
  action text NOT NULL,
  details jsonb,
  performed_by uuid,
  performed_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audit log" ON public.booking_audit_log
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  );
CREATE POLICY "Authenticated can insert audit"
  ON public.booking_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  );

-- Staff invitations
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role app_role NOT NULL,
  invited_by uuid,
  invited_at timestamptz NOT NULL DEFAULT now(),
  activated boolean NOT NULL DEFAULT false,
  activated_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  revoked_at timestamptz
);
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invitations" ON public.staff_invitations
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert invitations" ON public.staff_invitations
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update invitations" ON public.staff_invitations
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete invitations" ON public.staff_invitations
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers can view invitations" ON public.staff_invitations
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));

-- Manager read-only across existing tables
CREATE POLICY "Managers can view booking groups" ON public.booking_groups
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers can view bookings" ON public.bookings
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers can view members" ON public.members
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers can view notifications" ON public.notifications
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers can view waitlist" ON public.waitlist_requests
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers can view companies" ON public.companies
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));