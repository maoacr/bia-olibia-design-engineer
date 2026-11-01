import React from 'react';
import { kwh, pesos, porcentaje } from './format.js';

/**
 * POR SEDE.
 *
 * La segunda pregunta es donde: si el aumento esta en una sede o repartido.
 * La respuesta es una sede, y el 80% es un numero que se ve en la barra
 * antes de leerlo.
 *
 * La fila trae ademas el dato que separa a esta pagina de un tablero de
 * consumo: cuanto de cada sede cae FUERA del horario habitual. Para dos
 * sedes esa cifra no se movio; para la tercera se disparo. Es el hecho que
 * despues sostiene la hipotesis, asi que va aqui y no escondido en un
 * bloque aparte.
 *
 * La seleccion es de radios nativos: una sola tabulacion, flechas para
 * moverse y el estado anunciado por el navegador. El circulito se dibuja a
 * mano porque el radio real esta escondido, pero la fila entera es la
 * etiqueta, asi que el area tactil es toda la fila.
 */
export default function Sedes({ report, selected, onSelect }) {
  const principal = report.mainSede;

  return (
    <section className="bloque sedes" id="q-donde" aria-labelledby="sedes-titulo">
      <header className="bloque__head">
        <h2 id="sedes-titulo">¿Dónde?</h2>
        <p className="bloque__scope">
          El consumo de cada sede, y cuánto de cada aumento es de esta
        </p>
      </header>

      <div className="sedes__lista" role="radiogroup" aria-label="Sedes">
        {report.sedes.map(sede => {
          // Un movimiento de medio punto porcentual es ruido de redondeo: las
          // dos sedes planas se dicen "sin cambio" en vez de repetir dos
          // numeros que no se diferencian.
          const moved = Math.abs(sede.currentOutsideShare - sede.previousOutsideShare) >= 0.005;

          return (
            <label className="sede" key={sede.id}>
              <input
                className="sr-only"
                type="radio"
                name="sede"
                value={sede.id}
                checked={selected === sede.id}
                onChange={() => onSelect(sede.id)}
              />
              <span className="sede__fila">
                <span className="sede__radio" aria-hidden="true" />

                <span className="sede__cuerpo">
                  <span className="sede__nombre">{sede.name}</span>
                  <span className="sede__nota">{sede.note}</span>
                </span>

                <span className="sede__cifras">
                  <span className="sede__consumo">
                    {kwh(sede.previousTotal)} <span aria-hidden="true">→</span>{' '}
                    <span className="sr-only">a</span> {kwh(sede.currentTotal)}
                  </span>
                  <span className="sede__delta">
                    +{kwh(sede.delta)} · +{pesos(sede.deltaBill)}
                  </span>
                </span>

                <span className="sede__participacion">
                  <span className="sede__pista">
                    <span className="sede__barra" style={{ '--parte': sede.share }} />
                  </span>
                  <span className="sede__participacion-valor">
                    {porcentaje(sede.share)} del alza
                  </span>
                </span>

                <span className={`sede__fuera${moved ? ' sede__fuera--movida' : ''}`}>
                  Fuera de horario:{' '}
                  {moved ? (
                    <>
                      {porcentaje(sede.previousOutsideShare)} <span aria-hidden="true">→</span>{' '}
                      <span className="sr-only">a</span> {porcentaje(sede.currentOutsideShare)}
                    </>
                  ) : (
                    'sin cambio'
                  )}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <p className="sedes__conclusion">
        El {porcentaje(principal.share)} del aumento está en la {principal.name}:{' '}
        {pesos(principal.deltaBill)} de {pesos(report.deltaBill)}.
      </p>
    </section>
  );
}
