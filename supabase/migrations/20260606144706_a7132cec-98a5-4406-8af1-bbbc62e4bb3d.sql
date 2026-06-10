CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select id from public.clients where owner_user_id = _user_id order by created_at asc, id asc limit 1
$function$;