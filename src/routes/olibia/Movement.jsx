import React from 'react';
import { ADVANCED, NEW, REGRESSED, STALLED } from './movement.js';

/**
 * Que cambio respecto del periodo anterior.
 *
 * El dashboard de partida mostraba cada periodo como una foto aislada aunque
 * los datos contenian el movimiento. Esto lo pone al frente, en la tabla y en
 * el detalle de cada oportunidad.
 *
 * AQUI VIVIA TAMBIEN `MovementBar`, la tira de cuatro recuentos que filtraba
 * la tabla por movimiento. No la importaba nadie: el rediseño la saco de la
 * pagina y se olvido de ella. Eran ochenta lineas inalcanzables, con cien de
 * CSS detras, y dejaron al filtro `movimiento` sin un solo control en
 * pantalla: se podia aplicar escribiendolo en la direccion, vaciar la tabla, y
 * no habia donde sacarlo. La ficha de filtro puesto —ver Opportunities.jsx—
 * es lo que ocupa ese lugar ahora, y de ahi sale este mapa de etiquetas.
 */

/**
 * Como se nombra cada estado cuando es un FILTRO, o sea un conjunto: la
 * ficha dice "Movimiento · sin moverse" sobre varias filas, no sobre una.
 */
export const MOVEMENT_FILTER_LABELS = {
  [STALLED]: 'sin moverse',
  [NEW]: 'entraron nuevas',
  [ADVANCED]: 'avanzaron',
  [REGRESSED]: 'retrocedieron',
};

/** Tono y etiqueta de cada estado en una fila: ahi es una sola, y va en singular. */
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
