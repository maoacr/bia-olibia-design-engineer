/**
 * Bloque 4 — "De donde viene el valor?"
 *
 * Reemplaza a "Origen de oportunidades abiertas", que contaba CUENTAS. Por
 * eso decia Outbound 3 = Referidos 3 y empujaba a la conclusion exactamente
 * contraria a la que el dato sostiene: referidos trae la misma cantidad de
 * cuentas pero el doble de plata, y es el unico canal que llega al final del
 * embudo. Contar cuentas iguala lo que no es igual.
 *
 * Aqui la plata de cada canal se ubica SOBRE el embudo, en la etapa donde hoy
 * esta parada. El eje es el mismo de "Que se esta cayendo?": los dos bloques
 * leen el embudo de izquierda a derecha, asi que se miran igual.
 *
 * Eso muestra de un golpe las dos mitades de la respuesta:
 *   · de donde viene lo bueno — la plata de referidos esta a la derecha
 *   · que no esta funcionando — la de outbound no se despega de la izquierda
 *
 * Las celdas pasada el techo de cada canal van PUNTEADAS, el mismo signo que
 * en "Vamos a llegar?" marca lo que todavia no ocurrio. Y se distinguen de
 * una celda vacia por debajo del techo, que significa algo distinto y mejor:
 * el canal paso por ahi y ya no le queda nada detenido.
 *
 * ALCANCE: periodo completo, sin filtrar. De donde viene el valor es un hecho
 * del mes, no de la vista.
 */

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CHANNELS, STAGE_SLUG, STAGES } from './data.js';
import { stageIndex } from './movement.js';

const money = value => `$${value} M`;

const SHORT_STAGE = {
  Contacto: 'Cont.',
  Calificación: 'Calif.',
  Propuesta: 'Prop.',
  Negociación: 'Negoc.',
};

export default function Origin({ period, opportunities, activeChannel, onSelectChannel }) {
  const reduceMotion = useReducedMotion();

  const total = opportunities.reduce((sum, o) => sum + o.value, 0);

  const rows = CHANNELS.map(channel => {
    const open = opportunities.filter(o => o.channel === channel);
    const byStage = STAGES.map(stage =>
      open.filter(o => o.stage === stage).reduce((sum, o) => sum + o.value, 0),
    );
    return {
      channel,
      open,
      value: open.reduce((sum, o) => sum + o.value, 0),
      byStage,
      // Hasta donde llego este canal. -1 cuando no tiene ninguna cuenta: no
      // es lo mismo que haberse quedado en Contacto.
      reach: open.length ? Math.max(...open.map(o => stageIndex(o.stage))) : -1,
    };
  }).sort((a, b) => b.value - a.value);

  // Una sola escala para las doce celdas: comparar entre canales Y entre
  // etapas es justamente el punto.
  const maxCell = Math.max(1, ...rows.flatMap(r => r.byStage));

  const top = rows[0];
  const furthest = Math.max(...rows.map(r => r.reach));
  const reachers = rows.filter(r => r.reach === furthest);
  const topIsSoleReacher = reachers.length === 1 && reachers[0].channel === top.channel;

  const share = total ? Math.round((top.value / total) * 100) : 0;
  const verdict =
    `${top.channel} trae ${top.open.length} de ${opportunities.length} cuentas pero el ${share} % del valor` +
    (topIsSoleReacher ? ` — y es el único que llega a ${STAGES[furthest]}.` : '.');

  // El techo bajo de un canal con varias cuentas es la otra mitad de la
  // respuesta, y no se deduce del largo de las barras.
  const capped = rows.find(r => r.open.length >= 2 && r.reach >= 0 && r.reach <= 1);

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
      <section className="origin" id="q-origen" aria-labelledby="origin-question">
        <header className="origin__head">
          <h2 id="origin-question">¿De dónde viene el valor?</h2>
          <p className="origin__scope">
            {period.label} · equipo completo, no cambia con los filtros
          </p>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={period.id} {...fade}>
            <p className="origin__verdict">{verdict}</p>

            {/* Mismo truco de sangria que el riel del bloque 2: el eje replica
                el relleno y el borde de la fila para que las etiquetas caigan
                sobre las celdas y no 9px al costado. */}
            <div className="origin__axis" aria-hidden="true">
              <span className="origin__name" />
              <span className="origin__cells">
                {STAGES.map(stage => (
                  <span className="origin__stage" key={stage}>
                    <span className="origin__stage-long">{stage}</span>
                    <span className="origin__stage-short">{SHORT_STAGE[stage]}</span>
                  </span>
                ))}
              </span>
              <span className="origin__value" />
            </div>

            <ul className="origin__rows">
              {rows.map(r => {
                const selected = activeChannel === r.channel;
                return (
                  <li key={r.channel}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          type="button"
                          className={`origin__row${selected ? ' is-selected' : ''}`}
                          aria-pressed={selected}
                          onClick={() => onSelectChannel(selected ? '' : r.channel)}
                        >
                          <span className="origin__name">{r.channel}</span>

                          <span className="origin__cells" aria-hidden="true">
                            {STAGES.map((stage, i) => (
                              <span
                                key={stage}
                                className={`origin__cell${i > r.reach ? ' is-unreached' : ''}`}
                              >
                                {r.byStage[i] > 0 && (
                                  <span
                                    className={`origin__fill origin__fill--${STAGE_SLUG[stage]}`}
                                    style={{ width: `${(r.byStage[i] / maxCell) * 100}%` }}
                                  />
                                )}
                              </span>
                            ))}
                          </span>

                          <span className="origin__value">{money(r.value)}</span>

                          <span className="sr-only">
                            {r.open.length === 1 ? '1 cuenta' : `${r.open.length} cuentas`},{' '}
                            {money(r.value)}, {total ? Math.round((r.value / total) * 100) : 0} %
                            del pipeline.{' '}
                            {r.reach < 0
                              ? 'Sin cuentas abiertas.'
                              : `Llega hasta ${STAGES[r.reach]}.`}{' '}
                            {selected ? 'Filtro activo.' : 'Filtrar por este canal.'}
                          </span>
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="tip"
                          side="top"
                          sideOffset={8}
                          collisionPadding={12}
                        >
                          <strong>{r.channel}</strong>
                          {r.open.length === 0 ? (
                            <span>Sin cuentas abiertas.</span>
                          ) : (
                            r.open
                              .slice()
                              .sort((a, b) => stageIndex(b.stage) - stageIndex(a.stage))
                              .map(o => (
                                <span key={o.id}>
                                  {o.company} · {o.stage} · {money(o.value)}
                                </span>
                              ))
                          )}
                          <span className="tip__note">
                            {selected
                              ? 'Clic para quitar el filtro.'
                              : 'Clic para ver solo este canal.'}
                          </span>
                          <Tooltip.Arrow className="tip__arrow" width={11} height={5} />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </li>
                );
              })}
            </ul>

            {capped && (
              <p className="origin__capped">
                {capped.channel} trae {capped.open.length} cuentas y ninguna pasa de{' '}
                {STAGES[capped.reach]}.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </Tooltip.Provider>
  );
}
