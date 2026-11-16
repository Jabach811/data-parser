const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/mabac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const dir=__dirname,root=path.dirname(dir),source=fs.readFileSync(path.join(root,'Data Parser App.html'),'utf8'),manifest=require('./concepts.json');
const scripts=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
const out=path.join(dir,'previews');fs.mkdirSync(out,{recursive:true});
const only=process.argv[2];
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];try{
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),manifest.sha256);
 for(const c of manifest.concepts.filter(c=>!only||c.key===only)){
  const html=fs.readFileSync(path.join(dir,`Data Parser - ${c.name}.html`),'utf8');assert.deepEqual(scripts(html).slice(0,-1),scripts(source));
  const context=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(dir,`Data Parser - ${c.name}.html`)).href);await page.waitForSelector('.ms-ready');
  const originalIds=[...source.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]),actual=await page.locator('[id]').evaluateAll(ns=>ns.map(n=>n.id));
  for(const id of originalIds)assert.equal(actual.filter(x=>x===id).length,1,`${c.name}: missing or duplicated ${id}`);
  const go=async key=>{await page.locator(`.ms-shell button[data-ms-target="${key}"]:visible`).first().click();};
  await page.screenshot({path:path.join(out,c.key+'-empty.png')});
  const sample=c.key==='insights'?'FIDELITY_special_rollover_mock.txt':'FIDELITY_summary_tabs_mock.txt';
  await go('files');await page.locator('#fileInput').setInputFiles(path.join(root,'Test Samples/Vendor Files/fidelity',sample));await page.waitForFunction(()=>document.querySelector('#loadingBox').dataset.loadingState==='complete');
  if(c.key==='inbox'||c.key==='insights')await go('case');if(c.key==='teams')await go('summary');if(c.key==='desktop')await go('home');
  await page.locator('#caseNumberInput').fill('QK1234567890');await page.locator('#planNameInput').fill('Sample Company 401(k) Plan');await page.locator('#planNameInput').blur();
  if(c.key==='insights')await go('summary');else if(c.key!=='desktop')await go('reports');
  await page.screenshot({path:path.join(out,c.key+'-loaded.png')});
  await go('reports');await page.locator('#dpcReportList button[data-code]').nth(1).click();assert.equal(await page.locator('.report-card.is-active').count(),1);
  await page.screenshot({path:path.join(out,c.key+'-report.png')});
  // Search uses the original report filter, even when its field lives in the title bar.
  const reportCount=await page.locator('#dpcReportList button[data-code]').count();const search=page.locator('#dpcReportSearch');await search.fill('balance');const filtered=await page.locator('#dpcReportList button[data-code]').count();assert.ok(filtered>0&&filtered<reportCount,`${c.name}: report filter`);await search.fill('');
  // The two worksheet layouts retain the original working report tabs.
  if(c.key==='workbook'||c.key==='insights'){await page.locator('#dpcTabs button').nth(2).click();assert.equal(await page.locator('.report-card.is-active').count(),1);}
  await go('mapping');await page.locator('#mappingFileInput').setInputFiles(path.join(root,'Test Samples/Mapping Files/v01-matched.xlsx'));await page.waitForFunction(()=>document.querySelector('#mappingValidationPanel').textContent.includes('Fund Mapping'));
  await page.screenshot({path:path.join(out,c.key+'-mapping.png')});
  if(c.key==='desktop')await go('export');
  await page.locator('#exportWorkbookBtn').click();await page.locator('#dpcConvDialog').waitFor({state:'visible'});await page.locator('#dpcConvDialog input[value="cash"]').check();await page.locator('#dpcConvDialog [data-cv="next"]').click();await page.locator('#dpcExportDialog').waitFor({state:'visible'});await page.screenshot({path:path.join(out,c.key+'-export.png')});await page.locator('#dpcExportCancel').click();
  if(c.key==='desktop')await go('home');else if(c.key==='insights')await go('summary');else await go('reports');
  // Settings remain accessible, including the original dark mode and spacing switches.
  await page.locator('#settingsBtn').click();await page.locator('[data-mode="dark"]').click();await page.locator('#settingsBtn').click();await page.screenshot({path:path.join(out,c.key+'-dark.png')});
  await page.locator('#settingsBtn').click();await page.locator('[data-mode="light"]').click();await page.locator('[data-density="compact"]').click();assert.ok(await page.locator('body').evaluate(n=>n.classList.contains('density-compact')));await page.locator('[data-density="roomy"]').click();await page.locator('#settingsBtn').click();
  for(const width of [390,768]){
   await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,c.key+'-'+width+'.png')});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth)<=width,`${c.name}: overflow at ${width}`);
   // Check the report view too, since wide records must scroll inside their table.
   await go('reports');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth)<=width,`${c.name}: report overflow at ${width}`);
   await go('files');assert.ok(await page.locator('#dpcAddFiles').isVisible(),`${c.name}: source actions accessible`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth)<=width,`${c.name}: file overflow at ${width}`);
   if(c.key==='desktop')await go('home');else if(c.key==='insights')await go('summary');else await go('reports');
  }
  assert.deepEqual(errors,[]);results.push({name:c.name,originalScriptsUnchanged:true,allOriginalIdsPresent:true,parsedSample:true,reports:await page.locator('#dpcReportList button[data-code]').count(),reportSearch:true,reportSwitching:true,mappingFeedback:true,conversionAndExportPreview:true,darkMode:true,compactMode:true,responsive:[390,768],errors});
  console.log(c.name+' passed');await context.close();
 }
 const p=await browser.newPage({viewport:{width:1500,height:1100}});await p.goto(pathToFileURL(path.join(dir,'Choose a Microsoft Look.html')).href);await p.screenshot({path:path.join(out,'five-microsoft-layouts.png'),fullPage:true});
 fs.writeFileSync(path.join(dir,only?`verification-${only}.json`:'verification.json'),JSON.stringify({sourceSha256:manifest.sha256,checkedAt:new Date().toISOString(),results},null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
