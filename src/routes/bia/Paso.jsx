import React from 'react';
import { NEXT_STEP } from './data.js';

/**
 * EL SIGUIENTE PASO.
 *
 * Una linea y un boton. La alternativa —mover el arranque del equipo de
 * frio— queda debajo, marcada como condicional: depende de que la primera
 * hipotesis sea la correcta, y decirlo es parte del trabajo.
 */
export default function Paso({ sede, enviado, onPedir }) {
  return (
    <section className="bloque paso" id="q-que-hago" aria-labelledby="paso-titulo">
      <header className="bloque__head">
        <h2 id="paso-titulo">¿Qué hago?</h2>
      </header>

      {enviado ? (
        <div className="paso__enviado" role="status">
          <p className="paso__texto">
            <strong>Solicitud enviada.</strong> Bia revisa la {sede.name} y responde en un día hábil.
          </p>
        </div>
      ) : (
        <div className="paso__fila">
          <p className="paso__texto">
            Pedir a Bia el diagnóstico de la {sede.name}, con los datos que ya están.
          </p>
          <button type="button" className="paso__cta" onClick={onPedir}>
            Pedir el diagnóstico
          </button>
        </div>
      )}

      <p className="paso__alternativa">
        <span className="paso__alternativa-clave">Si la hipótesis del equipo es la correcta:</span>{' '}
        {NEXT_STEP.alternativa.titulo.toLowerCase()}.
      </p>
    </section>
  );
}
