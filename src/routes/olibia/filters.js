/**
 * Filtrado de oportunidades.
 *
 * El starter derivaba el canal aqui mismo, a partir de la posicion de la fila
 * en el array, lo que hacia que una empresa cambiara de canal entre periodos.
 * Ahora el canal es un campo del dato y este modulo solo filtra.
 */

import { parseContact } from './contact.js';

export const EMPTY_FILTERS = {
  query: '',
  stage: '',
  owner: '',
  channel: '',
  minimum: '',
  movement: '',
};

export function filterOpportunities(opportunities, filters = {}) {
  const { query, stage, owner, channel, minimum, movement } = { ...EMPTY_FILTERS, ...filters };
  const search = query.trim().toLowerCase();

  return opportunities.filter(
    opportunity =>
      opportunity.company.toLowerCase().includes(search) &&
      (!stage || opportunity.stage === stage) &&
      (!owner || opportunity.owner === owner) &&
      (!channel || opportunity.channel === channel) &&
      (!minimum || opportunity.value >= Number(minimum)) &&
      (!movement || opportunity.movement?.status === movement),
  );
}

/**
 * Ordena la lista visible.
 *
 * Va aqui y no en el componente de la tabla porque la exportacion a CSV sale
 * del mismo arreglo: si la tabla se ordenara al pintar, el archivo saldria en
 * un orden distinto del que la persona esta viendo, y el aviso dice que lleva
 * "las oportunidades que muestra la tabla".
 *
 * `localeCompare` con locale explicito: con el del navegador, la misma lista
 * se ordena distinto segun quien la abra, y la Ñ y los acentos caen donde no
 * corresponde. Las fechas se comparan como fechas y no como texto —"5 nov"
 * va despues de "30 oct" aunque empiece por un digito menor— y las que no se
 * puedan leer van al final, nunca intercaladas en silencio.
 */
export function sortOpportunities(opportunities, sort, period) {
  if (!sort) return opportunities;

  const factor = sort.direction === 'desc' ? -1 : 1;

  const compare =
    sort.field === 'empresa'
      ? (a, b) => a.company.localeCompare(b.company, 'es')
      : (a, b) => {
          const x = parseContact(a.nextContact, period.year);
          const y = parseContact(b.nextContact, period.year);
          if (!x || !y) return x ? -1 : y ? 1 : 0;
          return x - y;
        };

  return [...opportunities].sort((a, b) => compare(a, b) * factor);
}
