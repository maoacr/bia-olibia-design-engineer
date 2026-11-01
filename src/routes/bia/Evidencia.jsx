import React, { useState } from 'react';
import { HYPOTHESIS } from './data.js';
import { kwh, porcentaje } from './format.js';

/**
 * EL HECHO Y LAS HIPOTESIS.
 *
 * Este es el bloque del que la pagina se juega el criterio. El enunciado
 * pide distinguir hechos de hipotesis, y casi ningun diseno lo hace de
 * verdad: lo que casi siempre pasa es que el grafico de la madrugada
 * aparece al lado del dato y el lector lo toma por la causa.
 *
 * Aqui la causa esta en otro lugar, con su propio registro visual: un
 * contorno punteado y la palabra SIN CONFIRMAR. El punteado, en toda la
 * pagina, significa exactamente eso y nada mas. Un hecho se muestra con
 * tinta solida; una hipotesis, con puntos. Y el bloque del limite dice
 * cuanto de la situacion NO cubren las hipotesis, porque 780 de los 1.200
 * kWh que subio la sede ocurrieron dentro del horario habitual: la parte
 * mas grande del problema sigue sin explicacion, y decirlo es parte del
 * trabajo.
 */
export default function Evidencia({ sede }) {
  const [abierto, setAbierto] = useState(false);

  // Dos puntos porcentuales de diferencia en el consumo de madrugada ya son
  // una señal; menos que eso es ruido de redondeo.
  const movio = Math.abs(sede.currentOutsideShare - sede.previousOutsideShare) >= 0.02;

  if (!movio) {
    return (
      <section className="bloque evidencia evidencia--vacia" aria-labelledby="evidencia-titulo">
        <header className="bloque__head">
          <h2 id="evidencia-titulo">¿Por qué?</h2>
          <p className="bloque__scope">Qué se sabe del consumo de madrugada de la {sede.name}</p>
        </header>
        <p className="evidencia__vacia-titulo">En esta sede no hay nada que explicar</p>
        <p className="evidencia__vacia-texto">
          La {sede.name} gastó {kwh(sede.delta)} más, y su consumo fuera de horario no se movió:{' '}
          {porcentaje(sede.currentOutsideShare)} en los dos meses. Lo que subió fue dentro del
          horario de apertura, que es lo normal que subir.
        </p>
      </section>
    );
  }

  return (
    <section className="bloque evidencia" id="q-porque" aria-labelledby="evidencia-titulo">
      <header className="bloque__head">
        <h2 id="evidencia-titulo">¿Por qué?</h2>
        <p className="bloque__scope">Qué está confirmado y qué no, en la {sede.name}</p>
      </header>

      <div className="evidencia__bloque evidencia__bloque--hecho">
        <p className="evidencia__etiqueta">Dato</p>
        <p className="evidencia__texto">{HYPOTHESIS.sintoma}</p>
      </div>

      <div className="evidencia__bloque evidencia__bloque--hipotesis">
        <p className="evidencia__etiqueta">Hipótesis · sin confirmar</p>
        <p className="evidencia__texto">
          Dos causas posibles. Ninguna comprobada, y no se pueden separar con los datos de este mes.
        </p>

        <ol className="evidencia__candidatos">
          {HYPOTHESIS.candidatos.map(candidato => (
            <li className="candidato" key={candidato.id}>
              <p className="candidato__afirmacion">{candidato.claim}</p>

              {abierto && (
                <div className="candidato__evidencia">
                  <div className="candidato__lado">
                    <p className="candidato__lado-titulo">A favor</p>
                    <ul>
                      {candidato.aFavor.map(linea => (
                        <li key={linea}>{linea}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="candidato__lado">
                    <p className="candidato__lado-titulo">En contra</p>
                    <ul>
                      {candidato.enContra.map(linea => (
                        <li key={linea}>{linea}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>

        <button
          type="button"
          className="evidencia__toggle"
          aria-expanded={abierto}
          onClick={() => setAbierto(valor => !valor)}
        >
          {abierto ? 'Ocultar los datos de cada hipótesis' : 'Ver los datos que sostienen cada una'}
        </button>
      </div>

      <div className="evidencia__bloque evidencia__bloque--limite">
        <p className="evidencia__etiqueta">Lo que no explican</p>
        <p className="evidencia__texto">{HYPOTHESIS.limite}</p>
        <p className="evidencia__falta-titulo">Para confirmarlas o descartarlas harían falta:</p>
        <ul className="evidencia__falta">
          {HYPOTHESIS.falta.map(linea => (
            <li key={linea}>{linea}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
