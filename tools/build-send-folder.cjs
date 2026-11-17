// Refreshes "Send to Work": copies of everything Joel emails to work, under plain names.
const fs=require('node:fs'),path=require('node:path');
const root=path.dirname(__dirname),out=path.join(root,'Send to Work');
const files=[
  ['Workbook Studio.html','Workbook Studio.html'],
  ['Workbook Studio - Demo.html','Workbook Studio - Practice Copy.html'],
  // The phone cut fits under work email's attachment limit; the full one is 50 MB.
  ['Training/Workbook Studio Walkthrough - Phone.mp4','Workbook Studio Walkthrough.mp4'],
  ['Test Samples/Plan Review Documents/Practice PRD.docx','Practice Files/Practice Plan Review Document.docx'],
  ['Test Samples/Merger Compares/Practice merger compare - Harbor View Academy.pdf','Practice Files/Practice Merger Compare.pdf'],
  ['Excel Macros/Build CONV File.txt','Excel Macros/Build CONV File.txt'],
  ['Excel Macros/Copy TOA to Fund Mapping.txt','Excel Macros/Copy TOA to Fund Mapping.txt'],
  ['Excel Macros/Export Form Code.txt','Excel Macros/Export Form Code.txt'],
];
for(const [from,to] of files){
  const dest=path.join(out,to);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(path.join(root,from),dest);
}
console.log('Refreshed Send to Work');
