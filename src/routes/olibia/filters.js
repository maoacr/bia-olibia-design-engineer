/**
 * Filtrado de oportunidades.
 *
 * El starter derivaba el canal aqui mismo, a partir de la posicion de la fila
 * en el array, lo que hacia que una empresa cambiara de canal entre periodos.
 * Ahora el canal es un campo del dato y este modulo solo filtra.
 */

export const EMPTY_FILTERS = { query: '', stage: '', owner: '', channel: '', minimum: '' };

export function filterOpportunities(opportunities, filters = {}) {
  const { query, stage, owner, channel, minimum } = { ...EMPTY_FILTERS, ...filters };
  const search = query.trim().toLowerCase();

  return opportunities.filter(
    opportunity =>
      opportunity.company.toLowerCase().includes(search) &&
      (!stage || opportunity.stage === stage) &&
      (!owner || opportunity.owner === owner) &&
      (!channel || opportunity.channel === channel) &&
      (!minimum || opportunity.value >= Number(minimum)),
  );
}
