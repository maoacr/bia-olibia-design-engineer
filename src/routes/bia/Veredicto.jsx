import React from 'react';
import { kwh, pesos, porcentaje } from './format.js';

/**
 * EL VEREDICTO.
 *
 * Los meses son el marco. Un "+25%" sin los meses al lado no dice nada, y
 * la cifra sola se lleva la mirada a un numero que no se puede interpretar.
 * Por eso la comparacion se abre como una factura: dos columnas, la de
 * referencia y la que se mira, con su mes ARRIBA de cada numero.
 *
 * Y la ultima frase corrige la lectura equivocada: la tarifa no cambio, de
 * modo que lo que subio fue consumo.
 */
export default function Veredicto({ comparacion: c, tarifa }) {
  return (
    <section className="bloque veredicto" id="q-que-paso" aria-labelledby="veredicto-titulo">
      <header className="bloque__head">
        <h2 id="veredicto-titulo">¿Qué pasó?</h2>
        <p className="bloque__scope">Factura de energía · comparación mes a mes</p>
      </header>

      <div className="veredicto__marco">
        <div className="veredicto__columna">
          <p className="veredicto__mes">{c.a.label}</p>
          <p className="veredicto__numero veredicto__numero--antes">{pesos(c.billA)}</p>
          <p className="veredicto__kwh">{kwh(c.kwhA)}</p>
        </div>

        <div className="veredicto__columna veredicto__columna--ahora">
          <p className="veredicto__mes">{c.b.label}</p>
          <p className="veredicto__numero">{pesos(c.billB)}</p>
          <p className="veredicto__kwh">{kwh(c.kwhB)}</p>
          <p className="veredicto__delta">
            {c.deltaBill > 0 ? '+' : c.deltaBill < 0 ? '−' : ''}
            {pesos(Math.abs(c.deltaBill))} ·{' '}
            {c.deltaPercent > 0 ? '+' : c.deltaPercent < 0 ? '−' : ''}
            {porcentaje(Math.abs(c.deltaPercent))}
          </p>
        </div>
      </div>

      <p className="veredicto__plano">
        La tarifa no cambió: {pesos(tarifa)} el kWh en los dos meses. Subió el consumo.
      </p>
    </section>
  );
}
