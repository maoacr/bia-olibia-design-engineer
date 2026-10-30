/**
 * Bloque 1 — "Vamos a llegar?"
 *
 * Es la primera pregunta de quien es dueño del numero, y la unica que tiene
 * que contestarse en tres segundos. El starter mostraba "Cierres del mes: 8"
 * y "Meta comercial: 80%" en dos tarjetas separadas: obliga a hacer la resta
 * a mano y, peor, no dice NADA sobre si hay con que cerrar lo que falta.
 *
 * Aqui los diez cierres de la meta son diez lugares. Los ocupados son los
 * cierres hechos; los vacios, lo que falta. Debajo de los vacios van las
 * cuentas que podrian ocuparlos: las que estan en Negociacion, la etapa mas
 * cerca del cierre.
 *
 * El caso que justifica el diseño es septiembre: faltan cuatro y no hay
 * NINGUNA cuenta en negociacion. Los lugares vacios se quedan sin candidatos
 * y eso se ve, sin que haya que escribirlo. La misma estructura que
 * tranquiliza en octubre alarma en septiembre. El estado vacio no es un caso
 * borde que hay que cubrir: es la pantalla mas informativa de las dos.
 *
 * ALCANCE: la meta y los cierres son del equipo y NO responden a los filtros.
 * Por eso este bloque recibe las oportunidades del periodo COMPLETO, nunca las
 * filtradas. Si al filtrar por "Ana" desaparecieran los candidatos, el bloque
 * estaria mintiendo sobre el mes.
 *
 * Los lugares vacios van punteados a proposito: un candidato en negociacion es
 * lo mas cerca del cierre que hay, no un cierre. La forma lo dice sin prosa.
 */

import React, { useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MONTHLY_GOAL, STAGES } from './data.js';
import { stageIndex } from './movement.js';

const NEGOTIATION = STAGES[STAGES.length - 1];

const money = value => `$${value} M`;

/** Concordancia de numero, para no escribir "1 cuentas". */
const plural = (count, singular, many) => `${count} ${count === 1 ? singular : many}`;

/**
 * La cuenta que mas lejos llego en el embudo. Solo se usa cuando no hay
 * ninguna en negociacion: decir "no hay candidatos" y callarse deja a la
 * persona sin nada que hacer. Decirle donde esta lo mas avanzado le da el
 * siguiente paso.
 */
function furthestAlong(opportunities) {
  return opportunities.reduce((best, o) => {
    if (!best) return o;
    const gap = stageIndex(o.stage) - stageIndex(best.stage);
    return gap > 0 || (gap === 0 && o.value > best.value) ? o : best;
  }, null);
}

export default function Goal({ period, opportunities, onSelect }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(null);

  const closed = period.closed;
  const remaining = Math.max(0, MONTHLY_GOAL - closed);

  // Mayor valor primero: si no alcanzan para todos los lugares vacios, importa
  // cual de las candidatas pesa mas.
  const candidates = opportunities
    .filter(o => o.stage === NEGOTIATION)
    .sort((a, b) => b.value - a.value);

  // Solo las que tienen un lugar donde entrar se dibujan contra la meta. El
  // resto, si lo hubiera, se nombra aparte en vez de inventarle un hueco.
  const seated = candidates.slice(0, remaining);
  const spare = candidates.length - seated.length;
  const inPlay = candidates.reduce((sum, o) => sum + o.value, 0);

  const reached = remaining === 0;
  const uncovered = !reached && candidates.length === 0;
  const fallback = uncovered ? furthestAlong(opportunities) : null;

  // Una sola linea de prosa, y solo la que la forma no puede decir sola: la
  // relacion entre lo que falta y lo que hay para cubrirlo.
  const verdict = reached
    ? 'Meta cumplida.'
    : uncovered
      ? 'Ninguna oportunidad llegó a negociación.'
      : candidates.length === remaining
        ? 'Justo las que faltan están en negociación.'
        : candidates.length > remaining
          ? `${plural(candidates.length, 'cuenta', 'cuentas')} en negociación para ${remaining} lugares.`
          : `Sólo ${plural(candidates.length, 'cuenta', 'cuentas')} en negociación para los ${remaining} que faltan.`;

  const trackLabel = reached
    ? `Meta cumplida: ${closed} de ${MONTHLY_GOAL} cierres.`
    : `${closed} de ${MONTHLY_GOAL} cierres. Faltan ${remaining}.`;

  // Entrada y salida al cambiar de periodo. Motion desactiva su propio
  // movimiento cuando el sistema pide movimiento reducido; aqui ademas se
  // anula la duracion para que el cambio sea instantaneo y no "rapido".
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
        className={`goal${uncovered ? ' goal--alert' : ''}${reached ? ' goal--reached' : ''}`}
        id="q-meta"
        aria-labelledby="goal-question"
      >
        <header className="goal__head">
          <h2 id="goal-question">¿Vamos a llegar?</h2>
          <p className="goal__scope">{period.label} · equipo completo, no cambia con los filtros</p>
        </header>

        <div className="goal__meter">
          <div
            className="goal__track"
            style={{ '--goal-slots': MONTHLY_GOAL }}
            role="img"
            aria-label={trackLabel}
          >
            {Array.from({ length: MONTHLY_GOAL }, (_, index) => {
              const isClosed = index < closed;
              const candidate = isClosed ? null : (seated[index - closed] ?? null);
              const isActive = candidate != null && active === candidate.id;

              return (
                <span
                  key={index}
                  aria-hidden="true"
                  className={[
                    'goal__slot',
                    isClosed ? 'is-closed' : 'is-open',
                    candidate ? 'has-candidate' : '',
                    isActive ? 'is-active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  // Apuntar un lugar vacio enciende su candidata. Es un detalle
                  // de mouse: la via con teclado es el boton de la candidata,
                  // que hace lo mismo al recibir foco.
                  onMouseEnter={() => candidate && setActive(candidate.id)}
                  onMouseLeave={() => candidate && setActive(null)}
                />
              );
            })}

            {remaining > 0 && (
              <span
                aria-hidden="true"
                className="goal__bracket"
                style={{ gridColumn: `${closed + 1} / span ${remaining}` }}
              />
            )}
          </div>

          <p className="goal__count">
            <strong>{closed}</strong>
            <span>de {MONTHLY_GOAL} cierres</span>
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={period.id} className="goal__answer" {...fade}>
            <p className="goal__verdict">{verdict}</p>

            {seated.length > 0 && (
              <ul className="goal__candidates">
                {seated.map(o => (
                  <li key={o.id}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          type="button"
                          className={`goal__candidate${active === o.id ? ' is-active' : ''}`}
                          onClick={() => onSelect(o)}
                          onMouseEnter={() => setActive(o.id)}
                          onMouseLeave={() => setActive(null)}
                          onFocus={() => setActive(o.id)}
                          onBlur={() => setActive(null)}
                        >
                          <span className="goal__candidate-name">{o.company}</span>
                          <span className="goal__candidate-value">{money(o.value)}</span>
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        {/* Abre hacia abajo: por defecto Radix lo pone arriba y
                            ahi tapa los lugares vacios, que son justamente lo
                            que la ficha esta señalando. */}
                        <Tooltip.Content
                          className="tip"
                          side="bottom"
                          sideOffset={8}
                          collisionPadding={12}
                        >
                          <strong>{o.company}</strong>
                          <span>
                            {o.owner} · próximo contacto {o.nextContact}
                          </span>
                          <span className="tip__note">
                            Negociación es la etapa más cerca del cierre, no una garantía.
                          </span>
                          <Tooltip.Arrow className="tip__arrow" width={11} height={5} />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </li>
                ))}
              </ul>
            )}

            {spare > 0 && (
              <p className="goal__spare">
                Hay {plural(spare, 'cuenta más', 'cuentas más')} en negociación por encima de la
                meta.
              </p>
            )}

            {inPlay > 0 && (
              <p className="goal__inplay">
                <strong>{money(inPlay)}</strong> en juego
              </p>
            )}

            {uncovered && fallback && (
              <p className="goal__fallback">
                Lo más avanzado está en {fallback.stage}:{' '}
                <button type="button" className="linkish" onClick={() => onSelect(fallback)}>
                  {fallback.company} · {money(fallback.value)}
                </button>
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </Tooltip.Provider>
  );
}
