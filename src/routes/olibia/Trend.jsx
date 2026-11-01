/**
 * Bloque 5 — "Como venimos?"
 *
 * Reemplaza a "Cierres por mes", que dibujaba barras contra una linea de meta
 * punteada. Dos problemas: una barra sugiere magnitud continua cuando un
 * cierre es un evento contable —no se cierran 7,5 negocios— y, sobre todo, el
 * grafico no decia la conclusion que sus propios datos sostienen.
 *
 * La conclusion es esta: EN SIETE MESES LA META DE 10 NUNCA SE ALCANZO. El
 * maximo historico es 8, y es octubre. Eso reencuadra el bloque 1: "faltan 2"
 * no es rutina de fin de mes, es una brecha que el equipo no cerro nunca.
 *
 * Por eso cada mes es una columna de diez lugares, no una barra: los mismos
 * diez lugares de "Vamos a llegar?", extendidos en el tiempo. Un punto es un
 * cierre aqui y alla. Que ninguna columna se llene es el dato.
 *
 * Los dos meses que ademas son periodos navegables se vuelven botones, y eso
 * se deriva del dato —el ultimo mes del historial de cada periodo— en vez de
 * quedar escrito a mano.
 *
 * DIBUJA LA SERIE, NO LA VENTANA. Antes dibujaba `period.history`, que es la
 * ventana de seis meses que TERMINA en el periodo elegido. De ahi salian dos
 * fallas con una sola causa:
 *
 *   · El mes elegido caia siempre en la ultima columna. Al pasar de octubre a
 *     septiembre la caja de seleccion no se movia ni un pixel: lo que se
 *     corria un lugar era el resto del grafico, debajo de ella. Visto en
 *     pantalla, parecia que el clic no habia hecho nada.
 *
 *   · Todo mes POSTERIOR al elegido desaparecia. Desde septiembre, octubre no
 *     existia en el grafico, y no habia forma de volver sin ir al selector de
 *     la banda del pipeline. Un control de navegacion que te lleva a un lugar
 *     del que no se vuelve.
 *
 * Ahora dibuja TIMELINE, la serie completa de siete meses, igual para todos
 * los periodos. La marca se mueve sobre un grafico que se queda quieto, que
 * es lo que hace legible el cambio, y los dos meses navegables estan siempre
 * los dos a la vista.
 *
 * El veredicto habla del mes elegido dentro de la serie entera, y se compara
 * con el mes anterior DE LA SERIE. Por eso desde septiembre dice que el mejor
 * fue octubre: el tablero se mira desde hoy, y que octubre haya cerrado ocho
 * es un hecho del equipo, no una prediccion. Esconderlo seria raro ademas
 * porque la columna de octubre esta ahi dibujada.
 *
 * ALCANCE: periodo completo. El historial es del equipo y no responde a
 * filtros.
 */

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MONTH_NAMES, MONTHLY_GOAL, PERIOD_IDS, TIMELINE, periods } from './data.js';

/** Mes abreviado -> id de periodo, para los meses que se pueden visitar. */
const PERIOD_BY_MONTH = PERIOD_IDS.reduce((map, id) => {
  const history = periods[id].history;
  map[history[history.length - 1].month] = id;
  return map;
}, {});

export default function Trend({ period, onSelectPeriod }) {
  const reduceMotion = useReducedMotion();

  const history = TIMELINE;
  const months = history.length;

  // Donde esta parada la persona dentro de la serie. El mes y el periodo se
  // emparejan por PERIOD_BY_MONTH, que sale de los mismos PERIOD_IDS: el
  // indice siempre existe.
  const at = history.findIndex(h => PERIOD_BY_MONTH[h.month] === period.id);
  const last = history[at];
  const previous = at > 0 ? history[at - 1] : null;

  const best = Math.max(...history.map(h => h.closed));
  const isBest = last.closed === best && history.filter(h => h.closed === best).length === 1;
  const bestMonth = history.find(h => h.closed === best);
  const neverReached = best < MONTHLY_GOAL;

  const delta = previous ? last.closed - previous.closed : 0;
  const deltaText = previous
    ? `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta)} frente a ${MONTH_NAMES[previous.month]}`
    : null;

  const verdict = isBest
    ? `${last.closed} cierres: el mejor de los ${months} meses.`
    : `${last.closed} cierres${deltaText ? `, ${deltaText}` : ''}. El mejor fue ${MONTH_NAMES[bestMonth.month]} con ${best}.`;

  const fade = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.2, ease: [0.2, 0, 0, 1] },
      };

  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={400}>
      <section className="trend" id="q-tendencia" aria-labelledby="trend-question">
        <header className="trend__head">
          <h2 id="trend-question">¿Cómo venimos?</h2>
          <p className="trend__scope">
            Últimos {months} meses · equipo completo, no cambia con los filtros
          </p>
        </header>

        {/* Lo unico que cambia al cambiar de periodo. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.p className="trend__verdict" key={period.id} {...fade}>
            {verdict}
            {isBest && deltaText && <span className="trend__delta"> {deltaText}.</span>}
          </motion.p>
        </AnimatePresence>

        {/* El grafico queda FUERA de la animacion, y es deliberado: ahora es
            la misma serie para los dos periodos, asi que desvanecerlo y
            volver a traerlo seria reemplazar un dibujo por otro identico.
            Quieto, lo unico que se mueve es la caja de seleccion, que se
            desliza de una columna a la otra. Ese desplazamiento ES el acuse
            de recibo del clic, y es exactamente lo que antes faltaba. */}
        <div className="trend__chart">
          <p className="trend__goal">
            <span>meta {MONTHLY_GOAL}</span>
          </p>

          <ol className="trend__months">
            {history.map(h => {
              const target = PERIOD_BY_MONTH[h.month];
              const current = target === period.id;
              const name = MONTH_NAMES[h.month] ?? h.month;

              const column = (
                <>
                  <span className="trend__stack" aria-hidden="true">
                    {Array.from({ length: MONTHLY_GOAL }, (_, i) => (
                      <span
                        key={i}
                        className={`trend__slot ${i < h.closed ? 'is-closed' : 'is-open'}`}
                      />
                    ))}
                  </span>
                  <span className="trend__count">{h.closed}</span>
                  <span className="trend__label">{h.month}</span>
                </>
              );

              // Solo dos de los seis meses existen como periodo navegable.
              // Los demas se muestran, no se visitan: fingir que son
              // botones prometeria algo que el dato no tiene.
              return (
                <li key={h.month} className={current ? 'is-current' : undefined}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      {target ? (
                        <button
                          type="button"
                          className={`trend__month trend__month--link${current ? ' is-current' : ''}`}
                          aria-pressed={current}
                          onClick={() => onSelectPeriod(target)}
                        >
                          {column}
                          <span className="sr-only">
                            {name}: {h.closed} de {MONTHLY_GOAL} cierres.{' '}
                            {current ? 'Periodo en pantalla.' : 'Ver este periodo.'}
                          </span>
                        </button>
                      ) : (
                        <span className="trend__month" tabIndex={0} role="group">
                          {column}
                          <span className="sr-only">
                            {name}: {h.closed} de {MONTHLY_GOAL} cierres. Sin detalle disponible.
                          </span>
                        </span>
                      )}
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="tip"
                        side="top"
                        sideOffset={8}
                        collisionPadding={12}
                      >
                        <strong>
                          {name.charAt(0).toUpperCase() + name.slice(1)} · {h.closed} de{' '}
                          {MONTHLY_GOAL}
                        </strong>
                        <span>
                          {MONTHLY_GOAL - h.closed === 0
                            ? 'Meta alcanzada.'
                            : `Faltaron ${MONTHLY_GOAL - h.closed}.`}
                        </span>
                        <span className="tip__note">
                          {target
                            ? current
                              ? 'Es el periodo que estás viendo.'
                              : 'Clic para ver este periodo.'
                            : 'Sólo hay detalle de los dos meses más recientes.'}
                        </span>
                        <Tooltip.Arrow className="tip__arrow" width={11} height={5} />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Constante: con una sola serie, cual fue el mejor mes y si alguno
            alcanzo la meta ya no dependen del periodo elegido. */}
        {neverReached && (
          <p className="trend__never">
            Ningún mes de los {months} alcanzó la meta de {MONTHLY_GOAL}. El máximo fue {best}, en{' '}
            {MONTH_NAMES[bestMonth.month]}.
          </p>
        )}
      </section>
    </Tooltip.Provider>
  );
}
