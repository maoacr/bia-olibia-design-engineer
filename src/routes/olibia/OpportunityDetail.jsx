import React, { useEffect, useRef, useState } from 'react';
import { MovementTag, movementSentence } from './Movement.jsx';
import { STAGE_SLUG } from './data.js';
import { nextStage } from './movement.js';
import { ContactTag } from './Contact.jsx';

/**
 * Detalle de una oportunidad.
 *
 * El detalle del starter repetia los mismos cuatro campos de la tabla con el
 * mismo peso, asi que abrirlo no aportaba nada. Aqui la informacion se agrupa
 * por lo que responde —cuanto vale, en que anda, que sigue— y el valor y el
 * movimiento dejan de competir con los datos de ficha.
 *
 * Tambien resuelve lo que faltaba de teclado: el foco entra al dialogo, no se
 * escapa mientras esta abierto y vuelve al boton que lo abrio al cerrarlo.
 *
 * Y ES EL UNICO LUGAR DONDE SE ACTUA. La pagina entera diagnostica: cinco
 * preguntas que señalan que una cuenta lleva un mes sin moverse, que un canal
 * no pasa de Calificacion, que faltan dos cierres. Hasta aqui lo unico que se
 * podia hacer al respecto era un booleano —"ya lo mire"—, asi que el producto
 * detectaba y no trataba.
 *
 * Adelantar de etapa cierra ese circuito, y lo hace sin sincronizar nada: la
 * etapa entra por `opportunitiesWithMovement`, de donde sale todo lo que la
 * pagina dibuja. Mover la cuenta trabada recalcula su movimiento contra el
 * mes previo, y "Que se esta cayendo?" deja de marcarla en el mismo cuadro.
 *
 * SE FUE "MARCAR SEGUIMIENTO REALIZADO". Dejaba un tilde junto al nombre en
 * la lista y nada mas. Una cuenta recorre el embudo con muchos contactos
 * encima, asi que un booleano no contesta cuanto hay que insistir ni cuando
 * volver —y encima se borraba al recargar, o sea que dependia de la sesion y
 * no del cliente. En su lugar va el formulario de registrar contacto: que se
 * hablo y para cuando quedo el proximo. La fecha no es decorativa, actualiza
 * el campo del que sale la alerta de vencido.
 *
 * EL HISTORIAL NO INVENTA NADA. No hay conversaciones de asesores escritas a
 * mano: cada linea sale de un dato que el sistema ya tenia —en que etapa
 * estaba el mes pasado, quien la lleva, cuando toca el proximo contacto, como
 * se movio— mas lo que ocurre en esta sesion. Es la misma regla que el resto
 * del proyecto: derivar del dato en lugar de escribirlo a mano.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** "Octubre 2026" -> "octubre". Sale de lo que el periodo declara, no de
    cortar la cadena a ciegas. */
const monthOf = period => period.label.replace(` ${period.year}`, '').toLowerCase();

export default function OpportunityDetail({
  opportunity,
  period,
  previous,
  log,
  onPromote,
  onRegister,
  onClose,
}) {
  const [notes, setNotes] = useState('');
  const [on, setOn] = useState('');
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    // Quien tenia el foco antes de abrir, para devolverselo al cerrar.
    returnFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector(FOCUSABLE)?.focus();

    // Sin esto, la pagina de atras sigue desplazandose bajo el dialogo.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      // Encierra el recorrido del tabulador dentro del dialogo: sin esto el
      // foco se va a la pagina de atras, que esta oculta para el lector pero
      // sigue siendo tabulable.
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [onClose]);

  const { movement } = opportunity;
  const next = nextStage(opportunity.stage);

  return (
    <div className="modal" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <article
        ref={dialogRef}
        className="detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detailTitle"
      >
        <header className="detail__head">
          <div>
            <h2 id="detailTitle">{opportunity.company}</h2>
            <p className="detail__meta">
              {opportunity.channel} · {opportunity.owner}
            </p>
          </div>
          <button className="detail__close" onClick={onClose} aria-label="Cerrar el detalle">
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        {/* Lo que primero se pregunta de una oportunidad es cuanto vale. */}
        {/* DOS COLUMNAS DESDE TABLET, y el reparto no es por tamaño: a la
            izquierda esta EL NEGOCIO —cuanto vale, en que etapa anda, y la
            accion que mueve esa etapa— y a la derecha LA ACTIVIDAD sobre el:
            que paso y que registrar ahora. Agrupados en dos cajas y no
            repartidos con `grid-template-areas` porque en areas las filas de
            una columna dictan las alturas de la otra, y las dos mitades no
            tienen ni la misma cantidad de piezas ni el mismo alto.

            El orden del DOM es el mismo que el visual en los dos anchos, asi
            que el recorrido con teclado no salta de una columna a la otra:
            cerrar, adelantar etapa, y recien despues el formulario. */}
        <div className="detail__body">
          <div className="detail__deal">
            <p className="detail__amount">
              ${opportunity.value} M
              <span className="detail__amount-note">COP mensuales estimados</span>
            </p>

            <dl className="detail__facts">
              <div>
                <dt>Etapa</dt>
                <dd>
                  <span className={`badge badge--${STAGE_SLUG[opportunity.stage]}`}>
                    {opportunity.stage}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Movimiento</dt>
                <dd>
                  <MovementTag movement={opportunity.movement} />
                  <span className="detail__sentence">{movementSentence(opportunity.movement)}</span>
                </dd>
              </div>
              <div>
                <dt>Próximo contacto</dt>
                <dd>
                  <ContactTag opportunity={opportunity} period={period} />
                </dd>
              </div>
            </dl>

            <footer className="detail__foot">
              {/* La accion que faltaba. Deshabilitada en la ultima etapa, donde no
              hay "siguiente": cerrar un negocio no es avanzar el embudo. */}
              {next ? (
                <button className="detail__action detail__action--primary" onClick={onPromote}>
                  Avanzar a {next}
                </button>
              ) : (
                <button className="detail__action" disabled>
                  Está en la última etapa
                </button>
              )}
            </footer>
          </div>

          <div className="detail__activity">
            <section className="detail__log" aria-labelledby="detail-log-title">
              <h3 id="detail-log-title">Historial</h3>
              <ol>
                {/* Lo de esta sesion primero, con su hora: es lo ultimo que paso
                y es lo unico que la persona acaba de provocar. */}
                {(log ?? []).map((entry, i) => (
                  <li key={`s${i}`} className="detail__entry detail__entry--live">
                    <span className="detail__when">{entry.at}</span>
                    <span>
                      {entry.text}
                      {entry.next && (
                        <span className="detail__rescheduled">Próximo contacto: {entry.next}</span>
                      )}
                    </span>
                  </li>
                ))}

                {/* El proximo contacto es el unico hecho a futuro, y encabeza por
                eso: es lo que hay que hacer, no lo que ya se hizo. */}
                <li className="detail__entry detail__entry--next">
                  <span className="detail__when">
                    {opportunity.nextContact} {period.year}
                  </span>
                  <span>Próximo contacto previsto · {opportunity.owner}</span>
                </li>

                <li className="detail__entry">
                  <span className="detail__when">{monthOf(period)}</span>
                  <span>
                    {movement
                      ? movementSentence(movement)
                      : `En ${opportunity.stage} · ${opportunity.owner}`}
                  </span>
                </li>

                {/* Solo si la cuenta ya existia el mes pasado. Si entro nueva, la
                frase de movimiento ya lo dice y una linea previa seria falsa. */}
                {movement?.from && previous && (
                  <li className="detail__entry">
                    <span className="detail__when">{monthOf(previous)}</span>
                    <span>
                      En {movement.from} · {opportunity.owner}
                    </span>
                  </li>
                )}
              </ol>

              {!previous && (
                <p className="detail__note">
                  {period.label} es el periodo más antiguo disponible: no hay un mes previo del cual
                  traer historia.
                </p>
              )}
            </section>

            {/* REGISTRAR UN CONTACTO. Es la accion que un asesor hace de verdad, y
            la que el booleano anterior fingia: anota que se hablo y deja
            acordada la proxima fecha. Guardar escribe las dos cosas — la nota
            encabeza el historial y la fecha actualiza el campo del que sale
            la alerta de vencido, que se ve al instante en la ficha de arriba
            y en la fila de la tabla. */}
            <form
              className="contact-form"
              onSubmit={event => {
                event.preventDefault();
                if (!notes.trim()) return;
                onRegister({ notes, on });
                setNotes('');
                setOn('');
              }}
            >
              <h3>Registrar contacto</h3>

              <label className="contact-form__field">
                Qué se habló
                <textarea
                  rows={2}
                  value={notes}
                  required
                  placeholder="Pidió la propuesta por escrito…"
                  onChange={event => setNotes(event.target.value)}
                />
              </label>

              <label className="contact-form__field contact-form__field--date">
                Próximo contacto acordado
                <input type="date" value={on} onChange={event => setOn(event.target.value)} />
              </label>

              {/* Deshabilitado sin nota, no sin fecha: el registro existe para
              dejar dicho QUE paso. Reagendar sin contar nada no es un
              contacto, y una fecha nueva sin motivo no se puede auditar. */}
              <button type="submit" className="detail__action" disabled={!notes.trim()}>
                Guardar contacto
              </button>
            </form>
          </div>
        </div>

        {/* Gobierna a las dos acciones —adelantar etapa y registrar
            contacto—, asi que no puede vivir dentro de ninguna de las dos:
            va al pie del dialogo y cruza las dos columnas. */}
        <p className="detail__note detail__note--close">
          Los cambios viven en esta sesión; no hay un servicio conectado que los guarde.
        </p>
        {/* El cambio se VE como primera linea del historial, con su hora.
            Para quien no lo ve, hace falta decirlo: el historial es una
            lista y volverlo `role="log"` le quitaria la semantica de
            lista, asi que el anuncio va en una region aparte. */}
        <p role="status" className="sr-only">
          {log?.length ? log[0].text : ''}
        </p>
      </article>
    </div>
  );
}
