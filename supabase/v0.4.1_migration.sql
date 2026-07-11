-- Cosmic Conquest v0.4.1 migration
-- Run this only if supabase/schema.sql from v0.4.0 was already installed.
-- Fresh projects should run the current supabase/schema.sql instead.

begin;

alter table public.logistics_settings drop column if exists republic_pool;

drop function if exists public.allocate_republic_requisition(text,integer);
drop function if exists public.salvage_logistics_asset(uuid);

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

grant execute on function public.salvage_logistics_asset(uuid,integer) to authenticated;

-- Shared atlas state: public sanitized state and private GM state.
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

alter table public.atlas_public_state enable row level security;
alter table public.atlas_private_state enable row level security;

drop policy if exists "public reads atlas state" on public.atlas_public_state;
create policy "public reads atlas state" on public.atlas_public_state for select to anon,authenticated using (true);

drop policy if exists "admins read private atlas state" on public.atlas_private_state;
create policy "admins read private atlas state" on public.atlas_private_state for select to authenticated using (public.is_logistics_admin());

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

grant execute on function public.get_atlas_state() to anon,authenticated;
grant execute on function public.save_atlas_state(jsonb) to authenticated;
grant execute on function public.save_command_tactical_pois(jsonb) to authenticated;

-- Shared custom moon/planet textures.
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

do $$
begin
  alter publication supabase_realtime add table public.atlas_public_state;
exception when duplicate_object then null;
end $$;

commit;
