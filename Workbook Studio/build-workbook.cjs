const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=__dirname,root=path.dirname(dir),conceptDir=path.join(root,'Microsoft Concepts');
const sourcePath=path.join(conceptDir,'Data Parser - Workbook Studio.html'),source=fs.readFileSync(sourcePath,'utf8');
const css=fs.readFileSync(path.join(dir,'ribbon.css'),'utf8')+'\n'+fs.readFileSync(path.join(dir,'appearance.css'),'utf8');
const iconAssets=JSON.parse(fs.readFileSync(path.join(dir,'ribbon-icons.json'),'utf8'));
const notices=fs.readFileSync(path.join(dir,'THIRD-PARTY-NOTICES.txt'),'utf8');
const ribbonSource=fs.readFileSync(path.join(dir,'ribbon.js'),'utf8'),iconMarker='/* WORKBOOK_ICON_ASSETS */{}';
if(!ribbonSource.includes(iconMarker))throw new Error('Missing ribbon icon placeholder.');
const runtime='/*\n'+notices+'\n*/\n'+ribbonSource.replace(iconMarker,()=>JSON.stringify(iconAssets.icons).replace(/</g,'\\u003c'));
const appearance=fs.readFileSync(path.join(dir,'appearance.js'),'utf8');
let settingsInitializerCount=0,settingsControllerCount=0;
let app=source.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi,(tag,script)=>{
  if(script.includes('var pals=')&&script.includes('localStorage.getItem("dpc-settings")')){settingsInitializerCount++;return '<script>\n'+appearance+'\n</script>';}
  if(script.includes('var b=document.body,btn=document.getElementById("settingsBtn")')){settingsControllerCount++;return '<script>/* Settings are managed by Workbook Studio appearance preferences. */</script>';}
  return tag;
});
if(settingsInitializerCount!==1||settingsControllerCount!==1)throw new Error('Expected exactly two original settings scripts.');
app=app.replace('</head>',`<style id="workbook-ribbon-style">${css}</style>\n</head>`);
function appendScript(html,id,script){const closing=html.lastIndexOf('</body>');return html.slice(0,closing)+`<script id="${id}">\n${script}\n</script>\n`+html.slice(closing);}
app=appendScript(app,'workbook-ribbon-runtime',runtime);
fs.writeFileSync(path.join(dir,'Workbook Studio.html'),app);
const samplePath=path.join(root,'Test Samples','Vendor Files','fidelity','FIDELITY_special_rollover_mock.txt'),sample=fs.readFileSync(samplePath,'utf8');
const demoRuntime=fs.readFileSync(path.join(conceptDir,'demo-runtime.js'),'utf8');
const json=JSON.stringify(sample).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const demo=appendScript(app.replace('<title>Data Parser | Workbook Studio</title>','<title>Workbook Studio | Ribbon update demo</title>'),'loaded-demo-runtime',`const DEMO_SAMPLE_TEXT=${json};\n${demoRuntime}`);
fs.writeFileSync(path.join(dir,'Workbook Studio - Demo.html'),demo);
fs.writeFileSync(path.join(dir,'build.json'),JSON.stringify({source:path.relative(root,sourcePath),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),sample:path.relative(root,samplePath),app:'Workbook Studio.html',demo:'Workbook Studio - Demo.html'},null,2));
console.log('Built Workbook Studio and its loaded demo. Earlier concepts preserved.');
