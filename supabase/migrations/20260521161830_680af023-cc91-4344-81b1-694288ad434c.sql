
create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  url text not null,
  secret text not null default encode(gen_random_bytes(24), 'hex'),
  events text[] not null default array['message.sent','message.delivered','message.failed'],
  active boolean not null default true,
  last_status int,
  failure_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.webhooks enable row level security;
create policy "Manage own webhooks" on public.webhooks for all
  using (client_id = get_user_client_id(auth.uid()) or is_admin(auth.uid()))
  with check (client_id = get_user_client_id(auth.uid()) or is_admin(auth.uid()));

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null,
  message_id uuid,
  event_type text not null,
  payload jsonb not null,
  response_status int,
  response_body text,
  attempt int not null default 1,
  succeeded boolean not null default false,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);
alter table public.webhook_deliveries enable row level security;
create policy "View own deliveries" on public.webhook_deliveries for select
  using (exists (select 1 from public.webhooks w where w.id = webhook_id
    and (w.client_id = get_user_client_id(auth.uid()) or is_admin(auth.uid()))));

create index idx_webhooks_client on public.webhooks(client_id);
create index idx_wd_webhook on public.webhook_deliveries(webhook_id, created_at desc);

create trigger trg_webhooks_updated before update on public.webhooks
  for each row execute function public.update_updated_at_column();
