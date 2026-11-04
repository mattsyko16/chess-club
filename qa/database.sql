begin; set local role anon;
do $test$
declare room text := 'stress-'||substr(gen_random_uuid()::text,1,12); pass text := gen_random_uuid()::text; r jsonb; a text; b text; ver bigint; rejected boolean;
begin
r:=public.chess_room_v1('create',room,pass);
assert r->'state'->'players'='[]'::jsonb,'Create not empty';
r:=public.chess_room_v1('player',room,pass,(r->>'version')::bigint,'{"name":"Alpha"}'); a:=r->'state'->'players'->0->>'id';
r:=public.chess_room_v1('player',room,pass,(r->>'version')::bigint,'{"name":"Beta"}'); b:=r->'state'->'players'->1->>'id'; ver:=(r->>'version')::bigint;
rejected:=false; begin perform public.chess_room_v1('get',room,'wrong-passcode'); exception when others then rejected:=sqlerrm like '%not recognised%'; end; assert rejected,'Wrong pass accepted';
rejected:=false; begin perform public.chess_room_v1('player',room,pass,ver,'{"name":"alpha"}'); exception when others then rejected:=sqlerrm like '%already exists%'; end; assert rejected,'Duplicate player accepted';
rejected:=false; begin perform public.chess_room_v1('player',room,pass,ver,'{"name":"  "}'); exception when others then rejected:=true; end; assert rejected,'Empty player accepted';
rejected:=false; begin perform public.chess_room_v1('result',room,pass,ver,jsonb_build_object('id','invalid','white',a,'black',a,'result','draw')); exception when others then rejected:=true; end; assert rejected,'Self match accepted';
rejected:=false; begin perform public.chess_room_v1('result',room,pass,ver,jsonb_build_object('id','invalid','white',a,'black','missing','result','draw')); exception when others then rejected:=true; end; assert rejected,'Unknown player accepted';
rejected:=false; begin perform public.chess_room_v1('result',room,pass,ver,jsonb_build_object('id','invalid','white',a,'black',b,'result','bogus')); exception when others then rejected:=true; end; assert rejected,'Invalid result accepted';
r:=public.chess_room_v1('result',room,pass,ver,jsonb_build_object('id','test-match','white',a,'black',b,'result','white','control','60 s per move / 10 min game')); assert jsonb_array_length(r->'state'->'games')=1,'Result missing';
rejected:=false; begin perform public.chess_room_v1('player',room,pass,ver,'{"name":"Stale client"}'); exception when others then rejected:=sqlerrm like '%CONFLICT%'; end; assert rejected,'Stale write accepted';
ver:=(r->>'version')::bigint;
r:=public.chess_room_v1('result',room,pass,ver,jsonb_build_object('id','test-match','white',a,'black',b,'result','white')); assert jsonb_array_length(r->'state'->'games')=1 and (r->>'version')::bigint=ver,'Duplicate result added';
r:=public.chess_room_v1('delete',room,pass,ver,'{"id":"test-match"}'); assert r->'state'->'games'='[]'::jsonb,'Delete did not correct results';
r:=public.chess_room_v1('get',room,pass); assert jsonb_array_length(r->'state'->'players')=2 and r->'state'->'games'='[]'::jsonb,'Shared read inconsistent';
end $test$;
rollback;
select '12 live database assertions passed; test changes rolled back' as result;
