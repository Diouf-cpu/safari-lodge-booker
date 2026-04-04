
-- Add expires_at column to booking_groups for 3-day auto-cancel
ALTER TABLE public.booking_groups ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '3 days');

-- Allow admins to manage companies (update and delete)
CREATE POLICY "Admins can update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete companies"
ON public.companies
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow accountants to view booking groups and bookings
CREATE POLICY "Accountants can view booking groups"
ON public.booking_groups
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'accountant'));

CREATE POLICY "Accountants can view bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'accountant'));

-- Allow accountants to view user_roles (own)
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
