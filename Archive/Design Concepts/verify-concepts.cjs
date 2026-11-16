const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/mabac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const dir=__dirname,root=path.dirname(dir),source=fs.readFileSync(path.join(root,'Data Parser App.html'),'utf8'),manifest=require('./concepts.json');
const scripts=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]).filter(x=>x!=='concept-skin');
const out=path.join(dir,'previews');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
 try{for(const c of manifest.concepts){
  const file=path.join(dir,`Data Parser - ${c.name}.html`),html=fs.readFileSync(file,'utf8');
  assert.deepEqual(scripts(html),scripts(source));assert.deepEqual(ids(html),ids(source));
  const context=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(file).href);await page.screenshot({path:path.join(out,c.key+'-empty.png')});
  await page.locator('#fileInput').setInputFiles(path.join(root,'Test Samples/Vendor Files/fidelity/FIDELITY_summary_tabs_mock.txt'));
  await page.waitForFunction(()=>document.querySelector('#loadingBox').dataset.loadingState==='complete');
  await page.locator('#caseNumberInput').fill('QK1234567890');await page.locator('#planNameInput').fill('Sample Company 401(k) Plan');await page.locator('#planNameInput').blur();
  const reports=await page.locator('#dpcReportList button').count();assert.ok(reports>5);
  await page.screenshot({path:path.join(out,c.key+'-loaded.png')});
  await page.locator('#dpcReportList button').nth(1).click();assert.equal(await page.locator('.report-card.is-active').count(),1);
  await page.locator('#reportOutputs').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,c.key+'-report.png')});
  await page.locator('#exportWorkbookBtn').click();await page.locator('#dpcConvDialog').waitFor({state:'visible'});
  await page.screenshot({path:path.join(out,c.key+'-conversion.png')});
  await page.locator('#dpcConvDialog input[value="cash"]').check();await page.locator('#dpcConvDialog [data-cv="next"]').click();
  await page.locator('#dpcExportDialog').waitFor({state:'visible'});await page.screenshot({path:path.join(out,c.key+'-export.png')});
  const downloaded=page.waitForEvent('download');await page.locator('#dpcExportConfirm').click();const workbook=await downloaded;assert.ok(workbook.suggestedFilename().endsWith('.xlsx'));const downloadFailure=await workbook.failure();
  if(downloadFailure){
   const baseline=await context.newPage();await baseline.goto(pathToFileURL(path.join(root,'Data Parser App.html')).href);await baseline.locator('#fileInput').setInputFiles(path.join(root,'Test Samples/Vendor Files/fidelity/FIDELITY_summary_tabs_mock.txt'));await baseline.waitForFunction(()=>document.querySelector('#loadingBox').dataset.loadingState==='complete');await baseline.locator('#caseNumberInput').fill('QK1234567890');await baseline.locator('#planNameInput').fill('Sample Company 401(k) Plan');await baseline.locator('#exportWorkbookBtn').click();await baseline.locator('#dpcConvDialog input[value="cash"]').check();await baseline.locator('#dpcConvDialog [data-cv="next"]').click();const pending=baseline.waitForEvent('download');await baseline.locator('#dpcExportConfirm').click();assert.equal(await(await pending).failure(),downloadFailure,'Download behavior must match original');await baseline.close();
  }
  await page.locator('#dpcExportCancel').click();
  await page.locator('#settingsBtn').click();await page.locator('[data-mode="dark"]').click();assert.ok(await page.locator('body').evaluate(e=>e.classList.contains('mode-dark')));await page.keyboard.press('Escape');
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,c.key+'-dark.png')});
  await page.locator('#settingsBtn').click();await page.locator('[data-mode="light"]').click();assert.ok(await page.locator('body').evaluate(e=>!e.classList.contains('mode-dark')));await page.keyboard.press('Escape');
  for(const width of [390,768]){await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));const actual=await page.evaluate(()=>document.documentElement.scrollWidth);assert.ok(actual<=width,`${c.name} overflow ${actual} at ${width}`);if(width===390){await page.screenshot({path:path.join(out,c.key+'-mobile.png')});await page.locator('#settingsBtn').click();const rect=await page.locator('#settingsPanel').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width+1,`${c.name} settings overflow`);await page.keyboard.press('Escape');}}
  assert.deepEqual(errors,[]);results.push({name:c.name,reports,scriptsIdentical:true,idsPreserved:true,conversionDialog:true,exportPreview:true,downloadBehaviorMatchesOriginal:true,browserDownloadFailure:downloadFailure,workbookDownload:workbook.suggestedFilename(),darkAndLight:true,mobileWidths:[390,768],errors});console.log(c.name+' passed');await context.close();
 }
 const page=await browser.newPage({viewport:{width:1500,height:1100}});await page.goto(pathToFileURL(path.join(dir,'Choose a Look.html')).href);await page.screenshot({path:path.join(out,'five-looks.png'),fullPage:true});
 fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(results,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
