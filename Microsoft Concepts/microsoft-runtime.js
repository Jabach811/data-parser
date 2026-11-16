(function(){
  'use strict';
  const kind=document.body.dataset.concept;
  const $=s=>document.querySelector(s);
  const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text)n.textContent=text;return n;};
  const paths={
    files:'M3 7h7l2 2h9v11H3z M3 7V4h7l2 3',
    reports:'M4 4h16v16H4z M4 9h16 M9 9v11 M4 14h16',
    case:'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7',
    mapping:'M4 5h6v5H4z M14 14h6v5h-6z M7 10v7h7 M10 7h7v7',
    summary:'M4 20V10h4v10 M10 20V4h4v16 M16 20v-7h4v7',
    export:'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
    home:'m3 11 9-8 9 8 M5 9v12h5v-7h4v7h5V9',
    close:'m6 6 12 12 M18 6 6 18',
    check:'m5 12 4 4L19 6',
    panel:'M3 4h18v16H3z M15 4v16',
    chevron:'m9 5 7 7-7 7'
  };
  function icon(key){const n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.setAttribute('viewBox','0 0 24 24');n.setAttribute('aria-hidden','true');n.setAttribute('fill','none');n.setAttribute('stroke','currentColor');n.setAttribute('stroke-width','1.6');n.setAttribute('stroke-linecap','round');n.setAttribute('stroke-linejoin','round');const p=document.createElementNS(n.namespaceURI,'path');p.setAttribute('d',paths[key]||paths.reports);n.append(p);return n;}
  function button(label,fn,cls='ms-button',glyph){const n=make('button',cls);n.type='button';if(glyph)n.append(icon(glyph));n.append(make('span','',label));n.addEventListener('click',fn);return n;}
  function block(label,cls){const n=make('section','ms-block '+cls);n.append(make('h2','ms-block-title',label));return n;}
  const cols=document.querySelectorAll('.top>.col');
  const caseInput=$('#caseNumberInput'),planInput=$('#planNameInput'),loadingBox=$('#loadingBox'),tableCard=$('#dpcTableCard');
  const source=block('Source files','ms-source'),casebox=block('Case details','ms-case'),reports=block('Reports','ms-reports'),mapping=block('Mapping workbook','ms-mapping'),delivery=block('Export workbook','ms-delivery');
  source.append(cols[0].querySelector('.col-grow'),$('#loadingBox'),$('#errorText'),$('#pendingFilesPanel'));
  casebox.append(cols[0].querySelector('.fields'),$('#caseNumberMessage'));
  reports.append(cols[1].querySelector('.col-grow'));
  reports.querySelector('.list-head>span:first-child').textContent='Report';
  reports.querySelector('.list-head>span:last-child').textContent='Rows';
  mapping.append($('#mappingFileInput'),$('#mappingImportBtn'),$('#dpcMappingFileState'));
  const exportButton=$('#exportWorkbookBtn'),override=$('#vpOverrideBtn');
  delivery.append(make('p','ms-note','Choose a conversion type, review the workbook sheets, then export.'),exportButton,override);
  const totals=$('#dpcTotals'),checks=$('#dpcMapping'),preview=$('.bottom'),tabs=$('#dpcTabs');
  [totals,checks,preview].forEach(n=>n.remove());
  const summaryDetails=totals.querySelector('details');if(summaryDetails)summaryDetails.open=kind==='insights';
  preview.classList.add('ms-preview');
  let route=()=>{};
  const previewEmpty=make('div','ms-empty-workspace');previewEmpty.append(icon('reports'),make('h2','','Your data, ready to review'),make('p','','Add vendor files to open your reports in this workspace.'),button('Add source files',()=>route('files'),'ms-button ms-primary','files'));preview.prepend(previewEmpty);
  const updateEmpty=()=>{previewEmpty.hidden=!tableCard.hidden;};
  new MutationObserver(updateEmpty).observe(tableCard,{attributes:true,attributeFilter:['hidden']});updateEmpty();
  const host=make('main','ms-shell');host.id='ms-main';host.tabIndex=-1;$('.console').replaceChildren(host);
  const skip=make('a','ms-skip','Skip to workspace');skip.href='#ms-main';document.body.prepend(skip);
  $('.app-wordmark p').textContent=({workbook:'Workbook Studio',inbox:'Review Inbox',teams:'Team Workspace',desktop:'Fluent Desktop',insights:'Insights Desk'})[kind];
  const context=make('span','ms-header-context','New conversion');$('.masthead').insertBefore(context,$('#settingsBtn'));
  function updateCase(){const val=caseInput.value.trim();context.textContent=val||'New conversion';document.querySelectorAll('[data-case-title]').forEach(n=>n.textContent=planInput.value.trim()||'Conversion workspace');}
  document.addEventListener('input',updateCase);document.addEventListener('change',updateCase);new MutationObserver(updateCase).observe(loadingBox,{attributes:true,attributeFilter:['data-loading-state']});updateCase();
  function nav(items,action,cls){const n=make('nav',cls);n.setAttribute('aria-label','Workspace navigation');for(const [key,label,glyph]of items){const b=button(label,()=>action(key),'ms-nav-button',glyph||key);b.dataset.msTarget=key;b.setAttribute('aria-pressed','false');n.append(b);}return n;}
  function state(n,key){n.querySelectorAll('[data-ms-target]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.msTarget===key)));}
  function panes(parent,keys){const result={};for(const key of keys){const pane=make('section','ms-view');pane.dataset.msView=key;parent.append(pane);result[key]=pane;}return result;}
  function show(p,key){Object.entries(p).forEach(([k,n])=>n.hidden=k!==key);document.body.dataset.currentView=key;}
  function heading(title,description){const n=make('div','ms-page-heading');n.append(make('h2','',title));if(description)n.append(make('p','',description));return n;}
  function command(label,key,glyph,cls='ms-command'){const b=button(label,()=>route(key),cls,glyph||key);b.dataset.msTarget=key;return b;}
  function blankSummary(){const n=make('div','ms-summary-empty');n.append(icon('summary'),make('h3','','Start with your source files'),make('p','','Participant counts, totals and exceptions appear here after a file is loaded.'),button('Open source files',()=>route('files'),'ms-button ms-primary','files'));const sync=()=>n.hidden=!totals.hidden;new MutationObserver(sync).observe(totals,{attributes:true,attributeFilter:['hidden']});sync();return n;}

  if(kind==='workbook'){
    const ribbon=make('div','excel-ribbon'),ribbonBody=make('div','excel-ribbon-body'),groups=make('div','excel-ribbon-commands');
    const home=make('div','excel-command-group'),data=make('div','excel-command-group'),review=make('div','excel-command-group');
    home.append(command('Get data','files','files','ms-ribbon-command'),command('Reports','reports','reports','ms-ribbon-command'));data.append(command('Source files','files','files','ms-ribbon-command'),command('Mapping','mapping','mapping','ms-ribbon-command'));review.append(command('Parse summary','summary','summary','ms-ribbon-command'),command('Mapping checks','mapping','check','ms-ribbon-command'));groups.append(home,data,review);
    const ribbonTabs=nav([['home','Home','home'],['data','Data','reports'],['review','Review','check']],key=>{home.hidden=key!=='home';data.hidden=key!=='data';review.hidden=key!=='review';state(ribbonTabs,key);},'excel-ribbon-tabs');data.hidden=true;review.hidden=true;state(ribbonTabs,'home');
    const exportGroup=make('div','excel-export-group');exportGroup.append(exportButton,override,make('span','ms-group-label','Workbook'));ribbonBody.append(groups,casebox,exportGroup);ribbon.append(ribbonTabs,ribbonBody);
    const grid=make('div','excel-workarea'),canvas=make('div','excel-canvas'),formula=make('div','excel-formula');formula.append(make('span','excel-namebox','Report preview'),make('span','excel-fx','fx'),make('span','excel-formula-text','Select a report tab to inspect the parsed records.'));canvas.append(formula,preview);
    tableCard.append(tabs); // Existing report tabs become worksheet tabs.
    const task=make('aside','excel-taskpane'),taskHead=make('div','ms-pane-heading'),taskTitle=make('h2','','Source files'),close=button('Hide pane',()=>{task.hidden=true;grid.classList.add('pane-closed');ribbonTabs.querySelector('[aria-pressed=true]').focus();},'ms-icon-button','close');taskHead.append(taskTitle,close);
    const taskNav=nav([['files','Files'],['reports','Reports'],['mapping','Mapping'],['summary','Summary']],key=>route(key),'ms-mini-tabs');task.append(taskHead,taskNav);const p=panes(task,['files','reports','mapping','summary']);p.files.append(source);p.reports.append(reports);p.mapping.append(mapping,checks);p.summary.append(blankSummary(),totals);
    route=key=>{if(key==='case'){casebox.scrollIntoView({block:'nearest'});$('#caseNumberInput').focus();return;}task.hidden=false;grid.classList.remove('pane-closed');const chosen=key==='export'?'files':key;show(p,chosen);state(taskNav,chosen);taskTitle.textContent=({files:'Source files',reports:'Workbook reports',mapping:'Mapping review',summary:'Parse summary'})[chosen];};
    grid.append(canvas,task);host.append(ribbon,grid);route('files');
  }

  if(kind==='inbox'){
    const commands=make('div','outlook-commandbar');commands.append(command('Add source files','files'),command('Case details','case'),command('Mapping review','mapping'),exportButton,override);
    const grid=make('div','outlook-grid'),folders=make('aside','outlook-folders'),list=make('aside','outlook-list'),reading=make('div','outlook-reading');
    folders.append(make('h2','','This conversion'));const foldersNav=nav([['reports','All reports'],['files','Source files'],['case','Case details'],['mapping','Mapping review'],['summary','Parse summary']],key=>route(key),'outlook-folder-nav');folders.append(foldersNav);
    const folderNote=make('div','outlook-folder-note');folderNote.append(icon('case'),make('strong','','Your working case'),make('p','','Files, reports and checks in one place.'));folders.append(folderNote);
    list.append(reports);const p=panes(reading,['reports','files','case','mapping','summary']);const readingHead=heading('Report review');readingHead.querySelector('h2').dataset.caseTitle='';p.reports.append(readingHead,preview);p.files.append(heading('Source files','Add or replace the vendor documents for this case.'),source);p.case.append(heading('Case details','These details appear in your workbook export.'),casebox);p.mapping.append(heading('Mapping review'),mapping,checks);p.summary.append(heading('Parse summary'),blankSummary(),totals);
    route=key=>{show(p,key==='export'?'case':key);state(foldersNav,key);};grid.append(folders,list,reading);host.append(commands,grid);route('reports');
  }

  if(kind==='teams'){
    const shell=make('div','teams-grid'),rail=nav([['summary','Workspace','home'],['files','Files','files'],['reports','Reports','reports'],['mapping','Checks','check']],key=>route(key),'teams-apprail');
    const channels=make('aside','teams-channels'),channelTitle=make('div','teams-channel-title');channelTitle.append(make('span','teams-workspace-tile','D'),make('div','','Conversion workspace'));channels.append(channelTitle,make('h2','teams-channel-label','Case reports'),reports);
    const work=make('div','teams-work'),top=make('div','teams-work-heading'),title=make('h2','','Conversion workspace');title.dataset.caseTitle='';top.append(title,exportButton,override);
    const tabsNav=nav([['summary','Overview','home'],['files','Files','files'],['reports','Reports','reports'],['mapping','Mapping','mapping']],key=>route(key),'teams-tabs');const content=make('div','teams-content'),p=panes(content,['summary','files','reports','mapping']);p.summary.append(heading('Case overview','The details and reconciliation for this conversion.'),casebox,blankSummary(),totals);p.files.append(heading('Source files'),source);p.reports.append(preview);p.mapping.append(heading('Mapping review'),mapping,checks);
    route=key=>{if(key==='case'||key==='export')key='summary';show(p,key);state(tabsNav,key);state(rail,key);};work.append(top,tabsNav,content);shell.append(rail,channels,work);host.append(shell);route('summary');
  }

  if(kind==='desktop'){
    const shell=make('div','windows-grid'),sidebar=make('aside','windows-nav'),profile=make('div','windows-profile');profile.append(make('span','windows-app-tile','D'),make('div','windows-profile-copy'));profile.lastChild.append(make('strong','','Data Parser'),make('span','','Your conversion workspace'));sidebar.append(profile);
    const menu=nav([['home','Home'],['files','Source files'],['reports','Reports'],['mapping','Mapping'],['summary','Reconciliation'],['export','Export workbook']],key=>route(key),'windows-menu');sidebar.append(menu);
    const work=make('div','windows-content'),p=panes(work,['home','files','reports','mapping','summary','export']);
    p.home.append(heading('Home','Everything you need for your next conversion.'));const shortcuts=make('div','windows-shortcuts');for(const [key,label,desc]of [['files','Open vendor files','Detect and parse your source'],['reports','Review reports','Inspect the parsed records'],['mapping','Check mapping','Review source and fund codes']]){const b=button(label,()=>route(key),'windows-shortcut',key);b.dataset.msTarget=key;b.append(make('small','',desc),icon('chevron'));shortcuts.append(b);}p.home.append(shortcuts,casebox);
    const homeNote=make('div','windows-home-note');homeNote.append(icon('export'),make('div','','Ready to create your workbook?'),command('Go to export','export'));p.home.append(homeNote);
    p.files.append(heading('Source files','Add the documents for this conversion.'),source);const reportsGrid=make('div','windows-report-grid');reportsGrid.append(reports,preview);p.reports.append(heading('Reports'),reportsGrid);p.mapping.append(heading('Mapping','Check the workbook before you export.'),mapping,checks);p.summary.append(heading('Reconciliation'),blankSummary(),totals);p.export.append(heading('Export workbook','Review your conversion type and workbook sheets before downloading.'),delivery);
    route=key=>{if(key==='case')key='home';show(p,key);state(menu,key);work.scrollTop=0;};shell.append(sidebar,work);host.append(shell);route('home');
  }

  if(kind==='insights'){
    const commands=make('div','bi-commandbar');commands.append(command('Get data','files','files'),command('Case details','case','case'),command('Mapping workbook','mapping','mapping'),exportButton,override);
    const shell=make('div','bi-grid'),rail=nav([['summary','Overview','summary'],['reports','Data','reports'],['mapping','Mapping','mapping']],key=>route(key),'bi-rail'),canvas=make('div','bi-canvas'),pane=make('aside','bi-pane');
    const p=panes(canvas,['summary','reports','mapping']);const overviewHead=heading('Conversion overview','A closer look at your parsed data.');overviewHead.querySelector('h2').dataset.caseTitle='';p.summary.append(overviewHead,blankSummary(),totals);p.reports.append(preview);p.mapping.append(heading('Mapping checks'),checks);
    tableCard.append(tabs);
    const paneHead=make('div','ms-pane-heading');paneHead.append(make('h2','','Data & properties'));pane.append(paneHead);const paneNav=nav([['reports','Reports'],['files','Files'],['mapping','Mapping'],['case','Case']],key=>openPane(key),'ms-mini-tabs');pane.append(paneNav);const side=panes(pane,['reports','files','mapping','case']);side.reports.append(reports);side.files.append(source);side.mapping.append(mapping);side.case.append(casebox);
    function openPane(key){show(side,key);state(paneNav,key);}
    route=key=>{if(['files','case'].includes(key)){openPane(key);return;}if(key==='export'){openPane('case');return;}show(p,key);state(rail,key);openPane(key==='mapping'?'mapping':'reports');};
    shell.append(rail,canvas,pane);host.append(commands,shell);route('summary');openPane('files');
  }

  if(kind==='inbox'||kind==='teams'){
    const search=$('.report-search');search.classList.add('ms-global-search');$('.masthead').insertBefore(search,context);
  }
  $('#dpcReportList').addEventListener('click',e=>{if(e.target.closest('button[data-code]'))route('reports');});
  $('#dpcReportSearch').addEventListener('input',()=>route('reports'));
  // Reveal the correct page before the original export guard focuses its control.
  window.addEventListener('click',e=>{if(!e.target.closest('#exportWorkbookBtn'))return;if(!$('#vpHold').hidden){route('mapping');return;}if(!$('#caseNumberInput').value||!$('#planNameInput').value)route('case');},true);
  updateCase();document.body.classList.add('ms-ready');
})();
