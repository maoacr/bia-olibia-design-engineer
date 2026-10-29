import {build} from 'esbuild';
import fs from 'node:fs';
await build({entryPoints:['src/App.jsx'],bundle:true,minify:true,outdir:'dist',entryNames:'app',define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
const js=fs.readFileSync('dist/app.js','utf8').replace(/<\/script/gi,'<\\/script');
const css=fs.readFileSync('dist/app.css','utf8');
fs.writeFileSync('dist/index.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Olibia · Dashboard base React</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`);
