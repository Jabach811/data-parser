const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=__dirname,root=path.dirname(dir),out=path.join(dir,'Loaded Demos');
fs.mkdirSync(out,{recursive:true});
const {concepts}=JSON.parse(fs.readFileSync(path.join(dir,'concepts.json'),'utf8'));
const fixture=path.join(root,'Test Samples','Vendor Files','fidelity','FIDELITY_special_rollover_mock.txt');
const sample=fs.readFileSync(fixture,'utf8'),runtime=fs.readFileSync(path.join(dir,'demo-runtime.js'),'utf8');
const safeJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const records=[];
for(const concept of concepts){
 const source=fs.readFileSync(path.join(dir,`Data Parser - ${concept.name}.html`),'utf8');
 let html=source.replace(`<title>Data Parser | ${concept.name}</title>`,`<title>Data Parser | ${concept.name} Demo</title>`);
 const closing=html.lastIndexOf('</body>');
 const bootstrap=`<script id="loaded-demo-runtime">\nconst DEMO_SAMPLE_TEXT=${safeJSON(sample)};\n${runtime}\n</script>\n`;
 html=html.slice(0,closing)+bootstrap+html.slice(closing);
 const name=`Data Parser - ${concept.name} - Demo.html`;
 fs.writeFileSync(path.join(out,name),html);
 records.push({...concept,file:name,originalSha256:crypto.createHash('sha256').update(source).digest('hex')});
}
let gallery=fs.readFileSync(path.join(dir,'Choose a Microsoft Look.html'),'utf8');
gallery=gallery.replace('<title>Data Parser | Microsoft-inspired layouts</title>','<title>Data Parser | Loaded demos</title>')
 .replace('Design collection','Loaded demos')
 .replace('A familiar place to get work done.','Try the loaded demos.')
 .replace('Five new structures, inspired by the Microsoft apps you already know. Open any one to use it with your files.','Every layout opens with the same fictional Fidelity case: four participants, eight reports, and populated balances. Click around to compare.')
 .replace('href="../Data Parser App.html"','href="../Choose a Microsoft Look.html"')
 .replace('Open original app','Open blank versions')
 .replaceAll('Open app <span','Open loaded demo <span')
 .replace('Same parser, mapping checks and Excel export. All five are separate working copies. Previews show the included sample file.','Fictional data is loaded through the real parser. Use New case to clear the demo, or return here to open another layout.')
 .replace('href="../Layout Concepts/Choose a Layout.html"','href="../../Layout Concepts/Choose a Layout.html"');
for(const c of concepts)gallery=gallery.replace(`href="Data Parser - ${c.name}.html"`,`href="Data Parser - ${c.name} - Demo.html"`);
fs.writeFileSync(path.join(out,'Choose a Loaded Demo.html'),gallery);
fs.writeFileSync(path.join(out,'demos.json'),JSON.stringify({sample:path.relative(root,fixture),sampleSha256:crypto.createHash('sha256').update(sample).digest('hex'),expected:{participants:4,reports:8,grandTotal:'27,560.85'},concepts:records},null,2));
console.log('Created five self-contained demos with the same embedded fictional Fidelity file.');
