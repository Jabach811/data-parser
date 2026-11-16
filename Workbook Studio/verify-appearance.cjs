const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const{chromium}=require('C:/Users/mabac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[],out=path.join(__dirname,'previews');
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname,'Workbook Studio - Demo.html')).href);
  await page.waitForSelector('body.studio-ribbon[data-demo-state="ready"]');
  await page.locator('#settingsBtn').click();
  const colors=()=>page.evaluate(()=>({header:getComputedStyle(document.querySelector('.masthead')).backgroundColor,export:getComputedStyle(document.querySelector('#exportWorkbookBtn')).backgroundColor}));
  await page.locator('[data-palette="blue"]').click();const first=await colors();
  await page.locator('[data-palette="plum"]').click();const second=await colors();
  assert.notEqual(second.header,first.header,'Selecting a different palette must change the title bar.');
  assert.notEqual(second.export,first.export,'Selecting a different palette must change the primary action.');
  const contrast=(a,b)=>{
    const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  };
  const matrix=[];
  for(const mode of ['light','dark']){
    await page.locator('[data-mode="'+mode+'"]').click();
    for(const palette of ['green','blue','indigo','teal','plum','graphite']){
      await page.locator('[data-palette="'+palette+'"]').click();
      const values=await page.evaluate(()=>{
        const read=selector=>{const s=getComputedStyle(document.querySelector(selector));return{background:s.backgroundColor,text:s.color};};
        return{header:read('.masthead'),primary:read('#exportWorkbookBtn'),selected:read('.list-row.is-active'),tab:read('#ws-tab-home')};
      });
      for(const name of ['header','primary','selected'])assert.ok(contrast(values[name].background,values[name].text)>=4.5,`${palette} ${mode} ${name} contrast`);
      assert.equal(values.tab.text,values.primary.background,`${palette} ${mode} selected tab follows palette`);
      matrix.push({palette,mode,...values});
    }
  }
  for(const mode of ['light','dark'])for(const name of ['header','primary','selected'])assert.equal(new Set(matrix.filter(v=>v.mode===mode).map(v=>v[name].background)).size,6,`All ${mode} ${name} colors are distinct`);
  const fontTargets=['#ws-panel-home .ws-large span','.report-card.is-active tbody td','.list-row.is-active .n','#caseNumberInput','.ws-settings-section legend'];
  const fontSizes=[];
  for(const size of ['standard','large','extra-large']){
    await page.locator('button[data-text-size="'+size+'"]').click();
    fontSizes.push({size,values:await page.evaluate(selectors=>selectors.map(selector=>parseFloat(getComputedStyle(document.querySelector(selector)).fontSize)),fontTargets)});
  }
  for(let i=0;i<fontTargets.length;i++)assert.ok(fontSizes[0].values[i]<fontSizes[1].values[i]&&fontSizes[1].values[i]<fontSizes[2].values[i],`Text preference increases ${fontTargets[i]}: ${fontSizes.map(s=>s.values[i]).join(', ')}`);
  assert.equal(await page.locator('#ws-panel-home .ws-large svg').first().evaluate(n=>n.getBoundingClientRect().width),40);
  await page.locator('[data-palette="blue"]').click();await page.locator('[data-density="compact"]').click();
  const saved={palette:'blue',mode:'dark',density:'compact',textSize:'extra-large'};
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('dpc-settings'))),saved);
  await page.reload();await page.waitForSelector('body[data-demo-state="ready"][data-appearance-ready="true"]');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('dpc-settings'))),saved);
  assert.equal(await page.locator('body').getAttribute('data-text-size'),'extra-large');
  assert.ok(await page.locator('body.mode-dark.pal-blue.density-compact').count());
  assert.equal(await page.locator('#ws-panel-home .ws-large span').first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize)).then(v=>Math.round(v)),19);
  // Clicking the gear itself must open the panel without the outside-click handler closing it.
  await page.locator('#settingsBtn svg').click();assert.ok(await page.locator('#settingsPanel').isVisible());
  await page.screenshot({path:path.join(out,'settings-blue-extra-large-dark.png'),animations:'disabled'});
  for(const width of [1280,768,390]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth)<=width,`Extra large layout at ${width}`);
    assert.ok(await page.locator('#dpcReportList .list-row').evaluateAll(rows=>rows.every(row=>{const bounds=row.getBoundingClientRect(),text=row.querySelector('.n').getBoundingClientRect();return text.top>=bounds.top&&text.bottom<=bounds.bottom;})),`Report names fit their rows at ${width}`);
    const box=await page.locator('#settingsPanel').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width,`Settings fits at ${width}`);
    assert.ok(await page.locator('#settingsPanel').evaluate(n=>n.scrollWidth<=n.clientWidth),'Settings has no horizontal clipping');
    await page.screenshot({path:path.join(out,'settings-extra-large-'+width+'.png'),animations:'disabled'});
  }
  await page.keyboard.press('Escape');assert.ok(await page.locator('#settingsPanel').isHidden());assert.equal(await page.locator(':focus').getAttribute('id'),'settingsBtn');
  await page.screenshot({path:path.join(out,'ribbon-extra-large-mobile.png'),animations:'disabled'});
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#settingsBtn').click();
  const reportsBefore=await page.locator('#dpcReportList [data-code]').count(),caseBefore=await page.locator('#caseNumberInput').inputValue();
  await page.getByRole('button',{name:'Reset appearance',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('dpc-settings'))),{palette:'green',mode:'light',density:'roomy',textSize:'standard'});
  assert.equal(await page.locator('#dpcReportList [data-code]').count(),reportsBefore);assert.equal(await page.locator('#caseNumberInput').inputValue(),caseBefore);
  await page.screenshot({path:path.join(out,'settings-green-standard.png'),animations:'disabled'});
  await page.getByRole('button',{name:'Close settings',exact:true}).click();assert.ok(await page.locator('#settingsPanel').isHidden());
  await page.screenshot({path:path.join(out,'ribbon-readable.png'),animations:'disabled'});
  // Unreadable or older settings cannot prevent the app from opening.
  await page.evaluate(()=>localStorage.setItem('dpc-settings','{broken json'));
  await page.reload();await page.waitForSelector('body[data-demo-state="ready"][data-appearance-ready="true"]');
  assert.ok(await page.locator('body.pal-green[data-text-size="standard"]').count());
  await page.evaluate(()=>localStorage.setItem('dpc-settings',JSON.stringify({palette:'ta-night',mode:'dark',density:'compact'})));
  await page.reload();await page.waitForSelector('body[data-demo-state="ready"][data-appearance-ready="true"]');
  assert.ok(await page.locator('body.pal-indigo.mode-dark.density-compact[data-text-size="standard"]').count());
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'appearance-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),paletteMatrix:matrix,textSizes:fontSizes,preferencesSurviveReload:true,gearClick:true,resetPreservesCase:true,legacyAndInvalidSettings:true,responsiveExtraLarge:[1280,768,390],errors},null,2));
  console.log('Appearance checks passed: 12 palette/mode combinations, text sizing, persistence, reset, and responsive layout.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
