/**
 * Bloque 2 — "Que se esta cayendo?"
 *
 * La segunda pregunta de quien es dueño del numero. El starter no la
 * contestaba de ninguna forma: trataba cada periodo como una foto aislada,
 * asi que una cuenta podia llevar meses parada sin que nada lo dijera.
 *
 * La tira de recuentos que habia antes —"1 sin moverse · 2 nuevas · 5
 * avanzaron"— lo AFIRMABA. Esto lo MUESTRA: cada cuenta dibuja su recorrido
 * sobre el embudo, de la etapa donde estaba a la etapa donde esta. La que no
 * se movio es la unica sin recorrido, un punto solo entre lineas que viajan.
 * No hay que creerle al numero: se ve.
 *
 * El orden es el mismo criterio que ya usaba la tira: primero lo que pide
 * atencion, despues lo que va bien.
 *
 * ALCANCE: recibe el periodo COMPLETO, nunca lo filtrado. Es una alerta, y
 * una alerta que un filtro puede silenciar no sirve: si filtraras por "Ana",
 * la cuenta trabada —que es de Mateo— desapareceria y el bloque diria que no
 * hay nada parado.
 *
 * SEPTIEMBRE: no tiene periodo previo. Que no haya con que comparar es
 * distinto de que nada se haya movido, y la interfaz no puede confundirlas
 * —el mismo principio que ya sostiene movement.js.
 *
 * ALTO EN MOVIL: 759px a 390px de ancho, el bloque mas alto de los cinco, y
 * se queda asi a proposito. Las ocho filas no son una lista larga que
 * convenga recortar: son el argumento. El punto solo de la cuenta trabada se
 * lee como trabado PORQUE a su alrededor hay siete lineas que viajan.
 * Esconder esas siete tras un "ver las 8" dejaria el punto sin nada contra
 * que leerse, y entonces habria que creerle al color —que es exactamente la
 * tira de recuentos que este bloque vino a reemplazar.
 *
 * Medido antes de decidir: 0.90 de viewport, entra en una pantalla, sin
 * desborde horizontal y sin ningun control por debajo de 44px. Es el mas
 * alto porque es el unico con ocho items comparables; los demas tienen entre
 * tres y cinco. Eso es consecuencia del dato, no un defecto de densidad.
 */

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { STAGES } from './data.js';
import { ADVANCED, NEW, REGRESSED, STALLED, stageIndex } from './movement.js';
import { movementSentence } from './Movement.jsx';

const money = value => `$${value} M`;

/** Etiqueta corta para pantalla angosta, donde los nombres completos no entran. */
const SHORT_STAGE = {
  Contacto: 'Cont.',
  Calificación: 'Calif.',
  Propuesta: 'Prop.',
  Negociación: 'Negoc.',
};

/** Tono por estado. Mismo mapa que usan la tira y la tabla. */
const TONE = {
  [STALLED]: 'attention',
  [REGRESSED]: 'negative',
  [ADVANCED]: 'good',
  [NEW]: 'neutral',
};

/** Primero lo que pide atencion, despues lo que va bien. */
const RANK = { [STALLED]: 0, [REGRESSED]: 1, [ADVANCED]: 2, [NEW]: 3 };

/** Centro de una etapa, en porcentaje del ancho del riel. */
const center = index => ((index + 0.5) / STAGES.length) * 100;

export default function Stalled({ period, previous, opportunities, onSelect }) {
  const reduceMotion = useReducedMotion();

  if (!previous) {
    return (
      <section className="stall stall--void" id="q-trabadas" aria-labelledby="stall-question">
        <header className="stall__head">
          <h2 id="stall-question">¿Qué se está cayendo?</h2>
          <p className="stall__scope">{period.label}</p>
        </header>
        <p className="stall__verdict">
          {period.label} es el periodo más antiguo que tenemos: no hay un mes previo con el cual
          compararlo.
        </p>
        <p className="stall__note">
          Que no haya con qué comparar no es lo mismo que decir que nada se movió.
        </p>
      </section>
    );
  }

  const rows = opportunities
    .filter(o => o.movement)
    .sort(
      (a, b) =>
        RANK[a.movement.status] - RANK[b.movement.status] ||
        stageIndex(a.movement.to) - stageIndex(b.movement.to) ||
        b.value - a.value,
    );

  const stuck = rows.filter(o => o.movement.status === STALLED);
  const back = rows.filter(o => o.movement.status === REGRESSED);

  // Una linea de prosa, y solo la que el dibujo no dice solo: cual es, y
  // desde cuando. El resto —que las demas si se movieron— ya se ve.
  const verdict =
    back.length > 0
      ? `${back.length === 1 ? `${back[0].company} retrocedió` : `${back.length} cuentas retrocedieron`} de etapa.`
      : stuck.length === 0
        ? 'Nada quedó parado: todas las cuentas se movieron.'
        : stuck.length === 1
          ? `${stuck[0].company} sigue en ${stuck[0].movement.to} desde ${previous.label.split(' ')[0].toLowerCase()}.`
          : `${stuck.length} cuentas siguen donde estaban en ${previous.label.split(' ')[0].toLowerCase()}.`;

  const healthy = stuck.length === 0 && back.length === 0;

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
      <section
        className={`stall${healthy ? ' stall--healthy' : ''}`}
        id="q-trabadas"
        aria-labelledby="stall-question"
      >
        <header className="stall__head">
          <h2 id="stall-question">¿Qué se está cayendo?</h2>
          <p className="stall__scope">
            {period.label} frente a {previous.label} · periodo completo, no cambia con los filtros
          </p>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={period.id} {...fade}>
            <p className={`stall__verdict${healthy ? ' stall__verdict--good' : ''}`}>{verdict}</p>

            <div className="rail">
              {/* El eje copia la estructura de una fila: misma columna de
                  nombre, y las cuatro etapas dentro de UN solo hijo. Asi ese
                  hijo ocupa exactamente el mismo ancho que el riel, y como no
                  lleva separacion entre columnas, el centro de cada etiqueta
                  cae justo en el 12.5 / 37.5 / 62.5 / 87.5 % que usan los
                  puntos. Con separacion, el eje se corria 3px en los extremos. */}
              <div className="rail__axis" aria-hidden="true">
                <span className="rail__name" />
                <span className="rail__stages">
                  {STAGES.map(stage => (
                    <span className="rail__stage" key={stage}>
                      <span className="rail__stage-long">{stage}</span>
                      <span className="rail__stage-short">{SHORT_STAGE[stage]}</span>
                    </span>
                  ))}
                </span>
              </div>

              <ul className="rail__rows">
                {rows.map(o => {
                  const { status, from, to } = o.movement;
                  const tone = TONE[status];
                  const a = from ? stageIndex(from) : stageIndex(to);
                  const b = stageIndex(to);
                  const travels = b !== a;

                  return (
                    <li key={o.id}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <button
                            type="button"
                            className={`rail__row rail__row--${tone}`}
                            onClick={() => onSelect(o)}
                          >
                            <span className="rail__name">{o.company}</span>
                            <span className="rail__track" aria-hidden="true">
                              <span className="rail__line" />
                              {travels && (
                                <>
                                  <span className="rail__from" style={{ left: `${center(a)}%` }} />
                                  <span
                                    className="rail__move"
                                    style={{
                                      left: `${center(a)}%`,
                                      width: `${center(b) - center(a)}%`,
                                    }}
                                  />
                                </>
                              )}
                              {/* Una cuenta nueva tambien se dibuja como un
                                  punto solo, igual que una trabada, y entrar no
                                  es lo mismo que estar parado: Industrias Atlas
                                  entra directo en Negociacion con $78 M, que es
                                  buena noticia. La punta de entrada lo separa
                                  por FORMA, que se lee antes que el color.
                                  No es proporcional a propósito: la cuenta no
                                  recorrio el embudo, aterrizo donde esta. */}
                              {status === NEW && (
                                <span className="rail__enter" style={{ left: `${center(b)}%` }} />
                              )}
                              <span className="rail__to" style={{ left: `${center(b)}%` }} />
                            </span>
                            {/* El lector de pantalla no ve el riel: recibe la
                                misma trayectoria como frase, con la redaccion
                                que ya usa el detalle. */}
                            <span className="sr-only">
                              {movementSentence(o.movement)} {money(o.value)}. {o.owner}.
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
                            <strong>{o.company}</strong>
                            <span>{movementSentence(o.movement)}</span>
                            <span>
                              {money(o.value)} · {o.owner}
                            </span>
                            <Tooltip.Arrow className="tip__arrow" width={11} height={5} />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>
    </Tooltip.Provider>
  );
}
