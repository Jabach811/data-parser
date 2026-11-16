// Builds the training copy: the official app with the fictional Fidelity case preloaded.
const fs=require('node:fs'),path=require('node:path');
const root=path.dirname(__dirname);
const app=fs.readFileSync(path.join(root,'Workbook Studio.html'),'utf8');
const sample=fs.readFileSync(path.join(root,'Test Samples','Vendor Files','fidelity','FIDELITY_special_rollover_mock.txt'),'utf8');
const runtime=fs.readFileSync(path.join(__dirname,'demo-runtime.js'),'utf8');
const json=JSON.stringify(sample).replace(/</g,'\u003c').replace(/\u2028/g,'\u2028').replace(/\u2029/g,'\u2029');
const title='<title>Data Parser | Workbook Studio</title>';
if(!app.includes(title))throw new Error('Workbook Studio.html title changed; update build-demo.cjs.');
const html=app.replace(title,()=>'<title>Data Parser | Workbook Studio Demo</title>');
const close=html.lastIndexOf('</body>');
fs.writeFileSync(path.join(root,'Workbook Studio - Demo.html'),html.slice(0,close)+`<script id="loaded-demo-runtime">\nconst DEMO_SAMPLE_TEXT=${json};\n${runtime}\n</script>\n`+html.slice(close));
console.log('Built Workbook Studio - Demo.html');
