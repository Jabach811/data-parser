(function(){
  'use strict';
  if(document.body.dataset.concept!=='workbook')return;
  const $=selector=>document.querySelector(selector);
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
  // The builder embeds the locally stored Fluent SVGs; no icon network requests.
  const symbols=/* WORKBOOK_ICON_ASSETS */{};
  let iconInstance=0;
  function icon(key){
    const asset=symbols[key],prefix='ws-icon-'+(++iconInstance)+'-';
    const template=document.createElement('template');
    // Each instance owns its gradients, including copies in hidden ribbon tabs.
    template.innerHTML=asset.svg.replace(/id="([^"]+)"/g,(_,id)=>'id="'+prefix+id+'"').replace(/url\(#([^)]+)\)/g,(_,id)=>'url(#'+prefix+id+')');
    const n=template.content.firstElementChild;
    n.setAttribute('class','ws-icon ws-icon--'+asset.style);
    n.setAttribute('aria-hidden','true');n.setAttribute('focusable','false');
    n.removeAttribute('width');n.removeAttribute('height');
    return n;
  }
  function button(label,glyph,run,cls='ws-command'){const n=make('button',cls);n.type='button';n.title=label;n.append(icon(glyph),make('span','',label));n.addEventListener('click',run);return n;}
  const ribbon=$('.excel-ribbon'),casebox=$('.excel-ribbon .ms-case'),exportButton=$('#exportWorkbookBtn'),override=$('#vpOverrideBtn');
  const task=$('.excel-taskpane'),grid=$('.excel-workarea'),taskNav=task.querySelector('.ms-mini-tabs');
  const fileInput=$('#fileInput'),mappingInput=$('#mappingFileInput'),fileCard=$('#dpcFileCard'),loadingBox=$('#loadingBox');
  const replaceOriginal=$('#dpcReplace'),newCaseOriginal=$('#dpcNewCase');
  const reportControls=[];
  $('#settingsBtn svg').replaceWith(icon('settings'));
  function openPane(key){taskNav.querySelector('[data-ms-target="'+key+'"]').click();}
  function navCommand(label,glyph,key,large=false){const n=button(label,glyph,()=>openPane(key),'ws-command'+(large?' ws-large':''));n.dataset.msTarget=key;return n;}
  function group(label,...controls){const n=make('div','ws-group');n.setAttribute('role','group');n.setAttribute('aria-label',label);const controlsRow=make('div','ws-group-controls');controlsRow.append(...controls);n.append(controlsRow,make('span','ws-group-label',label));return n;}
  function stack(...controls){const n=make('div','ws-command-stack');n.append(...controls);return n;}
  function addFiles(){return button('Add files','add',()=>{openPane('files');fileInput.click();},'ws-command ws-large');}
  function uploadMapping(){return button('Upload mapping','upload',()=>{openPane('mapping');mappingInput.click();},'ws-command ws-large');}
  function activeReportAction(selector){const n=$('#reportOutputs .report-card.is-active '+selector);if(n)n.click();}
  function reportButtons(){const all=button('Show all rows','rows',()=>activeReportAction('.report-toggle'));const download=button('Download report','download',()=>activeReportAction('.report-download'));reportControls.push({all,download});return stack(all,download);}

  // The existing case fields and export buttons move; their event handlers remain attached.
  casebox.classList.add('ws-casebar');
  const fields=casebox.querySelectorAll('.fields .eyebrow');fields[0].textContent='Case';fields[1].textContent='Plan';
  $('#caseNumberInput').setAttribute('aria-describedby','caseNumberMessage');
  $('.excel-formula').replaceWith(casebox);
  exportButton.prepend(icon('download'));exportButton.classList.add('ws-export');
  const row=make('div','ws-ribbon-top'),tabList=make('div','ws-ribbon-tabs'),actions=make('div','ws-ribbon-actions'),panels=make('div','ws-ribbon-panels');
  tabList.setAttribute('role','tablist');tabList.setAttribute('aria-label','Ribbon');panels.id='ws-ribbon-panels';
  const paneToggle=button('Task pane','pane',()=>{if(task.hidden)openPane(document.body.dataset.currentView||'reports');else{task.hidden=true;grid.classList.add('pane-closed');}},'ws-toolbar-button');paneToggle.id='ws-pane-toggle';task.id='ws-task-pane';paneToggle.setAttribute('aria-controls',task.id);
  const collapse=button('Collapse ribbon','collapse',()=>setCollapsed(!panels.hidden),'ws-toolbar-button ws-icon-only');collapse.id='ws-collapse-ribbon';collapse.setAttribute('aria-controls',panels.id);
  function setCollapsed(value){panels.hidden=value;collapse.setAttribute('aria-expanded',String(!value));const label=value?'Expand ribbon':'Collapse ribbon';collapse.title=label;collapse.setAttribute('aria-label',label);collapse.querySelector('span').textContent=label;collapse.querySelector('svg').replaceWith(icon(value?'expand':'collapse'));}
  actions.append(paneToggle,exportButton,collapse);row.append(tabList,actions);
  const sections={},tabs=[];
  for(const [key,label]of [['home','Home'],['data','Data'],['review','Review']]){
    const tab=make('button','ws-ribbon-tab',label);tab.type='button';tab.id='ws-tab-'+key;tab.dataset.wsTab=key;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','ws-panel-'+key);tab.addEventListener('click',()=>selectTab(key,true));tabList.append(tab);tabs.push(tab);
    const panel=make('div','ws-ribbon-panel');panel.id='ws-panel-'+key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);sections[key]=panel;panels.append(panel);
  }
  function selectTab(key,expand){for(const tab of tabs){const active=tab.dataset.wsTab===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;sections[tab.dataset.wsTab].hidden=!active;}if(expand)setCollapsed(false);}
  tabList.addEventListener('keydown',event=>{const current=tabs.indexOf(document.activeElement);if(current<0)return;let next=current;if(event.key==='ArrowRight')next=(current+1)%tabs.length;else if(event.key==='ArrowLeft')next=(current+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();selectTab(tabs[next].dataset.wsTab,true);tabs[next].focus();});
  sections.home.append(
    group('Files',addFiles(),stack(navCommand('Source files','files','files'))),
    group('Reports',navCommand('Browse reports','reports','reports',true),stack(navCommand('Parse summary','summary','summary'))),
    group('Mapping',uploadMapping(),stack(navCommand('Mapping checks','check','mapping'))),
    group('Current report',reportButtons())
  );
  const replace=button('Replace files','replace',()=>replaceOriginal.click()),newCase=button('New case','newcase',()=>newCaseOriginal.click());
  sections.data.append(
    group('Source files',addFiles(),stack(navCommand('View files','files','files'),replace)),
    group('Case',newCase),
    group('Mapping workbook',uploadMapping(),stack(navCommand('Mapping checks','check','mapping')))
  );
  sections.review.append(
    group('Reconciliation',navCommand('Parse summary','summary','summary',true),navCommand('Mapping checks','check','mapping',true)),
    group('Reports',navCommand('Browse reports','reports','reports',true),reportButtons())
  );
  ribbon.replaceChildren(row,panels);task.prepend(override);override.classList.add('ws-override');
  task.querySelector('.ms-icon-button').addEventListener('click',()=>paneToggle.focus());
  const syncPane=()=>{paneToggle.setAttribute('aria-expanded',String(!task.hidden));paneToggle.title=task.hidden?'Show task pane':'Hide task pane';};
  new MutationObserver(syncPane).observe(task,{attributes:true,attributeFilter:['hidden']});syncPane();
  function syncControls(){
    const report=$('#reportOutputs .report-card.is-active'),toggle=report&&report.querySelector('.report-toggle'),download=report&&report.querySelector('.report-download');
    replace.disabled=fileCard.hidden;newCase.disabled=fileCard.hidden;
    for(const controls of reportControls){
      controls.all.disabled=!toggle;controls.download.disabled=!download;
      const label=toggle&&/less/i.test(toggle.textContent)?'Show fewer rows':'Show all rows';
      if(controls.all.querySelector('span').textContent!==label){controls.all.querySelector('span').textContent=label;controls.all.title=label;}
    }
  }
  const controlObserver=new MutationObserver(syncControls);
  controlObserver.observe($('#reportOutputs'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  controlObserver.observe(fileCard,{attributes:true,attributeFilter:['hidden']});
  controlObserver.observe(loadingBox,{attributes:true,attributeFilter:['data-loading-state']});
  selectTab('home',false);setCollapsed(false);syncControls();document.body.classList.add('studio-ribbon');
})();
