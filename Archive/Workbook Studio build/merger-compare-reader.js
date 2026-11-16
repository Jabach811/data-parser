(function(root){
  'use strict';
  const ON='☒☑',OFF='☐□';
  const BOX=new RegExp('(['+ON+OFF+'])');
  const isBox=ch=>ON.includes(ch)||OFF.includes(ch);
  const clean=s=>s.replace(/_{2,}/g,' ').replace(/\s+/g,' ').trim();
  const isRef=s=>/^AA\b.{0,20}\bPg\b/i.test(s);
  const isHeading=s=>/[:?]$/.test(s);
  const median=list=>{if(!list.length)return 0;const s=[...list].sort((a,b)=>a-b);return s[Math.floor(s.length/2)];};

  async function readPages(pdfjsLib,data){
    const pdf=await pdfjsLib.getDocument({data,disableWorker:true,useSystemFonts:true}).promise;
    const pages=[];
    for(let n=1;n<=pdf.numPages;n++){
      const page=await pdf.getPage(n),content=await page.getTextContent(),items=[];
      for(const it of content.items){
        if(!it.str||!it.str.trim())continue;
        items.push({str:it.str,x:it.transform[4],y:it.transform[5],w:it.width||0});
      }
      let fields=0;
      try{
        for(const a of await page.getAnnotations()){
          if(a.fieldType!=='Btn'||!a.checkBox||!a.rect)continue;
          fields++;
          const on=a.fieldValue&&a.fieldValue!=='Off';
          items.push({str:on?'☒':'☐',x:a.rect[0],y:a.rect[1]+1,w:a.rect[2]-a.rect[0]});
        }
      }catch(e){}
      pages.push({items,fields});
    }
    return pages;
  }

  // Items closer than a word space belong to one phrase; small caps arrive as "C" + "URRENT".
  function phrases(items,maxGap){
    const out=[];
    for(const it of [...items].sort((a,b)=>a.x-b.x)){
      const last=out[out.length-1],gap=last?it.x-(last.x+last.w):Infinity;
      if(last&&gap<maxGap){last.str+=(gap>1.2&&!/\s$/.test(last.str)&&!/^\s/.test(it.str)?' ':'')+it.str;last.w=Math.max(last.w,it.x+it.w-last.x);}
      else out.push({...it});
    }
    return out;
  }

  function lines(items,tol){
    const sorted=[...items].sort((a,b)=>b.y-a.y),out=[];
    for(const it of sorted){
      const last=out[out.length-1];
      if(last&&Math.abs(last.y-it.y)<=tol)last.items.push(it);
      else out.push({y:it.y,items:[it]});
    }
    for(const l of out){
      const ps=phrases(l.items,3);
      l.x=ps[0].x;l.right=Math.max(...ps.map(p=>p.x+p.w));
      l.text=ps.map(p=>p.str).join(' ').replace(/\s+/g,' ').trim();
    }
    return out;
  }

  function findHeader(page){
    const find=re=>page.items.find(it=>re.test(it.str));
    const merg=find(/Merging\s*Plan/i),surv=find(/Surviving\s*Plan/i),comm=find(/^\s*Comments/i);
    if(!merg||!surv||!comm)return null;
    const c=it=>it.x+it.w/2,s=c(surv),m=c(merg),k=c(comm);
    const top=Math.min(merg.y,surv.y,comm.y)-2;
    const nameText=page.items.filter(it=>it.y>=merg.y-2&&it.y<merg.y+30&&it.x+it.w>(s+m)/2&&it.x<(m+k)/2).sort((a,b)=>b.y-a.y||a.x-b.x).map(it=>it.str).join(' ');
    const q=nameText.match(/[“"]([^”"]+)[”"]/);
    return {b0:s-(m-s)/2,b1:(s+m)/2,b2:(m+k)/2,top,plan:q?clean(q[1]):clean(nameText.replace(/Merging\s*Plan/i,''))};
  }

  function parse(pages){
    const diag={pages:pages.length,headerPages:[],fieldBoxes:pages.reduce((n,p)=>n+p.fields,0),symbols:{}};
    for(const p of pages)for(const it of p.items)for(const ch of it.str){
      const cp=ch.codePointAt(0);
      if(isBox(ch)||(cp>=0x2000&&cp<0x2C00)||(cp>=0xE000&&cp<0xF900)){const k='U+'+cp.toString(16).toUpperCase().padStart(4,'0');diag.symbols[k]=(diag.symbols[k]||0)+1;}
    }
    let bands=null,plan='',stop=null;
    pages.forEach((p,i)=>{if(stop)return;const t=p.items.find(it=>/^\s*Source\s*Mapping\s*$/i.test(it.str));if(t)stop={page:i,y:t.y};});

    const rows=[],mergLines=[];
    let row=null;
    pages.forEach((page,pi)=>{
      if(stop&&pi>stop.page)return;
      const h=findHeader(page);
      if(h){bands=h;diag.headerPages.push(pi+1);if(!plan)plan=h.plan;}
      if(!bands)return;
      const body=page.items.filter(it=>it.y<(h?h.top:Infinity)&&!(stop&&pi===stop.page&&it.y<=stop.y+2)&&!/Docusign Envelope ID/i.test(it.str));
      const label=lines(body.filter(it=>it.x<bands.b0),2.5),merg=lines(body.filter(it=>it.x>=bands.b1&&it.x<bands.b2),2.5)
        .filter(l=>!(/^(page\s*)?\d+(\s*of\s*\d+)?$/i.test(l.text)&&l.y<45));
      // A cell's first line can sit a hair above its label's baseline, so labels win ties within 4pt.
      const events=[...label.map(l=>({kind:'label',l,k:l.y+4})),...merg.map(l=>({kind:'merg',l,k:l.y}))].sort((a,b)=>b.k-a.k);
      for(const e of events){
        if(e.kind==='label'){
          const m=e.l.text.match(/^(\d{1,2})\.\s*(.*)$/);
          if(m){row={num:+m[1],label:[m[2]],lines:[]};rows.push(row);}
          else if(row&&row.label.length<3&&!row.labelDone){
            if(/protected|testing|implications|\*|^COMMENT/i.test(e.l.text))row.labelDone=true;else row.label.push(e.l.text);
          }
        }else if(row){row.lines.push({...e.l,page:pi});mergLines.push(e.l);}
      }
    });
    if(!bands)diag.noHeader=true;
    const colRight=median(mergLines.map(l=>l.right).sort((a,b)=>b-a).slice(0,Math.max(1,Math.ceil(mergLines.length*0.1))));
    diag.colRight=Math.round(colRight);

    for(const r of rows){
      r.name=clean(r.label.join(' '));
      r.entries=entries(r.lines,colRight);
      delete r.lines;delete r.label;delete r.labelDone;
    }
    diag.rows=rows.map(r=>r.num);
    const mapping=parseMapping(pages,stop,diag);
    const fields=extractFields(rows,diag);
    return {plan,rows,fields,mapping,diag};
  }

  function entries(rowLines,colRight){
    const gaps=[];
    for(let i=1;i<rowLines.length;i++)if(rowLines[i].page===rowLines[i-1].page)gaps.push(rowLines[i-1].y-rowLines[i].y);
    const lineGap=median(gaps.filter(g=>g>2))||10;
    const out=[];let prev=null;
    for(const l of rowLines){
      const parts=l.text.split(BOX).map(s=>s.trim());
      const lead=clean(parts[0]),gap=prev?(prev.page===l.page?prev.y-l.y:lineGap):Infinity;
      const last=out[out.length-1];
      const firstWord=(lead.split(' ')[0]||'');
      const wrapped=prev&&prev.right+4+firstWord.length*(l.right-l.x)/Math.max(1,l.text.length)>colRight-2;
      const cont=last&&lead&&gap<=lineGap*1.35&&!isHeading(last.text)&&!isRef(lead)&&!isRef(last.text)&&!/^(KEY\s*\d|[A-Z][\w #%/()-]{0,30}:)/.test(lead)&&(wrapped||/^[a-z(]/.test(lead));
      if(cont)last.text=clean(last.text+(/-$/.test(last.text)?'':' ')+lead);
      else if(lead)out.push({kind:'text',text:lead});
      for(let i=1;i<parts.length;i+=2){
        const text=clean(parts[i+1]||'');
        out.push({kind:'option',checked:ON.includes(parts[i]),text});
      }
      prev=l;
    }
    let heading='';
    for(const e of out){
      if(e.kind==='text'&&isHeading(e.text)){heading=e.text.replace(/[:?]$/,'');e.heading=true;}
      e.under=e.heading?'':heading;
    }
    return out.filter(e=>e.kind==='text'||e.text);
  }

  const FIELDS=[
    {key:'contrib',num:9,re:/contribution/i,title:'Contribution types'},
    {key:'elig',num:10,re:/eligib/i,title:'Eligibility'},
    {key:'entry',num:11,re:/entry/i,title:'Entry date'},
    {key:'auto',num:14,re:/automatic|auto\b/i,title:'Automatic elective deferrals'},
    {key:'vest',num:30,re:/vesting/i,title:'Vesting'},
    {key:'loans',num:38,re:/loan/i,title:'Loans'},
    {key:'comp',num:40,re:/compensation/i,title:'Compensation'},
  ];

  function findRow(rows,f){
    return rows.find(r=>r.num===f.num&&f.re.test(r.name))||rows.find(r=>f.re.test(r.name)&&r.name.search(f.re)<12)||rows.find(r=>r.num===f.num)||null;
  }
  const checked=(es,test)=>es.filter(e=>e.kind==='option'&&e.checked&&(!test||test(e))).map(e=>e.text);
  const join=list=>list.filter(Boolean).join('; ');
  const isNA=t=>/^N\/?A\b/i.test(t);
  function summary(es,skip){
    const parts=[],groups=new Map();
    for(const e of es){
      if(skip&&skip(e))continue;
      if(e.kind==='text'&&!e.heading&&!isRef(e.text))parts.push(e.text);
      if(e.kind==='option'&&e.checked){const k=e.under||'';if(!groups.has(k)){groups.set(k,[]);parts.push(groups.get(k));}groups.get(k).push(e.text);}
    }
    return join(parts.map(p=>{
      if(typeof p==='string')return p;
      const k=[...groups].find(([,v])=>v===p)[0];
      return (k?k+': ':'')+p.join(', ');
    }));
  }

  function extractFields(rows,diag){
    const out=[];diag.fields=[];
    const add=(item,row,value)=>out.push({item,row:row?String(row.num):'',value:value||''});
    for(const f of FIELDS){
      const row=findRow(rows,f),es=row?row.entries:[];
      diag.fields.push({title:f.title,expected:f.num,found:row?row.num:null,byLabel:!!(row&&f.re.test(row.name)),checkedCount:checked(es).length,entries:es.length});
      if(!row){add(f.title,null,'Not found');continue;}
      if(f.key==='contrib')add(f.title,row,join(checked(es))||'Nothing checked');
      else if(f.key==='entry')add(f.title,row,join(checked(es))||'Nothing checked');
      else if(f.key==='elig')eligibility(es,row,add);
      else if(f.key==='auto'){
        const first=es.find(e=>e.kind==='option'&&e.checked);
        const group=first?checked(es,e=>e.under===first.under):[];
        add(f.title,row,!first?'Nothing checked':isNA(first.text)?'No':'Yes: '+group.join(', '));
      }
      else if(f.key==='vest')add(f.title,row,summary(es)||'Nothing found');
      else if(f.key==='loans'){
        const na=es.find(e=>e.kind==='option'&&isNA(e.text)&&!e.under);
        add(f.title,row,na&&na.checked?'No':'Yes');
        if(!(na&&na.checked))add('Loan details',row,summary(es,e=>e===na));
      }
      else if(f.key==='comp'){
        add(f.title,row,join(checked(es,e=>!/exclu/i.test(e.under)))||'Nothing checked');
        add('Compensation exclusions',row,join(checked(es,e=>/exclu/i.test(e.under)))||'None checked');
      }
    }
    return out;
  }

  function eligibility(es,row,add){
    const stopAt=es.findIndex(e=>e.heading&&/method|hours of service|exclu/i.test(e.text));
    const head=stopAt<0?es:es.slice(0,stopAt);
    let who='',ee=[],er=[],other=[];
    for(const e of head){
      if(e.kind!=='text'||isRef(e.text))continue;
      let t=e.text;
      const m=t.match(/^Employ(ee|er)\s+Sources?\s*:?\s*/i);
      if(m){who=m[1].toLowerCase();t=t.slice(m[0].length);}
      else if(e.heading&&!/^(age|service)/i.test(t))continue;
      if(!t)continue;
      (who==='ee'?ee:who==='er'?er:other).push(t);
    }
    if(ee.length||er.length){add('Eligibility - employee sources',row,join(ee)||'Not found');add('Eligibility - employer sources',row,join(er)||'Not found');}
    else add('Eligibility - age and service',row,join(other)||'Not found');
    const under=re=>checked(es,e=>re.test(e.under));
    add('Method for determining service',row,join(under(/method|determin/i))||'Nothing checked');
    add('Hours of service definition',row,join(under(/hours of service/i))||'Nothing checked');
    let inExcl=false,src='';const ex={ee:[],er:[]};
    for(const e of es){
      if(e.heading){
        if(/exclu/i.test(e.text)){inExcl=true;src='';}
        else if(/waive|method|hours of service|entry/i.test(e.text))inExcl=false;
        const s=e.text.match(/^Employ(ee|er)\s+Sources?/i);if(s)src=s[1].toLowerCase();
        continue;
      }
      if(!inExcl||e.kind!=='option'||!e.checked)continue;
      const tag=/\ball EE\b/i.test(e.text)?'ee':/\ball ER\b/i.test(e.text)?'er':src;
      if(tag==='ee'||tag==='er')ex[tag].push(e.text);else{ex.ee.push(e.text);ex.er.push(e.text);}
    }
    add('Excluded groups - employee sources',row,join(ex.ee)||'None checked');
    add('Excluded groups - employer sources',row,join(ex.er)||'None checked');
  }

  const VOCAB=/^(current|source|w\/d|rules|vesting|schedule|transamerica|statement|name|report|output|tab|new|freq|of|contrib|active|or|frozen|\*)$/i;
  const MAP_COLS=['Current source','W/D rules (current)','Vesting (current)','TA statement name','W/D rules (new)','Vesting (new)','Frequency','New source?','Active / frozen'];

  function parseMapping(pages,stop,diag){
    const res={found:!!stop,headerCols:0,rows:[]};diag.mapping=res;
    if(!stop)return res;
    let edges=null,inHeader=false,cur=null,prevY=null,lineGap=null;
    for(let pi=stop.page;pi<pages.length;pi++){
      const items=pages[pi].items.filter(it=>!(pi===stop.page&&it.y>=stop.y-2)&&!/Docusign Envelope ID/i.test(it.str));
      for(const l of lines(items,2.5)){
        if(/^Additional Comments/i.test(l.text)){pi=pages.length;break;}
        if(!edges){
          if(/current/i.test(l.text)&&/vesting/i.test(l.text)){
            const ps=phrases(l.items,5);
            res.headerCols=ps.length;
            edges=ps.length===9?ps.slice(0,8).map(p=>p.x+p.w+1.5):null;
            if(!edges){const c=ps.map(p=>p.x+p.w/2);edges=c.slice(0,-1).map((v,i)=>(v+c[i+1])/2);}
            inHeader=true;
          }
          continue;
        }
        const words=l.text.replace(/[().*]/g,' ').split(/\s+/).filter(Boolean);
        if(inHeader&&words.every(w=>VOCAB.test(w)))continue;
        if(/^(page\s*)?\d+(\s*of\s*\d+)?$/i.test(l.text))continue;
        if(words.length&&words.every(w=>VOCAB.test(w))&&/current/i.test(l.text))continue;
        inHeader=false;
        const cells={};
        for(const p of phrases(l.items,3)){
          let c=0;while(c<edges.length&&p.x>edges[c])c++;
          cells[c]=clean(((cells[c]||'')+' '+p.str));
        }
        const gap=prevY===null||pi!==cur?.page?Infinity:prevY-l.y;
        if(gap!==Infinity&&gap>1)lineGap=lineGap===null?gap:Math.min(lineGap,gap);
        const clash=cur&&Object.keys(cells).some(c=>cur.cells[c]&&(c>=6||gap>(lineGap||10)*1.25));
        if(!cur||clash){cur={page:pi,cells:{}};res.rows.push(cur);}
        for(const [c,t] of Object.entries(cells))cur.cells[c]=cur.cells[c]?cur.cells[c]+' '+t:t;
        cur.page=pi;prevY=l.y;
      }
    }
    res.rows=res.rows.map(r=>MAP_COLS.map((_,i)=>r.cells[i]||'')).filter(r=>r.some(Boolean));
    return res;
  }

  function checks(result){
    const out=[];
    for(const f of result.fields)if(/^(Not found|Nothing checked|Nothing found)$/.test(f.value))out.push([f.item,f.value+(f.row?' in row '+f.row:'')+'. Check the PDF.']);
    if(!result.mapping.found)out.push(['Source mapping','The Source Mapping table was not found.']);
    const names=new Map();
    for(const r of result.mapping.rows){
      if(!r[0])out.push(['Source mapping',(r[3]||'A row')+' has no current source.']);
      if(r[0]&&r[3]){if(!names.has(r[3]))names.set(r[3],[]);names.get(r[3]).push(r[0]);}
    }
    for(const [n,list] of names)if(list.length>1)out.push(['Shared statement name',list.join(' and ')+' both map to '+n+'.']);
    out.push(['Read by computer','Values were read from the PDF automatically. Spot-check the checkboxes before relying on them.']);
    return out;
  }

  function report(result){
    const d=result.diag,L=[];
    L.push('Merger compare check (reader v1)');
    L.push('Pages: '+d.pages);
    L.push('Column headers found on '+d.headerPages.length+' of '+d.pages+' pages'+(d.headerPages.length<d.pages?' (missing: '+missing(d.headerPages,d.pages)+')':''));
    L.push('Merging column right edge: '+d.colRight);
    const sym=Object.entries(d.symbols).map(([k,v])=>k+' x'+v).join(', ');
    L.push('Symbols: '+(sym||'none'));
    L.push('Form-field checkboxes: '+d.fieldBoxes);
    L.push('Plan name found: '+(result.plan?'yes':'no'));
    L.push('Rows found ('+d.rows.length+'): '+d.rows.join(', '));
    for(const f of d.fields)L.push('  '+f.title+' (expected row '+f.expected+'): '+(f.found===null?'NOT FOUND':'row '+f.found+(f.byLabel?' by label':' by number only')+', '+f.entries+' lines, '+f.checkedCount+' checked'));
    L.push('Source mapping: '+(d.mapping.found?'title found, header columns '+d.mapping.headerCols+', rows '+d.mapping.rows.length:'NOT FOUND'));
    return L.join('\n');
  }
  function missing(found,n){const s=new Set(found),m=[];for(let i=1;i<=n;i++)if(!s.has(i))m.push(i);return m.join(', ');}

  root.MergerCompareReader={readPages,parse,checks,report,MAP_COLS};
})(typeof window!=='undefined'?window:globalThis);
