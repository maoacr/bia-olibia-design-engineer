/**
 * Comparacion entre periodos.
 *
 * El dashboard de partida mostraba cada periodo como una foto aislada, pero
 * los datos contienen una pelicula: entre septiembre y octubre hay cuentas que
 * avanzan de etapa, una que lleva un mes entero sin moverse y dos que entran
 * nuevas. Este modulo deriva ese movimiento una sola vez, para que los
 * componentes reciban el hecho ya resuelto en lugar de recalcularlo al pintar.
 */

import { STAGES, periods } from './data.js';

export const NEW = 'new';
export const ADVANCED = 'advanced';
export const STALLED = 'stalled';
export const REGRESSED = 'regressed';

/** Posicion en el embudo. Define que significa avanzar o retroceder. */
export const stageIndex = stage => STAGES.indexOf(stage);

/**
 * Compara una oportunidad contra su estado en el periodo anterior.
 * Devuelve `null` cuando no hay periodo previo con el cual comparar: la
 * ausencia de historia es distinta de no haberse movido, y la interfaz no
 * debe confundirlas.
 */
export function movementFor(opportunity, previousPeriod) {
  if (!previousPeriod) return null;

  const before = previousPeriod.opportunities.find(o => o.id === opportunity.id);
  if (!before) {
    return { status: NEW, from: null, to: opportunity.stage, steps: 0 };
  }

  const steps = stageIndex(opportunity.stage) - stageIndex(before.stage);
  const status = steps > 0 ? ADVANCED : steps < 0 ? REGRESSED : STALLED;
  return { status, from: before.stage, to: opportunity.stage, steps };
}

/** El periodo anterior a uno dado, o `null` si es el mas antiguo que tenemos. */
export const previousPeriodOf = period => (period.previous ? periods[period.previous] : null);

/** Las oportunidades del periodo, cada una con su movimiento ya resuelto. */
export function opportunitiesWithMovement(period) {
  const previous = previousPeriodOf(period);
  return period.opportunities.map(opportunity => ({
    ...opportunity,
    movement: movementFor(opportunity, previous),
  }));
}

/**
 * Recuento de movimiento sobre un conjunto de oportunidades.
 * Se calcula sobre las que el usuario tiene a la vista, no sobre el periodo
 * completo, para que no contradiga lo que la pantalla esta mostrando.
 */
export function movementSummary(opportunities) {
  const summary = { [NEW]: 0, [ADVANCED]: 0, [STALLED]: 0, [REGRESSED]: 0, comparable: 0 };

  for (const { movement } of opportunities) {
    if (!movement) continue;
    summary.comparable += 1;
    summary[movement.status] += 1;
  }

  return summary;
}
