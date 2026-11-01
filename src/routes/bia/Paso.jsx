import React from 'react';
import { NEXT_STEP } from './data.js';
import { kwh, pesos, porcentaje } from './format.js';

/**
 * EL SIGUIENTE PASO.
 *
 * Lo que la pagina ofrece no es un arreglo: es una medicion. Y esa es la
 * diferencia entre honesto y comodo. Decirle a esta persona "apague las
 * neveras a las 9 de la noche" cuando la causa no esta confirmada
 * convertiria una suposicion en una orden, y si la suposicion esta
 * equivocado, la persona hizo un esfuerzo para nada y pierde la confianza
 * en el producto.
 *
 * Por eso hay un paso principal y una alternativa marcada como
 * condicional: la segunda depende de que la primera hipotesis sea la
 * correcta, y la pagina lo dice.
 *
 * Y el paso sigue a la SEDE CON LA ANOMALIA, no a la que este mirando la
 * persona en ese momento. Si estas mirando la Sede Norte, que no tiene
 * nada que explicar, el paso te dice eso y te ofrece el diagnostico de la
 * que si lo tiene: pedir un diagnostico de una sede que no lo necesita
 * seria tirar el tiempo de quien lo pide.
 */
export default function Paso({ sede, diagnostico, enviado, onPedir }) {
  const esLaDiagnosticada = sede.id === diagnostico.id;

  return (
    <section className="bloque paso" id="q-que-hago" aria-labelledby="paso-titulo">
      <header className="bloque__head">
        <h2 id="paso-titulo">¿Qué hago?</h2>
        <p className="bloque__scope">Un paso, con lo que haría falta para el siguiente</p>
      </header>

      <p className="paso__frase">Todavía no sabemos la causa. Sí sabemos dónde mirar.</p>

      {!esLaDiagnosticada && (
        <p className="paso__nota">
          En la {sede.name} no hay nada que pedir: su consumo de madrugada no se movió. Lo que hay
          que pedir es el diagnóstico de la {diagnostico.name}.
        </p>
      )}

      {enviado ? (
        <div className="paso__enviado" role="status">
          <p className="paso__enviado-titulo">Solicitud enviada</p>
          <p className="paso__enviado-texto">
            Bia revisa la {diagnostico.name} y responde en un día hábil. El resumen que se envió:{' '}
            {kwh(diagnostico.delta)} más, {pesos(diagnostico.deltaBill)}, y una madrugada que pasó
            de {kwh(diagnostico.previousOutside)} a {kwh(diagnostico.currentOutside)} kWh.
          </p>
        </div>
      ) : (
        <div className="paso__principal">
          <p className="paso__titulo">Pedir a Bia el diagnóstico de la {diagnostico.name}</p>
          <p className="paso__porque">
            Con los datos que ya están: {kwh(diagnostico.delta)} más (
            {porcentaje(diagnostico.share)} del aumento), {pesos(diagnostico.deltaBill)}, y una
            madrugada que pasó de {porcentaje(diagnostico.previousOutsideShare)} a{' '}
            {porcentaje(diagnostico.currentOutsideShare)} de lo que gasta la sede. La causa sigue
            sin confirmar, y por eso lo que sirve es que alguien la mida.
          </p>
          <button type="button" className="paso__cta" onClick={onPedir}>
            Pedir el diagnóstico
          </button>
        </div>
      )}

      <div className="paso__alternativa">
        <p className="paso__alternativa-etiqueta">Condicional</p>
        <p className="paso__alternativa-titulo">{NEXT_STEP.alternativa.titulo}</p>
        <p className="paso__alternativa-condicion">{NEXT_STEP.alternativa.condicion}</p>
      </div>
    </section>
  );
}
