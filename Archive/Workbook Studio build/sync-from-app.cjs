// Rebuilds every Workbook Studio file from the current Data Parser App.html.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const dir=__dirname,root=path.dirname(dir),conceptDir=path.join(root,'Microsoft Concepts');
const source=fs.readFileSync(path.join(root,'Data Parser App.html'),'utf8');
const css=fs.readFileSync(path.join(conceptDir,'microsoft.css'),'utf8'),runtime=fs.readFileSync(path.join(conceptDir,'microsoft-runtime.js'),'utf8');
let html=source.replace('</head>',()=>`<style id="microsoft-concept-style">${css}</style>\n</head>`).replace('<body class="pal-navy app-edition">','<body class="pal-navy app-edition ms-app" data-concept="workbook">').replace('<title>Data Parser</title>','<title>Data Parser | Workbook Studio</title>');
if(!html.includes('data-concept="workbook"')||!html.includes('<title>Data Parser | Workbook Studio</title>'))throw new Error('Data Parser App.html is not in the expected shape.');
const close=html.lastIndexOf('</body>');html=html.slice(0,close)+`<script id="microsoft-layout-runtime">${runtime}</script>\n`+html.slice(close);
fs.writeFileSync(path.join(conceptDir,'Data Parser - Workbook Studio.html'),html);
for(const step of ['build-workbook.cjs','build-focus.cjs'])execFileSync(process.execPath,[path.join(dir,step)],{stdio:'inherit'});
