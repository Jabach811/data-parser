(function(){
  'use strict';
  if(document.body.dataset.concept!=='workbook')return;
  const R=window.MergerCompareReader;
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
  const iconAsset=/* MERGER_ICON */{svg:'',style:'color'};

  let pdfLoader=null;
  function loadPdfJs(){
    if(window.pdfjsLib&&window.pdfjsLib.getDocument)return Promise.resolve(window.pdfjsLib);
    return pdfLoader||(pdfLoader=new Promise((resolve,reject)=>{
      const sources=['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js'];
      (function next(i){
        if(i>=sources.length){pdfLoader=null;reject(new Error('The PDF reader could not load. Check the internet connection and try again.'));return;}
        const s=document.createElement('script');s.src=sources[i];
        s.onload=()=>window.pdfjsLib?resolve(window.pdfjsLib):next(i+1);s.onerror=()=>next(i+1);
        document.head.appendChild(s);
      })(0);
    }));
  }

  const dialog=make('dialog','mc-dialog');dialog.setAttribute('aria-labelledby','mc-title');
  const head=make('header','mc-head'),title=make('h2','','Merger compare'),close=make('button','mc-close','Close');
  title.id='mc-title';close.type='button';close.addEventListener('click',()=>dialog.close());
  head.append(title,close);
  const drop=make('div','mc-drop'),pick=make('button','mc-primary','Choose PDF'),input=make('input');
  input.type='file';input.accept='.pdf,application/pdf';input.hidden=true;pick.type='button';
  drop.append(make('p','mc-drop-main','Drop the merger compare PDF here'),pick,make('p','mc-note','The file is read on this computer. Nothing is sent anywhere.'),input);
  const status=make('p','mc-status');status.setAttribute('role','status');
  const results=make('div','mc-results');results.hidden=true;
  dialog.append(head,drop,status,results);
  document.body.append(dialog);
  pick.addEventListener('click',()=>input.click());
  input.addEventListener('change',()=>{if(input.files[0])read(input.files[0]);input.value='';});
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('is-over');});
  drop.addEventListener('dragleave',()=>drop.classList.remove('is-over'));

  function open(){if(!dialog.open)dialog.showModal();}
  const isPdf=f=>f&&(/\.pdf$/i.test(f.name)||f.type==='application/pdf');
  // Runs before the vendor drop zones so a merger compare never lands in the case files.
  window.addEventListener('drop',e=>{
    const f=e.dataTransfer&&e.dataTransfer.files[0];
    if(!isPdf(f)||!(dialog.open||/merger\s*-?\s*compare/i.test(f.name)))return;
    e.preventDefault();e.stopImmediatePropagation();drop.classList.remove('is-over');
    open();read(f);
  },true);

  let current=null;
  async function read(file){
    current=null;results.hidden=true;status.className='mc-status';status.textContent='Reading '+file.name+'…';
    try{
      const lib=await loadPdfJs();
      const pages=await R.readPages(lib,new Uint8Array(await file.arrayBuffer()));
      current=R.parse(pages);current.checks=R.checks(current);
      status.textContent='';show(current);
    }catch(err){
      status.className='mc-status is-error';
      status.textContent='Could not read this PDF. '+(err&&err.message||'');
    }
  }

  function table(cols,rows,cls){
    const t=make('table','mc-table'+(cls?' '+cls:'')),th=t.createTHead().insertRow(),tb=t.createTBody();
    for(const c of cols)th.append(make('th','',c));
    for(const r of rows){const tr=tb.insertRow();r.forEach(v=>tr.insertCell().textContent=v);}
    return t;
  }

  function show(res){
    const plan=res.plan||'Merging plan';
    const top=make('div','mc-result-head');
    const h=make('h3','',plan);
    const dl=make('button','mc-primary','Download Excel');dl.type='button';dl.addEventListener('click',()=>download(res));
    top.append(h,dl);
    const tabs=make('div','mc-tabs'),panels=make('div','mc-panels');
    tabs.setAttribute('role','tablist');
    const report=R.report(res);
    const views=[
      ['Summary',()=>table(['Item','Row','Value'],res.fields.map(f=>[f.item,f.row,f.value]),'mc-summary')],
      ['Source mapping',()=>res.mapping.rows.length?table(R.MAP_COLS,res.mapping.rows):make('p','mc-empty','No source mapping rows were found.')],
      ['All checked items',()=>table(['Row','Row name','Under','Checked'],allChecked(res))],
      ['Check these',()=>table(['Issue','Detail'],res.checks)],
      ['Check this file',()=>{
        const box=make('div','mc-diag');
        const copy=make('button','mc-secondary','Copy report');copy.type='button';
        copy.addEventListener('click',()=>{navigator.clipboard.writeText(report).then(()=>{copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy report',1500);});});
        box.append(make('p','mc-note','This report has no plan details in it, only counts and row numbers. It is safe to send.'),copy,make('pre','',report));
        return box;
      }],
    ];
    const buttons=views.map(([label,build],i)=>{
      const b=make('button','mc-tab',label);b.type='button';b.setAttribute('role','tab');
      b.addEventListener('click',()=>{buttons.forEach(x=>x.setAttribute('aria-selected',String(x===b)));panels.replaceChildren(build());});
      return b;
    });
    tabs.append(...buttons);
    results.replaceChildren(top,tabs,panels);results.hidden=false;
    buttons[0].click();
  }

  function allChecked(res){
    const out=[];
    for(const r of res.rows)for(const e of r.entries)if(e.kind==='option'&&e.checked)out.push([String(r.num),r.name,e.under,e.text]);
    return out;
  }

  function download(res){
    const plan=res.plan||'Merging plan';
    const sheets=[
      {name:'Plan Provisions',cols:['Plan','Item','Row','Value'],widths:[22,34,7,90],rows:res.fields.map(f=>[plan,f.item,f.row,f.value])},
      {name:'Source Mapping',cols:['Plan',...R.MAP_COLS],widths:[22,26,24,16,26,24,16,12,12,14],rows:res.mapping.rows.map(r=>[plan,...r])},
      {name:'All Checked Items',cols:['Plan','Row','Row name','Under','Checked'],widths:[22,7,34,30,70],rows:allChecked(res).map(r=>[plan,...r])},
      {name:'Check These',cols:['Plan','Issue','Detail'],widths:[22,24,100],rows:res.checks.map(c=>[plan,...c])},
    ];
    const blob=new Blob([xlsx(sheets)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const a=make('a');a.href=URL.createObjectURL(blob);a.download=plan.replace(/[\\/:*?"<>|]/g,'')+' - merger compare extract.xlsx';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
  const colName=i=>{let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;};
  function xlsx(sheets){
    const files={
      '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>',
      '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>'<sheet name="'+esc(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets><definedNames>'+sheets.map((s,i)=>'<definedName name="_xlnm._FilterDatabase" localSheetId="'+i+'" hidden="1">\''+esc(s.name)+'\'!$A$1:$'+colName(s.cols.length-1)+'$'+(s.rows.length+1)+'</definedName>').join('')+'</definedNames></workbook>',
      'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      'xl/styles.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF107C41"/></patternFill></fill></fills><borders count="2"><border/><border><bottom style="thin"><color rgb="FFE0E0E0"/></bottom></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs></styleSheet>',
    };
    sheets.forEach((s,i)=>{
      const row=(vals,r,style)=>'<row r="'+r+'">'+vals.map((v,c)=>/^\d{1,9}$/.test(v)?'<c r="'+colName(c)+r+'" s="'+style+'"><v>'+v+'</v></c>':'<c r="'+colName(c)+r+'" s="'+style+'" t="inlineStr"><is><t xml:space="preserve">'+esc(v==null?'':v)+'</t></is></c>').join('')+'</row>';
      files['xl/worksheets/sheet'+(i+1)+'.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+s.widths.map((w,c)=>'<col min="'+(c+1)+'" max="'+(c+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols><sheetData>'+row(s.cols,1,1)+s.rows.map((r,j)=>row(r,j+2,2)).join('')+'</sheetData><autoFilter ref="A1:'+colName(s.cols.length-1)+(s.rows.length+1)+'"/></worksheet>';
    });
    return zip(files);
  }

  const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
  const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=crcTable[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
  function zip(files){
    const enc=new TextEncoder(),parts=[],central=[];let offset=0;
    for(const [name,text] of Object.entries(files)){
      const n=enc.encode(name),d=enc.encode(text),crc=crc32(d);
      const local=new DataView(new ArrayBuffer(30));
      local.setUint32(0,0x04034b50,true);local.setUint16(4,20,true);local.setUint16(6,0x0800,true);local.setUint32(14,crc,true);local.setUint32(18,d.length,true);local.setUint32(22,d.length,true);local.setUint16(26,n.length,true);
      const cen=new DataView(new ArrayBuffer(46));
      cen.setUint32(0,0x02014b50,true);cen.setUint16(4,20,true);cen.setUint16(6,20,true);cen.setUint16(8,0x0800,true);cen.setUint32(16,crc,true);cen.setUint32(20,d.length,true);cen.setUint32(24,d.length,true);cen.setUint16(28,n.length,true);cen.setUint32(42,offset,true);
      parts.push(local.buffer,n,d);central.push(cen.buffer,n);offset+=30+n.length+d.length;
    }
    const size=central.reduce((s,p)=>s+(p.byteLength),0),end=new DataView(new ArrayBuffer(22)),count=Object.keys(files).length;
    end.setUint32(0,0x06054b50,true);end.setUint16(8,count,true);end.setUint16(10,count,true);end.setUint32(12,size,true);end.setUint32(16,offset,true);
    return new Blob([...parts,...central,end.buffer]);
  }

  const commands=document.querySelector('.ws-ribbon-top [aria-label="Case commands"]');
  if(commands){
    const b=make('button','ws-toolbar-button');b.type='button';b.title='Read a merger compare PDF';
    const t=document.createElement('template');t.innerHTML=iconAsset.svg.replace(/id="([^"]+)"/g,'id="mc-$1"').replace(/url\(#([^)]+)\)/g,'url(#mc-$1)');
    const svg=t.content.firstElementChild;
    if(svg){svg.setAttribute('class','ws-icon ws-icon--'+iconAsset.style);svg.setAttribute('focusable','false');svg.setAttribute('aria-hidden','true');svg.removeAttribute('width');svg.removeAttribute('height');b.append(svg);}
    b.append(make('span','','Merger compare'));b.addEventListener('click',open);
    commands.append(b);
  }
})();
