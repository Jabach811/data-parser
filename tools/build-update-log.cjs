// Copies WHATS-NEW.md and CHANGELOG.md into Workbook Studio.html for the What's new window.
const fs=require('node:fs'),path=require('node:path');
const root=path.dirname(__dirname),file=path.join(root,'Workbook Studio.html');
let app=fs.readFileSync(file,'utf8');
for(const [id,name] of [['update-log-plain','WHATS-NEW.md'],['update-log-technical','CHANGELOG.md']]){
  const text=fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n');
  if(/<\/script/i.test(text))throw new Error(name+' cannot contain "</script".');
  const block=new RegExp('(<script type="text/markdown" id="'+id+'">)[\\s\\S]*?(</script>)');
  if(!block.test(app))throw new Error('Workbook Studio.html has no '+id+' block.');
  app=app.replace(block,(m,open,close)=>open+'\n'+text+close);
}
fs.writeFileSync(file,app);
console.log('Copied the update logs into Workbook Studio.html');
