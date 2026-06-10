-- Enable scheduling extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Index to make the stuck-message lookup cheap
CREATE INDEX IF NOT EXISTS idx_messages_status_processing_at
  ON public.messages (status, processing_at)
  WHERE status = 'processing';

-- Remove a previous schedule with the same name (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('requeue-stuck-messages');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Run the requeue worker every minute
SELECT cron.schedule(
  'requeue-stuck-messages',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rtgcrclgmvcmrjpvtpwm.supabase.co/functions/v1/requeue-stuck-messages',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Z2NyY2xnbXZjbXJqcHZ0cHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NTU0NTEsImV4cCI6MjA3MDQzMTQ1MX0.JR45nTPTScLaObpXQM-VzQ50ODRJTzakrvPOA3HldCM"}'::jsonb,
    body := jsonb_build_object('ts', now())
  );
  $$
);