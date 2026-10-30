/**
 * Dock — el indice de las cinco preguntas.
 *
 * El menu anterior ofrecia filtros por movimiento y por persona, con sus
 * recuentos. Despues del rediseño, siete de sus ocho enlaces eran una
 * version mas pobre de lo que ya hacen los bloques: el riel DIBUJA la cuenta
 * trabada en vez de afirmar "1", y la fila de "Donde me meto?" filtra por
 * persona mostrando ademas por que mirarla. Filtrar desde el menu era
 * hacerlo a ciegas.
 *
 * Lo que si falta, y lo creo el propio rediseño: la pagina pasa de 3900px,
 * casi dos pantallas y media, con cinco respuestas apiladas y ninguna forma
 * de ir de una a otra que no sea rodar. El dock navega, no duplica.
 *
 * El sexto destino es la zona de exploracion —la unica que SI responde a los
 * filtros— y por eso es la que lleva el indicador de filtro activo: el aviso
 * vive donde el filtro tiene efecto.
 *
 * Es flotante en los dos tamaños: despegado del borde, sobre vidrio. El
 * sistema de tokens reserva el vidrio justo para capas que flotan sobre
 * contenido, que es exactamente lo que esto es.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useReducedMotion } from 'motion/react';

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/* Los iconos citan la forma del bloque al que llevan, no un simbolo generico:
   la meta son lugares, lo trabado es un punto que no viaja, el equipo son
   barras de distinto largo, el origen converge, la tendencia sube. */

const IconMeta = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
    <circle cx="5" cy="10" r="2.1" fill="currentColor" />
    <circle cx="10" cy="10" r="2.1" fill="currentColor" />
    <circle cx="15" cy="10" r="2.1" {...S} strokeDasharray="2 1.6" />
  </svg>
);

const IconTrabadas = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
    <line x1="2.5" y1="13.5" x2="17.5" y2="13.5" {...S} strokeWidth="1.2" />
    <path d="M9 7.5 L14.5 7.5" {...S} />
    <circle cx="5.5" cy="7.5" r="2.4" fill="currentColor" />
    <circle cx="14.5" cy="7.5" r="1.7" {...S} />
  </svg>
);

const IconEquipo = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
    <line x1="3" y1="5.5" x2="15" y2="5.5" {...S} strokeWidth="2.4" />
    <line x1="3" y1="10" x2="17" y2="10" {...S} strokeWidth="2.4" />
    <line x1="3" y1="14.5" x2="10" y2="14.5" {...S} strokeWidth="2.4" />
  </svg>
);

const IconOrigen = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
    <path d="M3 4.5 C9 4.5 9 10 16 10" {...S} />
    <path d="M3 15.5 C9 15.5 9 10 16 10" {...S} />
    <circle cx="16.4" cy="10" r="2" fill="currentColor" />
  </svg>
);

const IconTendencia = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
    <line x1="2.5" y1="4" x2="17.5" y2="4" {...S} strokeWidth="1.1" strokeDasharray="2 2" />
    <polyline points="3,15.5 7,12.5 11,13.5 17,7.5" {...S} />
  </svg>
);

const IconExplorar = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
    <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="2" {...S} />
    <line x1="2.75" y1="8" x2="17.25" y2="8" {...S} />
    <line x1="7.75" y1="8" x2="7.75" y2="16.25" {...S} />
  </svg>
);

const DESTINOS = [
  { id: 'q-meta', label: '¿Vamos a llegar?', short: 'Meta', Icon: IconMeta },
  { id: 'q-trabadas', label: '¿Qué se está cayendo?', short: 'Trabadas', Icon: IconTrabadas },
  { id: 'q-equipo', label: '¿Dónde me meto?', short: 'Equipo', Icon: IconEquipo },
  { id: 'q-origen', label: '¿De dónde viene el valor?', short: 'Origen', Icon: IconOrigen },
  { id: 'q-tendencia', label: '¿Cómo venimos?', short: 'Tendencia', Icon: IconTendencia },
  { id: 'q-explorar', label: 'Explorar las oportunidades', short: 'Explorar', Icon: IconExplorar },
];

export default function Dock({ filtersActive, onClear }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(DESTINOS[0].id);
  const marca = useRef(0);
  const marcado = useRef(null);
  const llego = useRef(false);

  /**
   * Apaga el destello, sea cual sea la seccion que lo tenga.
   *
   * Antes solo se le quitaba la clase al destino NUEVO y se cancelaba el
   * temporizador del anterior: eso dejaba al anterior encendido para siempre,
   * y con dos secciones marcadas a la vez.
   */
  const apagar = () => {
    window.clearTimeout(marca.current);
    if (marcado.current) marcado.current.classList.remove('is-targeted');
    marcado.current = null;
    llego.current = false;
  };

  const viaje = useRef(0);

  useEffect(
    () => () => {
      apagar();
      cancelAnimationFrame(viaje.current);
    },
    [],
  );

  /**
   * Desplazamiento propio en vez de `behavior: 'smooth'`.
   *
   * La curva nativa es fija y llega al destino de golpe. Esta aplica dos
   * principios de animacion:
   *
   *   SLOW IN, SLOW OUT — la curva arranca y frena despacio, y se pasa mas
   *   tiempo en los extremos que en el medio. Un movimiento que empieza y
   *   termina a velocidad constante se lee como mecanico.
   *
   *   TIMING — la duracion sale de la distancia, no es fija: un salto a la
   *   seccion de al lado no puede tardar lo mismo que uno de punta a punta.
   *   Acotada para que ni se sienta lento ni se vuelva un salto.
   */
  const viajarHasta = destino => {
    cancelAnimationFrame(viaje.current);
    const inicio = window.scrollY;
    const tramo = destino - inicio;
    if (Math.abs(tramo) < 2) return;

    const ms = Math.min(850, Math.max(340, Math.abs(tramo) * 0.45));
    const t0 = performance.now();
    // Cubica de entrada y salida: acelera hasta la mitad y desacelera igual.
    const suave = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

    const paso = ahora => {
      const t = Math.min(1, (ahora - t0) / ms);
      window.scrollTo(0, inicio + tramo * suave(t));
      if (t < 1) viaje.current = requestAnimationFrame(paso);
    };
    viaje.current = requestAnimationFrame(paso);
  };

  // La marca sigue a la seccion que cruza una linea fija bajo la cabecera.
  // Un observador por interseccion obliga a afinar margenes para secciones de
  // alturas muy distintas —van de 335 a 759px—; una linea fija es predecible.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // Offset FIJO, no un porcentaje del alto de la ventana. Con un 30% y
      // una ventana de 1600px la linea cae en 480, y un bloque de 384 nunca
      // la contiene aunque este arriba de todo: la marca se adelantaba.
      // 140px es justo debajo de la cabecera pegajosa.
      const line = 140;
      // Gana la seccion que CONTIENE la linea, no la ultima que quedo por
      // encima: con una ventana alta entran varias arriba del umbral y la
      // marca se adelantaba una posicion.
      let containing = null;
      let lastAbove = DESTINOS[0].id;
      for (const { id } of DESTINOS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= line) lastAbove = id;
        if (top <= line && bottom > line) containing = id;
      }
      // Al final de la pagina ya no queda desplazamiento para que la ultima
      // seccion cruce la linea, asi que nunca se marcaria sola. Llegar al
      // fondo ES estar en el ultimo destino.
      const atEnd =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const next = atEnd ? DESTINOS[DESTINOS.length - 1].id : (containing ?? lastAbove);
      setActive(next);

      // Una sola seccion marcada a la vez: si la persona se va de la que
      // pidio, el destello se apaga. Pero solo DESPUES de haber llegado: un
      // desplazamiento suave cruza las secciones del medio, y apagar ahi
      // mataria el destello en pleno viaje.
      if (marcado.current) {
        if (marcado.current.id === next) llego.current = true;
        else if (llego.current) apagar();
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const go = id => {
    const el = document.getElementById(id);
    if (!el) return;
    // El margen que deja libre la cabecera pegajosa se calcula aqui porque
    // el desplazamiento es propio: `scroll-margin-top` solo lo respeta
    // `scrollIntoView`, que es justo lo que se dejo de usar.
    const cabecera = document.querySelector('.top');
    const aire = (cabecera ? cabecera.getBoundingClientRect().height : 0) + 16;
    const destino = Math.max(0, el.getBoundingClientRect().top + window.scrollY - aire);

    if (reduceMotion) {
      cancelAnimationFrame(viaje.current);
      window.scrollTo(0, destino);
    } else {
      viajarHasta(destino);
    }

    // El foco acompaña al desplazamiento: quien navega con teclado tiene que
    // quedar DENTRO de la seccion a la que pidio ir, no donde estaba.
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });

    // Y un destello de acento que ata el clic con el modulo que llego: sin
    // el, pedir una seccion que ya estaba a la vista no da ninguna señal.
    apagar();
    void el.offsetWidth; // reinicia la animacion si se repite el destino
    el.classList.add('is-targeted');
    marcado.current = el;
    marca.current = window.setTimeout(apagar, 1400);
  };

  return (
    <Tooltip.Provider delayDuration={320} skipDelayDuration={500}>
      <nav className="dock" aria-label="Las cinco preguntas">
        <ul className="dock__list">
          {DESTINOS.map(({ id, label, short, Icon }) => {
            const current = active === id;
            const flagged = id === 'q-explorar' && filtersActive;
            return (
              <li key={id}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      className={`dock__item${current ? ' is-current' : ''}`}
                      aria-current={current ? 'true' : undefined}
                      onClick={() => go(id)}
                    >
                      <span className="dock__icon">
                        <Icon />
                        {flagged && <span className="dock__dot" aria-hidden="true" />}
                      </span>
                      <span className="dock__short">{short}</span>
                      <span className="sr-only">
                        {label}
                        {flagged ? ' · hay filtros aplicados' : ''}
                      </span>
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="tip"
                      side="right"
                      sideOffset={12}
                      collisionPadding={12}
                    >
                      <strong>{label}</strong>
                      {flagged && <span className="tip__note">Hay filtros aplicados.</span>}
                      <Tooltip.Arrow className="tip__arrow" width={11} height={5} />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </li>
            );
          })}
        </ul>

        {/* Lo unico que el dock hace y ningun bloque cubre. Solo aparece
            cuando hay algo que limpiar: un control permanentemente inerte
            ocupa lugar y enseña a ignorarlo. */}
        {filtersActive && (
          <button type="button" className="dock__clear" onClick={onClear}>
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
              <line x1="5.5" y1="5.5" x2="14.5" y2="14.5" {...S} />
              <line x1="14.5" y1="5.5" x2="5.5" y2="14.5" {...S} />
            </svg>
            <span className="dock__short">Limpiar</span>
            <span className="sr-only">Quitar todos los filtros</span>
          </button>
        )}
      </nav>
    </Tooltip.Provider>
  );
}
