/**
 * Datos ficticios del consumo energetico de tres cafeterias.
 *
 * El escenario viene del enunciado: la factura paso de $4,8 a $6 millones
 * (+25%), el consumo de 6.000 a 7.500 kWh, la tarifa se mantuvo en
 * $800/kWh, una sede concentro 1.200 de los 1.500 kWh adicionales, y hay
 * consumo fuera del horario habitual con la causa SIN CONFIRMAR.
 *
 * TRES REGLAS DE ESTE ARCHIVO
 * --------------------------
 * 1. **Los totales no se escriben: se derivan.** Cada sede declara sus
 *    cinco tramos del dia y el total sale de sumarlos. Si un dia alguien
 *    cambia un tramo, el total, la factura, el porcentaje y el delta se
 *    mueven juntos. Un total escrito a mano puede mentir; derivado, no.
 *
 * 2. **Los tramos son objetos con nombre, no posiciones.** Un array
 *    posicional obliga a acordarse de que el tercero es "tarde"; una keyed
 *    por identificador se lee sola. Es la misma correccion que se le hizo
 *    al fixture de Olibia, y por el mismo motivo: el dato tiene que
 *    sobrevivir a que lo lea alguien que no lo escribio.
 *
 * 3. **Un hecho y una hipotesis no se guardan igual.** Los tramos son
 *    hechos: pasaron. La causa del consumo fuera de horario NO esta
 *    confirmada, y vive separada, en HIPOTHESIS, con lo que la sostiene y
 *    lo que falta. Mezclarlas en el mismo objeto es como se termina
 *    presentando una suposicion como un dato.
 */

/** La tarifa. No cambio entre los dos meses: es el hecho del que sale todo. */
export const TARIFF = 800;

/** Los dos meses que se comparan. */
export const MONTHS = {
  previous: { id: 'sep', label: 'Septiembre', full: 'Septiembre de 2026' },
  current: { id: 'oct', label: 'Octubre', full: 'Octubre de 2026' },
};

/**
 * Los tramos del dia.
 *
 * Una cafeteria abre a las 06:00 y cierra a las 21:00. Lo que pasa entre
 * las 21:00 y las 06:00 es "fuera del horario habitual": no es un error,
 * es cuando la refrigeracion trabaja sola.
 */
export const BUCKETS = [
  { id: 'apertura', label: 'Apertura', hours: '06:00 – 09:00' },
  { id: 'manana', label: 'Media mañana', hours: '09:00 – 14:00' },
  { id: 'tarde', label: 'Tarde', hours: '14:00 – 18:00' },
  { id: 'cierre', label: 'Cierre', hours: '18:00 – 21:00' },
  { id: 'fuera', label: 'Fuera de horario', hours: '21:00 – 06:00' },
];

/** El id del tramo que cae fuera del horario habitual. */
export const OUTSIDE = 'fuera';

/**
 * Las tres sedes.
 *
 * Los tramos estan en kWh del mes. La Sede Centro es la del enunciado:
 * concentra 1.200 de los 1.500 kWh que el conjunto consumio, y su
 * madrugada es la unica que se movio.
 */ export const SEDES = [
  {
    id: 'centro',
    name: 'Sede Centro',
    note: 'La de mayor consumo',
    previous: { apertura: 400, manana: 900, tarde: 700, cierre: 500, fuera: 300 },
    current: { apertura: 480, manana: 1340, tarde: 900, cierre: 560, fuera: 720 },
  },
  {
    id: 'norte',
    name: 'Sede Norte',
    note: 'La de horario más parejo',
    previous: { apertura: 250, manana: 600, tarde: 480, cierre: 390, fuera: 180 },
    current: { apertura: 265, manana: 645, tarde: 520, cierre: 425, fuera: 195 },
  },
  {
    id: 'parque',
    name: 'Sede Parque',
    note: 'La más chica',
    previous: { apertura: 170, manana: 420, tarde: 330, cierre: 260, fuera: 120 },
    current: { apertura: 185, manana: 460, tarde: 370, cierre: 305, fuera: 130 },
  },
];

const suma = valores => Object.values(valores).reduce((total, valor) => total + valor, 0);

/**
 * EL INFORME.
 *
 * Todo lo que la pagina muestra sale de aca. Se calcula una vez, al cargar
 * el modulo, y de el se leen tanto las cifras grandes como las de cada
 * sede: si el total y el detalle no pueden discrepar, es porque salen de
 * la misma cuenta.
 */
export const REPORT = (() => {
  const sedes = SEDES.map(sede => {
    const previousTotal = suma(sede.previous);
    const currentTotal = suma(sede.current);
    const delta = currentTotal - previousTotal;
    const previousOutside = sede.previous[OUTSIDE];
    const currentOutside = sede.current[OUTSIDE];

    return {
      ...sede,
      previousTotal,
      currentTotal,
      delta,
      previousBill: previousTotal * TARIFF,
      currentBill: currentTotal * TARIFF,
      deltaBill: delta * TARIFF,
      deltaPercent: delta / previousTotal,
      previousOutside,
      currentOutside,
      previousOutsideShare: previousOutside / previousTotal,
      currentOutsideShare: currentOutside / currentTotal,
      outsideDelta: currentOutside - previousOutside,
      outsideDeltaPercent: (currentOutside - previousOutside) / previousOutside,
      buckets: BUCKETS.map(bucket => ({
        ...bucket,
        previous: sede.previous[bucket.id],
        current: sede.current[bucket.id],
        delta: sede.current[bucket.id] - sede.previous[bucket.id],
      })),
    };
  });

  const previousKwh = suma(sedes.map(sede => sede.previousTotal));
  const currentKwh = suma(sedes.map(sede => sede.currentTotal));
  const deltaKwh = currentKwh - previousKwh;

  return {
    tariff: TARIFF,
    previousKwh,
    currentKwh,
    deltaKwh,
    previousBill: previousKwh * TARIFF,
    currentBill: currentKwh * TARIFF,
    deltaBill: deltaKwh * TARIFF,
    deltaPercent: deltaKwh / previousKwh,
    sedes: sedes.map(sede => ({ ...sede, share: sede.delta / deltaKwh })),
    /** La sede que concentra el problema: la de mayor participacion en el alza. */
    mainSede: sedes.reduce((a, b) => (b.delta > a.delta ? b : a)),
  };
})();

/**
 * LO QUE SE SABE Y LO QUE SE SOSPECHA.
 *
 * La causa del consumo fuera de horario NO esta confirmada. Lo que esta
 * confirmado es el sintoma. Y hay una cifra que obliga a ser honesto:
 * de los 1.200 kWh que subio la Sede Centro, 420 fueron de madrugada y
 * 780 ocurrieron DENTRO del horario habitual.
 *
 * O sea: las dos hipotesis de abajo explican, con suerte, un tercio del
 * aumento de esa sede. La parte mas grande del problema sigue sin
 * explicacion, y decir eso es parte del trabajo: si la pagina presentara
 * el consumo de madrugada como la causa, estaria affirmando algo que el
 * dato no dice.
 */
export const HYPOTHESIS = {
  sedeId: 'centro',

  /** El sintoma. Es un hecho. */
  sintoma:
    'El consumo fuera de horario de la Sede Centro pasó de 300 a 720 kWh: del 10,7% al 18% de lo que gasta la sede. En Norte y Parque no se movió.',

  /** Dos causas posibles. Ninguna confirmada. */
  candidatos: [
    {
      id: 'equipo',
      claim: 'El equipo de refrigeración quedó funcionando fuera de horario.',
      aFavor: [
        'La madrugada subió 420 kWh y nada más en toda la cadena.',
        'Las otras dos sedes movieron su madrugada apenas: +15 y +10 kWh.',
      ],
      enContra: [
        'No hay medición por circuito: no se sabe qué equipo está consumiendo.',
        'El inventario de equipos de la sede no registra cambios este mes.',
      ],
    },
    {
      id: 'turnos',
      claim: 'La cafetería opera más tarde de lo habitual.',
      aFavor: ['El tramo de cierre (18:00 – 21:00) también subió: de 500 a 560 kWh.'],
      enContra: [
        'Si la operación se hubiera extendido, el peso de la subida caería en el cierre, no en la madrugada: el cierre subió 60 kWh y la madrugada 420.',
        'No hay registro de turnos ni de eventos nocturnos.',
      ],
    },
  ],

  /** Lo que haria falta para confirmar o descartar. */
  falta: [
    'Medición por circuito en la Sede Centro durante una semana.',
    'El registro de equipos instalados o modificados este mes.',
    'El registro de turnos y de eventos nocturnos de la sede.',
  ],

  /** El limite honesto: ninguna de las dos alcanza. */
  limite:
    'Ninguna de las dos alcanza. 780 de los 1.200 kWh que subió la sede (65%) ocurrieron dentro del horario habitual: es la parte más grande del problema y todavía no tiene explicación.',
};

/**
 * La alternativa: lo que se puede hacer mientras nadie mide nada.
 *
 * Y va marcada como condicional a proposito. Es el paso que la gente quiere
 * oir -"apague las neveras"-, y es el que mas facil se equivoca: si la
 * causa fuera otra, el esfuerzo no moveria la aguja y la persona perderia la
 * confianza en el producto.
 */
export const NEXT_STEP = {
  alternativa: {
    titulo: 'Mover el arranque del equipo de frío al horario de apertura',
    condicion:
      'Sirve solo si la primera hipótesis es la correcta. Si la causa fuera otra, este cambio no movería la aguja.',
  },
};
