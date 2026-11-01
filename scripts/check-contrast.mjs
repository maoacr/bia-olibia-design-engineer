/**
 * Verificador de contraste WCAG sobre src/tokens.css.
 *
 * Lee los tokens del archivo real —no una copia— y comprueba cada par
 * texto/superficie en los dos temas. Se ejecuta con `npm run check:contrast`
 * y termina con codigo 1 si algo baja del minimo, para que el fallo sea
 * visible en CI y no una afirmacion de buena fe.
 *
 * Umbrales segun WCAG 2.1 AA:
 *   4.5:1  texto normal                        (1.4.3)
 *   3:1    componentes de interfaz y foco      (1.4.11)
 *   Los bordes decorativos de panel NO son componentes de interfaz y por eso
 *   no se miden contra 3:1; los de control (--border-control) si.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS = fs.readFileSync(path.join(ROOT, 'src/tokens.css'), 'utf8');

/** Extrae las declaraciones del primer bloque que empieza en el patron dado. */
function block(pattern) {
  const start = CSS.search(pattern);
  if (start < 0) return {};
  const rest = CSS.slice(start);
  let depth = 0;
  let open = false;
  let end = rest.length;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '{') {
      depth++;
      open = true;
    } else if (rest[i] === '}') {
      depth--;
      if (open && depth === 0) {
        end = i;
        break;
      }
    }
  }
  return Object.fromEntries(
    [...rest.slice(0, end).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]),
  );
}

const primitives = block(/^:root \{/m);
const themes = {
  oscuro: { ...primitives, ...block(/^:root,\n:root\[data-theme='dark'\] \{/m) },
  claro: { ...primitives, ...block(/^:root\[data-theme='light'\] \{/m) },
};

function resolve(value, scope, depth = 0) {
  if (!value || depth > 10) return value;
  const ref = /^var\((--[\w-]+)\)$/.exec(value.trim());
  return ref ? resolve(scope[ref[1]], scope, depth + 1) : value.trim();
}

const channels = hex => [0, 2, 4].map(i => parseInt(hex.slice(i + 1, i + 3), 16));

function luminance(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const [r, g, b] = channels(hex)
    .map(v => v / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  if (x === null || y === null) return null;
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
}

/** [primer plano, fondo, minimo exigido] */
const PAIRS = [
  ['text-primary', 'surface-base', 4.5],
  ['text-primary', 'surface-panel', 4.5],
  ['text-primary', 'surface-raised', 4.5],
  ['text-secondary', 'surface-base', 4.5],
  ['text-secondary', 'surface-panel', 4.5],
  ['text-muted', 'surface-base', 4.5],
  ['text-muted', 'surface-panel', 4.5],
  ['accent', 'surface-base', 4.5],
  ['accent', 'surface-panel', 4.5],
  ['accent-strong', 'surface-panel', 4.5],
  ['signal-good', 'surface-panel', 4.5],
  // La banda del pipeline no tiene superficie propia: su variacion se apoya
  // directamente sobre el fondo de la pagina, que nadie estaba midiendo.
  ['signal-good', 'surface-base', 4.5],
  ['signal-negative', 'surface-base', 4.5],
  ['signal-attention', 'surface-panel', 4.5],
  ['signal-negative', 'surface-panel', 4.5],
  ['signal-neutral', 'surface-panel', 4.5],
  ['chart-axis', 'surface-panel', 4.5],
  // Las barras transmiten informacion: 3:1 segun WCAG 1.4.11.
  ['chart-bar', 'surface-panel', 3],
  ['chart-bar', 'surface-raised', 3],
  ['chart-bar-on', 'surface-panel', 3],
  ['chart-bar-on', 'surface-raised', 3],
  ['focus-ring', 'surface-base', 3],
  ['focus-ring', 'surface-panel', 3],
  ['border-control', 'surface-base', 3],
  ['border-control', 'surface-panel', 3],
  ['border-control', 'surface-hover', 3],

  // Superficie de los controles. Todo boton, desplegable y campo se rellena
  // con ella, asi que su texto y su placeholder se apoyan ahi.
  ['text-primary', 'surface-control', 4.5],
  ['text-primary', 'surface-control-hover', 4.5],

  // "Limpiar todo" es el unico control relleno de acento de la pagina: su
  // texto se apoya sobre la marca, no sobre una superficie. El par no estaba
  // medido por nadie hasta que ese boton existio.
  ['text-on-accent', 'accent', 4.5],
  ['text-on-accent', 'accent-strong', 4.5],
  // La pildora de "vencido" es el unico relleno rojo de la tabla, y su texto
  // se apoya sobre la señal, no sobre una superficie.
  ['text-on-accent', 'signal-negative', 4.5],

  // Bloque "Vamos a llegar?". Los lugares de la meta son elementos graficos
  // portadores de informacion, no adorno: el punto lleno, el anillo punteado
  // vacio y el corchete tienen que ser perceptibles (1.4.11).
  ['accent', 'surface-raised', 3],
  ['signal-attention', 'surface-base', 4.5],
  // El tooltip de Radix se pinta sobre superficie elevada y su nota al pie usa
  // el gris mas tenue de la escala: es el par mas exigido de los dos temas.
  ['text-secondary', 'surface-raised', 4.5],
  ['text-muted', 'surface-raised', 4.5],

  // Bloque "Que se esta cayendo?". El recorrido de cada cuenta —puntos y
  // barra— es informacion pura, no decoracion. Y la fila cambia a superficie
  // elevada al pasar el raton, asi que hay que medir contra las dos.
  ['signal-good', 'surface-raised', 3],
  ['signal-attention', 'surface-raised', 3],
  ['signal-negative', 'surface-raised', 3],
  ['signal-neutral', 'surface-raised', 3],

  // Bloque "Donde me meto?". La rampa de etapas deja de ser solo color de
  // texto en un distintivo y pasa a ser RELLENO de la barra de carga: cada
  // tramo transmite de que etapa esta hecha esa carga (1.4.11). El canal de
  // la barra es surface-raised.
  ['stage-contacto', 'surface-raised', 3],
  ['stage-calificacion', 'surface-raised', 3],
  ['stage-propuesta', 'surface-raised', 3],
  ['stage-negociacion', 'surface-raised', 3],
];

let failures = 0;
let skipped = 0;

for (const [name, scope] of Object.entries(themes)) {
  console.log(`\nTEMA ${name.toUpperCase()}`);
  for (const [fg, bg, min] of PAIRS) {
    const front = resolve(scope[`--${fg}`], scope);
    const back = resolve(scope[`--${bg}`], scope);
    const ratio = contrast(front, back);

    if (ratio === null) {
      skipped++;
      console.log(`  --  ${`${fg} / ${bg}`.padEnd(36)} no evaluable`);
      continue;
    }
    const ok = ratio >= min;
    if (!ok) failures++;
    console.log(
      `  ${ok ? 'OK' : 'XX'}  ${`${fg} / ${bg}`.padEnd(36)}${ratio.toFixed(2).padStart(6)}:1   minimo ${min}`,
    );
  }
}

console.log('');
if (skipped) console.log(`${skipped} par(es) no evaluables (valor no hexadecimal).`);
if (failures) {
  console.error(`${failures} par(es) por debajo del minimo WCAG AA.`);
  process.exit(1);
}
console.log('Todos los pares cumplen WCAG AA en los dos temas.');
