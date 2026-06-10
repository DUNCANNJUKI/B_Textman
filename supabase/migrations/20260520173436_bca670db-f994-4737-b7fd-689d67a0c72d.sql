-- =========================================================
-- ENUMS
-- =========================================================
create type public.app_role as enum ('super_admin', 'admin', 'client_user');
create type public.device_status as enum ('online','offline','sending','inactive','disabled');
create type public.message_status as enum ('queued','processing','sent','delivered','failed','cancelled');
create type public.api_key_status as enum ('active','revoked');
create type public.campaign_status as enum ('pending','processing','completed','failed','cancelled');

-- =========================================================
-- UTILS
-- =========================================================
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- =========================================================
-- PROFILES
-- =========================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  company text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- =========================================================
-- USER ROLES (separate table, no recursive RLS)
-- =========================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles
    where user_id = _user_id and role in ('admin','super_admin'))
$$;

-- =========================================================
-- CLIENTS (tenants)
-- =========================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  monthly_quota int not null default 10000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.clients enable row level security;
create index idx_clients_owner on public.clients(owner_user_id);

create or replace function public.get_user_client_id(_user_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.clients where owner_user_id = _user_id limit 1
$$;

-- =========================================================
-- API KEYS
-- =========================================================
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  status public.api_key_status not null default 'active',
  rate_limit int not null default 60,
  usage_count bigint not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.api_keys enable row level security;
create index idx_api_keys_client on public.api_keys(client_id);
create index idx_api_keys_hash on public.api_keys(key_hash);

-- =========================================================
-- DEVICES
-- =========================================================
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  device_name text not null,
  device_token text not null unique,
  phone_number text,
  sim_operator text,
  sim_slot int default 1,
  android_version text,
  app_version text,
  battery_level int default 0,
  signal_strength int default 0,
  internet_type text,
  ip_address text,
  status public.device_status not null default 'offline',
  last_seen timestamptz,
  total_sms_sent bigint not null default 0,
  total_sms_failed bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.devices enable row level security;
create index idx_devices_client on public.devices(client_id);
create index idx_devices_status on public.devices(status);

-- =========================================================
-- MESSAGES
-- =========================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  recipient text not null,
  message text not null,
  encoding text not null default 'GSM7',
  parts_count int not null default 1,
  status public.message_status not null default 'queued',
  priority int not null default 5,
  retry_count int not null default 0,
  max_retries int not null default 3,
  provider_response jsonb,
  error_message text,
  external_reference text,
  created_at timestamptz not null default now(),
  processing_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create index idx_messages_client on public.messages(client_id);
create index idx_messages_device on public.messages(device_id);
create index idx_messages_status on public.messages(status);
create index idx_messages_created on public.messages(created_at desc);

-- =========================================================
-- MESSAGE EVENTS
-- =========================================================
create table public.message_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
alter table public.message_events enable row level security;
create index idx_message_events_msg on public.message_events(message_id);

-- =========================================================
-- DEVICE LOGS
-- =========================================================
create table public.device_logs (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
alter table public.device_logs enable row level security;
create index idx_device_logs_device on public.device_logs(device_id);

-- =========================================================
-- BULK CAMPAIGNS
-- =========================================================
create table public.bulk_campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  message_template text not null,
  total_count int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  status public.campaign_status not null default 'pending',
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bulk_campaigns enable row level security;
create index idx_campaigns_client on public.bulk_campaigns(client_id);

-- =========================================================
-- SETTINGS
-- =========================================================
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;

-- =========================================================
-- RLS POLICIES
-- =========================================================
-- profiles
create policy "Users view own profile" on public.profiles for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "Users update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = user_id);

-- user_roles
create policy "Users view own roles" on public.user_roles for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "Super admin manages roles" on public.user_roles for all using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- clients
create policy "View own client" on public.clients for select using (owner_user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "Update own client" on public.clients for update using (owner_user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "Insert own client" on public.clients for insert with check (owner_user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "Admin delete clients" on public.clients for delete using (public.is_admin(auth.uid()));

-- api_keys
create policy "View own api keys" on public.api_keys for select using (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid()));
create policy "Manage own api keys" on public.api_keys for all using (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid())) with check (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid()));

-- devices
create policy "View own devices" on public.devices for select using (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid()));
create policy "Manage own devices" on public.devices for all using (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid())) with check (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid()));

-- messages
create policy "View own messages" on public.messages for select using (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid()));
create policy "Insert own messages" on public.messages for insert with check (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid()));
create policy "Update own messages" on public.messages for update using (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid()));
create policy "Delete own messages" on public.messages for delete using (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid()));

-- message_events
create policy "View own message events" on public.message_events for select using (
  exists(select 1 from public.messages m where m.id = message_id and (m.client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid())))
);

-- device_logs
create policy "View own device logs" on public.device_logs for select using (
  exists(select 1 from public.devices d where d.id = device_id and (d.client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid())))
);

-- bulk_campaigns
create policy "View own campaigns" on public.bulk_campaigns for select using (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid()));
create policy "Manage own campaigns" on public.bulk_campaigns for all using (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid())) with check (client_id = public.get_user_client_id(auth.uid()) or public.is_admin(auth.uid()));

-- settings
create policy "Auth read settings" on public.settings for select using (auth.role() = 'authenticated');
create policy "Super admin writes settings" on public.settings for all using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger trg_clients_updated before update on public.clients for each row execute function public.update_updated_at_column();
create trigger trg_devices_updated before update on public.devices for each row execute function public.update_updated_at_column();
create trigger trg_messages_updated before update on public.messages for each row execute function public.update_updated_at_column();
create trigger trg_campaigns_updated before update on public.bulk_campaigns for each row execute function public.update_updated_at_column();
create trigger trg_settings_updated before update on public.settings for each row execute function public.update_updated_at_column();

-- =========================================================
-- HANDLE NEW USER: create profile + client + default role
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_client_id uuid;
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));

  insert into public.clients (owner_user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'company', split_part(new.email,'@',1) || '''s Account'))
  returning id into new_client_id;

  insert into public.user_roles (user_id, role) values (new.id, 'client_user');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- =========================================================
-- REALTIME
-- =========================================================
alter publication supabase_realtime add table public.devices;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_events;