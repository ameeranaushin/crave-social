import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='qa/revision-nov13';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const issues=[],checks=[];
function watch(p){p.on('pageerror',e=>issues.push(e.message));p.on('response',r=>{if(r.status()>=400)issues.push(`${r.status()} ${r.url()}`)});p.on('console',m=>{if(m.type()==='warning'&&m.text().includes('GSAP target'))issues.push(m.text())});}
async function open(p,url='http://127.0.0.1:4173/'){await p.goto(url);await p.waitForFunction(()=>document.documentElement.classList.contains('gallery-motion-ready'));await p.waitForFunction(()=>getComputedStyle(document.querySelector('.loader')).display==='none');}
async function at(p,selector,progress=0){await p.locator(selector).evaluate((e,v)=>scrollTo({top:e.getBoundingClientRect().top+scrollY+Math.max(0,e.offsetHeight-innerHeight)*v,behavior:'instant'}),progress);await p.waitForTimeout(220);}
const transforms=(p,s)=>p.locator(s).evaluateAll(es=>es.map(e=>getComputedStyle(e).transform));
async function close(p){await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('dialog[open]')&&!document.body.classList.contains('modal-open'));}
async function swipe(session,x,y,dx,dy){await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=10;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/10,y:y+dy*i/10}]});await new Promise(r=>setTimeout(r,16))}await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
try{
const desktop=await browser.newPage({viewport:{width:1440,height:900}});watch(desktop);
await desktop.goto('http://127.0.0.1:4173/');await desktop.waitForFunction(()=>document.documentElement.classList.contains('gallery-motion-ready'));
const count=await desktop.locator('.loader-count').textContent();await desktop.waitForTimeout(350);assert.notEqual(await desktop.locator('.loader-count').textContent(),count);
assert.equal(await desktop.locator('.loader-photo').count(),8);assert.ok(await desktop.locator('.loader-photo-stage').evaluate(e=>{const w=e.getBoundingClientRect().width;return w>=110&&w<=170}));
await desktop.screenshot({path:`${out}/loader-cycle-final.png`});
await desktop.waitForFunction(()=>getComputedStyle(document.querySelector('.loader')).display==='none');assert.equal(await desktop.evaluate(()=>scrollY),0);
assert.equal(await desktop.locator('.marquee,.section-kicker,.story-kicker').count(),0);
assert.equal(await desktop.locator('.footer-letters').getAttribute('aria-label'),'RAVE SOCIAL');
assert.equal(await desktop.locator('.footer-wordmark').getAttribute('aria-label'),'Crave Social');
assert.equal(await desktop.locator('.hero-canvas').getAttribute('data-scene'),'ready');
for(const selector of ['.hero-panel-label','.hero-next-label','.hero-panel-title','.hero-round-cta']){
assert.ok(await desktop.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect(),p=document.querySelector('.hero-interface').getBoundingClientRect();return r.left>=p.left+15&&r.right<=p.right-15&&r.top>=p.top+15&&r.bottom<=p.bottom-15}),`${selector} stays inside the panel`);}
await desktop.screenshot({path:`${out}/desktop-hero-final.png`});checks.push('Editorial photo-flash loader, complete hero artwork and aligned panel copy; no ribbon or small section labels; correct citrus C logos');
await at(desktop,'.haunted-sequence',1/3);
assert.ok(await desktop.locator('.haunted-card').first().evaluate(e=>e.offsetWidth)>=300,'Desktop shuffle cards are enlarged');
const photoStage1=await transforms(desktop,'.haunted-card');await at(desktop,'.haunted-sequence',2/3);assert.notDeepEqual(await transforms(desktop,'.haunted-card'),photoStage1);await at(desktop,'.haunted-sequence',1/3);assert.deepEqual(await transforms(desktop,'.haunted-card'),photoStage1);
await desktop.screenshot({path:`${out}/desktop-shuffle-final.png`});
await at(desktop,'.haunted-sequence',1);await desktop.mouse.wheel(0,1000);await desktop.waitForTimeout(260);assert.ok(await desktop.locator('.haunted-pin').evaluate(e=>e.getBoundingClientRect().top<0));
checks.push('Enlarged, reversible shuffle stages with native scroll release');
await at(desktop,'.programme');assert.equal(await desktop.locator('.programme-tab[aria-expanded="false"]>.programme-status').first().textContent(),'Open +');
assert.equal(await desktop.locator('.programme-tab[aria-expanded="false"]>.programme-status').first().evaluate(e=>getComputedStyle(e).writingMode),'vertical-rl');
await desktop.locator('#tab-bling').click();assert.equal(await desktop.locator('#tab-bloom .programme-status').textContent(),'Open +');await desktop.keyboard.press('ArrowRight');assert.equal(await desktop.locator('#tab-haunted').getAttribute('aria-expanded'),'true');await desktop.locator('#tab-bloom').click();await desktop.waitForTimeout(850);
await desktop.locator('#panel-bloom [data-enquiry]').click();await close(desktop);checks.push('Vertical Open cues, ticket expansion, keyboard navigation and stable enquiry return');
for(const section of ['.hero-experience','.duet-sequence','.haunted-sequence','.films','.worlds-sequence']){
const bounds=await desktop.locator(section).evaluate(e=>({start:e.getBoundingClientRect().top+scrollY,end:e.getBoundingClientRect().top+scrollY+e.offsetHeight-innerHeight}));for(const y of [bounds.start+10,bounds.end+20,bounds.end-20,bounds.start+10]){await desktop.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await desktop.waitForTimeout(110);assert.ok(Math.abs(await desktop.evaluate(()=>scrollY)-y)<2,`${section} does not snap at its boundaries`);}}
await at(desktop,'.duet-sequence',.2);const before=await desktop.evaluate(()=>scrollY);await desktop.mouse.wheel(0,2400);await desktop.waitForTimeout(260);const fast=await desktop.evaluate(()=>scrollY);assert.ok(fast>before+2000);await desktop.waitForTimeout(320);assert.ok(Math.abs(await desktop.evaluate(()=>scrollY)-fast)<2);await desktop.mouse.wheel(0,-1600);await desktop.waitForTimeout(260);assert.ok(await desktop.evaluate(()=>scrollY)<fast-1300);
for(const hash of ['moments','invitation','themes','people']){await desktop.locator(`.desktop-nav a[href="#${hash}"]`).click();await desktop.waitForFunction(id=>Math.abs(document.getElementById(id).getBoundingClientRect().top-24)<2,hash,{timeout:4000});}
await desktop.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});await desktop.mouse.wheel(0,800);await desktop.waitForTimeout(180);assert.ok(await desktop.evaluate(()=>scrollY)>200);await desktop.waitForFunction(()=>document.documentElement.classList.contains('gallery-motion-ready'));assert.equal(await desktop.locator('.loader').isVisible(),false);checks.push('Fast/reverse input, sticky boundaries, navigation links and interruptible loading');
await desktop.close();
for(const width of [360,390]){
const c=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const p=await c.newPage();watch(p);await open(p);
assert.ok(await p.locator('html').evaluate(e=>e.classList.contains('mobile-gallery-motion')));
await p.screenshot({path:`${out}/hero-${width}-final.png`});
await at(p,'.duet-sequence',.2);const initial=await transforms(p,'.duet-slide');await at(p,'.duet-sequence',.65);assert.notDeepEqual(await transforms(p,'.duet-slide'),initial);await at(p,'.duet-sequence',.2);assert.deepEqual(await transforms(p,'.duet-slide'),initial);
assert.ok(await p.locator('.duet-slide').first().evaluate(e=>Math.abs(e.offsetHeight-document.querySelector('.duet-gallery').offsetHeight)<2),'Mobile slides fill the gallery instead of using the static tile height');
await p.screenshot({path:`${out}/duet-${width}-final.png`});
await at(p,'.haunted-sequence',0);const stack=await transforms(p,'.haunted-card');await at(p,'.haunted-sequence',.5);assert.notDeepEqual(await transforms(p,'.haunted-card'),stack);assert.ok(await p.locator('.haunted-card').last().evaluate(e=>e.offsetWidth)>=width*.65);await at(p,'.haunted-sequence',1);assert.equal(await p.locator('.haunted-card').last().evaluate(e=>getComputedStyle(e).opacity),'1');
await p.screenshot({path:`${out}/shuffle-${width}-final.png`});await p.mouse.wheel(0,500);await p.waitForTimeout(200);assert.ok(await p.locator('.haunted-pin').evaluate(e=>e.getBoundingClientRect().top<0));
await at(p,'.films');const session=await c.newCDPSession(p);const sy=await p.evaluate(()=>scrollY);await swipe(session,width/2,500,0,-240);await p.waitForTimeout(350);assert.ok(await p.evaluate(()=>scrollY)>sy+120);assert.ok(await p.locator('.film-track').evaluate(e=>Number(gsap.getProperty(e,'x')))<0);
for(const selector of ['.moments','.haunted-sequence','.films','.programme','.worlds-sequence','.people','.contact','.footer']){await at(p,selector,1);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
await p.screenshot({path:`${out}/footer-${width}-final.png`});
await p.setViewportSize({width:844,height:390});await p.waitForTimeout(400);assert.equal(await p.locator('.haunted-pin').evaluate(e=>getComputedStyle(e).position),'relative','Landscape uses a light scrolling layout');
await p.setViewportSize({width,height:844});await p.waitForTimeout(400);assert.equal(await p.locator('.haunted-pin').evaluate(e=>getComputedStyle(e).position),'sticky');
await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>ScrollTrigger.getAll().length),0);assert.equal(await p.locator('.haunted-card').first().evaluate(e=>getComputedStyle(e).position),'relative');await c.close();
}
checks.push('Mobile opposing slides and larger postcard shuffle animate and reverse; vertical-driven mobile reels and native scroll release; responsive landscape and reduced motion');
const fallback=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const f=await fallback.newPage();await f.goto('http://127.0.0.1:4173/');assert.equal(await f.locator('.loader').isVisible(),false);assert.equal(await f.locator('.haunted-card').first().evaluate(e=>getComputedStyle(e).position),'relative');await fallback.close();
assert.deepEqual(issues,[]);await writeFile(`${out}/results.json`,JSON.stringify({passed:true,issues,checks},null,2));console.log(JSON.stringify({passed:true,checks},null,2));
}finally{await browser.close();}
