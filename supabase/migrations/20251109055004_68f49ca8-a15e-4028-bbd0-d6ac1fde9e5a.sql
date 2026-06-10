-- Fix search path for security
DROP FUNCTION IF EXISTS public.increment_visitor_count();

CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.site_visitors
  SET count = count + 1,
      last_updated = now()
  WHERE id = (SELECT id FROM public.site_visitors LIMIT 1)
  RETURNING count INTO new_count;
  
  RETURN new_count;
END;
$$;