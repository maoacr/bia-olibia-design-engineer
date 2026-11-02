import React from 'react';
import { MONTHS } from './data.js';
import { pesos, porcentaje } from './format.js';

/**
 * EL VEREDICTO.
 *
 * Tres cosas y ninguna mas: cuanto, contra cuanto, y la frase que
 * corrige la lectura equivocada. La cascada que estaba antes ocupaba media
 * pantalla con dos losas grises para decir lo mismo que ahora dicen dos
 * lineas.
 */
export default function Veredicto({ report }) {
  const { currentBill, previousBill, deltaBill, deltaPercent, tariff } = report;

  return (
    <section className="bloque veredicto" id="q-que-paso" aria-labelledby="veredicto-titulo">
      <header className="bloque__head">
        <h2 id="veredicto-titulo">¿Qué pasó?</h2>
        <p className="bloque__scope">Factura de energía · {MONTHS.current.full}</p>
      </header>

      <p className="veredicto__total">{pesos(currentBill)}</p>

      <p className="veredicto__comparacion">
        contra {pesos(previousBill)} en {MONTHS.previous.label.toLowerCase()}{' '}
        <span className="veredicto__delta">
          +{pesos(deltaBill)} · +{porcentaje(deltaPercent)}
        </span>
      </p>

      <p className="veredicto__plano">
        La tarifa no cambió: {pesos(tariff)} el kWh en los dos meses. Subió el consumo.
      </p>
    </section>
  );
}
