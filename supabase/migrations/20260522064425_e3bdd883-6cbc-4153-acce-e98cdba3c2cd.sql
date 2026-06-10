
-- 1. Drop leftover site_visitors table & function (from old B-SPOT project — no longer used)
DROP FUNCTION IF EXISTS public.increment_visitor_count();
DROP TABLE IF EXISTS public.site_visitors;

-- 2. Restrict settings reads to admins only (may contain sensitive config)
DROP POLICY IF EXISTS "Auth read settings" ON public.settings;
CREATE POLICY "Admins read settings"
  ON public.settings FOR SELECT
  USING (public.is_admin(auth.uid()));

-- 3. Realtime channel authorization — enable RLS on realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to use realtime; broadcast/presence topics of the form
-- "device:<device_token>" require that the user owns that device.
DROP POLICY IF EXISTS "Authenticated realtime access" ON realtime.messages;
CREATE POLICY "Authenticated realtime access"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Postgres-changes events are already filtered by table RLS, allow them.
    (extension = 'postgres_changes')
    OR
    -- Broadcast / presence: if topic is a device channel, require ownership.
    (
      extension IN ('broadcast','presence')
      AND (
        topic NOT LIKE 'device:%'
        OR EXISTS (
          SELECT 1 FROM public.devices d
          WHERE d.device_token = split_part(realtime.messages.topic, ':', 2)
            AND (d.client_id = public.get_user_client_id(auth.uid())
                 OR public.is_admin(auth.uid()))
        )
      )
    )
  );

CREATE POLICY "Authenticated realtime publish"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    extension IN ('broadcast','presence')
    AND (
      topic NOT LIKE 'device:%'
      OR EXISTS (
        SELECT 1 FROM public.devices d
        WHERE d.device_token = split_part(realtime.messages.topic, ':', 2)
          AND (d.client_id = public.get_user_client_id(auth.uid())
               OR public.is_admin(auth.uid()))
      )
    )
  );
