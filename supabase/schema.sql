-- Cosmic Conquest Atlas + Logistics shared database schema
-- Run this in the Supabase SQL Editor on a new project.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;

create table if not exists public.logistics_settings (
  id integer primary key default 1 check (id = 1),
  default_company_cap integer not null default 100 check (default_company_cap >= 0),
  salvage_percent integer not null default 33 check (salvage_percent between 10 and 50),
  weekly_base integer not null default 15 check (weekly_base >= 0),
  resource_minor integer not null default 1 check (resource_minor >= 0),
  resource_standard integer not null default 2 check (resource_standard >= 0),
  resource_major integer not null default 3 check (resource_major >= 0),
  production_minor integer not null default 2 check (production_minor >= 0),
  production_standard integer not null default 4 check (production_standard >= 0),
  production_major integer not null default 6 check (production_major >= 0),
  last_weekly_grant_at timestamptz
);
insert into public.logistics_settings(id) values (1) on conflict (id) do nothing;

create table if not exists public.logistics_companies (
  id text primary key,
  name text not null,
  cap_override integer check (cap_override is null or cap_override >= 0),
  requisition_points integer not null default 100 check (requisition_points >= 0)
);
insert into public.logistics_companies(id,name,requisition_points) values
  ('dorn','Dorn Company',100),('makeshift','Makeshift Company',100),('vixus','Vixus Company',100),('fourth','4th Company',100)
on conflict (id) do nothing;

create table if not exists public.logistics_catalog (
  id text primary key,
  category text not null check (category in ('ground','air','base','general')),
  name text not null,
  cost integer not null check (cost >= 0),
  active boolean not null default true
);

insert into public.logistics_catalog(id,category,name,cost) values
('at-te','ground','AT-TE',24),('at-ap','ground','AT-AP',27),('at-ot','ground','AT-OT',10),('at-pt','ground','AT-PT',12),
('barc-speeder','ground','BARC Speeder',6),('rho-cargo-pod','ground','Rho-class Cargo Pod',3),('at-rt','ground','AT-RT',9),
('tx-427','ground','TX-427',18),('tx-130','ground','TX-130',15),('isp','ground','ISP',12),('av-7','ground','AV-7',12),
('laat-i','air','LAAT/i',30),('laat-c','air','LAAT/c',15),('rho-transport-shuttle','air','Rho-class Transport Shuttle',9),
('v-wing','air','V-Wing',6),('y-wing','air','Y-Wing',15),('arc-170','air','ARC-170',12),
('fob-supplies','base','FOB Supplies',21),('outpost-supplies','base','Outpost Supplies',9),('signal-equipment','base','Signal Equipment',6),
('building','base','Building',6),('shield-generator','base','Shield Generator',9),('medical-tent','base','Medical Tent',6),
('medical-droid','base','Medical Droid',15),('bacta-tank','base','Bacta Tank',9),('e-web','base','E-WEB',3),
('at-turret','base','AT Turret',6),('aa-turret','base','AA Turret',6),('ap-turret','base','AP Turret',6),
('food','general','Food',3),('medical','general','Medical',6),('blaster-rifles','general','Blaster Rifles',9),('explosives','general','Explosives',9)
on conflict (id) do update set category=excluded.category,name=excluded.name,cost=excluded.cost,active=true;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_user_id text,
  display_name text,
  app_role text not null default 'viewer' check (app_role in ('viewer','command','admin','root')),
  company_id text references public.logistics_companies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,discord_user_id,display_name)
  values(new.id, coalesce(new.raw_user_meta_data->>'provider_id',new.raw_user_meta_data->>'sub'), coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',new.raw_user_meta_data->>'preferred_username','Discord User'))
  on conflict(id) do update set display_name=excluded.display_name,discord_user_id=excluded.discord_user_id,updated_at=now();
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of raw_user_meta_data on auth.users for each row execute function public.handle_new_user();

create table if not exists public.logistics_assets (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.logistics_companies(id) on delete cascade,
  catalog_item_id text references public.logistics_catalog(id) on delete set null,
  category text not null check (category in ('ground','air','base','general')),
  name text not null,
  status text not null default 'operational' check (status in ('operational','maintenance','salvageable')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.logistics_ledger (
  id bigint generated always as identity primary key,
  company_id text references public.logistics_companies(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  amount integer not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.requisition_sites (
  id text primary key,
  body_id text not null,
  body_name text not null,
  site_type text not null check (site_type in ('resource','production')),
  tier text not null check (tier in ('minor','standard','major')),
  faction_id text not null,
  updated_at timestamptz not null default now()
);

-- Shared galaxy-map state.
-- The public table contains a sanitized state for anonymous viewers.
-- The private table contains GM notes and hidden Intel for Admin/Root accounts.
create table if not exists public.atlas_public_state (
  id integer primary key default 1 check (id = 1),
  state jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.atlas_public_state(id,state) values(1,null) on conflict(id) do nothing;

create table if not exists public.atlas_private_state (
  id integer primary key default 1 check (id = 1),
  state jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.atlas_private_state(id,state) values(1,null) on conflict(id) do nothing;


create or replace function public.current_app_role() returns text language sql stable security definer set search_path=public as $$
  select coalesce((select app_role from public.profiles where id=auth.uid()),'viewer');
$$;
create or replace function public.current_company_id() returns text language sql stable security definer set search_path=public as $$
  select company_id from public.profiles where id=auth.uid();
$$;
create or replace function public.is_logistics_admin() returns boolean language sql stable security definer set search_path=public as $$
  select public.current_app_role() in ('admin','root');
$$;
create or replace function public.is_logistics_root() returns boolean language sql stable security definer set search_path=public as $$
  select public.current_app_role()='root';
$$;

create or replace function public.make_public_atlas_state(p_state jsonb) returns jsonb
language plpgsql immutable as $$
declare
  v_state jsonb:=coalesce(p_state,'{}'::jsonb);
  v_pois jsonb;
  v_terrain jsonb;
  v_sectors jsonb;
begin
  select coalesce(jsonb_agg(item - 'gmNotes'),'[]'::jsonb)
    into v_pois
  from jsonb_array_elements(coalesce(v_state->'pois','[]'::jsonb)) item
  where coalesce(item->>'visibility','public') in ('public','discovered');

  select coalesce(jsonb_agg(item - 'gmNotes'),'[]'::jsonb)
    into v_terrain
  from jsonb_array_elements(coalesce(v_state->'terrain','[]'::jsonb)) item
  where coalesce(item->>'visibility','public') in ('public','discovered');

  select coalesce(jsonb_agg(item - 'gmNotes'),'[]'::jsonb)
    into v_sectors
  from jsonb_array_elements(coalesce(v_state->'sectors','[]'::jsonb)) item
  where coalesce(item->>'visibility','public') in ('public','discovered');

  v_state:=jsonb_set(v_state,'{pois}',v_pois,true);
  v_state:=jsonb_set(v_state,'{terrain}',v_terrain,true);
  v_state:=jsonb_set(v_state,'{sectors}',v_sectors,true);
  return v_state;
end $$;

create or replace function public.get_atlas_state() returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare v_state jsonb;
begin
  if public.is_logistics_admin() then
    select state into v_state from public.atlas_private_state where id=1;
  else
    select state into v_state from public.atlas_public_state where id=1;
  end if;
  return v_state;
end $$;

create or replace function public.save_atlas_state(p_state jsonb) returns void
language plpgsql security definer set search_path=public as $$
begin
  if not public.is_logistics_admin() then raise exception 'Admin or Root role required.'; end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then raise exception 'Atlas state must be a JSON object.'; end if;

  update public.atlas_private_state
    set state=p_state,updated_at=now(),updated_by=auth.uid()
    where id=1;
  update public.atlas_public_state
    set state=public.make_public_atlas_state(p_state),updated_at=now(),updated_by=auth.uid()
    where id=1;
end $$;

create or replace function public.save_command_tactical_pois(p_pois jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare
  v_role text:=public.current_app_role();
  v_state jsonb;
  v_non_tactical jsonb;
begin
  if v_role not in ('command','admin','root') then raise exception 'Command role or higher is required.'; end if;
  if p_pois is null or jsonb_typeof(p_pois) <> 'array' then raise exception 'Tactical POIs must be a JSON array.'; end if;
  if exists(
    select 1 from jsonb_array_elements(p_pois) item
    where coalesce(item->>'type','') <> 'tactical'
       or coalesce(item->>'visibility','public') not in ('public','discovered')
  ) then
    raise exception 'Command accounts can publish public or discovered Tactical Point POIs only.';
  end if;

  select state into v_state from public.atlas_private_state where id=1 for update;
  if v_state is null then raise exception 'The shared atlas has not been initialized by an Admin or Root account.'; end if;

  -- Preserve all non-tactical POIs and any hidden tactical POIs that Command users cannot see.
  select coalesce(jsonb_agg(item),'[]'::jsonb)
    into v_non_tactical
  from jsonb_array_elements(coalesce(v_state->'pois','[]'::jsonb)) item
  where coalesce(item->>'type','') <> 'tactical'
     or coalesce(item->>'visibility','public') not in ('public','discovered');

  select coalesce(jsonb_agg(item - 'gmNotes'),'[]'::jsonb)
    into p_pois
  from jsonb_array_elements(p_pois) item;

  v_state:=jsonb_set(v_state,'{pois}',v_non_tactical || p_pois,true);

  update public.atlas_private_state
    set state=v_state,updated_at=now(),updated_by=auth.uid()
    where id=1;
  update public.atlas_public_state
    set state=public.make_public_atlas_state(v_state),updated_at=now(),updated_by=auth.uid()
    where id=1;
end $$;


alter table public.logistics_settings enable row level security;
alter table public.logistics_companies enable row level security;
alter table public.logistics_catalog enable row level security;
alter table public.logistics_assets enable row level security;
alter table public.logistics_ledger enable row level security;
alter table public.requisition_sites enable row level security;
alter table public.profiles enable row level security;
alter table public.atlas_public_state enable row level security;
alter table public.atlas_private_state enable row level security;

-- Public read access keeps the tracker and sanitized galaxy map viewable on the public website. All writes are controlled separately.
drop policy if exists "public reads atlas state" on public.atlas_public_state;
create policy "public reads atlas state" on public.atlas_public_state for select to anon,authenticated using (true);
drop policy if exists "admins read private atlas state" on public.atlas_private_state;
create policy "admins read private atlas state" on public.atlas_private_state for select to authenticated using (public.is_logistics_admin());
create policy "public read settings" on public.logistics_settings for select to anon,authenticated using (true);
create policy "public read companies" on public.logistics_companies for select to anon,authenticated using (true);
create policy "public read catalog" on public.logistics_catalog for select to anon,authenticated using (active=true);
create policy "public read assets" on public.logistics_assets for select to anon,authenticated using (true);
create policy "admins read ledger" on public.logistics_ledger for select to authenticated using (public.is_logistics_admin());
create policy "admins read sites" on public.requisition_sites for select to authenticated using (public.is_logistics_admin());
create policy "own profile or root reads" on public.profiles for select to authenticated using (id=auth.uid() or public.is_logistics_root());
create policy "root updates profiles" on public.profiles for update to authenticated using (public.is_logistics_root()) with check (public.is_logistics_root());
create policy "root updates settings" on public.logistics_settings for update to authenticated using (public.is_logistics_root()) with check (public.is_logistics_root());
create policy "root manages companies" on public.logistics_companies for all to authenticated using (public.is_logistics_root()) with check (public.is_logistics_root());
create policy "root manages catalog" on public.logistics_catalog for all to authenticated using (public.is_logistics_root()) with check (public.is_logistics_root());

create or replace function public.company_cap(p_company_id text) returns integer language sql stable security definer set search_path=public as $$
  select coalesce(c.cap_override,s.default_company_cap) from public.logistics_companies c cross join public.logistics_settings s where c.id=p_company_id and s.id=1;
$$;

create or replace function public.requisition_logistics_asset(p_company_id text,p_catalog_item_id text) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_role text; v_assigned text; v_item public.logistics_catalog; v_company public.logistics_companies; v_id uuid;
begin
  v_role:=public.current_app_role(); v_assigned:=public.current_company_id();
  if v_role not in ('command','admin','root') then raise exception 'Command role or higher is required.'; end if;
  if v_role='command' and v_assigned is distinct from p_company_id then raise exception 'You are not assigned to this company.'; end if;
  select * into v_item from public.logistics_catalog where id=p_catalog_item_id and active=true;
  if not found then raise exception 'Catalog item not found.'; end if;
  select * into v_company from public.logistics_companies where id=p_company_id for update;
  if not found then raise exception 'Company not found.'; end if;
  if v_company.requisition_points < v_item.cost then raise exception 'Insufficient requisition points.'; end if;
  update public.logistics_companies set requisition_points=requisition_points-v_item.cost where id=p_company_id;
  insert into public.logistics_assets(company_id,catalog_item_id,category,name,created_by) values(p_company_id,v_item.id,v_item.category,v_item.name,auth.uid()) returning id into v_id;
  insert into public.logistics_ledger(company_id,user_id,action,amount,note) values(p_company_id,auth.uid(),'requisition',-v_item.cost,v_item.name);
  return v_id;
end $$;

create or replace function public.set_logistics_asset_status(p_asset_id uuid,p_status text) returns void
language plpgsql security definer set search_path=public as $$
begin
  if not public.is_logistics_admin() then raise exception 'Admin or Root role required.'; end if;
  if p_status not in ('operational','maintenance','salvageable') then raise exception 'Invalid status.'; end if;
  update public.logistics_assets set status=p_status where id=p_asset_id;
end $$;

create or replace function public.repair_logistics_asset(p_asset_id uuid,p_cost integer) returns void
language plpgsql security definer set search_path=public as $$
declare v_asset public.logistics_assets; v_company public.logistics_companies;
begin
  if not public.is_logistics_admin() then raise exception 'Admin or Root role required.'; end if;
  if p_cost < 0 then raise exception 'Repair cost cannot be negative.'; end if;
  select * into v_asset from public.logistics_assets where id=p_asset_id for update;
  if not found then raise exception 'Asset not found.'; end if;
  select * into v_company from public.logistics_companies where id=v_asset.company_id for update;
  if v_company.requisition_points < p_cost then raise exception 'Insufficient requisition points.'; end if;
  update public.logistics_companies set requisition_points=requisition_points-p_cost where id=v_company.id;
  update public.logistics_assets set status='operational' where id=p_asset_id;
  insert into public.logistics_ledger(company_id,user_id,action,amount,note) values(v_company.id,auth.uid(),'repair',-p_cost,v_asset.name);
end $$;

create or replace function public.salvage_logistics_asset(p_asset_id uuid,p_salvage_percent integer) returns integer
language plpgsql security definer set search_path=public as $$
declare v_asset public.logistics_assets; v_cost integer:=0; v_refund integer; v_credit integer; v_cap integer; v_points integer;
begin
  if not public.is_logistics_admin() then raise exception 'Admin or Root role required.'; end if;
  if p_salvage_percent < 10 or p_salvage_percent > 50 then raise exception 'Salvage percentage must be between 10 and 50.'; end if;
  select * into v_asset from public.logistics_assets where id=p_asset_id for update;
  if not found then raise exception 'Asset not found.'; end if;
  if v_asset.status <> 'salvageable' then raise exception 'Asset must be Salvageable.'; end if;
  select cost into v_cost from public.logistics_catalog where id=v_asset.catalog_item_id;
  v_refund:=ceil(coalesce(v_cost,0) * p_salvage_percent / 100.0)::integer;
  v_cap:=public.company_cap(v_asset.company_id);
  select requisition_points into v_points from public.logistics_companies where id=v_asset.company_id for update;
  v_credit:=greatest(0,least(v_refund,v_cap-v_points));
  update public.logistics_companies set requisition_points=requisition_points+v_credit where id=v_asset.company_id;
  delete from public.logistics_assets where id=p_asset_id;
  insert into public.logistics_ledger(company_id,user_id,action,amount,note)
  values(v_asset.company_id,auth.uid(),'salvage',v_credit,concat(v_asset.name,' at ',p_salvage_percent,'%'));
  return v_credit;
end $$;

create or replace function public.set_logistics_company_points(p_company_id text,p_points integer) returns void
language plpgsql security definer set search_path=public as $$
begin
  if not public.is_logistics_admin() then raise exception 'Admin or Root role required.'; end if;
  update public.logistics_companies set requisition_points=least(greatest(p_points,0),public.company_cap(p_company_id)) where id=p_company_id;
  insert into public.logistics_ledger(company_id,user_id,action,amount,note) values(p_company_id,auth.uid(),'manual_set',0,concat('Set to ',p_points,' RP'));
end $$;

create or replace function public.sync_requisition_sites(p_sites jsonb) returns integer
language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
  if not public.is_logistics_admin() then raise exception 'Admin or Root role required.'; end if;
  delete from public.requisition_sites;
  insert into public.requisition_sites(id,body_id,body_name,site_type,tier,faction_id)
  select x.id,x.body_id,x.body_name,x.site_type,x.tier,x.faction_id
  from jsonb_to_recordset(coalesce(p_sites,'[]'::jsonb)) as x(id text,body_id text,body_name text,site_type text,tier text,faction_id text);
  get diagnostics v_count=row_count;
  return v_count;
end $$;

create or replace function public.run_weekly_requisition(p_force boolean default false) returns integer
language plpgsql security definer set search_path=public as $$
declare
  s public.logistics_settings;
  v_sites integer;
  v_total integer;
  company_row public.logistics_companies;
  v_cap integer;
  v_before integer;
  v_after integer;
  v_credit integer;
begin
  if p_force and not public.is_logistics_admin() then raise exception 'Admin or Root role required for a forced grant.'; end if;
  select * into s from public.logistics_settings where id=1 for update;
  if not p_force and s.last_weekly_grant_at is not null and s.last_weekly_grant_at > now()-interval '7 days' then return 0; end if;

  select coalesce(sum(case
    when site_type='resource' and tier='minor' then s.resource_minor
    when site_type='resource' and tier='standard' then s.resource_standard
    when site_type='resource' and tier='major' then s.resource_major
    when site_type='production' and tier='minor' then s.production_minor
    when site_type='production' and tier='standard' then s.production_standard
    when site_type='production' and tier='major' then s.production_major else 0 end),0)::integer
  into v_sites
  from public.requisition_sites;

  v_total:=s.weekly_base+v_sites;

  for company_row in select * from public.logistics_companies for update loop
    v_cap:=public.company_cap(company_row.id);
    v_before:=company_row.requisition_points;
    v_after:=least(v_cap,v_before+v_total);
    v_credit:=greatest(0,v_after-v_before);
    update public.logistics_companies set requisition_points=v_after where id=company_row.id;
    insert into public.logistics_ledger(company_id,user_id,action,amount,note)
    values(company_row.id,auth.uid(),'weekly_grant',v_credit,concat('Calculated ',v_total,' RP: base ',s.weekly_base,' + sites ',v_sites));
  end loop;

  update public.logistics_settings set last_weekly_grant_at=now() where id=1;
  return v_total;
end $$;


-- Public texture bucket for uploaded custom moon/planet maps.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('atlas-textures','atlas-textures',true,52428800,array['image/png','image/jpeg','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "public reads atlas textures" on storage.objects;
create policy "public reads atlas textures" on storage.objects for select to anon,authenticated
using (bucket_id='atlas-textures');
drop policy if exists "admins upload atlas textures" on storage.objects;
create policy "admins upload atlas textures" on storage.objects for insert to authenticated
with check (bucket_id='atlas-textures' and public.is_logistics_admin());
drop policy if exists "admins update atlas textures" on storage.objects;
create policy "admins update atlas textures" on storage.objects for update to authenticated
using (bucket_id='atlas-textures' and public.is_logistics_admin())
with check (bucket_id='atlas-textures' and public.is_logistics_admin());
drop policy if exists "admins delete atlas textures" on storage.objects;
create policy "admins delete atlas textures" on storage.objects for delete to authenticated
using (bucket_id='atlas-textures' and public.is_logistics_admin());

grant execute on function public.get_atlas_state() to anon,authenticated;
grant execute on function public.save_atlas_state(jsonb) to authenticated;
grant execute on function public.save_command_tactical_pois(jsonb) to authenticated;

grant execute on function public.requisition_logistics_asset(text,text) to authenticated;
grant execute on function public.set_logistics_asset_status(uuid,text) to authenticated;
grant execute on function public.repair_logistics_asset(uuid,integer) to authenticated;
grant execute on function public.salvage_logistics_asset(uuid,integer) to authenticated;
grant execute on function public.set_logistics_company_points(text,integer) to authenticated;
grant execute on function public.sync_requisition_sites(jsonb) to authenticated;
grant execute on function public.run_weekly_requisition(boolean) to authenticated;

-- The job runs daily, but the function's seven-day guard allows only one automatic grant per week.
select cron.schedule('cosmic-conquest-weekly-logistics','5 0 * * *','select public.run_weekly_requisition(false);');

-- Realtime updates for shared company trackers and the public galaxy map.
alter publication supabase_realtime add table public.logistics_settings;
alter publication supabase_realtime add table public.logistics_companies;
alter publication supabase_realtime add table public.logistics_catalog;
alter publication supabase_realtime add table public.logistics_assets;
alter publication supabase_realtime add table public.atlas_public_state;
