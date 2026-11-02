/**
 * Medir y capturar sobre el navegador de verdad.
 *
 * Por que existe: varias fallas de este repo no se ven leyendo el codigo.
 * Un 404 servido por una cache vieja, una columna que se pisa con otra, un
 * porcentaje que multiplica dos veces, un tramo de 41px donde el piso dice
 * 44. Todas se encontraron mirando la pantalla con las medidas del
 * navegador, no razonando sobre el CSS.
 *
 * Y las herramientas de medicion se rehicieron dos sesiones seguidas
 * porque vivian en el scratchpad. Este archivo las versiona.
 *
 * Uso:
 *   node scripts/measure.mjs shot  <url> <salida.png> <ancho> <alto> [light]
 *   node scripts/measure.mjs eval  <url> <archivo.js> [ancho] [alto] [light]
 *   node scripts/measure.mjs probe <url> [ancho] [alto] [light]
 *
 * `probe` corre una lista de comprobaciones que aplican a cualquier pagina
 * del proyecto. Sale con codigo 1 si alguna falla, para que un fallo sea
 * visible en CI y no una afirmacion de buena fe.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const PUERTO = Number(process.env.MEASURE_PORT || 9333);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) if (fs.existsSync(candidate)) return candidate;
  throw new Error(
    'No se encontro Chrome. Poné la ruta en CHROME_PATH:\n' +
      CHROME_CANDIDATES.map(c => `  ${c}`).join('\n'),
  );
}

/**
 * Cliente minimo de CDP.
 *
 * Se podria usar el paquete `chrome-remote-interface`, pero son 40 lineas
 * y el proyecto no tiene por que depender de algo que no usa para nada
 * mas. Node trae WebSocket desde la v22 y desde la v20 con bandera.
 */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

async function startChrome() {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'bia-medir-'));
  const proc = spawn(
    findChrome(),
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      `--remote-debugging-port=${PUERTO}`,
      `--user-data-dir=${perfil}`,
      'about:blank',
    ],
    { stdio: 'ignore', detached: true },
  );

  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PUERTO}/json/version`)).ok) return { proc, perfil };
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome no abrio el puerto de depuracion');
}

async function connect(url) {
  const target = await (
    await fetch(`http://127.0.0.1:${PUERTO}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  ).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  return new CDP(ws);
}

/**
 * El viewport.
 *
 * `--window-size` de Chrome headless NO aplica: la captura sale de 756x469
 * en vez de lo pedido, sin error. El viewport hay que forzarlo con
 * Emulation.setDeviceMetricsOverride.
 */
async function setViewport(client, ancho, alto, tema) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: ancho,
    height: alto,
    deviceScaleFactor: 1,
    mobile: ancho < 700,
  });
  if (tema === 'light' || tema === 'reduced') {
    const features = [];
    if (tema === 'light') features.push({ name: 'prefers-color-scheme', value: 'light' });
    if (tema === 'reduced') features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
    await client.send('Emulation.setEmulatedMedia', { features });
  }
}

/**
 * LAS COMPROBACIONES.
 *
 * Corre dentro de la pagina. Devuelve lineas "OK ..." o "XX ...".
 *
 * `enlace en linea` queda fuera del piso de 44px a proposito: WCAG 2.2
 * (2.5.8) exime a los enlaces dentro de un bloque de texto. Los controles
 * —botones, campos, desplegables— no tienen exencion.
 */
const PROBE = `(() => {
  const out = [];
  const ok = (label, cond, extra = '') => out.push((cond ? 'OK  ' : 'XX  ') + label + (extra ? '  ' + extra : ''));
  const R = el => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, r: r.right, t: r.top, b: r.bottom }; };

  const doc = document.documentElement;
  ok('sin desborde horizontal', doc.scrollWidth <= doc.clientWidth + 1, doc.scrollWidth + ' vs ' + doc.clientWidth);

  const h1 = document.querySelectorAll('h1');
  ok('un solo h1', h1.length === 1, h1.length + ' encontrados');

  const texto = document.body.innerText;
  const malos = texto.match(/NaN|undefined|Infinity|\\[object/g);
  ok('sin cifras rotas en el texto', !malos, malos ? malos.join(', ') : '');

  const marca = doc.getAttribute('data-brand');
  const acento = getComputedStyle(doc).getPropertyValue('--accent').trim();
  ok('la marca esta declarada', !!marca, marca || 'sin data-brand');
  ok('el acento resuelve a un color', /^#|^rgb/.test(acento), acento);

  const chicos = [];
  for (const el of document.querySelectorAll('button, select, input, textarea, [role="radio"], [role="tab"]')) {
    const r = R(el);
    if (r.h > 0 && r.h < 44) chicos.push((el.className.split(' ')[0] || el.tagName) + ' ' + Math.round(r.w) + 'x' + Math.round(r.h));
  }
  ok('ningun control bajo 44px', chicos.length === 0, chicos.join(' | '));

  const enlaces = [...document.querySelectorAll('a')].filter(a => {
    const r = R(a);
    return r.h > 0 && r.h < 44 && a.closest('p');
  }).length;
  out.push('--  ' + enlaces + ' enlace(s) en linea por debajo de 44px (exentos por WCAG 2.5.8)');

  return out.join('\\n');
})()`;

const [, , modo, ...args] = process.argv;
const url = args[0];
if (!url) {
  console.error('Falta la url. MIRA el uso al principio del archivo.');
  process.exit(1);
}

const { proc, perfil } = await startChrome();
let fallas = 0;

try {
  const client = await connect(url);
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  if (modo === 'shot') {
    const [, salida, ancho, alto, tema] = args;
    await setViewport(client, Number(ancho), Number(alto), tema);
    await client.send('Page.navigate', { url });
    await sleep(2500);
    const { data } = await client.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    fs.writeFileSync(salida, Buffer.from(data, 'base64'));
    console.log(`  ${salida} ${ancho}x${alto}${tema ? ' ' + tema : ''}`);
  }

  if (modo === 'eval') {
    const [, archivo, ancho, alto, tema] = args;
    await setViewport(client, Number(ancho || 1440), Number(alto || 900), tema);
    await client.send('Page.navigate', { url });
    await sleep(2500);
    const expresion = fs.readFileSync(archivo, 'utf8');
    const { result, exceptionDetails } = await client.send('Runtime.evaluate', {
      expression: expresion,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      console.error(JSON.stringify(exceptionDetails, null, 2));
      process.exit(1);
    }
    console.log(typeof result.value === 'string' ? result.value : JSON.stringify(result.value, null, 2));
  }

  if (modo === 'probe') {
    const [, ancho, alto, tema] = args;
    await setViewport(client, Number(ancho || 1440), Number(alto || 900), tema);
    await client.send('Page.navigate', { url });
    await sleep(2500);
    const { result, exceptionDetails } = await client.send('Runtime.evaluate', {
      expression: PROBE,
      returnByValue: true,
    });
    if (exceptionDetails) {
      console.error(JSON.stringify(exceptionDetails, null, 2));
      process.exit(1);
    }
    const lineas = String(result.value).split('\n');
    for (const linea of lineas) {
      if (linea.startsWith('XX')) fallas++;
      console.log('  ' + linea);
    }
    console.log(fallas ? `\n${fallas} comprobacion(es) fallidas.` : '\nTodas las comprobaciones pasan.');
    if (fallas) process.exitCode = 1;
  }
} finally {
  try {
    process.kill(-proc.pid);
  } catch {}
  fs.rmSync(perfil, { recursive: true, force: true });
  await sleep(200);
}
