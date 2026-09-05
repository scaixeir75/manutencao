// Verifica scripts inline (incluindo módulos) e ficheiros JS sem os executar.
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pmp-syntax-'));let count=0;
try{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(!match[2].trim())continue;const file=path.join(temp,`inline-${count}.${/type=["']module/.test(match[1])?'mjs':'js'}`);fs.writeFileSync(file,match[2]);cp.execFileSync(process.execPath,['--check',file],{stdio:'pipe'});count++;
  }
  const files=['sw.js','photo-ai-config.js','photo-ai-contract.js',...fs.readdirSync(path.join(root,'server/photo-ai')).filter(f=>f.endsWith('.js')).map(f=>'server/photo-ai/'+f)];
  for(const file of files){cp.execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});count++;}
  console.log(`Sintaxe válida: ${count} scripts.`);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
