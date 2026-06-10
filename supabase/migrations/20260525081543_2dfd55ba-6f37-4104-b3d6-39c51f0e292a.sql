UPDATE public.messages
SET status = 'queued', device_id = NULL, processing_at = NULL
WHERE status = 'processing';