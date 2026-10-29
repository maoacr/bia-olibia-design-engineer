import React from 'react';
import { ADVANCED, NEW, REGRESSED, STALLED } from './movement.js';

/**
 * Que cambio respecto del periodo anterior.
 *
 * El dashboard de partida mostraba cada periodo como una foto aislada aunque
 * los datos contenian el movimiento. Esto lo pone al frente y ademas lo vuelve
 * navegable: cada recuento filtra la tabla, de modo que el movimiento no es un
 * adorno informativo sino una forma de entrar a los datos.
 */

/** El orden importa: primero lo que pide atencion, despues lo que va bien. */
const KINDS = [
  {
    status: STALLED,
    label: 'sin moverse',
    detail: 'llevan un mes en la misma etapa',
    tone: 'attention',
  },
  { status: NEW, label: 'entraron nuevas', detail: 'no estaban el mes pasado', tone: 'neutral' },
  { status: ADVANCED, label: 'avanzaron', detail: 'subieron al menos una etapa', tone: 'good' },
  { status: REGRESSED, label: 'retrocedieron', detail: 'bajaron de etapa', tone: 'negative' },
];

export default function MovementBar({ summary, previousLabel, active, onSelect }) {
  // Sin periodo anterior no hay nada que comparar, y eso es distinto de que
  // nada se haya movido. Decirlo es mas honesto que mostrar cuatro ceros.
  if (!previousLabel) {
    return (
      <section
        className="panel panel--lead movement"
        aria-label="Movimiento respecto al periodo anterior"
      >
        <h2>Movimiento</h2>
        <p className="muted">
          Este es el periodo más antiguo disponible, así que no hay un mes previo con el cual
          compararlo.
        </p>
      </section>
    );
  }

  const shown = KINDS.filter(kind => summary[kind.status] > 0 || kind.status !== REGRESSED);

  return (
    <section
      className="panel panel--lead movement"
      aria-label="Movimiento respecto al periodo anterior"
    >
      <div className="movement__head">
        <h2>Qué cambió frente a {previousLabel}</h2>
        {active && (
          <button className="movement__clear" onClick={() => onSelect('')}>
            Ver todas
          </button>
        )}
      </div>

      <div className="movement__tiles">
        {shown.map(({ status, label, detail, tone }) => {
          const count = summary[status];
          const selected = active === status;
          return (
            <button
              key={status}
              type="button"
              className={`movement__tile movement__tile--${tone}${selected ? ' is-selected' : ''}`}
              aria-pressed={selected}
              disabled={count === 0}
              onClick={() => onSelect(selected ? '' : status)}
            >
              <span className="movement__count">{count}</span>
              <span className="movement__label">{label}</span>
              <span className="movement__detail">{detail}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Tono y etiqueta de cada estado, compartidos por la tira y la tabla. */
const TAGS = {
  [ADVANCED]: { label: 'avanzó', tone: 'good' },
  [STALLED]: { label: 'sin moverse', tone: 'attention' },
  [NEW]: { label: 'nueva', tone: 'neutral' },
  [REGRESSED]: { label: 'retrocedió', tone: 'negative' },
};

/**
 * Indicador compacto para la tabla.
 *
 * Dice el estado, no la trayectoria: el recorrido completo —de que etapa
 * venia— se reserva para el detalle, que es donde "explorar una oportunidad"
 * tiene que revelar algo que la lista no mostraba.
 */
export function MovementTag({ movement }) {
  if (!movement) return <span className="muted">—</span>;

  const { label, tone } = TAGS[movement.status];
  return <span className={`move-tag move-tag--${tone}`}>{label}</span>;
}

/** Frase de trayectoria para el detalle. */
export function movementSentence(movement) {
  if (!movement) return 'Sin periodo anterior con el cual comparar.';
  if (movement.status === NEW) return `Entró este mes directo a ${movement.to}.`;
  if (movement.status === STALLED) return `Sigue en ${movement.to} desde el mes pasado.`;
  const verb = movement.status === ADVANCED ? 'Avanzó' : 'Retrocedió';
  return `${verb} de ${movement.from} a ${movement.to}.`;
}
