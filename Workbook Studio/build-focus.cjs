const fs=require('node:fs'),path=require('node:path');
const dir=__dirname,read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const iconAssets=JSON.parse(read('ribbon-icons.json')),iconMarker='/* WORKBOOK_ICON_ASSETS */{}',source=read('focus.js');
if(!source.includes(iconMarker))throw new Error('Missing focus icon placeholder.');
const runtime='/*\n'+read('THIRD-PARTY-NOTICES.txt')+'\n*/\n'+source.replace(iconMarker,()=>JSON.stringify(iconAssets.icons).replace(/</g,'\\u003c'));
const mergerMarker="/* MERGER_ICON */{svg:'',style:'color'}",merger=read('merger-compare.js');
if(!merger.includes(mergerMarker))throw new Error('Missing merger compare icon placeholder.');
const mergerRuntime=read('merger-compare-reader.js')+'\n'+merger.replace(mergerMarker,()=>JSON.stringify(iconAssets.icons.reports).replace(/</g,'\\u003c'));
const css=read('focus.css')+'\n'+read('merger-compare.css'),runtimeOpen='<script id="workbook-ribbon-runtime">';
function focus(html,oldTitle,newTitle){
  const start=html.indexOf(runtimeOpen),end=html.indexOf('</script>',start);
  if(start<0||!html.includes(oldTitle))throw new Error('Workbook Studio file is not in the expected shape.');
  return (html.slice(0,start)+runtimeOpen+'\n'+runtime+'\n</script>\n<script id="merger-compare-runtime">\n'+mergerRuntime+'\n'+html.slice(end)).replace(oldTitle,()=>newTitle).replace('</head>',()=>`<style id="workbook-focus-style">${css}</style>\n</head>`);
}
fs.writeFileSync(path.join(dir,'Workbook Studio - Focus.html'),focus(read('Workbook Studio.html'),'<title>Data Parser | Workbook Studio</title>','<title>Data Parser | Workbook Studio Focus</title>'));
fs.writeFileSync(path.join(dir,'Workbook Studio - Focus Demo.html'),focus(read('Workbook Studio - Demo.html'),'<title>Workbook Studio | Ribbon update demo</title>','<title>Workbook Studio | Focus demo</title>'));
console.log('Built Workbook Studio Focus and its loaded demo. Existing files untouched.');
