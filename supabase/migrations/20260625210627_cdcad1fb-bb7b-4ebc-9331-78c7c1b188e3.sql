
DROP FUNCTION IF EXISTS public.reset_company_password_to_default(uuid);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS default_password text;

CREATE OR REPLACE FUNCTION public.generate_default_company_password()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i int;
BEGIN
  FOR i IN 1..8 LOOP
    out := out || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN out;
END; $$;

CREATE OR REPLACE FUNCTION public.reset_company_password_to_default(_company_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pwd text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can reset company passwords';
  END IF;
  _pwd := public.generate_default_company_password();
  UPDATE public.companies
    SET password_hash = crypt(_pwd, gen_salt('bf')),
        default_password = _pwd,
        password_must_change = true
    WHERE id = _company_id;
  RETURN _pwd;
END; $$;

CREATE OR REPLACE FUNCTION public.seed_company_password(_company_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pwd text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can seed company passwords';
  END IF;
  _pwd := public.generate_default_company_password();
  UPDATE public.companies
    SET password_hash = crypt(_pwd, gen_salt('bf')),
        default_password = _pwd,
        password_must_change = true
    WHERE id = _company_id;
  RETURN _pwd;
END; $$;

CREATE OR REPLACE FUNCTION public.change_company_password(_company_id uuid, _current_password text, _new_password text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _hash text;
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
        default_password = NULL,
        password_must_change = false
    WHERE id = _company_id;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.list_company_defaults()
RETURNS TABLE(company_id uuid, default_password text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can view company default passwords';
  END IF;
  RETURN QUERY SELECT id, c.default_password FROM public.companies c;
END; $$;
