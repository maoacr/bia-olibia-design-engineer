import http from 'node:http';
import fs from 'node:fs';
http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync('dist/index.html'))}).listen(3000,()=>console.log('http://localhost:3000'));
