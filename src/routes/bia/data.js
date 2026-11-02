/**
 * Datos ficticios del consumo energetico de tres cafeterias.
 *
 * El escenario viene del enunciado: la factura paso de $4,8 a $6 millones
 * COP (+25%), el consumo de 6.000 a 7.500 kWh, la tarifa se mantuvo en
 * $800/kWh, una sede concentro 1.200 de los 1.500 kWh adicionales, y hay
 * consumo fuera del horario habitual con la causa SIN CONFIRMAR.
 *
 * TRES REGLAS DE ESTE ARCHIVO
 * ---------------------------
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
 *    confirmada, y vive separada, en HYPOTHESIS, con lo que la sostiene y
 *    lo que falta. Mezclarlas en el mismo objeto es como se termina
 *    presentando una suposicion como un dato.
 *
 * LA HISTORIA
 * -----------
 * Diez meses, de enero a octubre de 2026. Los dos ultimos son los del
 * enunciado, exactos. Los ocho primeros los anade yo, y estan ahi para una
 * razon: con dos meses no se puede contestar la pregunta que mas importa
 * para quien administra —"esto es de este mes o es siempre asi?"—. Con la
 * historia se ve que la Sede Centro venia creciendo despacio y de golpe
 * salto, y que su consumo de madrugada estuvo entre 10% y 11% todo el ano
 * hasta que en octubre fue 18%.
 */

/** La tarifa. No cambio entre los dos meses: es el hecho del que sale todo. */
export const TARIFF = 800;

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

/** Los meses, en orden. Los dos ultimos son los del enunciado. */
export const MONTHS = {
  previous: { id: 'sep', label: 'Septiembre', full: 'Septiembre de 2026', corto: 'Sep' },
  current: { id: 'oct', label: 'Octubre', full: 'Octubre de 2026', corto: 'Oct' },
};

/**
 * LA HISTORIA, written a mano.
 *
 * Los ocho primeros meses son anadidos: el enunciado solo da dos. Son
 * coherentes con esos dos y contados de la misma forma —la suma de los
 * cinco tramos—, para que el total se siga derivando y no escribiendo.
 */
const HISTORIA = {
  centro: [
    { mes: 'Ene', trams: { apertura: 340, manana: 770, tarde: 610, cierre: 445, fuera: 255 } },
    { mes: 'Feb', trams: { apertura: 355, manana: 805, tarde: 620, cierre: 430, fuera: 260 } },
    { mes: 'Mar', trams: { apertura: 360, manana: 813, tarde: 630, cierre: 445, fuera: 262 } },
    { mes: 'Abr', trams: { apertura: 355, manana: 854, tarde: 620, cierre: 450, fuera: 266 } },
    { mes: 'May', trams: { apertura: 370, manana: 830, tarde: 650, cierre: 465, fuera: 270 } },
    { mes: 'Jun', trams: { apertura: 385, manana: 806, tarde: 675, cierre: 480, fuera: 274 } },
    { mes: 'Jul', trams: { apertura: 375, manana: 857, tarde: 665, cierre: 485, fuera: 278 } },
    { mes: 'Ago', trams: { apertura: 380, manana: 877, tarde: 695, cierre: 475, fuera: 283 } },
    { mes: 'Sep', trams: { apertura: 400, manana: 900, tarde: 700, cierre: 500, fuera: 300 } },
    { mes: 'Oct', trams: { apertura: 480, manana: 1340, tarde: 900, cierre: 560, fuera: 720 } },
  ],
  norte: [
    { mes: 'Ene', trams: { apertura: 255, manana: 572, tarde: 470, cierre: 395, fuera: 178 } },
    { mes: 'Feb', trams: { apertura: 245, manana: 606, tarde: 470, cierre: 385, fuera: 179 } },
    { mes: 'Mar', trams: { apertura: 240, manana: 582, tarde: 480, cierre: 395, fuera: 178 } },
    { mes: 'Abr', trams: { apertura: 240, manana: 610, tarde: 470, cierre: 390, fuera: 180 } },
    { mes: 'May', trams: { apertura: 240, manana: 615, tarde: 475, cierre: 385, fuera: 180 } },
    { mes: 'Jun', trams: { apertura: 245, manana: 591, tarde: 480, cierre: 385, fuera: 179 } },
    { mes: 'Jul', trams: { apertura: 255, manana: 594, tarde: 490, cierre: 385, fuera: 181 } },
    { mes: 'Ago', trams: { apertura: 250, manana: 585, tarde: 480, cierre: 395, fuera: 180 } },
    { mes: 'Sep', trams: { apertura: 250, manana: 600, tarde: 480, cierre: 390, fuera: 180 } },
    { mes: 'Oct', trams: { apertura: 265, manana: 645, tarde: 520, cierre: 425, fuera: 195 } },
  ],
  parque: [
    { mes: 'Ene', trams: { apertura: 165, manana: 422, tarde: 320, cierre: 255, fuera: 118 } },
    { mes: 'Feb', trams: { apertura: 170, manana: 416, tarde: 325, cierre: 265, fuera: 119 } },
    { mes: 'Mar', trams: { apertura: 165, manana: 407, tarde: 335, cierre: 260, fuera: 118 } },
    { mes: 'Abr', trams: { apertura: 165, manana: 430, tarde: 320, cierre: 265, fuera: 120 } },
    { mes: 'May', trams: { apertura: 170, manana: 411, tarde: 325, cierre: 265, fuera: 119 } },
    { mes: 'Jun', trams: { apertura: 170, manana: 415, tarde: 340, cierre: 260, fuera: 120 } },
    { mes: 'Jul', trams: { apertura: 165, manana: 417, tarde: 320, cierre: 265, fuera: 118 } },
    { mes: 'Ago', trams: { apertura: 165, manana: 411, tarde: 335, cierre: 265, fuera: 119 } },
    { mes: 'Sep', trams: { apertura: 170, manana: 420, tarde: 330, cierre: 260, fuera: 120 } },
    { mes: 'Oct', trams: { apertura: 185, manana: 460, tarde: 370, cierre: 305, fuera: 130 } },
  ],
};

/** Las tres sedes. */
export const SEDES = [
  { id: 'centro', name: 'Sede Centro', note: 'La de mayor consumo', historia: HISTORIA.centro },
  { id: 'norte', name: 'Sede Norte', note: 'La de horario más parejo', historia: HISTORIA.norte },
  { id: 'parque', name: 'Sede Parque', note: 'La más chica', historia: HISTORIA.parque },
];

const suma = valores => Object.values(valores).reduce((total, valor) => total + valor, 0);

/** Los meses de la historia, en orden, con su etiqueta larga. */
const LARGOS = {
  Ene: 'Enero',
  Feb: 'Febrero',
  Mar: 'Marzo',
  Abr: 'Abril',
  May: 'Mayo',
  Jun: 'Junio',
  Jul: 'Julio',
  Ago: 'Agosto',
  Sep: 'Septiembre',
  Oct: 'Octubre',
};

/**
 * EL INFORME.
 *
 * Todo lo que la pagina muestra sale de aca. Se calcula una vez, al cargar
 * el modulo, y de el se leen tanto las cifras grandes como las de cada
 * sede: si el total y el detalle no pueden discrepar, es porque salen de
 * la misma cuenta.
 */
export const REPORT = (() => {
  const meses = SEDES[0].historia.map((entrada, indice) => ({
    id: entrada.mes.toLowerCase(),
    corto: entrada.mes,
    label: LARGOS[entrada.mes],
    full: `${LARGOS[entrada.mes]} de 2026`,
    indice,
  }));

  const sedes = SEDES.map(sede => {
    const serie = sede.historia.map((entrada, indice) => {
      const total = suma(entrada.trams);
      const fuera = entrada.trams[OUTSIDE];
      return {
        ...meses[indice],
        trams: entrada.trams,
        total,
        fuera,
        fueraShare: fuera / total,
      };
    });

    const anterior = serie[serie.length - 2];
    const actual = serie[serie.length - 1];
    const delta = actual.total - anterior.total;

    return {
      id: sede.id,
      name: sede.name,
      note: sede.note,
      serie,
      anterior,
      actual,
      previousTotal: anterior.total,
      currentTotal: actual.total,
      delta,
      previousBill: anterior.total * TARIFF,
      currentBill: actual.total * TARIFF,
      deltaBill: delta * TARIFF,
      deltaPercent: delta / anterior.total,
      previousOutside: anterior.fuera,
      currentOutside: actual.fuera,
      previousOutsideShare: anterior.fueraShare,
      currentOutsideShare: actual.fueraShare,
      outsideDelta: actual.fuera - anterior.fuera,
      outsideDeltaPercent: (actual.fuera - anterior.fuera) / anterior.fuera,
      /** El tramo del mes actual, con su comparacion contra el anterior. */
      buckets: BUCKETS.map(bucket => ({
        ...bucket,
        previous: anterior.trams[bucket.id],
        current: actual.trams[bucket.id],
        delta: actual.trams[bucket.id] - anterior.trams[bucket.id],
      })),
    };
  });

  const previousKwh = suma(sedes.map(sede => sede.previousTotal));
  const currentKwh = suma(sedes.map(sede => sede.currentTotal));
  const deltaKwh = currentKwh - previousKwh;

  // La participacion en el alza se calcula DESPUES, sobre las sedes ya
  // completas. Antes se armaba `mainSede` con la lista intermedia, que
  // todavia no tenia `share`: la conclusion de la pagina imprimia "NaN%".
  const completas = sedes.map(sede => ({ ...sede, share: sede.delta / deltaKwh }));

  return {
    tariff: TARIFF,
    meses,
    previousKwh,
    currentKwh,
    deltaKwh,
    previousBill: previousKwh * TARIFF,
    currentBill: currentKwh * TARIFF,
    deltaBill: deltaKwh * TARIFF,
    deltaPercent: deltaKwh / previousKwh,
    sedes: completas,
    /** La sede que concentra el problema: la de mayor participacion en el alza. */
    mainSede: completas.reduce((a, b) => (b.delta > a.delta ? b : a)),
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
        'En los ocho meses anteriores, esa sede estuvo siempre entre 10% y 11% de madrugada. El 18% de octubre no tiene antecedente.',
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

  /** Lo que haría falta para confirmar o descartar. */
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
