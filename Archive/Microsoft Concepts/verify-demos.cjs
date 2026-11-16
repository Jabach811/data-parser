const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/mabac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const dir=__dirname,demoDir=path.join(dir,'Loaded Demos'),out=path.join(demoDir,'previews'),manifest=JSON.parse(fs.readFileSync(path.join(demoDir,'demos.json'),'utf8'));
const scripts=html=>[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];try{
 for(const c of manifest.concepts){
  const source=fs.readFileSync(path.join(dir,`Data Parser - ${c.name}.html`),'utf8'),demo=fs.readFileSync(path.join(demoDir,c.file),'utf8');
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),c.originalSha256);
  assert.deepEqual(scripts(demo).slice(0,-1),scripts(source));
  const ctx=await browser.newContext({viewport:{width:1600,height:1000}}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const go=async key=>page.locator(`button[data-ms-target="${key}"]:visible`).first().click();
  await page.goto(pathToFileURL(path.join(demoDir,c.file)).href);
  await page.waitForSelector('body[data-demo-state="ready"]');
  assert.equal(await page.locator('#dpcReportList button[data-code]').count(),manifest.expected.reports);
  assert.equal((await page.locator('#participantCountText').textContent()).trim(),'4');
  assert.equal((await page.locator('#grandTotalText').textContent()).trim(),manifest.expected.grandTotal);
  assert.equal(await page.locator('#planNameInput').inputValue(),'Northstar Demo 401(k) Plan');
  assert.match(await page.locator('.report-card.is-active h3').textContent(),/77 - Balances/);
  await page.screenshot({path:path.join(out,c.key+'-loaded.png')});
  await go('reports');await page.locator('#dpcReportList button[data-code]').nth(1).click();assert.equal(await page.locator('.report-card.is-active').count(),1);
  if(c.key==='desktop')await go('export');
  await page.locator('#exportWorkbookBtn').click();await page.locator('#dpcConvDialog').waitFor({state:'visible'});await page.locator('#dpcConvDialog input[value="cash"]').check();await page.locator('#dpcConvDialog [data-cv="next"]').click();await page.locator('#dpcExportDialog').waitFor({state:'visible'});await page.locator('#dpcExportCancel').click();
  await go(c.key==='insights'?'summary':'reports');
  await page.setViewportSize({width:390,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth)<=390,`${c.name}: narrow layout overflow`);await page.screenshot({path:path.join(out,c.key+'-390.png')});
  // New case still clears the sample instead of immediately loading it again.
  await go('files');await page.locator('#dpcNewCase').click();await page.waitForSelector('body[data-demo-state="cleared"]');assert.equal(await page.locator('#dpcReportList button[data-code]').count(),0);assert.equal(await page.locator('#caseNumberInput').inputValue(),'');
  // Reopening the demo loads the sample again without a manual file picker.
  await page.reload();await page.waitForSelector('body[data-demo-state="ready"]');assert.equal(await page.locator('#dpcReportList button[data-code]').count(),8);
  assert.deepEqual(errors,[]);results.push({name:c.name,opensPreloaded:true,originalScriptsPreserved:true,participants:4,reports:8,grandTotal:manifest.expected.grandTotal,reportNavigation:true,exportPreview:true,newCaseClears:true,reopenReloadsDemo:true,narrowLayout:true,errors});console.log(c.name+' demo passed');await ctx.close();
 }
 const gallery=await browser.newPage({viewport:{width:1500,height:1100}});await gallery.goto(pathToFileURL(path.join(demoDir,'Choose a Loaded Demo.html')).href);assert.equal(await gallery.locator('a.concept').count(),5);assert.equal(await gallery.locator('img').evaluateAll(nodes=>nodes.filter(n=>!n.complete||n.naturalWidth===0).length),0);await gallery.screenshot({path:path.join(out,'loaded-demo-gallery.png'),fullPage:true});
 fs.writeFileSync(path.join(demoDir,'verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
