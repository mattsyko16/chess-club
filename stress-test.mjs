import fs from 'node:fs';
const HTML=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');const SOURCE=HTML.split('<script>')[1].split('</script>')[0];let checks=0;const check=(ok,label)=>{if(!ok)throw Error(label);checks++;};

function make({deniedStorage=false,preferences=null}={}){
 const ids=[...HTML.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),elements=new Map();let env;
 const classList=()=>{const values=new Set();return {contains:n=>values.has(n),toggle(n,on){const v=on??!values.has(n);v?values.add(n):values.delete(n);return v},remove:n=>values.delete(n)}};
 for(const id of ids)elements.set(id,{id,value:'',hidden:false,disabled:false,textContent:'',innerHTML:'',dataset:{},isConnected:true,classList:classList(),setAttribute(){},focus(){env.document.activeElement=this},addEventListener(){},reportValidity(){return true},checkValidity(){return true}});
 const el=id=>{if(!elements.has(id))throw Error('Missing DOM id: '+id);return elements.get(id)};
 el('confirm-overlay').hidden=true;const data=new Map();if(preferences)data.set('chess-clock-settings-v2',JSON.stringify(preferences));
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},events=new Map();
 const all=s=>s==='[data-busy]'?[el('join-club')]:s==='[data-finish]'?[]:s.startsWith('#clock-settings')?['clock-mode','clock-white','clock-black','minutes','increment','move-seconds'].map(el):s==='.pane'?['clock','leaderboard','history','players','result'].map(el):[];
 env={document:{getElementById:el,querySelectorAll:all,addEventListener:(n,f)=>events.set(n,f),body:{classList:classList()},activeElement:null},window:{addEventListener(){}},navigator:{vibrate(){}},location:{hash:'',href:'https://mattsyko16.github.io/chess-club/?v=old',protocol:'https:'},globalThis:{},performance:{now:()=>env.now},now:1000,structuredClone:v=>JSON.parse(JSON.stringify(v)),setInterval(){},setTimeout:()=>1,clearTimeout(){},fetch:(...args)=>env.onFetch(...args),onFetch(){throw Error('Unexpected fetch')},
 URL:class{constructor(v){this.href=v}static createObjectURL(){return 'blob:test'}static revokeObjectURL(){}},URLSearchParams:class{},TextEncoder:class{encode(s){return new Uint8Array(encodeURIComponent(s).replace(/%[0-9A-F]{2}|./g,'x').length)}},Blob:class{},AbortController:class{constructor(){this.signal={}}abort(){}},atob:()=>{throw Error('unused')}};
 if(deniedStorage){for(const k of ['localStorage','sessionStorage'])Object.defineProperty(env.globalThis,k,{get(){throw Error('blocked')}})}else{env.globalThis.localStorage=storage;env.globalThis.sessionStorage=storage}
 el('clock-mode').value='game';el('minutes').value='5';el('increment').value='0';el('move-seconds').value='60';
 const boot=new Function('env','const {document,window,navigator,location,globalThis,performance,structuredClone,setInterval,setTimeout,clearTimeout,fetch,URL,URLSearchParams,TextEncoder,Blob,AbortController,atob}=env;\n'+SOURCE+'\nreturn {run:s=>eval(s)};');
 const {run}=boot(env);run("local=true;state={players:[{id:'w',name:'White'},{id:'b',name:'Black'}],games:[]};");el('clock-white').value='w';el('clock-black').value='b';
 return {run,el,env,events,advance:ms=>env.now+=ms};
}


const {run,el,env,advance}=make();
el('minutes').value='3';el('increment').value='2';run('settingsChanged();startClock()');check(run('clock.active')===0,'White starts');advance(3000);run('tapClock(0)');check(run('clock.times[0]')===179000,'Increment accurate');check(run('clock.active')===1,'Switch turn');
run('tapClock(1)');check(run('clock.active')===1,'Rapid tap guarded');advance(500);run('tapClock(0)');check(run('clock.active')===1,'Inactive tap ignored');
advance(1500);run('requestReset()');check(!el('confirm-overlay').hidden&&run('clock.active')===null,'Reset pauses and opens modal');const remaining=run('clock.times[1]');advance(100000);run('closeConfirmation(false)');check(run('clock.active')===1&&run('clock.times[1]')===remaining,'Cancel resumes same side');
advance(1000);run('requestReset();closeConfirmation(true)');check(!run('clock.started')&&run('clock.active')===null&&run('clock.flag')===null,'Reset clears state');check(run('clock.times[0]')===180000&&run('clock.times[1]')===180000,'Reset restores both');check(!el('clock-mode').disabled,'Settings enabled');
for(let i=0;i<100;i++){run('startClock()');advance(400);run('tapClock(0);requestReset();closeConfirmation(true)');check(!run('clock.started')&&run('clock.id')===null,'Repeated reset '+i)}
run('startClock()');advance(180001);run('tapClock(0)');check(run('clock.flag')===0&&run('clock.active')===null,'Cannot increment after expiry');check(run('clock.times[0]')===0,'Clamps zero');run('resumeClock(0)');check(run('clock.active')===null,'Timeout cannot resume');
run('resetClock(true)');el('clock-mode').value='move';el('move-seconds').value='30';run('settingsChanged();startClock()');advance(11000);run('tapClock(0)');check(run('clock.times[0]')===30000&&run('clock.times[1]')===30000,'Fresh move budgets');advance(12000);run('pauseClock()');const moveRemaining=run('clock.times[1]');advance(50000);run('resumeClock(1);settle()');check(run('clock.times[1]')===moveRemaining,'Paused move preserved');advance(18000);run('settle()');check(run('clock.flag')===1&&run('clock.times[1]')===0,'Move exact expiry');
for(const invalid of ['0','1.5','NaN','3601']){run('resetClock(true)');el('move-seconds').value=invalid;run('settingsChanged();startClock()');check(!run('clock.started'),'Reject limit '+invalid);el('move-seconds').value='30'}
el('move-seconds').value='3600';run('settingsChanged();startClock()');check(run('clock.times[0]')===3600000,'Maximum move');run('resetClock(true)');el('clock-mode').value='game';el('minutes').value='180';el('increment').value='60';run('settingsChanged();startClock()');check(run('clock.times[0]')===10800000,'Maximum game');
const reference=[10800000,10800000];let side=0;
for(let i=0;i<4000;i++){const ms=251+(i*37%700);advance(ms);run('tapClock('+side+')');reference[side]=reference[side]-ms+60000;check(run('clock.times['+side+']')===reference[side],'Game invariant '+i);side=1-side;check(run('clock.active')===side,'Side invariant '+i)}
run('requestReset();closeConfirmation(true)');el('clock-mode').value='move';el('move-seconds').value='10';run('settingsChanged();startClock()');side=0;
for(let i=0;i<4000;i++){advance(251+i%500);run('tapClock('+side+')');check(run('clock.times[0]')===10000&&run('clock.times[1]')===10000,'Move invariant '+i);side=1-side}
run('pauseClock();toggleFocus()');check(env.document.body.classList.contains('clock-focus'),'Focus on');run('toggleFocus()');check(!env.document.body.classList.contains('clock-focus'),'Focus off');run('requestReset();closeConfirmation(true)');el('clock-black').value='w';run('startClock()');check(!run('clock.started'),'Same-player rejected');
const denied=make({deniedStorage:true});check(!denied.run('clock.started'),'Storage denial survives');
const corrupt=make({preferences:{mode:'move',moveSeconds:0,minutes:-20,increment:999}});check(corrupt.run('clock.mode')==='game'&&corrupt.run('clock.minutes')===5,'Corrupt preferences recover');
run("state.players.push({id:'unsafe',name:'<img src=x onerror=alert(1)>'});render()");check(!el('roster').innerHTML.includes('<img')&&el('roster').innerHTML.includes('&lt;img'),'Names escaped');
const a=make();let server={state:{players:[{id:'w',name:'White'},{id:'b',name:'Black'}],games:[]},version:0},calls=0,loseNext=false,hold=null;
a.env.onFetch=async(url,options)=>{calls++;const q=JSON.parse(options.body);if(hold){const wait=hold;hold=null;await wait}if(q.p_action==='get')return {ok:true,json:async()=>JSON.parse(JSON.stringify(server))};
if(q.p_version!==server.version)return {ok:false,json:async()=>({message:'CONFLICT: stale update'})};
if(q.p_action==='result'&&!server.state.games.some(g=>g.id===q.p_payload.id)){server.state.games.push({...q.p_payload,time:new Date().toISOString()});server.version++}
if(loseNext){loseNext=false;throw Error('Lost response')}return {ok:true,json:async()=>JSON.parse(JSON.stringify(server))}};
a.run("local=false;auth={...DEFAULT_CONNECTION,room:CLUB_ROOM,pass:'test-only-password'};startClock()");a.advance(1000);a.run('pauseClock()');let release;hold=new Promise(resolve=>release=resolve);const saving=a.run("finishClock('white')");check(a.run('clock.saving'),'Save in flight');a.run('requestReset()');check(a.run('clock.started')&&a.el('confirm-overlay').hidden,'Reset blocked during save');await a.run("finishClock('white')");check(calls===1,'Double save once');release();await saving;check(server.state.games.length===1&&a.run('clock.saved'),'Saved once');a.run('requestReset()');check(!a.run('clock.started'),'Saved game resets');
a.run('startClock();pauseClock()');loseNext=true;await a.run("finishClock('draw')");check(!a.run('clock.saved')&&!a.run('clock.saving'),'Lost response permits retry');await a.run("finishClock('draw')");check(!a.run('clock.saved')&&a.run('version')===server.version,'Conflict refresh');await a.run("finishClock('draw')");check(a.run('clock.saved')&&server.state.games.length===2,'Retry deduplicated');
a.run('requestReset();startClock();pauseClock()');a.env.onFetch=async()=>{const e=new Error('aborted');e.name='AbortError';throw e};await a.run("finishClock('black')");check(!a.run('busy')&&!a.run('clock.saving')&&!a.run('clock.saved'),'Timeout unlocks');check(a.el('message').textContent.includes('timed out'),'Timeout explained');

console.log('PASS: '+checks+' assertions across 8000 clock transitions and failure scenarios.');