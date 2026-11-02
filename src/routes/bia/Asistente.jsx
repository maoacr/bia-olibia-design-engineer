import React, { useEffect, useRef, useState } from 'react';
import { OUTSIDE } from './data.js';
import { kwh, numero, pesos, porcentaje, porcentajeConSigno } from './format.js';

/**
 * EL ASISTENTE DE BIA.
 *
 * El mismo patron que el de Olibia —burbuja flotante, panel, sin el foco
 * encerrado— con otra diferencia: este NO esta desconectado. Responde
 * sobre los datos del ejercicio.
 *
 * Y como no hay modelo de AI conectado, responde con REGLAS: cada
 * pregunta se reconoce por sus palabras y la respuesta se CALCULA del
 * fixture. No hay texto escrito a mano para cada caso, asi que no puede
 * contradecir a la grafica de arriba. Y el limite se dice en el pie del
 * panel: son reglas, no un modelo.
 *
 * Es la manera de que el administrador pregunte con sus palabras —"de
 * noche", "cuanto es en plata"— y reciba la misma cifra que esta
 * dibujada arriba, sin saber que existen los filtros.
 */

const IconChat = () => (
  <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true" focusable="false">
    <path
      d="M3 7.5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H8.5L5 17v-2.6A3 3 0 0 1 3 11.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="7.5" cy="9.5" r="1" fill="currentColor" />
    <circle cx="10" cy="9.5" r="1" fill="currentColor" />
    <circle cx="12.5" cy="9.5" r="1" fill="currentColor" />
  </svg>
);

/** Las preguntas que el panel ofrece: son las que el administrador haria. */
const SUGERIDAS = ['¿Cuánto gasté?', '¿Qué sede subió más?', '¿De noche?', '¿Por qué?'];

/**
 * LA LECTURA DE PARTIDA.
 *
 * Se arma con el dato, no con texto fijo: si cambia el fixture, el primer
 * mensaje cambia con el.
 */
function lecturaInicial(report) {
  const { currentBill, previousBill, deltaBill, deltaPercent, mainSede } = report;
  const fuera = mainSede.currentOutside;
  const share = mainSede.currentOutsideShare;
  return (
    <>
      <p>
        Tu factura de octubre es de <strong>{pesos(currentBill)}</strong>. Subió{' '}
        <strong>{pesos(deltaBill)}</strong> ({porcentaje(deltaPercent)}) contra septiembre, y no fue
        por el precio: la tarifa se mantuvo en {pesos(report.tariff)} el kWh.
      </p>
      <p>
        El <strong>{porcentaje(mainSede.share)}</strong> de ese aumento está en la {mainSede.name}.
        De sus {numero(mainSede.delta)} kWh extra, <strong>{numero(fuera)}</strong> fueron de
        madrugada — pasó del {porcentaje(mainSede.previousOutsideShare)} al {porcentaje(share)} de
        lo que gasta la sede.
      </p>
      <p>
        <strong>La causa no está confirmada.</strong> Hay dos hipótesis y ninguna comprobada. Lo que
        sí se puede pedir es una medición: eso es el siguiente paso.
      </p>
    </>
  );
}

/**
 * LAS REGLAS.
 *
 * Cada regla mira palabras y devuelve una respuesta CALCULADA. El orden
 * importa: la mas especifica va primero, porque "de noche" y "por que"
 * pueden aparecer en la misma frase.
 */
function responder(pregunta, report) {
  const q = pregunta.toLowerCase();
  const { mainSede, currentBill, previousBill, currentKwh, previousKwh, deltaPercent } = report;

  // 1 · La noche, en cualquier forma de nombrarla.
  if (/noche|madrugada|fuera de horario|fuera del horario|21:00|6:00/.test(q)) {
    const totalNoche = report.sedes.reduce((s, sede) => s + sede.currentOutside, 0);
    const nocheAntes = report.sedes.reduce((s, sede) => s + sede.previousOutside, 0);
    return (
      <>
        <p>
          De madrugada (21:00 – 06:00) las tres sedes pasaron de {kwh(nocheAntes)} a{' '}
          {kwh(totalNoche)}.
        </p>
        <p>
          La {mainSede.name} pasó de {kwh(mainSede.previousOutside)} a{' '}
          {kwh(mainSede.currentOutside)}: del {porcentaje(mainSede.previousOutsideShare)} al{' '}
          {porcentaje(mainSede.currentOutsideShare)} de lo que gasta la sede. En las otras dos no se
          movió.
        </p>
        <p>
          Y ojo con esto: de los {numero(mainSede.delta)} kWh que subió la {mainSede.name},{' '}
          <strong>{numero(mainSede.delta - mainSede.outsideDelta)} fueron de día</strong>. La
          madrugada explica un tercio, no todo.
        </p>
      </>
    );
  }

  // 2 · Una sede concreta.
  const sede = report.sedes.find(s => q.includes(s.name.toLowerCase()) || q.includes(s.id));
  if (sede) {
    return (
      <>
        <p>
          La {sede.name} pasó de {kwh(sede.previousTotal)} a {kwh(sede.currentTotal)}:{' '}
          {porcentajeConSigno(sede.deltaPercent)}, {pesos(sede.deltaBill)} de diferencia. Es el{' '}
          {porcentaje(sede.share)} del aumento de las tres.
        </p>
        <p>
          Su consumo de madrugada fue de {kwh(sede.previousOutside)} a {kwh(sede.currentOutside)} (
          {porcentaje(sede.previousOutsideShare)} → {porcentaje(sede.currentOutsideShare)}).
        </p>
      </>
    );
  }

  // 3 · La causa.
  if (/por qu|causa|motivo|raz[oó]n|pass[oó]|anomal/.test(q)) {
    return (
      <>
        <p>
          <strong>Nadie lo sabe todavía.</strong> Hay dos candidatas y ninguna comprobada.
        </p>
        <p>
          <strong>Que el equipo de refrigeración quedara encendido:</strong> a favor, que su
          madrugada estuvo entre 10% y 11% todo el año y en octubre fue 18% — no tiene antecedente.
          En contra, que no hay medición por circuito ni registro de equipos.
        </p>
        <p>
          <strong>Que la cafetería opere más tarde:</strong> en contra, que si la operación se
          hubiera extendido, el peso de la subida caería en el cierre (18:00 – 21:00), y ahí solo
          subieron 60 kWh frente a los 420 de la madrugada.
        </p>
        <p>
          Y lo que ninguna de las dos cubre: <strong>780 de los 1.200 kWh</strong> que subió la sede
          ocurrieron dentro del horario habitual.
        </p>
      </>
    );
  }

  // 4 · El siguiente paso.
  if (/qu[eé] hago|siguiente paso|qu[eé] puedo|recomend|action|pedir/.test(q)) {
    return (
      <>
        <p>
          <strong>Pedir a Bia el diagnóstico de la {mainSede.name}</strong>, con estos datos:{' '}
          {numero(mainSede.delta)} kWh más, {pesos(mainSede.deltaBill)}, y una madrugada que subió{' '}
          {porcentaje(mainSede.outsideDeltaPercent)}.
        </p>
        <p>
          Es una medición, no un arreglo: la causa no está confirmada, y sin confirmarla cualquier
          cambio es un tiro a ciegas.
        </p>
      </>
    );
  }

  // 5 · En plata.
  if (/plata|dinero|d[oó]lar|pesos|factura|precio|cuanto pago/.test(q)) {
    return (
      <>
        <p>
          La factura de octubre es de <strong>{pesos(currentBill)}</strong>, contra{' '}
          {pesos(previousBill)} en septiembre: {pesos(currentBill - previousBill)} más (
          {porcentaje(deltaPercent)}).
        </p>
        <p>
          Y el precio no es la causa: la tarifa se mantuvo en {pesos(report.tariff)} el kWh. Los{' '}
          {numero(report.deltaKwh)} kWh de más son {pesos(report.deltaKwh * report.tariff)} de
          consumo.
        </p>
      </>
    );
  }

  // 6 · La tendencia: si es de este mes o de siempre.
  if (/siempre|normal|habitual|hist[oó]ric|antes|siempre|tendenc|meses/.test(q)) {
    const primero = mainSede.serie[0];
    const antes = mainSede.serie[mainSede.serie.length - 2];
    return (
      <>
        <p>
          La {mainSede.name} venía <strong>creciendo despacio</strong>: de {kwh(primero.total)} en{' '}
          {primero.label.toLowerCase()} a {kwh(antes.total)} en {antes.label.toLowerCase()}. En
          octubre saltó a {kwh(mainSede.currentTotal)}.
        </p>
        <p>
          Y su madrugada estuvo entre el{' '}
          {porcentaje(Math.min(...mainSede.serie.slice(0, -1).map(m => m.fueraShare)))} y el{' '}
          {porcentaje(Math.max(...mainSede.serie.slice(0, -1).map(m => m.fueraShare)))} de lo que
          gasta la sede durante <strong>nueve meses</strong>. El{' '}
          {porcentaje(mainSede.currentOutsideShare)} de octubre no tiene antecedente.
        </p>
      </>
    );
  }

  // 7 · El total, que es la pregunta por defecto.
  if (/cuanto|cuánto|total|consumo|gast|plata/.test(q) || q.trim() === '') {
    return (
      <>
        <p>
          En octubre las tres sedes consumieron <strong>{kwh(currentKwh)}</strong>, contra{' '}
          {kwh(previousKwh)} en septiembre: {porcentaje(deltaPercent)} más.
        </p>
        <p>
          La {mainSede.name} aporta {kwh(mainSede.currentTotal)} de eso, y fue la que más creció:{' '}
          {numero(mainSede.delta)} kWh más ({porcentaje(mainSede.share)} del aumento total).
        </p>
      </>
    );
  }

  // 8 · Lo que no se sabe contestar.
  return (
    <p>
      Eso no lo sé contestar con estos datos. Sí puedo responder por el consumo total, el de cada
      sede, el de madrugada, si es de este mes o de siempre, por qué sube y cuál es el siguiente
      paso.
    </p>
  );
}

export default function Asistente({ report }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const [preguntas, setPreguntas] = useState([]);
  const [borrador, setBorrador] = useState('');

  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const panel = panelRef.current;
    panel?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    }

    function onPointerDown(event) {
      if (panel?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  function toggle() {
    setOpen(value => !value);
    setRead(true);
  }

  function preguntar(texto) {
    const limpia = texto.trim();
    if (!limpia) return;
    setPreguntas(previo => [...previo, { pregunta: limpia, respuesta: responder(limpia, report) }]);
    setBorrador('');
  }

  const unread = read ? 0 : 1;

  return (
    <div className="assistant">
      {open && (
        <section
          ref={panelRef}
          className="assistant__panel"
          role="dialog"
          aria-labelledby="bia-assistant-title"
          tabIndex={-1}
        >
          <header className="assistant__head">
            <div className="assistant__identity">
              <h2 id="bia-assistant-title">Asistente</h2>
              <span className="badge">Sin modelo de AI</span>
            </div>
            <button
              type="button"
              className="assistant__close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar el asistente"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </header>

          <div className="assistant__thread">
            <article className="assistant__message">
              <p className="assistant__from">Sobre lo que estás viendo</p>
              <div className="assistant__bubble" aria-live="polite">
                {lecturaInicial(report)}
              </div>
            </article>

            {preguntas.map((turno, indice) => (
              <article className="assistant__message" key={indice}>
                <p className="assistant__from">Preguntaste</p>
                <div className="assistant__bubble">
                  <p>{turno.pregunta}</p>
                </div>
                <div className="assistant__bubble" aria-live="polite">
                  {turno.respuesta}
                </div>
              </article>
            ))}
          </div>

          {preguntas.length === 0 && (
            <div className="bia__sugeridas">
              {SUGERIDAS.map(texto => (
                <button
                  type="button"
                  key={texto}
                  className="bia__sugerida"
                  onClick={() => preguntar(texto)}
                >
                  {texto}
                </button>
              ))}
            </div>
          )}

          <form
            className="assistant__composer"
            onSubmit={event => {
              event.preventDefault();
              preguntar(borrador);
            }}
          >
            <label className="sr-only" htmlFor="bia-assistant-input">
              Escribir al asistente
            </label>
            <input
              id="bia-assistant-input"
              type="text"
              value={borrador}
              onChange={event => setBorrador(event.target.value)}
              placeholder="Preguntar sobre estos datos..."
            />
            <button type="submit" aria-label="Enviar la pregunta">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
                <path
                  d="M3.5 10 16 10M3.5 10 5.5 4.5 16.5 10 5.5 15.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>

          <p className="scope-note">
            Las respuestas se calculan con reglas sobre los datos de este ejercicio; no hay un
            modelo de AI conectado.
          </p>
        </section>
      )}

      <button
        ref={triggerRef}
        type="button"
        className={`assistant__trigger${open ? ' is-open' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-label={
          open
            ? 'Cerrar el asistente'
            : `Abrir el asistente${unread ? ' · 1 mensaje sin leer' : ''}`
        }
      >
        <IconChat />
        {unread > 0 && (
          <span className="assistant__unread" aria-hidden="true">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
