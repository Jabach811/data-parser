/* Workbook Studio appearance preferences. Replaces only the original settings scripts. */
(function(){
  'use strict';
  const body=document.body,key='dpc-settings';
  const palettes={green:'Green',blue:'Blue',indigo:'Indigo',teal:'Teal',plum:'Plum',graphite:'Graphite'};
  const sizes={standard:'Standard',large:'Large','extra-large':'Extra large'};
  const legacy={navy:'blue',slate:'graphite',charcoal:'graphite','ta-night':'indigo','ta-forest':'green'};
  const defaults={palette:'green',mode:'light',density:'roomy',textSize:'standard'};
  let saved={};
  try{const value=JSON.parse(localStorage.getItem(key));if(value&&typeof value==='object'&&!Array.isArray(value))saved=value;}catch(error){}
  const palette=legacy[saved.palette]||saved.palette;
  let settings={palette:Object.hasOwn(palettes,palette)?palette:defaults.palette,mode:saved.mode==='dark'?'dark':'light',density:saved.density==='compact'?'compact':'roomy',textSize:Object.hasOwn(sizes,saved.textSize)?saved.textSize:'standard'};
  let panel,toggle,status;
  function apply(){
    for(const name of [...body.classList])if(name.startsWith('pal-'))body.classList.remove(name);
    body.classList.add('pal-'+settings.palette);
    body.classList.toggle('mode-dark',settings.mode==='dark');
    body.classList.toggle('density-compact',settings.density==='compact');
    body.dataset.textSize=settings.textSize;
    document.documentElement.style.colorScheme=settings.mode;
    const themeColor=document.querySelector('meta[name="theme-color"]');
    if(themeColor)themeColor.content=settings.mode==='dark'?'#202020':'#f5f5f5';
    if(panel)for(const [dataKey,value]of Object.entries(settings)){
      const attribute='data-'+dataKey.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase());
      panel.querySelectorAll('['+attribute+']').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset[dataKey]===value)));
    }
  }
  function save(message){
    try{localStorage.setItem(key,JSON.stringify(settings));if(status)status.textContent=message||'Saved in this browser.';}
    catch(error){if(status)status.textContent='Applied for this session. Browser storage is unavailable.';}
  }
  apply();
  function init(){
    panel=document.getElementById('settingsPanel');toggle=document.getElementById('settingsBtn');
    if(!panel||!toggle)return;
    panel.classList.add('ws-settings');panel.setAttribute('aria-labelledby','ws-settings-title');
    panel.removeAttribute('aria-label');toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-label','Appearance settings');
    panel.innerHTML=`
      <div class="ws-settings-heading">
        <div><h2 id="ws-settings-title">Appearance</h2><p>Make yourself comfortable.</p></div>
        <button type="button" class="ws-settings-close" aria-label="Close settings" title="Close settings"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
      </div>
      <fieldset class="ws-settings-section"><legend>App color</legend><div class="ws-palette-grid">
        ${Object.entries(palettes).map(([value,label])=>`<button type="button" class="ws-palette" data-palette="${value}" aria-pressed="false"><span class="ws-palette-preview" aria-hidden="true"><span class="ws-palette-check"><svg viewBox="0 0 16 16" focusable="false"><path d="m4 8 2.5 2.5L12 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span><span>${label}</span></button>`).join('')}
      </div></fieldset>
      <fieldset class="ws-settings-section"><legend>Light or dark</legend><div class="ws-choice-row"><button type="button" data-mode="light">Light</button><button type="button" data-mode="dark">Dark</button></div></fieldset>
      <fieldset class="ws-settings-section"><legend>Text size</legend><div class="ws-choice-row ws-text-choices">${Object.entries(sizes).map(([value,label])=>`<button type="button" data-text-size="${value}">${label}</button>`).join('')}</div><p class="ws-settings-hint">Applies to menus, labels, and report tables.</p></fieldset>
      <fieldset class="ws-settings-section"><legend>Spacing</legend><div class="ws-choice-row"><button type="button" data-density="roomy">Comfortable</button><button type="button" data-density="compact">Compact</button></div></fieldset>
      <div class="ws-settings-footer"><span id="ws-preference-status" role="status" aria-live="polite"></span><button type="button" class="ws-reset-appearance">Reset appearance</button></div>`;
    status=document.getElementById('ws-preference-status');
    function close(restoreFocus=false){panel.hidden=true;toggle.setAttribute('aria-expanded','false');if(restoreFocus)toggle.focus();}
    toggle.addEventListener('click',()=>{
      const open=panel.hidden;panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
      if(open)panel.querySelector('[data-palette][aria-pressed="true"]').focus();
    });
    panel.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button||!panel.contains(button))return;
      if(button.classList.contains('ws-settings-close')){close(true);return;}
      if(button.classList.contains('ws-reset-appearance')){settings={...defaults};apply();save('Default appearance restored.');return;}
      let message='';
      if(Object.hasOwn(palettes,button.dataset.palette)){settings.palette=button.dataset.palette;message=palettes[settings.palette]+' color saved.';}
      else if(['light','dark'].includes(button.dataset.mode)){settings.mode=button.dataset.mode;message=button.textContent+' appearance saved.';}
      else if(Object.hasOwn(sizes,button.dataset.textSize)){settings.textSize=button.dataset.textSize;message=sizes[settings.textSize]+' text saved.';}
      else if(['roomy','compact'].includes(button.dataset.density)){settings.density=button.dataset.density;message=button.textContent+' spacing saved.';}
      else return;
      apply();save(message);
    });
    document.addEventListener('click',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!toggle.contains(event.target))close();});
    document.addEventListener('focusin',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!toggle.contains(event.target))close();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();close(true);}});
    apply();save();
    body.dataset.appearanceReady='true';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
