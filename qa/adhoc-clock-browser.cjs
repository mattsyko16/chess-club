const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const downloadsPath=path.resolve(__dirname,'downloads');fs.mkdirSync(downloadsPath,{recursive:true});
 let browser;try{browser=await chromium.launch({channel:'chrome',headless:true,downloadsPath})}catch{browser=await chromium.launch({channel:'msedge',headless:true,downloadsPath})}
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,acceptDownloads:true});
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url())});
 await page.addInitScript(()=>{window.testNow=0;performance.now=()=>window.testNow;window.setInterval=()=>0;});
 await page.goto('file:///'+path.resolve(__dirname,'..','clock.html').replace(/\\/g,'/'));
 const checks=await page.evaluate(()=>{
 const results=[],check=(name,ok)=>{if(!ok)throw Error(name);results.push(name)},advance=ms=>{window.testNow+=ms;settle()};
 function setup(mode='game',move=60,total=10){$('clock-mode').value=mode;$('minutes').value='5';$('increment').value='2';$('move-seconds').value=String(move);$('max-game-minutes').value=String(total);setModeUI();resetClock(true);startClock()}
 setup();check('No names required',clock.white==='White'&&clock.black==='Black');advance(10000);tapClock(0);check('Increment and turn switch',clock.times[0]===292000&&clock.active===1);tapClock(1);check('Double tap ignored',clock.active===1);
 advance(10000);pauseClock();const paused=clock.times[1];advance(50000);check('Paused time frozen',clock.times[1]===paused);resumeClock(1);advance(1000);check('Resume continues remaining time',clock.times[1]===paused-1000);
 requestReset();check('Reset asks for confirmation',!!confirmation&&clock.active===null);closeConfirmation(false);check('Cancel reset restores turn',clock.active===1);requestReset();closeConfirmation(true);check('Reset clears game',!clock.started&&clock.times[0]===300000);
 setup('move');advance(10000);tapClock(0);check('New move refreshes allowance only',clock.times[1]===60000&&clock.gameRemaining===590000);advance(10000);pauseClock();const rem=clock.gameRemaining;advance(10000);check('Shared countdown pauses',clock.gameRemaining===rem);
 setup('move',120,1);advance(60000);check('Total game limit stops all clocks',clock.gameExpired&&clock.active===null&&clock.flag===null);resumeClock(0);check('Game timeout cannot resume',clock.active===null&&$('resume-white').hidden);
 resetClock(true);check('New game clears timeout',!clock.gameExpired&&!clock.started);
 setup('move',30,1);advance(120000);check('Earlier move timeout wins during delayed tick',clock.flag===0&&!clock.gameExpired&&clock.gameRemaining===30000);
 setup('move',60,1);advance(60000);check('Simultaneous timeout handled',clock.gameExpired);
 setup('move',60,0);advance(10000);tapClock(0);check('Zero disables game limit',clock.gameRemaining===null&&clock.active===1);
 setup('move',60,1);for(let i=0;i<60;i++){advance(1000);if(clock.active!==null)tapClock(clock.active)}check('Turn switches never reset total',clock.gameExpired&&clock.gameRemaining===0);
 resetClock(true);$('max-game-minutes').value='-1';check('Negative limit rejected',readClockSettings()===null);$('max-game-minutes').value='';check('Blank limit rejected',readClockSettings()===null);$('max-game-minutes').value='361';check('Overlarge limit rejected',readClockSettings()===null);
 $('max-game-minutes').value='10';$('clock-white').value='<img src=x onerror=alert(1)>';resetClock(true);startClock();check('Names display as text',!$('label-0').querySelector('img')&&$('label-0').textContent.includes('<img'));pauseClock();
 check('No club controls',!document.getElementById('join-form')&&!document.getElementById('standings'));
 return results;
 });
 for(const [width,height] of [[320,568],[390,844],[844,390]]){
 await page.setViewportSize({width,height});await page.evaluate(()=>{closeFocus();resetClock(true);});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Normal layout fits '+width);
 await page.locator('#focus-clock').click();assert(await page.evaluate(()=>{const a=$('game-timer').getBoundingClientRect(),b=$('focus-clock').getBoundingClientRect();return document.documentElement.scrollWidth<=innerWidth&&a.right<=b.left}),'Focus fits '+width);
 await page.screenshot({path:path.join(__dirname,'focus-'+width+'.png')});await page.locator('#focus-clock').click();
 }
 // Capture the download payload; native saving is restricted in this test environment.
 await page.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=b=>{window.exportedClock=b;return create(b)};document.addEventListener('click',e=>{if(e.target.closest('a[download]'))e.preventDefault()},true)});
 await page.locator('#download-clock').click();const exported=await page.evaluate(()=>window.exportedClock.text());const downloaded=path.resolve(__dirname,'downloaded-clock.html');fs.writeFileSync(downloaded,exported);
 await page.goto('file:///'+downloaded.replace(/\\/g,'/'));assert(await page.evaluate(()=>!clock.started&&clock.active===null&&$('start-clock').hidden===false),'Downloaded copy starts clean');
 await page.locator('#start-clock').click();assert(await page.evaluate(()=>clock.started&&clock.active===0),'Downloaded copy runs offline');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log(JSON.stringify({passed:checks.length+8,checks,layouts:3,exportedCopy:'generated HTML opened and started without a server',nativeDownloadDialog:'not verified',externalRequests:external,pageErrors:errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

