-- Replace the over-permissive realtime.messages policies with strict, ownership-checked ones.
DROP POLICY IF EXISTS "Authenticated realtime access" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated realtime publish" ON realtime.messages;

-- SELECT (subscribe): allow only on device topics the user owns OR the user's own client topic.
CREATE POLICY "Authenticated realtime subscribe scoped"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = ANY (ARRAY['broadcast'::text, 'presence'::text, 'postgres_changes'::text])
  AND (
    (
      topic LIKE 'device:%'
      AND EXISTS (
        SELECT 1 FROM public.devices d
        WHERE d.device_token = split_part(realtime.messages.topic, ':', 2)
          AND (d.client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()))
      )
    )
    OR (
      topic LIKE 'client:%'
      AND (
        split_part(realtime.messages.topic, ':', 2)::uuid = public.get_user_client_id(auth.uid())
        OR public.is_admin(auth.uid())
      )
    )
  )
);

-- INSERT (publish): allow only on those same scoped topics, and only broadcast/presence (not postgres_changes).
CREATE POLICY "Authenticated realtime publish scoped"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  extension = ANY (ARRAY['broadcast'::text, 'presence'::text])
  AND (
    (
      topic LIKE 'device:%'
      AND EXISTS (
        SELECT 1 FROM public.devices d
        WHERE d.device_token = split_part(realtime.messages.topic, ':', 2)
          AND (d.client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()))
      )
    )
    OR (
      topic LIKE 'client:%'
      AND (
        split_part(realtime.messages.topic, ':', 2)::uuid = public.get_user_client_id(auth.uid())
        OR public.is_admin(auth.uid())
      )
    )
  )
);