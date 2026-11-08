const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../clock.html','utf8');
const nodes=new Map([...html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)].map(m=>{const classes=new Set;return [m[1],{value:m[0].match(/\bvalue="([^"]*)"/)?.[1]||'',hidden:m[0].includes(' hidden'),textContent:'',isConnected:true,classList:{toggle(n,on){if(on===undefined)on=!classes.has(n);on?classes.add(n):classes.delete(n)},contains:n=>classes.has(n),remove:n=>classes.delete(n)},addEventListener(){},setAttribute(){},focus(){},querySelector(){return null}}]}));
nodes.get('clock-mode').value='game';
const document={getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],addEventListener(){},body:{classList:nodes.get('clock-0').classList},activeElement:null};
const context=vm.createContext({document,console,performance:{now:()=>context.testNow},navigator:{vibrate(){}},setInterval(){},setTimeout,clearTimeout,structuredClone,TextEncoder,URL,Blob,crypto:require('node:crypto').webcrypto,testNow:0,addEventListener(){}});context.window=context;
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const tests=fs.readFileSync(__dirname+'/adhoc-clock-browser.cjs','utf8').split('const checks=await page.evaluate(()=>{')[1].split('\n });')[0];
const result=vm.runInContext('(()=>{'+tests+'})()',context);assert(!/\bfetch\s*\(|supabase|chess_room_v1/.test(html));
console.log(JSON.stringify({passed:result.length+1,checks:result,networkDependencies:'none'},null,2));

