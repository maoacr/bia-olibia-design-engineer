/**
 * Estado del proximo contacto.
 *
 * El seguimiento no es un booleano. Una cuenta recorre el embudo con muchos
 * contactos encima, asi que marcar "ya lo mire" no contesta la unica pregunta
 * operativa que importa: A QUIEN LE DEBO UNA LLAMADA HOY. Eso sale de
 * comparar la fecha acordada con el dia desde el que se mira el periodo.
 *
 * Es ademas una señal mejor que el movimiento entre periodos. "Avanzo" o
 * "sin moverse" es una medida de reporte —como viene el mes contra el
 * anterior— y vive donde se la interroga, en "Que se esta cayendo?". Lo que
 * un asesor necesita de una lista de trabajo es a quien llamar y cuando.
 */

/** Meses como los escribe `toLocaleDateString('es', { month: 'short' })`. */
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const OVERDUE = 'overdue';
export const DUE = 'due';
export const UPCOMING = 'upcoming';

/** "5 nov" -> Date local. Devuelve `null` si el mes no se reconoce. */
export function parseContact(label, year) {
  const [day, month] = String(label).trim().toLowerCase().split(/\s+/);
  const index = MONTHS.indexOf(month?.replace('.', ''));
  if (index < 0 || !Number.isFinite(Number(day))) return null;
  return new Date(year, index, Number(day));
}

/**
 * "2026-11-05" -> Date local.
 *
 * `new Date('2026-11-05')` lo interpreta como medianoche UTC, que al oeste de
 * Greenwich cae el dia 4. Construirlo por partes lo deja en el dia que la
 * persona eligio en el calendario.
 */
export const dateFromISO = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Date -> "5 nov", el mismo formato en el que el dato ya venia escrito. */
export const formatContact = date =>
  date.toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '');

/**
 * `overdue` | `due` | `upcoming`, o `null` si la fecha no se puede leer.
 *
 * Se compara a dia entero: una cita es "de hoy" durante todo el dia, no
 * hasta la hora en que se abrio la pagina.
 */
export function contactState(nextContact, period) {
  const when = parseContact(nextContact, period.year);
  if (!when) return null;

  const [y, m, d] = period.today.split('-').map(Number);
  const today = new Date(y, m - 1, d);

  if (when < today) return OVERDUE;
  return when.getTime() === today.getTime() ? DUE : UPCOMING;
}

/** Las que ya deberian haberse contactado, de mas atrasada a menos. */
export const overdueOf = (opportunities, period) =>
  opportunities
    .filter(o => contactState(o.nextContact, period) === OVERDUE)
    .sort(
      (a, b) => parseContact(a.nextContact, period.year) - parseContact(b.nextContact, period.year),
    );
