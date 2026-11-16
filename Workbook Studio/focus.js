(function(){
  'use strict';
  if(document.body.dataset.concept!=='workbook')return;
  const $=selector=>document.querySelector(selector);
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
  const symbols=/* WORKBOOK_ICON_ASSETS */{};
  let iconInstance=0;
  function icon(key){
    const asset=symbols[key],prefix='ws-icon-'+(++iconInstance)+'-';
    const template=document.createElement('template');
    template.innerHTML=asset.svg.replace(/id="([^"]+)"/g,(_,id)=>'id="'+prefix+id+'"').replace(/url\(#([^)]+)\)/g,(_,id)=>'url(#'+prefix+id+')');
    const n=template.content.firstElementChild;
    n.setAttribute('class','ws-icon ws-icon--'+asset.style);
    n.setAttribute('aria-hidden','true');n.setAttribute('focusable','false');
    n.removeAttribute('width');n.removeAttribute('height');
    return n;
  }
  function button(label,glyph,run){const n=make('button','ws-toolbar-button');n.type='button';n.title=label;n.append(icon(glyph),make('span','',label));n.addEventListener('click',run);return n;}
  const ribbon=$('.excel-ribbon'),casebox=$('.excel-ribbon .ms-case'),exportButton=$('#exportWorkbookBtn'),override=$('#vpOverrideBtn');
  const task=$('.excel-taskpane'),grid=$('.excel-workarea'),taskNav=task.querySelector('.ms-mini-tabs');
  const fileInput=$('#fileInput'),mappingInput=$('#mappingFileInput'),fileCard=$('#dpcFileCard');
  const replaceOriginal=$('#dpcReplace'),newCaseOriginal=$('#dpcNewCase'),caseInput=$('#caseNumberInput'),planInput=$('#planNameInput');
  const reportOutputs=$('#reportOutputs'),tabsHost=$('#dpcTabs'),totalsHome=$('#dpcTotals'),discard=$('#discardCountText');
  $('#settingsBtn svg').replaceWith(icon('settings'));
  function openPane(key){taskNav.querySelector('[data-ms-target="'+key+'"]').click();}

  // Files are gone after any reload, so a remembered case only belongs on the page after Replace files.
  try{
    replaceOriginal.addEventListener('click',()=>sessionStorage.setItem('ws-keep-case','1'),true);
    if(sessionStorage.getItem('ws-keep-case'))sessionStorage.removeItem('ws-keep-case');
    else{for(const input of [caseInput,planInput])if(input.value){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}sessionStorage.removeItem('dpc-job-v1');}
  }catch(e){}

  casebox.classList.add('ws-casebar');
  const fields=casebox.querySelectorAll('.fields .eyebrow');fields[0].textContent='Case';fields[1].textContent='Plan';
  caseInput.setAttribute('aria-describedby','caseNumberMessage');
  $('.excel-formula').replaceWith(casebox);
  const totals=make('div','ws-totals');totals.append(...totalsHome.querySelectorAll('.summary-card'));casebox.append(totals);
  function syncTotals(){totals.hidden=totalsHome.hidden;totals.lastElementChild.classList.toggle('is-alert',parseInt(discard.textContent.replace(/,/g,''),10)>0);}
  new MutationObserver(syncTotals).observe(discard,{childList:true,characterData:true,subtree:true});
  new MutationObserver(syncTotals).observe(totalsHome,{attributes:true,attributeFilter:['hidden']});
  syncTotals();

  exportButton.prepend(icon('download'));exportButton.classList.add('ws-export');
  const row=make('div','ws-ribbon-top'),commands=make('div','ws-ribbon-actions'),actions=make('div','ws-ribbon-actions');
  commands.setAttribute('role','toolbar');commands.setAttribute('aria-label','Case commands');
  const replace=button('Replace files','replace',()=>replaceOriginal.click()),newCase=button('New case','newcase',()=>newCaseOriginal.click());
  commands.append(
    button('Add files','add',()=>{openPane('files');fileInput.click();}),
    button('Upload mapping','upload',()=>{openPane('mapping');mappingInput.click();}),
    replace,newCase
  );
  const paneToggle=button('Task pane','pane',()=>{if(task.hidden)openPane(document.body.dataset.currentView||'reports');else{task.hidden=true;grid.classList.add('pane-closed');}});
  paneToggle.id='ws-pane-toggle';task.id='ws-task-pane';paneToggle.setAttribute('aria-controls',task.id);
  actions.append(paneToggle,exportButton);row.append(commands,actions);
  ribbon.replaceChildren(row);task.prepend(override);override.classList.add('ws-override');
  task.querySelector('.ms-icon-button').addEventListener('click',()=>paneToggle.focus());
  const syncPane=()=>{paneToggle.setAttribute('aria-expanded',String(!task.hidden));paneToggle.title=task.hidden?'Show task pane':'Hide task pane';};
  new MutationObserver(syncPane).observe(task,{attributes:true,attributeFilter:['hidden']});syncPane();
  const syncFiles=()=>{replace.disabled=fileCard.hidden;newCase.disabled=fileCard.hidden;};
  new MutationObserver(syncFiles).observe(fileCard,{attributes:true,attributeFilter:['hidden']});syncFiles();

  new MutationObserver(()=>tabsHost.querySelectorAll('.tab').forEach(tab=>{tab.title=tab.textContent;tab.textContent=tab.textContent.replace(/\s*\(.*\)\s*$/,'');})).observe(tabsHost,{childList:true});

  // The export is built from the parsed data, so hiding these cells changes only the screen.
  function hideBlankColumns(){
    for(const table of reportOutputs.querySelectorAll('table')){
      const rows=[...table.tBodies[0].rows],cols=table.querySelectorAll('col');
      [...table.tHead.rows[0].cells].forEach((head,i)=>{
        if(head.classList.contains('ws-blank')||!/^(filler|reserved)$/i.test(head.textContent.trim()))return;
        if(rows.some(tr=>tr.cells[i]&&tr.cells[i].textContent.trim()))return;
        head.classList.add('ws-blank');cols[i].classList.add('ws-blank');
        rows.forEach(tr=>{if(tr.cells[i])tr.cells[i].classList.add('ws-blank');});
        table.style.width=(parseFloat(table.style.width)-parseFloat(cols[i].style.width))+'ch';
      });
    }
  }
  new MutationObserver(hideBlankColumns).observe(reportOutputs,{childList:true,subtree:true});

  const labelSkip=()=>{const skip=$('#dpcConvDialog [data-cv="skip"]');if(skip)skip.textContent='Continue without a type';};
  const dialogWatch=new MutationObserver(()=>{const dialog=$('#dpcConvDialog');if(!dialog)return;dialogWatch.disconnect();new MutationObserver(labelSkip).observe(dialog,{childList:true});labelSkip();});
  dialogWatch.observe(document.body,{childList:true});

  document.body.classList.add('studio-ribbon','studio-focus');
})();
