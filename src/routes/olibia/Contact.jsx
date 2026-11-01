import React from 'react';
import { DUE, OVERDUE, contactState } from './contact.js';

/**
 * La fecha del proximo contacto, con su estado.
 *
 * Ocupa el lugar que dejo la columna "Movimiento", y no es un reemplazo
 * cualquiera: aquella decia como venia el mes contra el anterior, que es
 * reporte. Esta dice a quien hay que llamar, que es trabajo.
 *
 * El estado no depende solo del color —"vencido" y "hoy" van escritos— para
 * que la alerta siga existiendo sin distinguir matices, que es la misma regla
 * que ya siguen los distintivos de etapa y las etiquetas de movimiento.
 *
 * TRES NIVELES, Y DOS SEÑALES DISTINTAS. Al principio vencido iba en ambar y
 * hoy en gris, con el argumento de que si todo lo que pide atencion grita,
 * nada la pide. El argumento es correcto; estaba mal aplicado, porque metia
 * dos cosas distintas en un mismo nivel:
 *
 *   ROJO   vencido — ya fallo. El cliente no se contacto el dia que tocaba, y
 *          eso no es un aviso: es una perdida que ya ocurrio.
 *   AMBAR  hoy — la ventana accionable. Es LA lista de llamadas de la
 *          jornada, lo unico sobre lo que todavia se puede hacer algo.
 *   NEUTRO por venir — todavia no pide nada.
 *
 * Con el rojo tomando lo que ya fallo, el ambar queda libre justo para lo que
 * hay que hacer ahora. Los dos colores de señal ya existian en el sistema y
 * ya estaban medidos contra las dos superficies, en los dos temas.
 */

const TAGS = {
  [OVERDUE]: { label: 'vencido', tone: 'negative' },
  [DUE]: { label: 'hoy', tone: 'attention' },
};

export function ContactTag({ opportunity, period }) {
  const state = contactState(opportunity.nextContact, period);
  const tag = TAGS[state];

  return (
    <span className="contact">
      <span className={tag ? `contact__date contact__date--${tag.tone}` : 'contact__date'}>
        {opportunity.nextContact}
      </span>
      {tag && <span className={`contact__tag contact__tag--${tag.tone}`}>{tag.label}</span>}
    </span>
  );
}
