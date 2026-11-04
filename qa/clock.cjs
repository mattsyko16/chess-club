const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_PATH?{executablePath:process.env.CHESS_BROWSER_PATH,args:['--no-sandbox','--single-process','--disable-gpu','--disable-software-rasterizer','--disable-webgl','--in-process-gpu','--no-zygote']}: {})});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<html></html>');
 await page.evaluate(()=>{window.testNow=0;performance.now=()=>window.testNow;window.setInterval=()=>0;});
 await page.setContent(fs.readFileSync(__dirname+'/../index.html','utf8'));
 const checks=await page.evaluate(async()=>{
 const checks=[];const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
 const advance=ms=>{window.testNow+=ms;settle()};
 state={players:[{id:'a',name:'White'},{id:'b',name:'Black'}],games:[]};local=true;render();enter();switchTab('clock');
 function setup(mode='move',move=60,total=10){resetClock(true);$('clock-mode').value=mode;$('move-seconds').value=String(move);$('max-game-minutes').value=String(total);$('minutes').value='5';$('increment').value='2';setModeUI();resetClock(true);$('clock-white').value='a';$('clock-black').value='b';startClock();}
 setup();advance(10000);check('Both limits count down',clock.times[0]===50000&&clock.gameRemaining===590000);
 tapClock(0);check('Move refresh leaves total untouched',clock.times[1]===60000&&clock.gameRemaining===590000&&clock.active===1);
 tapClock(1);check('Double tap protected',clock.active===1);
 advance(10000);pauseClock();const remaining=clock.gameRemaining;advance(100000);check('Pause freezes both limits',clock.gameRemaining===remaining&&clock.times[1]===50000);
 resumeClock(1);advance(5000);check('Resume uses remaining limits',clock.gameRemaining===575000&&clock.times[1]===45000);
 setup('move',120,1);advance(60000);check('Game limit stops clock',clock.gameExpired&&clock.active===null&&clock.flag===null&&clock.gameRemaining===0&&clock.times[0]===60000);
 resumeClock(0);tapClock(0);check('Expired game cannot resume',clock.active===null&&$('resume-white').hidden);
 await finishClock('draw');check('Game limit recorded in history',clock.saved&&state.games.length===1&&state.games[0].control==='120 s per move / 1 min game'&&state.games[0].reason==='Game time limit reached');
 await finishClock('draw');check('Repeated save is ignored',state.games.length===1);
 setup('move',30,1);advance(120000);check('Move limit wins if earlier during delayed tick',clock.flag===0&&!clock.gameExpired&&clock.gameRemaining===30000);
 setup('move',60,1);advance(60000);check('Simultaneous limits use game expiry',clock.gameExpired&&clock.gameRemaining===0);
 setup('move',30,0);advance(20000);tapClock(0);advance(20000);tapClock(1);check('Zero disables total limit',clock.gameRemaining===null&&!$('game-timer').offsetHeight&&clock.active===0);
 setup('game');advance(10000);tapClock(0);check('Standard increment mode unchanged',clock.times[0]===292000&&clock.gameRemaining===null);
 setup('move',60,1);for(let i=0;i<60;i++){advance(1000);if(clock.active!==null)tapClock(clock.active)}check('Total survives 59 switches and expires at 60 seconds',clock.gameExpired&&clock.gameRemaining===0);
 for(const val of ['',-1,361,1.5,'NaN']){$('max-game-minutes').value=String(val);check('Reject game limit '+JSON.stringify(val),readClockSettings()===null)}
 resetClock(true);$('max-game-minutes').value='15';settingsChanged();check('Settings accepted',readClockSettings().maxGameMinutes===15);
 setup('move',60,10);pauseClock();toggleFocus();check('Focus timer visible',!$('game-timer').hidden&&document.body.classList.contains('clock-focus'));
 const badge=$('game-timer').getBoundingClientRect(),exit=$('focus-clock').getBoundingClientRect();check('Mobile timer and exit do not overlap',badge.right<=exit.left&&badge.left>=0);
 check('Mobile has no horizontal overflow',document.documentElement.scrollWidth<=innerWidth);
 return checks;
 });
 await page.screenshot({path:__dirname+'/clock-mobile-test.png'});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:checks.length,checks,pageErrors:errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
