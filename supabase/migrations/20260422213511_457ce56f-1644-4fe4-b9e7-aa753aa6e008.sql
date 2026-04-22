-- Enable pgcrypto for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add password_hash column (nullable so existing companies stay usable until staff sets one)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS password_hash text;

-- Verify a plain password against the stored hash. Public-callable (returns boolean only).
CREATE OR REPLACE FUNCTION public.verify_company_password(_company_id uuid, _password text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hash text;
BEGIN
  SELECT password_hash INTO _hash FROM public.companies WHERE id = _company_id;
  IF _hash IS NULL OR _hash = '' THEN
    RETURN false;
  END IF;
  RETURN _hash = crypt(_password, _hash);
END;
$$;

-- Admin-only setter (staff use this from the Reservation dashboard)
CREATE OR REPLACE FUNCTION public.set_company_password(_company_id uuid, _password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can set company passwords';
  END IF;
  IF _password IS NULL OR length(_password) < 4 THEN
    RAISE EXCEPTION 'Password must be at least 4 characters';
  END IF;
  UPDATE public.companies
    SET password_hash = crypt(_password, gen_salt('bf'))
    WHERE id = _company_id;
END;
$$;

-- Hide password_hash from anonymous SELECTs by tightening the existing "Anyone can view" policy:
-- We keep the policy permissive but the column will simply be returned as NULL via a view-style approach.
-- Simpler: revoke column-level access from anon/authenticated for password_hash.
REVOKE SELECT (password_hash) ON public.companies FROM anon, authenticated;