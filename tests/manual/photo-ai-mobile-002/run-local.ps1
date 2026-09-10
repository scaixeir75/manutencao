$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$port = 8123
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) { & $python.Source -m http.server $port; exit $LASTEXITCODE }
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'É necessário Python ou Node.js instalado.' }
node -e "const fs=require('fs'),http=require('http'),path=require('path');http.createServer((q,r)=>{const n=q.url==='/'?'/index.html':q.url;const f=path.join(process.cwd(),n);fs.readFile(f,(e,d)=>{r.statusCode=e?404:200;r.end(e?'not found':d)})}).listen($port,()=>console.log('Abrir http://localhost:'+$port+'/'))"
