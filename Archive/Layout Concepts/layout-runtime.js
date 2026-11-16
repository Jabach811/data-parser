(function(){
  'use strict';
  const kind=document.body.dataset.layout;
  const $=s=>document.querySelector(s);
  const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text)n.textContent=text;return n;};
  const button=(text,fn,cls='layout-button')=>{const n=make('button',cls,text);n.type='button';n.addEventListener('click',fn);return n;};
  function block(title,cls=''){const n=make('section','layout-block '+cls);n.append(make('h2','layout-heading',title));return n;}
  const cols=document.querySelectorAll('.top>.col'),source=block('Source files','source-block'),casebox=block('Case details','case-block'),reports=block('Reports','reports-block'),mapping=block('Mapping workbook','mapping-block'),delivery=block('Workbook export','export-block');
  source.append(cols[0].querySelector('.col-grow'),$('#loadingBox'),$('#errorText'),$('#pendingFilesPanel'));
  casebox.append(cols[0].querySelector('.fields'),$('#caseNumberMessage'));
  reports.append(cols[1].querySelector('.col-grow'));
  mapping.append($('#mappingFileInput'),$('#mappingImportBtn'),$('#dpcMappingFileState'));
  delivery.append(make('p','layout-note','Review the conversion type and workbook sheets before downloading.'),$('#exportWorkbookBtn'),$('#vpOverrideBtn'));
  const totals=$('#dpcTotals'),checks=$('#dpcMapping'),preview=$('.bottom'),consoleEl=$('.console');
  const totalsDetails=totals.querySelector('details');if(totalsDetails)totalsDetails.open=false;
  const previewEmpty=make('div','layout-preview-empty');previewEmpty.append(make('div','preview-glyph','▦'),make('h2','','Your report workspace'),make('p','','Load vendor files, then select a report to inspect its records.'));
  preview.prepend(previewEmpty);preview.classList.add('layout-preview');
  new MutationObserver(()=>{previewEmpty.hidden=!$('#dpcTableCard').hidden;}).observe($('#dpcTableCard'),{attributes:true,attributeFilter:['hidden']});
  const host=make('main','layout-host');host.id='layout-main';const crumb=make('div','layout-crumb');crumb.append(make('span','','Data conversion'),make('span','',' / '+({explorer:'Explorer',guided:'Guided workflow',board:'Conversion board',focus:'Focus workspace',casebook:'Case file'}[kind])));host.append(crumb);
  const originalSections=[totals,checks,preview];originalSections.forEach(n=>n.remove());
  consoleEl.replaceChildren(host);
  const labels={files:'Files & case',reports:'Report review',mapping:'Mapping checks',export:'Export'};
  let reveal=()=>{};
  const navState=(nav,key)=>nav.querySelectorAll('button[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===key)));
  function nav(items,onSelect,cls){const n=make('nav',cls);n.setAttribute('aria-label','Workspace sections');items.forEach(([key,label])=>{const b=button(label,()=>onSelect(key));b.dataset.view=key;n.append(b);});return n;}
  if(kind==='explorer'){
    const grid=make('div','explorer-grid'),left=make('aside','explorer-intake'),middle=make('aside','explorer-directory'),right=make('div','explorer-work');
    left.append(casebox,source,mapping,delivery);middle.append(reports);const review=make('div','explorer-review'),audit=make('div','explorer-audit');review.append(preview);audit.append(totals,checks);audit.hidden=true;
    const switcher=nav([['review','Data preview'],['checks','Totals & mapping']],key=>{review.hidden=key!=='review';audit.hidden=key!=='checks';navState(switcher,key);},'layout-tabs');navState(switcher,'review');right.append(switcher,review,audit);grid.append(left,middle,right);host.append(grid);
    reveal=key=>{review.hidden=key==='mapping';audit.hidden=key!=='mapping';navState(switcher,key==='mapping'?'checks':'review');};
    $('#dpcReportList').addEventListener('click',()=>reveal('reports'));
  }
  if(kind==='guided'){
    const grid=make('div','guided-grid'),rail=make('aside','guided-rail'),work=make('div','guided-work'),stages={};
    const names=[['files','1   Set up the case'],['reports','2   Review the data'],['mapping','3   Check the mapping'],['export','4   Prepare the workbook']];let active='files';
    names.forEach(([key,label])=>{const pane=make('section','guided-stage');pane.dataset.stage=key;pane.append(make('h1','layout-title',label.slice(4)));stages[key]=pane;work.append(pane);});
    stages.files.append(make('p','layout-intro','Start with the case details and vendor files. The app detects the source and reads the reports.'),casebox,source);
    const reviewGrid=make('div','guided-review-grid');reviewGrid.append(reports,preview);stages.reports.append(totals,reviewGrid);stages.mapping.append(mapping,checks);stages.export.append(make('p','layout-intro','Use the existing export checks to choose a conversion type and review the workbook.'),delivery);
    const stepnav=nav(names,key=>show(key),'guided-nav');rail.append(make('h2','','Conversion workflow'),make('p','','Move between steps at any time.'),stepnav);
    const footer=make('div','guided-footer'),back=button('Back',()=>move(-1)),progress=make('span'),next=button('Continue',()=>move(1),'layout-button layout-primary');footer.append(back,progress,next);work.append(footer);
    function move(delta){const index=names.findIndex(x=>x[0]===active);show(names[Math.max(0,Math.min(names.length-1,index+delta))][0]);}
    function show(key){active=key;Object.entries(stages).forEach(([k,n])=>n.hidden=k!==key);navState(stepnav,key);const i=names.findIndex(x=>x[0]===key);back.disabled=i===0;next.hidden=i===3;progress.textContent='Step '+(i+1)+' of 4';}
    show(active);reveal=show;grid.append(rail,work);host.append(grid);
  }
  if(kind==='board'){
    host.append(make('h1','layout-title','Conversion board'),make('p','layout-intro','Keep intake, inspection and delivery in view together. Open the report canvas when you need the full table.'));
    const toolbar=make('div','board-case');toolbar.append(casebox);host.append(toolbar);
    const grid=make('div','board-grid');const a=make('section','board-column'),b=make('section','board-column'),c=make('section','board-column');
    a.append(make('h2','board-title','Intake'),source);b.append(make('h2','board-title','Inspect'),reports,totals);c.append(make('h2','board-title','Deliver'),mapping,checks,delivery);grid.append(a,b,c);host.append(grid);
    const canvas=make('section','board-canvas');canvas.append(make('h2','layout-title','Report canvas'),preview);host.append(canvas);$('#dpcReportList').addEventListener('click',()=>canvas.scrollIntoView({behavior:'smooth',block:'start'}));reveal=()=>c.scrollIntoView({block:'start'});
  }
  if(kind==='focus'){
    const toolbar=make('nav','focus-toolbar');toolbar.setAttribute('aria-label','Workspace tools');
    const drawer=make('aside','focus-drawer'),drawerTitle=make('h2'),close=button('Close panel',()=>hideDrawer());const drawerHead=make('div','drawer-head');drawerHead.append(drawerTitle,close);drawer.append(drawerHead);drawer.hidden=true;drawer.setAttribute('aria-label','Workspace panel');
    const parts={files:make('div'),reports:make('div'),mapping:make('div'),summary:make('div')};parts.files.append(casebox,source);parts.reports.append(reports);parts.mapping.append(mapping,checks);parts.summary.append(totals);
    Object.values(parts).forEach(n=>drawer.append(n));let prior=null;
    function hideDrawer(){drawer.hidden=true;document.body.classList.remove('drawer-open');if(prior)prior.focus();}
    function openDrawer(key){prior=document.activeElement;drawer.hidden=false;document.body.classList.add('drawer-open');Object.entries(parts).forEach(([k,n])=>n.hidden=k!==key);drawerTitle.textContent=({files:'Files & case',reports:'Choose a report',mapping:'Mapping workbook',summary:'Totals & exceptions'})[key];close.focus();}
    const override=delivery.querySelector('#vpOverrideBtn');toolbar.append(button('Files & case',()=>openDrawer('files')),button('Choose report',()=>openDrawer('reports')),button('Totals & exceptions',()=>openDrawer('summary')),button('Mapping',()=>openDrawer('mapping')),delivery.querySelector('#exportWorkbookBtn'));delivery.remove();
    const exportMore=make('div','focus-export-more');exportMore.append(override);host.append(toolbar,preview,exportMore,drawer);
    $('#dpcReportList').addEventListener('click',e=>{if(e.target.closest('.list-row:not(.list-more)'))hideDrawer();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawer.hidden)hideDrawer();});reveal=key=>openDrawer(key==='export'?'files':key);openDrawer('files');
  }
  if(kind==='casebook'){
    const grid=make('div','casebook-grid'),toc=make('aside','casebook-toc'),doc=make('article','casebook-document'),right=make('aside','casebook-delivery');
    const sections=[['case','Case details',casebox],['files','Source documents',source],['summary','Reconciliation',totals],['mapping','Mapping review',checks],['reports','Report appendix',null]];
    toc.append(make('div','casebook-spine','Case file'),make('p','','Your working conversion record.'));
    doc.append(make('div','casebook-cover', 'Data conversion / Working file'),make('h1','layout-title','Conversion case file'));
    sections.forEach(([key,title,node],i)=>{const section=make('section','casebook-section');section.id='layout-'+key;const b=button(title,()=>section.scrollIntoView({behavior:'smooth',block:'start'}));toc.append(b);section.append(make('div','casebook-section-number',String(i+1).padStart(2,'0')),make('h2','casebook-section-title',title));if(node)section.append(node);else section.append(reports,preview);doc.append(section);});
    right.append(make('h2','','Delivery desk'),make('p','layout-note','Mapping and export stay beside the working file.'),mapping,delivery);grid.append(toc,doc,right);host.append(grid);reveal=key=>$('#layout-'+(key==='export'?'case':key)).scrollIntoView({block:'start'});
  }
  // Reveal the owning view before the unchanged export guard scrolls to an error.
  window.addEventListener('click',e=>{if(!e.target.closest('#exportWorkbookBtn'))return;if(!$('#vpHold').hidden){reveal('mapping');return;}if(!$('#caseNumberInput').value||!$('#planNameInput').value)reveal('files');},true);
  // A file remains in the parser's original controls; no parser state is copied.
  document.body.classList.add('layout-ready');
})();
