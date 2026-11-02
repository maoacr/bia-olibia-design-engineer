/**
 * MEDIR Y CAPTURAR SOBRE EL NAVEGADOR DE VERDAD.
 *
 * Se versiona porque las herramientas de medicion se rehicieron dos sesiones
 * seguidas por vivir en el scratchpad, y porque varios bugs de este repo
 * (el vidrio sin desenfoque, los porcentajes, las columnas pisadas) solo
 * aparecieron al MEDIR, no al leer el codigo.
 *
 * Uso:
 *   node scripts/measure.mjs shot <url> <salida.png> <ancho> <alto> [light]
 *   node scripts/measure.mjs eval <url> <archivo.js> [ancho] [alto] [light]
 *
 * `eval` corre un archivo JavaScript dentro de la pagina e imprime el
 * resultado: ahi viven las comprobaciones de geometria, de contraste
 * compuesto y de objetivo tactil.
 *
 * CDP minimo: navegar, medir y capturar.
 *
 * Uso:
 *   node cdp.mjs shot <url> <salida.png> <ancho> <alto> [tema]
 *   node cdp.mjs eval <url> <archivo.js>
 *
 * El `--window-size` de Chrome headless no esta aplicando el tamano pedido
 * (devolvio 756x469), asi que el viewport se fuerza con
 * Emulation.setDeviceMetricsOverride, que es lo que hace el CDP de verdad.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function startChrome() {
  const proc = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      `--remote-debugging-port=${PORT}`,
      '--user-data-dir=/tmp/chk-cdp',
      'about:blank',
    ],
    { stdio: 'ignore', detached: true },
  );
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return proc;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome no abrio el puerto de depuracion');
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

async function connect(url) {
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  return new CDP(ws);
}

const [, , modo, ...args] = process.argv;
const proc = await startChrome();

try {
  const url = args[0];
  const client = await connect(url);
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  if (modo === 'shot') {
    const [, salida, ancho, alto, tema] = args;
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: Number(ancho),
      height: Number(alto),
      deviceScaleFactor: 1,
      mobile: Number(ancho) < 700,
    });
    if (tema === 'light') {
      await client.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-color-scheme', value: 'light' }],
      });
    }
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
    const [, archivo, anchoArg, altoArg, tema] = args;
    if (anchoArg) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: Number(anchoArg),
        height: Number(altoArg || 900),
        deviceScaleFactor: 1,
        mobile: Number(anchoArg) < 700,
      });
      if (tema === 'light')
        await client.send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-color-scheme', value: 'light' }],
        });
    }
    await client.send('Page.navigate', { url });
    await sleep(2500);
    const expresion = fs.readFileSync(archivo, 'utf8');
    const { result, exceptionDetails } = await client.send('Runtime.evaluate', {
      expression: expresion,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) console.error(JSON.stringify(exceptionDetails, null, 2));
    console.log(typeof result.value === 'string' ? result.value : JSON.stringify(result.value, null, 2));
  }
} finally {
  try {
    process.kill(-proc.pid);
  } catch {}
  await sleep(300);
}
