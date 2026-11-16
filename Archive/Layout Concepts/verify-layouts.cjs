const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/mabac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const dir=__dirname,root=path.dirname(dir),source=fs.readFileSync(path.join(root,'Data Parser App.html'),'utf8'),manifest=require('./layouts.json');
const scripts=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);const out=path.join(dir,'previews');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];try{
for(const c of manifest.layouts){
 const html=fs.readFileSync(path.join(dir,`Data Parser - ${c.name}.html`),'utf8');assert.deepEqual(scripts(html).slice(0,-1),scripts(source));
 const context=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(dir,`Data Parser - ${c.name}.html`)).href);
 await page.waitForSelector('.layout-ready');
 const originalIds=[...source.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);const actual=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));for(const id of originalIds){assert.equal(actual.filter(x=>x===id).length,1,`${c.name}: missing or duplicated ${id}`)}
 await page.screenshot({path:path.join(out,c.key+'-empty.png')});
 await page.locator('#fileInput').setInputFiles(path.join(root,'Test Samples/Vendor Files/fidelity/FIDELITY_summary_tabs_mock.txt'));await page.waitForFunction(()=>document.querySelector('#loadingBox').dataset.loadingState==='complete');
 await page.locator('#caseNumberInput').fill('QK1234567890');await page.locator('#planNameInput').fill('Sample Company 401(k) Plan');await page.locator('#planNameInput').blur();
 if(c.key==='guided')await page.locator('button[data-view="reports"]').click();
 if(c.key==='focus')await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.screenshot({path:path.join(out,c.key+'-loaded.png')});
 if(c.key==='focus')await page.getByRole('button',{name:'Choose report',exact:true}).click();
 await page.locator('#dpcReportList button[data-code]').nth(1).click();assert.equal(await page.locator('.report-card.is-active').count(),1);
 if(c.key==='board'||c.key==='casebook')await page.locator('.layout-preview').scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(out,c.key+'-report.png')});
 // Upload through the unchanged file input in every layout, then check actual validation output.
 await page.locator('#mappingFileInput').setInputFiles(path.join(root,'Test Samples/Mapping Files/v01-matched.xlsx'));
 await page.waitForFunction(()=>document.querySelector('#mappingValidationPanel').textContent.includes('Fund Mapping'));
 if(c.key==='guided')await page.locator('button[data-view="mapping"]').click();
 if(c.key==='focus')await page.getByRole('button',{name:'Mapping',exact:true}).click();
 if(c.key==='explorer')await page.getByRole('button',{name:'Totals & mapping',exact:true}).click();
 if(c.key==='casebook')await page.locator('.casebook-toc').getByRole('button',{name:'Mapping review'}).click();
 await page.screenshot({path:path.join(out,c.key+'-mapping.png')});
 if(c.key==='guided')await page.locator('button[data-view="export"]').click();
 if(c.key==='focus')await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.locator('#exportWorkbookBtn').click();await page.locator('#dpcConvDialog').waitFor({state:'visible'});await page.locator('#dpcConvDialog input[value="cash"]').check();await page.locator('#dpcConvDialog [data-cv="next"]').click();await page.locator('#dpcExportDialog').waitFor({state:'visible'});await page.screenshot({path:path.join(out,c.key+'-export.png')});await page.locator('#dpcExportCancel').click();
 // Return to the appropriate landing view before checking responsive layout.
 if(c.key==='guided')await page.locator('button[data-view="files"]').click();
 if(c.key==='explorer')await page.getByRole('button',{name:'Data preview',exact:true}).click();
 for(const width of [390,768]){await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,c.key+'-'+width+'.png')});const full=await page.evaluate(()=>document.documentElement.scrollWidth);assert.ok(full<=width,`${c.name} overflow ${full} at ${width}`);}
 assert.deepEqual(errors,[]);results.push({name:c.name,originalScriptsUnchanged:true,allOriginalIdsPresent:true,reports:await page.locator('#dpcReportList button[data-code]').count(),navigation:true,mappingValidation:true,conversionPreview:true,exportPreview:true,mobile:[390,768],errors});console.log(c.name+' passed');await context.close();
}
const p=await browser.newPage({viewport:{width:1500,height:1100}});await p.goto(pathToFileURL(path.join(dir,'Choose a Layout.html')).href);await p.screenshot({path:path.join(out,'five-layouts.png'),fullPage:true});fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(results,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
