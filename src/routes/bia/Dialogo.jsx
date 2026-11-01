import React, { useEffect, useRef } from 'react';
import { NEXT_STEP } from './data.js';
import { kwh, pesos } from './format.js';

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * EL DIALOGO DEL PEDIDO.
 *
 * Antes de enviar nada, la persona ve lo que se va a enviar. Es la
 * confirmacion que el enunciado pide y tambien la salvaguarda de que el
 * pedido no sea una guess: lo que va es el dato, y el dato es el que
 * justifica que alguien mida.
 *
 * De teclado se ocupa como el detalle de Olibia: el foco entra al
 * dialogo, no se escapa mientras esta abierto, Escape lo cierra y el foco
 * vuelve al boton que lo abrio.
 */
export default function Dialogo({ sede, onConfirmar, onClose }) {
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

      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter(
        node => node.offsetParent !== null,
      );
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

  return (
    <div className="modal" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <article
        ref={dialogRef}
        className="dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
      >
        <header className="dialogo__head">
          <h2 className="dialogo__titulo" id="dialogo-titulo">
            {NEXT_STEP.titulo}
          </h2>
          <button
            type="button"
            className="dialogo__cerrar"
            onClick={onClose}
            aria-label="Cerrar sin enviar"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <p className="dialogo__intro">
          Esto es lo que se envía. La causa sigue sin confirmar: por eso el pedido es una medición,
          no un arreglo.
        </p>

        <ul className="dialogo__datos">
          <li>
            <span className="dialogo__dato-clave">Sede</span>
            <span className="dialogo__dato-valor">{sede.name}</span>
          </li>
          <li>
            <span className="dialogo__dato-clave">Consumo del mes</span>
            <span className="dialogo__dato-valor">+{kwh(sede.delta)}</span>
          </li>
          <li>
            <span className="dialogo__dato-clave">En plata</span>
            <span className="dialogo__dato-valor">+{pesos(sede.deltaBill)}</span>
          </li>
          <li>
            <span className="dialogo__dato-clave">De madrugada</span>
            <span className="dialogo__dato-valor">
              {kwh(sede.previousOutside)} <span aria-hidden="true">→</span>{' '}
              {kwh(sede.currentOutside)}
            </span>
          </li>
        </ul>

        <footer className="dialogo__pie">
          <button type="button" className="dialogo__cancelar" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="dialogo__enviar" onClick={onConfirmar}>
            Enviar la solicitud
          </button>
        </footer>
      </article>
    </div>
  );
}
