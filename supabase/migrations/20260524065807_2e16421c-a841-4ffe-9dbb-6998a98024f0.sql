create table if not exists public.api_key_request_logs (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid not null,
  client_id uuid not null,
  endpoint_path text not null,
  request_method text not null default 'POST',
  device_id uuid null,
  device_name text null,
  ip_address text null,
  user_agent text null,
  status_code integer null,
  created_at timestamptz not null default now()
);

alter table public.api_key_request_logs enable row level security;

create index if not exists idx_api_key_request_logs_key_created
  on public.api_key_request_logs (api_key_id, created_at desc);
create index if not exists idx_api_key_request_logs_client_created
  on public.api_key_request_logs (client_id, created_at desc);

create policy "View own api key request logs"
on public.api_key_request_logs
for select
using ((client_id = public.get_user_client_id(auth.uid())) or public.is_admin(auth.uid()));

alter table public.webhook_deliveries
  add column if not exists target_url text,
  add column if not exists request_body jsonb,
  add column if not exists request_headers jsonb not null default '{}'::jsonb,
  add column if not exists response_headers jsonb not null default '{}'::jsonb,
  add column if not exists request_signature text,
  add column if not exists duration_ms integer;

update public.webhook_deliveries wd
set target_url = coalesce(wd.target_url, w.url),
    request_body = coalesce(
      wd.request_body,
      jsonb_build_object(
        'event', wd.event_type,
        'data', wd.payload,
        'timestamp', coalesce(wd.delivered_at, wd.created_at)
      )
    ),
    request_headers = case
      when wd.request_headers = '{}'::jsonb then jsonb_strip_nulls(jsonb_build_object(
        'content-type', 'application/json',
        'x-btextman-event', wd.event_type
      ))
      else wd.request_headers
    end,
    response_headers = coalesce(wd.response_headers, '{}'::jsonb)
from public.webhooks w
where w.id = wd.webhook_id;