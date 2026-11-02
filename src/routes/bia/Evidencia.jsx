import React, { useState } from 'react';
import { HYPOTHESIS } from './data.js';
import { porcentaje } from './format.js';

/**
 * EL HECHO Y LAS HIPOTESIS.
 *
 * Dos cajas y un limite. Los detalles —los dos candidatos, lo que sostiene
 * cada uno, lo que falta medir— quedan a un clic, porque estaban abiertos
 * de entrada y la pagina se leia como un informe, no como una respuesta.
 *
 * El punteado sigue siendo lo unico que significa "sin confirmar" en todo
 * el sitio. El hecho va con tinta solida.
 */
export default function Evidencia({ sede }) {
  const [abierto, setAbierto] = useState(false);

  const primero = sede.serie[0];
  const antes = sede.serie[sede.serie.length - 2];
  const previos = sede.serie.slice(0, -1);
  const minimo = Math.min(...previos.map(m => m.fueraShare));
  const maximo = Math.max(...previos.map(m => m.fueraShare));
  const minimoTotal = Math.min(...previos.map(m => m.total));
  const maximoTotal = Math.max(...previos.map(m => m.total));

  return (
    <section className="bloque evidencia" id="q-porque" aria-labelledby="evidencia-titulo">
      <header className="bloque__head">
        <h2 id="evidencia-titulo">¿Por qué?</h2>
      </header>

      <div className="evidencia__dato">
        <p className="evidencia__etiqueta">Dato</p>
        <p className="evidencia__texto">{HYPOTHESIS.sintoma}</p>
        <p className="evidencia__contexto">
          Entre {primero.label.toLowerCase()} y {antes.label.toLowerCase()} estuvo siempre entre{' '}
          {porcentaje(minimo)} y {porcentaje(maximo)}. En los nueve meses anteriores gastó entre{' '}
          {minimoTotal.toLocaleString('es-CO')} y {maximoTotal.toLocaleString('es-CO')} kWh.
        </p>
      </div>

      <div className="evidencia__hipotesis">
        <p className="evidencia__etiqueta">Hipótesis · sin confirmar</p>
        <p className="evidencia__texto">{HYPOTHESIS.candidatos.map(c => c.claim).join(' · ')}</p>
        <p className="evidencia__texto evidencia__texto--mudo">{HYPOTHESIS.limite}</p>

        {!abierto && (
          <button type="button" className="evidencia__mas" onClick={() => setAbierto(true)}>
            Ver por qué cada una
          </button>
        )}

        {abierto && (
          <div className="evidencia__detalle">
            {HYPOTHESIS.candidatos.map(candidato => (
              <div className="candidato" key={candidato.id}>
                <p className="candidato__afirmacion">{candidato.claim}</p>
                <div className="candidato__lados">
                  <div>
                    <p className="candidato__lado-titulo">A favor</p>
                    <ul>
                      {candidato.aFavor.map(linea => (
                        <li key={linea}>{linea}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="candidato__lado-titulo">En contra</p>
                    <ul>
                      {candidato.enContra.map(linea => (
                        <li key={linea}>{linea}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
            <div className="candidato">
              <p className="candidato__afirmacion">Lo que haría falta</p>
              <ul className="candidato__falta">
                {HYPOTHESIS.falta.map(linea => (
                  <li key={linea}>{linea}</li>
                ))}
              </ul>
            </div>
            <button type="button" className="evidencia__mas" onClick={() => setAbierto(false)}>
              Ocultar el detalle
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
