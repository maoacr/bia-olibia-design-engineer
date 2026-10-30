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
 * ALCANCE: periodo completo. El historial es del equipo y no responde a
 * filtros.
 */

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MONTH_NAMES, MONTHLY_GOAL, PERIOD_IDS, periods } from './data.js';

/** Mes abreviado -> id de periodo, para los meses que se pueden visitar. */
const PERIOD_BY_MONTH = PERIOD_IDS.reduce((map, id) => {
  const history = periods[id].history;
  map[history[history.length - 1].month] = id;
  return map;
}, {});

export default function Trend({ period, onSelectPeriod }) {
  const reduceMotion = useReducedMotion();

  const history = period.history;
  const months = history.length;
  const last = history[months - 1];
  const previous = history[months - 2];

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
      <section className="trend" aria-labelledby="trend-question">
        <header className="trend__head">
          <h2 id="trend-question">¿Cómo venimos?</h2>
          <p className="trend__scope">
            Últimos {months} meses · equipo completo, no cambia con los filtros
          </p>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={period.id} {...fade}>
            <p className="trend__verdict">
              {verdict}
              {isBest && deltaText && <span className="trend__delta"> {deltaText}.</span>}
            </p>

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
                                {name}: {h.closed} de {MONTHLY_GOAL} cierres. Sin detalle
                                disponible.
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

            {neverReached && (
              <p className="trend__never">
                Ningún mes de los {months} alcanzó la meta de {MONTHLY_GOAL}. El máximo fue {best},
                en {MONTH_NAMES[bestMonth.month]}.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </Tooltip.Provider>
  );
}
