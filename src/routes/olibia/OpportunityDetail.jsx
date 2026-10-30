import React, { useEffect, useRef } from 'react';
import { MovementTag, movementSentence } from './Movement.jsx';

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
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function OpportunityDetail({ opportunity, year, done, onFollowUp, onClose }) {
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

  const followed = Boolean(done);

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
        <p className="detail__amount">
          ${opportunity.value} M<span className="detail__amount-note">COP mensuales estimados</span>
        </p>

        <dl className="detail__facts">
          <div>
            <dt>Etapa</dt>
            <dd>
              <span className="badge">{opportunity.stage}</span>
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
              {opportunity.nextContact} {year}
            </dd>
          </div>
        </dl>

        <footer className="detail__foot">
          <button className="detail__action" disabled={followed} onClick={onFollowUp}>
            {followed ? 'Seguimiento registrado' : 'Marcar seguimiento realizado'}
          </button>
          <p role="status" className="detail__status">
            {followed ? 'Queda marcado en la lista durante esta sesión.' : ''}
          </p>
        </footer>
      </article>
    </div>
  );
}
