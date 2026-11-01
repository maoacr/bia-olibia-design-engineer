import React, { useEffect, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useReducedMotion } from 'motion/react';
import { MONTHS } from './data.js';
import { kwh, pesos, porcentaje } from './format.js';

/**
 * EL NUMERO QUE SUBE.
 *
 * Una sola vez, y solo en la cifra que duele: el total de la factura. Es
 * la unica animacion de la pagina -- todo lo demas es calma -- y con
 * movimiento reducido no arranca: el numero aparece ya final, sin cuenta
 * atras.
 */
function useCountUp(valor, duracion = 700) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? valor : 0);

  useEffect(() => {
    if (reduce) {
      setN(valor);
      return undefined;
    }
    let frame;
    const inicio = performance.now();
    const paso = ahora => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      // Salida suave: rapido al principio, lento al final. Linear se siente
      // como una maquina; esto se siente como una cifra que aterriza.
      const suave = 1 - (1 - t) ** 3;
      setN(Math.round(valor * suave));
      if (t < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [valor, duracion, reduce]);

  return n;
}

/** Un candado de cuatro trazos: la tarifa que no se movio. */
function Candado() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <rect x="3" y="7" width="10" height="7" rx="1.6" fill="currentColor" />
      <path
        d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * EL VEREDICTO.
 *
 * La primera pregunta de quien abre la pagina no es "cuanto me subio",
 * aunque esa sea la que trae: es "por que". Y la respuesta corta no es un
 * numero, es que la tarifa no cambio. Si la pagina arrancara con un "+25%"
 * pelado, la lectura seria "me encarecieron el kWh", que es falso: el
 * 100% del alza es consumo.
 *
 * La cascada enseña la multiplicacion sin explicarla. Dos columnas: la de
 * septiembre y la de octubre, con el nivel de septiembre dibujado en la
 * segunda con una linea punteada y el tramo de encima en acento. Ese
 * tramo es CONSUMO que se sumo, no un precio que subio. Y el tooltip de
 * cada pieza dice la cuenta entera: kWh por tarifa.
 */
export default function Veredicto({ report }) {
  const { previousBill, currentBill, deltaBill, previousKwh, currentKwh, deltaKwh, tariff } =
    report;

  const total = useCountUp(currentBill);

  // La parte que ya estaba (septiembre) y la que se sumo (octubre), como
  // fracciones de la barra de octubre. La barra de septiembre es la misma
  // parte: por eso las dos columnas arrancan a la misma altura.
  const base = previousBill / currentBill;

  return (
    <section className="bloque veredicto" id="q-que-paso" aria-labelledby="veredicto-titulo">
      <header className="bloque__head">
        <h2 id="veredicto-titulo">¿Qué pasó?</h2>
        <p className="bloque__scope">Factura de energía · {MONTHS.current.full}</p>
      </header>

      <div className="veredicto__cifras">
        <p className="veredicto__total">
          <span className="veredicto__total-valor">{pesos(total)}</span>
          <span className="veredicto__total-pie">la factura de este mes</span>
        </p>
        <p className="veredicto__comparacion">
          <span>
            contra {pesos(previousBill)} en {MONTHS.previous.label.toLowerCase()}
          </span>
          <span className="veredicto__delta">
            +{pesos(deltaBill)} · +{porcentaje(report.deltaPercent)}
          </span>
        </p>
      </div>

      <p className="veredicto__plano">
        La tarifa no cambió: {pesos(tariff)} el kWh en los dos meses. Subió lo que gastamos, no lo
        que pagamos.
      </p>

      <Tooltip.Provider delayDuration={200} skipDelayDuration={400}>
        <div className="cascada" style={{ '--base': base }}>
          <div className="cascada__col">
            <p className="cascada__cifra">{pesos(previousBill)}</p>
            <div className="cascada__pila">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className="cascada__barra cascada__barra--base"
                    style={{ '--parte': base }}
                    aria-label={`Ver como se calculo la factura de ${MONTHS.previous.label.toLowerCase()}`}
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="tip" sideOffset={8}>
                    <strong>{MONTHS.previous.label}</strong>
                    {kwh(previousKwh)} × {pesos(tariff)} = {pesos(previousBill)}
                    <Tooltip.Arrow className="tip__arrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
            <p className="cascada__mes">{MONTHS.previous.label}</p>
          </div>

          <div className="cascada__col">
            <p className="cascada__cifra">{pesos(currentBill)}</p>
            <div className="cascada__pila cascada__pila--guia">
              {/* El tramo que se sumo va PRIMERO en el DOM: la pila se arma
                  de abajo hacia arriba, asi que lo primero es lo de arriba.
                  Al reves, el alza queda abajo y la cascada cuenta otra
                  historia. */}
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className="cascada__barra cascada__barra--delta"
                    style={{ '--parte': 1 - base }}
                    aria-label="Ver el consumo que se sumo"
                  >
                    <span className="cascada__delta">+{pesos(deltaBill)}</span>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="tip" sideOffset={8}>
                    <strong>Lo que se sumó</strong>
                    {kwh(deltaKwh)} más, a {pesos(tariff)} el kWh: +{pesos(deltaBill)}. Todo
                    consumo.
                    <Tooltip.Arrow className="tip__arrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className="cascada__barra cascada__barra--base"
                    style={{ '--parte': base }}
                    aria-label="Ver el consumo que ya estaba en septiembre"
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="tip" sideOffset={8}>
                    <strong>Lo que ya estaba</strong>
                    Los mismos {kwh(previousKwh)} de {MONTHS.previous.label.toLowerCase()}, cobrados
                    a {pesos(tariff)}: {pesos(previousBill)}.
                    <Tooltip.Arrow className="tip__arrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
            <p className="cascada__mes">{MONTHS.current.label}</p>
          </div>
        </div>
      </Tooltip.Provider>

      <p className="cascada__tarifa">
        <span className="cascada__tarifa-clave">
          <Candado />
          Tarifa
        </span>
        <span className="cascada__tarifa-valor">{pesos(tariff)} el kWh</span>
        <span className="cascada__tarifa-nota">sin cambio entre los dos meses</span>
      </p>
    </section>
  );
}
