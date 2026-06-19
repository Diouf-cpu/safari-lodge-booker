-- 1) Add must-change flag to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS password_must_change boolean NOT NULL DEFAULT false;

-- 2) Admin: reset a company's password back to the shared default 'boga1234'
CREATE OR REPLACE FUNCTION public.reset_company_password_to_default(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can reset company passwords';
  END IF;
  UPDATE public.companies
    SET password_hash = crypt('boga1234', gen_salt('bf')),
        password_must_change = true
    WHERE id = _company_id;
END;
$$;

-- 3) Company-initiated change: verify current password, then set the new one
CREATE OR REPLACE FUNCTION public.change_company_password(
  _company_id uuid,
  _current_password text,
  _new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hash text;
BEGIN
  IF _new_password IS NULL OR length(_new_password) < 4 THEN
    RAISE EXCEPTION 'New password must be at least 4 characters';
  END IF;
  SELECT password_hash INTO _hash FROM public.companies WHERE id = _company_id;
  IF _hash IS NULL OR _hash = '' OR _hash <> crypt(_current_password, _hash) THEN
    RETURN false;
  END IF;
  UPDATE public.companies
    SET password_hash = crypt(_new_password, gen_salt('bf')),
        password_must_change = false
    WHERE id = _company_id;
  RETURN true;
END;
$$;

-- 4) Lightweight status helper for admin UI (avoids exposing hash)
CREATE OR REPLACE FUNCTION public.company_password_status(_company_id uuid)
RETURNS TABLE(has_password boolean, must_change boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (password_hash IS NOT NULL AND password_hash <> '') AS has_password,
    COALESCE(password_must_change, false) AS must_change
  FROM public.companies WHERE id = _company_id;
$$;

-- 5) BOGA Reserve capacity check — sum guests booked on a site for overlapping dates
CREATE OR REPLACE FUNCTION public.boga_site_capacity_check(
  _site_id text,
  _arrival date,
  _departure date
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(COALESCE(guest_count, 1)), 0)::int
  FROM public.bookings
  WHERE site_id = _site_id
    AND park_id = 'boga-reserve'
    AND status <> 'cancelled'
    AND arrival_date < _departure
    AND departure_date > _arrival;
$$;

GRANT EXECUTE ON FUNCTION public.reset_company_password_to_default(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_company_password(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.company_password_status(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.boga_site_capacity_check(text, date, date) TO anon, authenticated;