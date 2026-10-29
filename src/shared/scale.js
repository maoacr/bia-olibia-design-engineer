/**
 * Escalas derivadas del dato.
 *
 * El starter traia la escala escrita a mano: grilla fija en 0/5/10 y altura
 * `185 - valor * 15`. Con los cierres del mes funcionaba de casualidad, pero
 * al filtrar, el grafico de canales mostraba valores de 0 a 2 sobre una grilla
 * que llegaba a 10: dos barras invisibles y cuatro quintos del panel en aire
 * vacio. Una escala que no sale del dato miente sobre la magnitud.
 */

/**
 * Techo "redondo" y marcas regulares para un conjunto de valores.
 *
 * Elige un paso de 1, 2, 5 o 10 (por la decada que corresponda) de modo que
 * queden unas pocas marcas legibles. Como todo lo que graficamos son conteos,
 * el paso nunca baja de 1: no tiene sentido una marca en "2,5 oportunidades".
 */
export function niceScale(maxValue, targetTicks = 4) {
  const peak = Math.max(maxValue, 1);
  const roughStep = peak / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceStep = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  const step = Math.max(1, Math.round(niceStep * magnitude));
  const max = Math.ceil(peak / step) * step;

  const ticks = [];
  for (let value = 0; value <= max; value += step) ticks.push(value);

  return { max, ticks, step };
}
