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

/**
 * EL DIA DESDE EL QUE SE MIRA CADA PERIODO.
 *
 * Que un contacto este vencido depende de contra que fecha se compare, y un
 * tablero de datos ficticios no tiene un "hoy" real: usar la fecha del
 * sistema dejaria los seis meses de historia vencidos para siempre y, en el
 * mes corriente, marcaria las ocho cuentas a la vez. Una alerta que suena en
 * el 100% de las filas no es una alerta.
 *
 * Asi que cada periodo declara el dia desde el que se lo mira, como quien
 * abre el tablero un martes a media tarde. Con el 29 los contactos del 28
 * estan vencidos, los del 29 son para hoy y los del 30 estan por venir: los
 * tres estados existen en los dos meses. Es una convencion del ejercicio y
 * esta dicha aqui, no escondida en un componente.
 */
export const periods = {
  oct: {
    id: 'oct',
    label: 'Octubre 2026',
    year: 2026,
    today: '2026-10-29',
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
    today: '2026-09-29',
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

/**
 * La historia de cierres del equipo, completa y en orden.
 *
 * Cada periodo guarda SU ventana de seis meses, que termina en el mes del
 * periodo: octubre trae May-Oct y septiembre trae Abr-Sep. Son dos recortes
 * distintos de una sola serie, y dibujar el recorte en vez de la serie tenia
 * dos consecuencias feas en "Como venimos?": el mes elegido caia siempre en
 * la ultima columna —asi que la marca no se movia nunca al cambiar de mes— y
 * todo mes POSTERIOR al elegido desaparecia del grafico. Desde septiembre,
 * octubre no estaba, y no habia forma de volver.
 *
 * La union de las dos ventanas es la serie: siete meses, de abril a octubre.
 * Se deriva de los periodos en vez de quedar escrita a mano, y el orden sale
 * de MONTH_NAMES, que ya declara el eje cronologico.
 */
export const TIMELINE = (() => {
  const order = Object.keys(MONTH_NAMES);
  const closedByMonth = new Map();
  // El ultimo que escribe gana, y da igual: los meses compartidos por las dos
  // ventanas traen el mismo numero en las dos. Si algun dia dejaran de
  // coincidir, seria un dato roto y no algo que esta funcion deba conciliar.
  for (const id of PERIOD_IDS)
    for (const { month, closed } of periods[id].history) closedByMonth.set(month, closed);

  return [...closedByMonth]
    .map(([month, closed]) => ({ month, closed }))
    .sort((a, b) => order.indexOf(a.month) - order.indexOf(b.month));
})();
