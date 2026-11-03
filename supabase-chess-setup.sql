-- Run once in your Supabase SQL Editor. Uses separate chess tables; coffee data is untouched.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.chess_clubs_v1 (
 room text primary key,
 pass_hash text not null,
 data jsonb not null default '{"players":[],"games":[]}'::jsonb,
 version bigint not null default 0
);
alter table public.chess_clubs_v1 enable row level security;
revoke all on public.chess_clubs_v1 from public, anon, authenticated;

create or replace function public.chess_room_v1(
 p_action text, p_room text, p_pass text,
 p_version bigint default null, p_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 r public.chess_clubs_v1%rowtype;
 s jsonb; label text; player jsonb; game jsonb;
begin
 p_room := lower(trim(p_room));
 if p_room is null or p_room !~ '^[a-z0-9-]{3,40}$' or p_pass is null or length(p_pass)<8 or octet_length(p_pass)>64 then
  raise exception 'Use a club name of 3-40 letters, numbers or hyphens and a passcode of 8-64 bytes.';
 end if;
 if p_action='create' then
  begin
   insert into public.chess_clubs_v1(room,pass_hash) values(p_room,extensions.crypt(p_pass,extensions.gen_salt('bf',10))) returning * into r;
  exception when unique_violation then raise exception 'This club already exists. Join it or choose another name.';
  end;
  return jsonb_build_object('state',r.data,'version',r.version);
 end if;
 select * into r from public.chess_clubs_v1 where room=p_room for update;
 if not found then raise exception 'Club or passcode not recognised.'; end if;
 if extensions.crypt(p_pass,r.pass_hash)<>r.pass_hash then raise exception 'Club or passcode not recognised.'; end if;
 if p_action='get' then return jsonb_build_object('state',r.data,'version',r.version); end if;
 if p_version is distinct from r.version then raise exception 'CONFLICT: Another device changed the club. Refresh and try again.'; end if;
 s:=r.data;
 if p_action='player' then
  label:=trim(p_payload->>'name');
  if label is null or length(label)<1 or length(label)>40 then raise exception 'Enter a name of 1-40 characters.'; end if;
  if exists(select 1 from jsonb_array_elements(s->'players') x where lower(x->>'name')=lower(label)) then raise exception 'This player already exists.'; end if;
  player:=jsonb_build_object('id',pg_catalog.gen_random_uuid()::text,'name',label);
  s:=jsonb_set(s,'{players}',(s->'players')||jsonb_build_array(player));
 elsif p_action='result' then
  if (p_payload->>'white') is null or (p_payload->>'black') is null or (p_payload->>'white')=(p_payload->>'black') then raise exception 'Choose two different players.'; end if;
  if not exists(select 1 from jsonb_array_elements(s->'players') x where x->>'id'=p_payload->>'white') or not exists(select 1 from jsonb_array_elements(s->'players') x where x->>'id'=p_payload->>'black') then raise exception 'Unknown player.'; end if;
  if (p_payload->>'result') is null or (p_payload->>'result') not in ('white','black','draw') then raise exception 'Invalid result.'; end if;
  if (p_payload->>'id') is null or length(p_payload->>'id')>80 then raise exception 'Invalid match identifier.'; end if;
  if exists(select 1 from jsonb_array_elements(s->'games') x where x->>'id'=p_payload->>'id') then return jsonb_build_object('state',r.data,'version',r.version); end if;
  game:=jsonb_build_object('id',p_payload->>'id','white',p_payload->>'white','black',p_payload->>'black','result',p_payload->>'result','time',now(),'control',left(coalesce(p_payload->>'control','Untimed'),40),'reason',left(coalesce(p_payload->>'reason','Result entered'),80));
  s:=jsonb_set(s,'{games}',(s->'games')||jsonb_build_array(game));
 elsif p_action='delete' then
  s:=jsonb_set(s,'{games}',coalesce((select jsonb_agg(x) from jsonb_array_elements(s->'games') x where x->>'id' is distinct from p_payload->>'id'),'[]'::jsonb));
 else raise exception 'Unknown action.';
 end if;
 update public.chess_clubs_v1 set data=s,version=version+1 where room=p_room returning * into r;
 return jsonb_build_object('state',r.data,'version',r.version);
end;
$$;
revoke all on function public.chess_room_v1(text,text,text,bigint,jsonb) from public;
grant execute on function public.chess_room_v1(text,text,text,bigint,jsonb) to anon, authenticated;
