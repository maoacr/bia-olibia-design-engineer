import React, { useMemo, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { BUCKETS, OUTSIDE } from './data.js';
import { numero, pesos, porcentaje } from './format.js';

/**
 * EL EXPLORADOR.
 *
 * La version anterior tenia trece chips, dos select y un segmentado: una
 * pared de controles antes de ver nada, y una grafica con cuatro colores
 * que significaban cuatro cosas. Este bloque tiene CUATRO controles y una
 * sola regla de color:
 *
 *   · el teal   es el mes que estas mirando
 *   · el gris   es el mes de referencia
 *   · el rojo   aparece SOLO cuando el cambio es malo
 *   · el punteado es SOLO "sin confirmar"
 *
 * LA TIRA DE MESES ES EL CONTROL
 * ------------------------------
 * No hay dos selectores de mes: hay una tira con los diez meses, y se
 * comparan tocando dos. El primero que se toca es el gris (el de
 * referencia) y el segundo el teal (el que se mira). Tocar un tercero
 * reemplaza al teal, y tocar el gris da vuelta el par.
 *
 * Y la tira no es solo el control: es la RESPUESTA a "esto es de este mes
 * o de siempre". Muestra el valor mes a mes de lo que se esta mirando, con
 * el salto de octubre a la vista. Si no hay nada seleccionado, muestra el
 * total de las tres sedes; si se toca una fila de la comparacion, muestra
 * la historia de ESA fila.
 */

const METRICAS = [
  { id: 'kwh', label: 'kWh' },
  { id: 'plata', label: 'Pesos' },
  { id: 'porcentaje', label: '% del consumo' },
];

const DESGLOSES = [
  { id: 'sede', label: 'Sede' },
  { id: 'tramo', label: 'Tramo del día' },
];

export default function Explorador({ report }) {
  const [mesA, setMesA] = useState('sep');
  const [mesB, setMesB] = useState('oct');
  // El mes que se toco primero de un par nuevo. Mientras esta pendiente, la
  // grafica sigue comparando el par anterior: comparar a medias no es
  // comparar, y una grafica sin comparacion no tiene sentido.
  const [pendiente, setPendiente] = useState(null);
  const [unidad, setUnidad] = useState('kwh');
  const [desglose, setDesglose] = useState('sede');
  const [elegida, setElegida] = useState(null);

  const mesA_ = report.meses.find(m => m.id === mesA);
  const mesB_ = report.meses.find(m => m.id === mesB);

  /** Convierte un consumo en kWh a la unidad elegida. */
  const convertir = (consumo, mes) => {
    if (unidad === 'plata') return consumo * report.tariff;
    if (unidad === 'porcentaje') {
      const totalDelMes = report.sedes.reduce(
        (suma, s) => suma + s.serie.find(m => m.id === mes.id).total,
        0,
      );
      return consumo / totalDelMes;
    }
    return consumo;
  };

  /** Los kWh de una sede, un tramo o el conjunto, en un mes. */
  const kwhDe = (destino, mes) => {
    if (!destino) {
      return report.sedes.reduce(
        (suma, sede) => suma + sede.serie.find(m => m.id === mes.id).total,
        0,
      );
    }
    if (destino.tipo === 'sede') {
      const sede = report.sedes.find(s => s.id === destino.id);
      return sede.serie.find(m => m.id === mes.id).total;
    }
    return report.sedes.reduce((suma, sede) => {
      const delMes = sede.serie.find(m => m.id === mes.id);
      return suma + delMes.trams[destino.id];
    }, 0);
  };

  const valor = (destino, mes) => convertir(kwhDe(destino, mes), mes);

  const formato = cantidad => {
    if (unidad === 'plata') return pesos(Math.round(cantidad));
    if (unidad === 'porcentaje') return porcentaje(cantidad);
    return `${numero(Math.round(cantidad))} kWh`;
  };

  /** El destino que se esta mirando: una sede o un tramo. */
  const destinos = useMemo(() => {
    if (desglose === 'sede') {
      return report.sedes.map(s => ({ id: s.id, tipo: 'sede', nombre: s.name, nota: s.note }));
    }
    return BUCKETS.map(bucket => ({
      id: bucket.id,
      tipo: 'tramo',
      nombre: bucket.label,
      nota: bucket.hours,
      fuera: bucket.id === OUTSIDE,
    }));
  }, [report, desglose]);

  /** Las filas de la comparacion: el mes de referencia contra el que se mira. */
  const filas = destinos.map(destino => {
    const a = valor(destino, mesA_);
    const b = valor(destino, mesB_);
    return { ...destino, a, b, delta: b - a };
  });

  /** La tira: el valor mes a mes de lo que se esta mirando. */
  const mira = destinos.find(d => d.id === elegida) ?? null;
  const tira = report.meses.map(mes => {
    const v = valor(mira, mes);
    return { ...mes, valor: v, esA: mes.id === mesA, esB: mes.id === mesB };
  });

  const maximoFila = Math.max(1, ...filas.map(f => Math.max(f.a, f.b)));
  const maximoTira = Math.max(1, ...tira.map(m => m.valor));

  /**
   * TOCAR UN MES.
   *
   * Tocar dos meses arma el par: el primero es el de referencia (gris) y el
   * segundo el que se mira (teal). Un tercer toque arranca un par nuevo con
   * ese mes como referencia, y tocar el teal lo saca.
   *
   * La version anterior daba vuelta el par cuando se tocaba el gris, y al
   * probarlo se compararon mayo contra octubre sin querer. Una regla que
   * hay que adivinar no sirve.
   */
  function tocarMes(id) {
    if (pendiente === id) {
      setPendiente(null);
      return;
    }
    if (pendiente === null) {
      setPendiente(id);
      return;
    }
    setMesA(pendiente);
    setMesB(id);
    setPendiente(null);
  }

  const mesInicial = report.meses.find(m => m.id === mesA);
  const mesFinal = report.meses.find(m => m.id === mesB);

  return (
    <section className="bloque explorador" id="q-explorar" aria-labelledby="explorador-titulo">
      <header className="bloque__head">
        <h2 id="explorador-titulo">Comparar</h2>
        <p className="bloque__scope">
          Tocá dos meses. El primero es el de referencia; el segundo, el que querés ver.
        </p>
      </header>

      {/* ─── La tira: el control y la respuesta ────────────────────── */}
      <Tooltip.Provider delayDuration={200} skipDelayDuration={400}>
        <div className="tira">
          {tira.map(mes => (
            <Tooltip.Root key={mes.id}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  className={`tira__mes${mes.esA ? ' es-a' : ''}${mes.esB ? ' es-b' : ''}${
                    mes.esPendiente ? ' es-pendiente' : ''
                  }`}
                  aria-pressed={mes.esB}
                  aria-label={`${mes.label}: ${formato(mes.valor)}${
                    mes.esA ? ', mes de referencia' : mes.esB ? ', el que se está mirando' : ''
                  }`}
                  onClick={() => tocarMes(mes.id)}
                >
                  <span className="tira__barra" style={{ '--parte': mes.valor / maximoTira }} />
                  <span className="tira__corto">{mes.corto}</span>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="tip" sideOffset={8}>
                  <strong>{mes.full}</strong>
                  {formato(mes.valor)}
                  <Tooltip.Arrow className="tip__arrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
        </div>
      </Tooltip.Provider>

      <p className="tira__pie">
        {pendiente ? (
          <>
            <strong>{report.meses.find(m => m.id === pendiente).label}</strong> será el de
            referencia. Tocá el otro mes.
          </>
        ) : (
          <>
            <strong>
              {mesInicial.label} → {mesFinal.label}
            </strong>
            {mira ? ` de ${mira.nombre}` : ' de las tres sedes'}
          </>
        )}
      </p>

      {/* ─── Los dos controles que quedan ───────────────────────────── */}
      <div className="explorador__controles">
        <div className="explorador__grupo" role="group" aria-label="Desglosar por">
          {DESGLOSES.map(item => (
            <button
              type="button"
              key={item.id}
              className="explorador__chip"
              aria-pressed={desglose === item.id}
              onClick={() => {
                setDesglose(item.id);
                setElegida(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="explorador__grupo explorador__grupo--fin" role="group" aria-label="Unidad">
          {METRICAS.map(item => (
            <button
              type="button"
              key={item.id}
              className="explorador__chip"
              aria-pressed={unidad === item.id}
              onClick={() => setUnidad(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── La comparacion ─────────────────────────────────────────── */}
      <div className="explorador__filas">
        {filas.map(fila => (
          <button
            type="button"
            key={fila.id}
            className={`fila${elegida === fila.id ? ' es-elegida' : ''}`}
            aria-pressed={elegida === fila.id}
            onClick={() => setElegida(elegida === fila.id ? null : fila.id)}
          >
            <span className="fila__nombre">
              {fila.nombre}
              {fila.fuera && <span className="fila__nota">de madrugada</span>}
            </span>

            <span className="fila__pista">
              <span className="fila__barra" style={{ '--parte': fila.b / maximoFila }} />
              <span
                className="fila__referencia"
                style={{ '--parte': fila.a / maximoFila }}
                aria-hidden="true"
              />
            </span>

            <span className="fila__cifras">
              <span className="fila__antes">{formato(fila.a)}</span>
              <span className="fila__flecha" aria-hidden="true">
                →
              </span>
              <span className="fila__ahora">{formato(fila.b)}</span>
              <span
                className={`fila__delta${fila.delta > 0 ? ' sube' : fila.delta < 0 ? ' baja' : ''}`}
              >
                {fila.delta > 0 ? '+' : fila.delta < 0 ? '−' : ''}
                {formato(Math.abs(fila.delta))}
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="explorador__nota">
        La barra es {mesFinal ? mesFinal.label.toLowerCase() : 'el segundo mes'}; la línea, dónde
        estaba {mesInicial ? mesInicial.label.toLowerCase() : 'el primero'}. Tocá una fila para ver
        su historia mes a mes.
      </p>
    </section>
  );
}
