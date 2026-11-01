import React from 'react';
import { OUTSIDE } from './data.js';
import { kwh, numero, porcentajeConSigno } from './format.js';

/**
 * EL DIA POR TRAMOS.
 *
 * La tercera pregunta es cuando: en que momento del dia se consumio lo
 * que se consumio. Las cinco franjas de la hora de apertura a la de cierre
 * mas la madrugada.
 *
 * El grafico usa el MISMO gesto que la cascada del primer bloque: la parte
 * que ya estaba en gris, la que se sumo en acento. Aprendido una vez, se
 * lee en los dos lugares.
 *
 * Y una decision que vale por todo el bloque: aqui NO hay tooltip. Todo lo
 * que el tooltip diria esta escrito en la fila, al lado. Un dato que solo
 * se ve pasando el mouse no es un dato, es una trampa.
 */
export default function Perfil({ sede }) {
  // La escala es comun a las cinco franjas: si cada una usara la suya, dos
  // tramos con el mismo valor se verian distintos.
  const maximo = Math.max(...sede.buckets.map(bucket => Math.max(bucket.previous, bucket.current)));

  return (
    <section className="bloque perfil" id="q-cuando" aria-labelledby="perfil-titulo">
      <header className="bloque__head">
        <h2 id="perfil-titulo">¿Cuándo?</h2>
        <p className="bloque__scope">El día de la {sede.name}, por tramos de horario</p>
      </header>

      <div className="perfil__filas">
        {sede.buckets.map(bucket => {
          const fuera = bucket.id === OUTSIDE;
          const cambio = bucket.previous ? bucket.delta / bucket.previous : 0;

          return (
            <div className={`perfil__fila${fuera ? ' perfil__fila--fuera' : ''}`} key={bucket.id}>
              <div className="perfil__rotulo">
                <span className="perfil__nombre">{bucket.label}</span>
                <span className="perfil__horas">{bucket.hours}</span>
              </div>

              <div className="perfil__pista">
                <span className="perfil__prev" style={{ '--parte': bucket.previous / maximo }} />
                {bucket.delta > 0 && (
                  <span className="perfil__delta" style={{ '--parte': bucket.delta / maximo }} />
                )}
              </div>

              <div className="perfil__cifras">
                <span className="perfil__consumo">
                  {numero(bucket.previous)} <span aria-hidden="true">→</span>{' '}
                  {numero(bucket.current)} kWh
                </span>
                <span className="perfil__cambio">
                  {bucket.delta > 0 ? '+' : ''}
                  {numero(bucket.delta)} kWh
                  <span className="perfil__cambio-pct"> ({porcentajeConSigno(cambio)})</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="perfil__pie">
        En total, {kwh(sede.currentTotal)} este mes contra {kwh(sede.previousTotal)} en septiembre.
      </p>
    </section>
  );
}
