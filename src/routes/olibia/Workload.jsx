/**
 * Bloque 3 — "Donde me meto?"
 *
 * Reemplaza al grafico de "Cierres por ejecutivo", que MIENTE POR OMISION.
 * Ese grafico muestra una sola columna —cuantos cerro cada uno— y con Mateo
 * en 1 contra los 3 de Ana te manda a reclamarle al que menos cerro. Lo que
 * no dice es que Mateo carga $96 M, el pipeline mas pesado del equipo, y la
 * unica cuenta trabada. No cerro poco: le toco lo dificil.
 *
 * Aqui conviven en la misma fila las dos magnitudes: lo CERRADO y lo que
 * queda ABIERTO. Un punto por cierre —el mismo simbolo que en "Vamos a
 * llegar?", donde un cierre tambien es un punto— y una barra de carga partida
 * por etapa, con la rampa de color que ya usan los distintivos de la tabla.
 * Ningun vocabulario nuevo.
 *
 * La barra no solo mide: su composicion dice la CALIDAD de la carga. La de
 * Mateo es 81% negociacion, que es lo mas cerca del cierre; la trabada va
 * rayada, para que no dependa solo del color.
 *
 * El orden es por carga descendente. Es un criterio neutro y explicable, y en
 * octubre pone arriba justo a quien hay que mirar.
 *
 * ALCANCE: periodo completo, sin filtrar. Los cierres por ejecutivo son del
 * periodo y no responden a filtros; la carga tiene que medirse igual o la
 * comparacion seria entre dos cosas distintas.
 */

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { STAGE_SLUG, TEAM } from './data.js';
import { STALLED, stageIndex } from './movement.js';

const money = value => `$${value} M`;

export default function Workload({ period, opportunities, activeOwner, onSelectOwner }) {
  const reduceMotion = useReducedMotion();

  const people = TEAM.map(owner => {
    const closed = period.closesByOwner.find(c => c.owner === owner)?.closed ?? 0;
    // Del contacto hacia el cierre: la barra se lee de izquierda a derecha
    // como se lee el embudo.
    const open = opportunities
      .filter(o => o.owner === owner)
      .sort((a, b) => stageIndex(a.stage) - stageIndex(b.stage));
    return {
      owner,
      closed,
      open,
      load: open.reduce((sum, o) => sum + o.value, 0),
      stalled: open.filter(o => o.movement?.status === STALLED),
    };
  }).sort((a, b) => b.load - a.load || b.closed - a.closed);

  const maxLoad = Math.max(1, ...people.map(p => p.load));
  const first = people[0];

  // El desajuste solo existe si hay dispersion de cierres: con todos iguales,
  // "el que menos cerro" no significa nada.
  const closes = people.map(p => p.closed);
  const spread = new Set(closes).size > 1;
  const mismatch = spread && first.closed === Math.min(...closes);

  const verdict = mismatch
    ? `${first.owner} cerró ${first.closed} —el que menos— y carga ${money(first.load)}, el pipeline más pesado.`
    : `${first.owner} carga el pipeline más pesado: ${money(first.load)}.`;

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
      <section className="load" id="q-equipo" aria-labelledby="load-question">
        <header className="load__head">
          <h2 id="load-question">¿Dónde me meto?</h2>
          <p className="load__scope">{period.label} · equipo completo, no cambia con los filtros</p>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={period.id} {...fade}>
            <p className={`load__verdict${mismatch ? ' load__verdict--attention' : ''}`}>
              {verdict}
            </p>

            <div className="load__axis" aria-hidden="true">
              <span className="load__name" />
              <span className="load__closes">cerró</span>
              <span className="load__bar">carga abierta</span>
              <span className="load__value" />
            </div>

            <ul className="load__rows">
              {people.map(p => {
                const selected = activeOwner === p.owner;
                return (
                  <li key={p.owner}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          type="button"
                          className={`load__row${selected ? ' is-selected' : ''}`}
                          aria-pressed={selected}
                          onClick={() => onSelectOwner(selected ? '' : p.owner)}
                        >
                          <span className="load__name">{p.owner}</span>

                          <span className="load__closes">
                            {Array.from({ length: p.closed }, (_, i) => (
                              <span key={i} className="load__dot" aria-hidden="true" />
                            ))}
                            {p.closed === 0 && <span className="load__none">—</span>}
                          </span>

                          <span className="load__bar" aria-hidden="true">
                            <span
                              className="load__fill"
                              style={{ width: `${(p.load / maxLoad) * 100}%` }}
                            >
                              {p.open.map(o => (
                                <span
                                  key={o.id}
                                  className={`load__seg load__seg--${STAGE_SLUG[o.stage]}${
                                    o.movement?.status === STALLED ? ' is-stalled' : ''
                                  }`}
                                  style={{ flex: o.value }}
                                />
                              ))}
                            </span>
                          </span>

                          <span className="load__value">
                            {money(p.load)}
                            {p.stalled.length > 0 && (
                              <span className="load__flag" aria-hidden="true">
                                ⚠
                              </span>
                            )}
                          </span>

                          {/* La barra no existe para un lector de pantalla:
                              recibe los mismos hechos como frase. */}
                          <span className="sr-only">
                            Cerró {p.closed}. Carga {money(p.load)} en{' '}
                            {p.open.length === 1
                              ? '1 oportunidad'
                              : `${p.open.length} oportunidades`}
                            {p.stalled.length > 0
                              ? `, incluida ${p.stalled.map(o => o.company).join(' y ')} sin moverse.`
                              : '.'}{' '}
                            {selected ? 'Filtro activo.' : 'Filtrar por esta persona.'}
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
                          <strong>{p.owner}</strong>
                          {p.open.length === 0 ? (
                            <span>Sin oportunidades abiertas.</span>
                          ) : (
                            p.open.map(o => (
                              <span key={o.id}>
                                {o.company} · {o.stage} · {money(o.value)}
                                {o.movement?.status === STALLED ? ' · sin moverse' : ''}
                              </span>
                            ))
                          )}
                          <span className="tip__note">
                            {selected
                              ? 'Clic para quitar el filtro.'
                              : 'Clic para ver solo sus oportunidades.'}
                          </span>
                          <Tooltip.Arrow className="tip__arrow" width={11} height={5} />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </AnimatePresence>
      </section>
    </Tooltip.Provider>
  );
}
