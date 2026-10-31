/**
 * Asistente — el resumen AI, pero como conversacion.
 *
 * Antes era un panel fijo en medio de la pagina que afirmaba dos cifras y
 * sugeria un paso. Decia lo suyo y se terminaba ahi: no habia nada que
 * preguntarle. Como burbuja, el mismo texto pasa a ser el primer turno de
 * un intercambio, y el lugar para seguir preguntando queda a la vista.
 *
 * DONDE VA, Y POR QUE AHI. Desde 40rem el dock se corre a la columna
 * izquierda, asi que el angulo inferior derecho queda libre y la burbuja
 * cae donde todo el mundo la busca. Por debajo de 40rem el dock baja a la
 * barra inferior y ocupa ese rincon entero.
 *
 * No se resolvio metiendo el chat como septimo destino del dock: con los
 * filtros puestos aparece ademas el boton de limpiar, y en 375px los siete
 * destinos caen a 41.9px de ancho — por debajo del piso tactil de 44px que
 * el proyecto se fijo. El dock ya esta al limite con seis.
 *
 * Entonces la burbuja se apila ARRIBA del dock, con el mismo vidrio, el
 * mismo borde y la misma sombra: no es un widget pegado de afuera, es la
 * segunda pieza del sistema flotante que ya existia. El despeje sale de
 * --dock-height, derivado de los mismos tokens que dibujan el dock, para
 * que el dia que el dock cambie de alto la burbuja lo siga sola.
 *
 * NO ES MODAL, a proposito. Un chat que secuestra el foco y bloquea el
 * scroll impide lo unico para lo que sirve: mirar los datos mientras se
 * pregunta por ellos. Escape cierra, el clic afuera cierra, el foco entra
 * al abrir y vuelve al boton al cerrar — pero el tabulador no queda
 * encerrado y la pagina de atras sigue viva.
 *
 * El mensaje queda sin leer hasta que se abre por primera vez. Refleja
 * siempre la vista actual: es el mismo alcance que tenia el panel, que SI
 * responde a los filtros.
 */

import React, { useEffect, useRef, useState } from 'react';

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

/** Concordancia de numero, para no escribir "1 oportunidades". */
const plural = (count, singular, many) => `${count} ${count === 1 ? singular : many}`;

export default function Assistant({ rows, total, negotiation, cause, period }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);

  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    // El foco entra al panel, no se queda en el boton que ya se apreto.
    panel?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    }

    // Un clic fuera cierra. Va en `mousedown` y no en `click` para que
    // apretar dentro y soltar afuera —al seleccionar texto del mensaje— no
    // cuente como salida.
    function onPointerDown(event) {
      if (panel?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      // Al cerrar, el foco vuelve de donde salio. Sin esto, quien navega con
      // teclado queda al principio del documento.
      triggerRef.current?.focus();
    };
  }, [open]);

  function toggle() {
    setOpen(value => !value);
    setRead(true);
  }

  const unread = read ? 0 : 1;

  return (
    <div className="assistant">
      {open && (
        <section
          ref={panelRef}
          className="assistant__panel"
          role="dialog"
          aria-labelledby="assistant-title"
          tabIndex={-1}
        >
          <header className="assistant__head">
            <div className="assistant__identity">
              <h2 id="assistant-title">Asistente</h2>
              <span className="badge">Vista de demostración</span>
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
              {/* El alcance del mensaje, donde un chat real pondria la hora.
                  Inventar una marca de tiempo seria inventar un dato. */}
              <p className="assistant__from">Sobre lo que estás viendo</p>
              <div className="assistant__bubble" aria-live="polite">
                {rows.length ? (
                  <>
                    <p>
                      Hay{' '}
                      <strong>
                        {plural(rows.length, 'oportunidad abierta', 'oportunidades abiertas')}
                      </strong>{' '}
                      en esta vista, por un valor mensual estimado de{' '}
                      <strong>${total} millones COP</strong>.{' '}
                      {negotiation.length
                        ? `${plural(negotiation.length, 'está', 'están')} en negociación y ${negotiation.length === 1 ? 'concentra' : 'concentran'} $${negotiation.reduce((sum, o) => sum + o.value, 0)} millones COP del pipeline.`
                        : 'Ninguna de las oportunidades visibles está en negociación.'}
                    </p>
                    <p>
                      <strong>Siguiente paso sugerido:</strong> revisar{' '}
                      {negotiation.length
                        ? 'las negociaciones pendientes'
                        : 'las próximas fechas de contacto'}{' '}
                      y confirmar responsables.
                    </p>
                  </>
                ) : (
                  <p>
                    {cause
                      ? `Ninguna oportunidad de ${period.label} tiene ${cause.name} "${cause.value}".`
                      : 'No hay oportunidades con esta combinación de filtros.'}
                  </p>
                )}
              </div>
            </article>
          </div>

          {/* El campo existe y se ve deshabilitado en vez de faltar: muestra
              hacia donde va la pieza sin fingir que ya conversa. */}
          <form className="assistant__composer" onSubmit={event => event.preventDefault()}>
            <label className="sr-only" htmlFor="assistant-input">
              Escribir al asistente
            </label>
            <input
              id="assistant-input"
              type="text"
              placeholder="Preguntar sobre estos datos..."
              disabled
            />
            <button type="submit" disabled aria-label="Enviar">
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
            Resumen simulado a partir de los datos visibles; no utiliza un servicio de AI. La
            conversación todavía no está conectada.
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
            : `Abrir el asistente${unread ? ` · ${plural(unread, 'mensaje sin leer', 'mensajes sin leer')}` : ''}`
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
