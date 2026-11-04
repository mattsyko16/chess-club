const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_PATH?{executablePath:process.env.CHESS_BROWSER_PATH,args:['--no-sandbox','--single-process','--disable-gpu','--disable-software-rasterizer','--disable-webgl','--in-process-gpu','--no-zygote']}: {})});
 const page=await browser.newPage();let passed=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(fs.readFileSync(__dirname+'/../index.html','utf8'));
 await page.evaluate(()=>{state={players:[{id:'a',name:'A long player name with forty charactersxx'.slice(0,40)},{id:'b',name:'Beta'}],games:[]};local=true;render();enter();});
 for(const [width,height] of [[320,568],[390,844],[430,932],[844,390],[1280,800]]){
 await page.setViewportSize({width,height});
 await page.evaluate(()=>{document.body.classList.remove('clock-focus');switchTab('leaderboard');});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Leaderboard overflow ${width}`);passed++;
 await page.locator('.heading-actions [data-tab=readme]').click();
 assert(await page.locator('#readme').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Help overflow ${width}`);passed++;
 await page.locator('#readme [data-tab=leaderboard]').click();assert(await page.locator('#leaderboard').isVisible());passed++;
 await page.evaluate(()=>{switchTab('clock');$('clock-white').value='a';$('clock-black').value='b';$('clock-mode').value='move';$('max-game-minutes').value='10';settingsChanged();});
 await page.locator('#focus-clock').click();
 const layout=await page.evaluate(()=>{const a=$('game-timer').getBoundingClientRect(),b=$('focus-clock').getBoundingClientRect(),c=$('clock-1').getBoundingClientRect();return {noOverlap:a.right<=b.left,bottom:c.bottom<=innerHeight+1,overflow:document.documentElement.scrollWidth>innerWidth}});
 assert(layout.noOverlap&&layout.bottom&&!layout.overflow,`Focus layout ${width}: ${JSON.stringify(layout)}`);passed++;
 await page.screenshot({path:__dirname+`/focus-${width}.png`});
 await page.locator('#focus-clock').click();
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>switchTab('readme'));await page.screenshot({path:__dirname+'/readme-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,viewports:5,pageErrors:errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
