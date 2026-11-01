/**
 * Genera las imagenes de la carta social.
 *
 * Una carta que se comparte es una pieza de diseno mas, no un archivo que
 * alguien subio una vez: si el teal o el fondo cambian, la imagen tiene que
 * cambiar con ellos. Por eso la carta es un HTML (`scripts/og-card.html`)
 * renderizado con Chrome headless, y no un PNG editado a mano.
 *
 * Salidas:
 *   public/og-image.png         1200x630  -- meta de Open Graph (link, WhatsApp, Slack...)
 *   public/social-preview.png   1280x640  -- carta del repositorio en GitHub
 *   public/icon-512.png          512x512  -- icono con alfa para navegadores
 *   public/apple-touch-icon.png  180x180  -- icono de iOS (fondo opaco, sin radio)
 *
 * Uso: npm run make:images
 *
 * No requiere dependencias: el renderizado usa el Chrome que ya esta en el
 * sistema y el HTML incrusta la tipografia y el logo como datos base64, asi
 * que no hay nada que servir por HTTP.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(ROOT, 'scripts', 'og-card.html');
const LOGO = path.join(ROOT, 'public', 'bia-logo.png');
const FONT = path.join(ROOT, 'node_modules', '@fontsource-variable', 'inter', 'files', 'inter-latin-wght-normal.woff2');

/** Salidas: variante del HTML, nombre del archivo, ancho y alto. */
const TARGETS = [
  { variant: 'og', file: 'og-image.png', width: 1200, height: 630 },
  { variant: 'social', file: 'social-preview.png', width: 1280, height: 640 },
  { variant: 'icon', file: 'icon-512.png', width: 512, height: 512 },
  { variant: 'apple', file: 'apple-touch-icon.png', width: 180, height: 180 },
];

/**
 * Donde esta Chrome.
 *
 * Se busca en los lugares habituales de macOS y Linux. Si no aparece, el
 * error lo dice: es mas util eso que un fallo raro de `execFileSync`.
 */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    'No se encontro Chrome. Instalo, o poné la ruta en CHROME_PATH:\n' +
      candidates.map(c => `  ${c}`).join('\n'),
  );
}

/** Lee el tamano real de un PNG: los bytes 16..24 del IHDR. */
function pngSize(file) {
  const buffer = fs.readFileSync(file);
  const signature = buffer.readUInt32BE(0);
  if (signature !== 0x89504e47) throw new Error(`${file} no es un PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const chrome = findChrome();

if (!fs.existsSync(TEMPLATE)) throw new Error(`Falta la plantilla: ${TEMPLATE}`);
if (!fs.existsSync(LOGO)) throw new Error(`Falta el logotipo: ${LOGO}`);
if (!fs.existsSync(FONT))
  throw new Error(`Falta la tipografia: ${FONT}\n\nLas dependencias no estan instaladas. Corré npm ci.`);

const html = fs
  .readFileSync(TEMPLATE, 'utf8')
  // `replaceAll` y no `replace`: el logotipo aparece dos veces en la
  // plantilla (la carta y el icono) y con `replace` la segunda quedava con el
  // marcador puesto, es decir, una imagen rota.
  .replaceAll('{{FONT_DATA}}', fs.readFileSync(FONT).toString('base64'))
  .replaceAll('{{LOGO_DATA}}', fs.readFileSync(LOGO).toString('base64'));

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'bia-carta-'));
const profile = path.join(workspace, 'perfil');
const source = path.join(workspace, 'carta.html');
fs.writeFileSync(source, html);

console.log(`Chrome: ${chrome}`);

try {
  for (const target of TARGETS) {
    const out = path.join(ROOT, 'public', target.file);

    execFileSync(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-background-networking',
        // Un perfil propio: si hay un Chrome abierto, no se lo toca.
        `--user-data-dir=${profile}`,
        // Sin esto la captura sale a la escala del monitor y no a 1200x630.
        '--force-device-scale-factor=1',
        // Transparente por defecto; las piezas opacas ponen su propio fondo.
        '--default-background-color=00000000',
        // Margen para que la tipografia este cargada antes de la foto.
        '--virtual-time-budget=3000',
        `--window-size=${target.width},${target.height}`,
        `--screenshot=${out}`,
        `file://${source}?v=${target.variant}`,
      ],
      { stdio: 'ignore' },
    );

    if (!fs.existsSync(out)) throw new Error(`Chrome no escribio ${target.file}`);

    const size = pngSize(out);
    if (size.width !== target.width || size.height !== target.height) {
      throw new Error(
        `${target.file} salio de ${size.width}x${size.height} y se pidio ${target.width}x${target.height}`,
      );
    }

    const bytes = fs.statSync(out).size;
    console.log(`  ${target.file.padEnd(24)} ${size.width}x${size.height}  ${(bytes / 1024).toFixed(1)} kB`);
  }
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
}

console.log('Listo. Las imagenes estan en public/.');
