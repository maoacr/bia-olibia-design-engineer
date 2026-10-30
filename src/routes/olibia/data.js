/**
 * Datos ficticios del dashboard comercial.
 *
 * El starter guardaba cada oportunidad como un array posicional
 * (`['Grupo Andino','Calificación',42,...]`) y derivaba el canal de la
 * posicion de la fila, lo que hacia que una misma empresa cambiara de canal
 * entre periodos. Aqui cada oportunidad es un objeto con identidad estable,
 * que es lo que permite comparar un periodo contra el anterior.
 */

/** Orden del embudo. El indice define que significa "avanzar". */
export const STAGES = ['Contacto', 'Calificación', 'Propuesta', 'Negociación'];

/** Clase CSS de cada etapa, para teñir su distintivo. */
export const STAGE_SLUG = {
  Contacto: 'contacto',
  Calificación: 'calificacion',
  Propuesta: 'propuesta',
  Negociación: 'negociacion',
};

export const CHANNELS = ['Outbound', 'Referidos', 'Inbound'];

export const TEAM = ['Ana López', 'Carlos Ruiz', 'Laura Díaz', 'Mateo Gil'];

/** Cierres que el equipo se propone por mes. */
export const MONTHLY_GOAL = 10;

/**
 * Nombre completo de cada mes abreviado del historial. Permite derivar textos
 * como "frente a septiembre" del dato en vez de dejarlos escritos a mano.
 */
export const MONTH_NAMES = {
  Abr: 'abril',
  May: 'mayo',
  Jun: 'junio',
  Jul: 'julio',
  Ago: 'agosto',
  Sep: 'septiembre',
  Oct: 'octubre',
};

/**
 * El canal es una propiedad de como entro la cuenta, no de donde cae en una
 * lista: se mantiene estable entre periodos. La asignacion respeta el
 * comportamiento observado en los datos — las cuentas que entran o escalan
 * rapido a etapas altas vienen de referidos, las que arrancan en Contacto y
 * avanzan despacio son prospeccion en frio.
 */
const CHANNEL_BY_COMPANY = {
  'Grupo Andino': 'Outbound',
  'Hotel Central': 'Outbound',
  'Textiles Aurora': 'Outbound',
  'Alimentos del Norte': 'Referidos',
  'Logística Pacífico': 'Referidos',
  'Industrias Atlas': 'Referidos',
  'Clínica Horizonte': 'Inbound',
  'Mercado Verde': 'Inbound',
};

/** Identificador estable por empresa, para emparejarla entre periodos. */
const idFor = company =>
  company
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const opportunity = (company, stage, value, owner, nextContact) => ({
  id: idFor(company),
  company,
  stage,
  value,
  owner,
  nextContact,
  channel: CHANNEL_BY_COMPANY[company],
});

const closesByOwner = counts => TEAM.map((owner, i) => ({ owner, closed: counts[i] }));

const history = entries => entries.map(([month, closed]) => ({ month, closed }));

export const periods = {
  oct: {
    id: 'oct',
    label: 'Octubre 2026',
    year: 2026,
    previous: 'sep',
    closed: 8,
    history: history([
      ['May', 4],
      ['Jun', 6],
      ['Jul', 5],
      ['Ago', 7],
      ['Sep', 6],
      ['Oct', 8],
    ]),
    closesByOwner: closesByOwner([3, 2, 2, 1]),
    opportunities: [
      opportunity('Grupo Andino', 'Calificación', 42, 'Ana López', '28 oct'),
      opportunity('Clínica Horizonte', 'Propuesta', 28, 'Carlos Ruiz', '29 oct'),
      opportunity('Alimentos del Norte', 'Negociación', 65, 'Laura Díaz', '28 oct'),
      opportunity('Hotel Central', 'Contacto', 18, 'Mateo Gil', '30 oct'),
      opportunity('Logística Pacífico', 'Propuesta', 51, 'Ana López', '29 oct'),
      opportunity('Textiles Aurora', 'Calificación', 34, 'Carlos Ruiz', '30 oct'),
      opportunity('Mercado Verde', 'Contacto', 22, 'Laura Díaz', '28 oct'),
      opportunity('Industrias Atlas', 'Negociación', 78, 'Mateo Gil', '29 oct'),
    ],
  },
  sep: {
    id: 'sep',
    label: 'Septiembre 2026',
    year: 2026,
    previous: null,
    closed: 6,
    history: history([
      ['Abr', 3],
      ['May', 4],
      ['Jun', 6],
      ['Jul', 5],
      ['Ago', 7],
      ['Sep', 6],
    ]),
    closesByOwner: closesByOwner([2, 2, 1, 1]),
    opportunities: [
      opportunity('Grupo Andino', 'Contacto', 42, 'Ana López', '28 sep'),
      opportunity('Clínica Horizonte', 'Calificación', 28, 'Carlos Ruiz', '29 sep'),
      opportunity('Alimentos del Norte', 'Propuesta', 65, 'Laura Díaz', '28 sep'),
      opportunity('Hotel Central', 'Contacto', 18, 'Mateo Gil', '30 sep'),
      opportunity('Logística Pacífico', 'Calificación', 51, 'Ana López', '29 sep'),
      opportunity('Textiles Aurora', 'Contacto', 34, 'Carlos Ruiz', '30 sep'),
    ],
  },
};

/** Periodos en el orden en que se ofrecen al usuario: el mas reciente primero. */
export const PERIOD_IDS = ['oct', 'sep'];
