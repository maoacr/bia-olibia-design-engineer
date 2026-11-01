/**
 * Formato de cifras.
 *
 * Colombia separa los miles con punto y los decimales con coma: 7.500 kWh,
 * $6.000.000, 18,0%. El `Intl` de `es-CO` ya hace las dos cosas, pero deja
 * un espacio entre el signo y el numero ("$ 6.000.000"), y en una tabla de
 * cifras ese espacio desplaza la columna. Por eso el peso se arma a mano
 * sobre el numero formateado.
 */

const DECIMAL = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

const PORCENTAJE = new Intl.NumberFormat('es-CO', {
  style: 'percent',
  maximumFractionDigits: 1,
});

/** $6.000.000 */
export const pesos = valor => `$${DECIMAL.format(valor)}`;

/** 7.500 kWh */
export const kwh = valor => `${DECIMAL.format(valor)} kWh`;

/** 42,9% */
export const porcentaje = valor => PORCENTAJE.format(valor);

/** 1.200 — con el signo delante si es negativo: -150 */
export const numero = valor =>
  valor < 0 ? `−${DECIMAL.format(Math.abs(valor))}` : DECIMAL.format(valor);

/** +42,9% o −3,1%: el signo va adelante, como en un tablero. */
export const porcentajeConSigno = valor =>
  `${valor > 0 ? '+' : valor < 0 ? '−' : ''}${PORCENTAJE.format(Math.abs(valor))}`;
