(async function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const kind=document.body.dataset.concept;
  const skipKey='dpc-demo-skip-once-'+kind;
  const subtitle=$('.app-wordmark p');
  subtitle.textContent+=' · Demo';
  subtitle.title='This copy opens with fictional sample data.';
  document.body.dataset.demoState='starting';
  // Allow the original New case and Replace actions to open an empty workspace.
  window.addEventListener('click',event=>{
    if(event.target.closest('#dpcNewCase,#dpcReplace')){
      try{sessionStorage.setItem(skipKey,'yes');}catch(error){}
    }
  },true);
  try{
    if(sessionStorage.getItem(skipKey)==='yes'){
      sessionStorage.removeItem(skipKey);
      document.body.dataset.demoState='cleared';
      return;
    }
  }catch(error){}
  function fill(id,value){const input=$(id);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('blur',{bubbles:true}));}
  function navigate(key){const target=Array.from(document.querySelectorAll('.ms-shell button[data-ms-target="'+key+'"]')).find(button=>button.getClientRects().length);if(target)target.click();}
  try{
    fill('#caseNumberInput','QK5432167890');
    fill('#planNameInput','Northstar Demo 401(k) Plan');
    const loaded=new Promise((resolve,reject)=>{
      let timer;
      const check=()=>{
        if($('#loadingBox').dataset.loadingState==='complete'&&$('#dpcReportList button[data-code]')){
          observer.disconnect();clearTimeout(timer);resolve();
        }
      };
      const observer=new MutationObserver(check);
      observer.observe($('#loadingBox'),{attributes:true,attributeFilter:['data-loading-state']});
      observer.observe($('#dpcReportList'),{childList:true});
      timer=setTimeout(()=>{observer.disconnect();reject(new Error('The sample file did not finish loading.'));},20000);
      check();
    });
    const input=$('#fileInput'),transfer=new DataTransfer();
    transfer.items.add(new File([DEMO_SAMPLE_TEXT],'FIDELITY_demo_data.txt',{type:'text/plain',lastModified:0}));
    document.body.dataset.demoState='loading';
    input.files=transfer.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
    await loaded;
    navigate('reports');
    const balance=Array.from(document.querySelectorAll('#dpcReportList button[data-code]')).find(button=>button.textContent.includes('77 - Balances'));
    if(balance)balance.click();
    if(kind==='insights')navigate('summary');
    window.scrollTo(0,0);
    document.body.dataset.demoState='ready';
  }catch(error){
    document.body.dataset.demoState='error';
    const note=document.createElement('p');note.setAttribute('role','status');note.style.cssText='margin:16px;padding:12px;border:1px solid #d1d1d1;border-radius:4px;background:var(--surface);color:var(--ink)';
    note.textContent='The demo could not load automatically. Choose the included Fidelity sample from Test Samples to try this layout.';
    $('#ms-main').prepend(note);console.error(error);
  }
})();
