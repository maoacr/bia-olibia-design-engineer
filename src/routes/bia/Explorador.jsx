import React, { useMemo, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { BUCKETS, OUTSIDE } from './data.js';
import { kwh, numero, pesos, porcentaje, porcentajeConSigno } from './format.js';

/**
 * EL EXPLORADOR.
 *
 * La pagina cuenta una historia, y la historia esta bien. Pero el caso de
 * uso real es otro: alguien que administra tres cafeterias tiene un
 * objetivo clarisimo —entender que esta pasando con el consumo— y para
 * lograrlo hay que COMPARAR. Comparar sedes con sedes, meses con meses,
 * tramos del dia con tramos del dia.
 *
 * La version que cuenta la historia deja la comparacion encerrada: se ve
 * una sede a la vez y su perfil, y no hay forma de poner las tres lado a
 * lado. Este bloque es esa herramienta: filtros que se mueven, y una
 * grafica que reacciona en el momento.
 *
 * EL PORQUE DE NO USAR UNA LIBRERIA
 * ---------------------------------
 * Tremor, que es lo que suele usarse para esto, exige Tailwind CSS: seria
 * meter un segundo sistema de estilos en un proyecto cuya tesis entera es
 * un sistema de tokens hecho a mano. Y la casa YA tiene los tres patrones
 * que hacen falta —la lista con barra de "¿Donde me meto?", las barras
 * comparadas de "¿De donde viene el valor?" y la linea de mes de "¿Como
 * venimos?"—, todos SVG a mano con los mismos tokens. Extender ese
 * vocabulario es trabajo conocido y no mete dos lenguajes visuales en la
 * misma pagina.
 *
 * LA GRAMATICA
 * -------------
 * Una barra por fila con el valor del mes B y una marca en la altura del
 * mes A: es la forma de comparar dos periodos que no miente cuando B es
 * menor que A. Y al lado, los numeros, porque una grafica sin numeros es
 * una decoracion.
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
  const [sedesElegidas, setSedesElegidas] = useState(() => report.sedes.map(s => s.id));
  const [tramosElegidos, setTramosElegidos] = useState(() => BUCKETS.map(b => b.id));
  const [mesA, setMesA] = useState('sep');
  const [mesB, setMesB] = useState('oct');
  const [metrica, setMetrica] = useState('kwh');
  const [desglose, setDesglose] = useState('sede');

  const mesA_ = report.meses.find(m => m.id === mesA);
  const mesB_ = report.meses.find(m => m.id === mesB);

  /** Convierte un consumo en kWh a la unidad elegida. */
  const convertir = (consumo, mes) => {
    if (metrica === 'plata') return consumo * report.tariff;
    if (metrica === 'porcentaje') {
      const totalDelMes = report.sedes.reduce(
        (suma, s) => suma + s.serie.find(m => m.id === mes.id).total,
        0,
      );
      return consumo / totalDelMes;
    }
    return consumo;
  };

  /** El valor de una sede en un mes, con los tramos filtrados y en la unidad elegida. */
  const valorDe = (sede, mes) => {
    // Los tramos viven en la serie de la sede, no en el calendario de meses.
    const delMes = sede.serie.find(m => m.id === mes.id);
    const consumo = tramosElegidos.reduce((suma, id) => suma + delMes.trams[id], 0);
    return convertir(consumo, mes);
  };

  /** El valor del conjunto filtrado en un mes (todas las sedes elegidas). */
  const valorDelConjunto = mes =>
    sedesElegidas.reduce(
      (suma, id) =>
        suma +
        valorDe(
          report.sedes.find(s => s.id === id),
          mes,
        ),
      0,
    );

  const formato = valor => {
    if (metrica === 'plata') return pesos(Math.round(valor));
    if (metrica === 'porcentaje') return porcentaje(valor);
    return `${numero(Math.round(valor))} kWh`;
  };

  /** Las filas de la comparacion, segun el desglose elegido. */
  const filas = useMemo(() => {
    if (!mesA_ || !mesB_) return [];

    if (desglose === 'sede') {
      return report.sedes
        .filter(s => sedesElegidas.includes(s.id))
        .map(sede => {
          const a = valorDe(sede, mesA_);
          const b = valorDe(sede, mesB_);
          return { id: sede.id, nombre: sede.name, a, b, delta: b - a, nota: sede.note };
        });
    }

    return BUCKETS.filter(b => tramosElegidos.includes(b.id)).map(bucket => {
      // En el desglose por tramo, el valor de la fila es ESE tramo, no la
      // suma de los tramos filtrados: por eso no se usa `valorDe`.
      const delTramo = (mes, sede) => sede.serie.find(m => m.id === mes.id).trams[bucket.id];
      const a = convertir(
        report.sedes
          .filter(s => sedesElegidas.includes(s.id))
          .reduce((suma, sede) => suma + delTramo(mesA_, sede), 0),
        mesA_,
      );
      const b = convertir(
        report.sedes
          .filter(s => sedesElegidas.includes(s.id))
          .reduce((suma, sede) => suma + delTramo(mesB_, sede), 0),
        mesB_,
      );
      return {
        id: bucket.id,
        nombre: bucket.label,
        nota: bucket.hours,
        a,
        b,
        delta: b - a,
        fuera: bucket.id === OUTSIDE,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, sedesElegidas, tramosElegidos, mesA, mesB, metrica, desglose]);

  /** La tendencia: los diez meses, con los dos comparados marcados. */
  const tendencia = useMemo(
    () =>
      report.meses.map(mes => ({
        ...mes,
        valor: valorDelConjunto(mes),
        esA: mes.id === mesA,
        esB: mes.id === mesB,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [report, sedesElegidas, tramosElegidos, metrica, mesA, mesB],
  );

  const maximoFila = Math.max(1, ...filas.map(f => Math.max(f.a, f.b)));
  const maximoTendencia = Math.max(1, ...tendencia.map(m => m.valor));

  const totalA = valorDelConjunto(mesA_);
  const totalB = valorDelConjunto(mesB_);
  const deltaTotal = totalB - totalA;

  const mayor = [...filas].sort((x, y) => y.delta - x.delta)[0];

  const alternar = (lista, id, cambiar) => {
    const siguiente = lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id];
    cambiar(siguiente);
  };

  const vacio = sedesElegidas.length === 0 || tramosElegidos.length === 0;

  return (
    <section className="bloque explorador" id="q-explorar" aria-labelledby="explorador-titulo">
      <header className="bloque__head">
        <h2 id="explorador-titulo">¿Explorar?</h2>
        <p className="bloque__scope">Los mismos datos, comparados como los.compare</p>
      </header>

      {/* ─── Los filtros ─────────────────────────────────────────────── */}
      <div className="explorador__filtros">
        <fieldset className="explorador__grupo">
          <legend className="explorador__grupo-titulo">Sedes</legend>
          <div className="explorador__opciones">
            {report.sedes.map(sede => (
              <button
                type="button"
                key={sede.id}
                className="explorador__chip"
                aria-pressed={sedesElegidas.includes(sede.id)}
                onClick={() => alternar(sedesElegidas, sede.id, setSedesElegidas)}
              >
                {sede.name.replace('Sede ', '')}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="explorador__grupo">
          <legend className="explorador__grupo-titulo">Tramos del día</legend>
          <div className="explorador__opciones">
            {BUCKETS.map(bucket => (
              <button
                type="button"
                key={bucket.id}
                className={`explorador__chip${bucket.id === OUTSIDE ? ' explorador__chip--fuera' : ''}`}
                aria-pressed={tramosElegidos.includes(bucket.id)}
                onClick={() => alternar(tramosElegidos, bucket.id, setTramosElegidos)}
              >
                {bucket.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="explorador__grupo">
          <legend className="explorador__grupo-titulo">Comparar</legend>
          <div className="explorador__opciones explorador__opciones--par">
            <label className="explorador__select">
              <span className="sr-only">Mes inicial</span>
              <select value={mesA} onChange={event => setMesA(event.target.value)}>
                {report.meses.map(mes => (
                  <option key={mes.id} value={mes.id}>
                    {mes.corto}
                  </option>
                ))}
              </select>
            </label>
            <span className="explorador__flecha" aria-hidden="true">
              →
            </span>
            <label className="explorador__select">
              <span className="sr-only">Mes final</span>
              <select value={mesB} onChange={event => setMesB(event.target.value)}>
                {report.meses.map(mes => (
                  <option key={mes.id} value={mes.id}>
                    {mes.corto}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="explorador__grupo">
          <legend className="explorador__grupo-titulo">Unidad</legend>
          <div className="explorador__opciones">
            {METRICAS.map(item => (
              <button
                type="button"
                key={item.id}
                className="explorador__chip"
                aria-pressed={metrica === item.id}
                onClick={() => setMetrica(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="explorador__grupo">
          <legend className="explorador__grupo-titulo">Desglosar por</legend>
          <div className="explorador__opciones">
            {DESGLOSES.map(item => (
              <button
                type="button"
                key={item.id}
                className="explorador__chip"
                aria-pressed={desglose === item.id}
                onClick={() => setDesglose(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* ─── Los numeros que reaccionan ───────────────────────────────── */}
      <div className="explorador__kpis">
        <div className="explorador__kpi">
          <p className="explorador__kpi-clave">{mesA_.label}</p>
          <p className="explorador__kpi-valor">{formato(totalA)}</p>
        </div>
        <div className="explorador__kpi">
          <p className="explorador__kpi-clave">{mesB_.label}</p>
          <p className="explorador__kpi-valor">{formato(totalB)}</p>
        </div>
        <div className="explorador__kpi">
          <p className="explorador__kpi-clave">Variación</p>
          <p
            className={`explorador__kpi-valor explorador__kpi-valor--${
              deltaTotal > 0 ? 'sube' : deltaTotal < 0 ? 'baja' : 'igual'
            }`}
          >
            {deltaTotal > 0 ? '+' : deltaTotal < 0 ? '−' : ''}
            {formato(Math.abs(deltaTotal))}
          </p>
        </div>
        <div className="explorador__kpi">
          <p className="explorador__kpi-clave">Lo que más creció</p>
          <p className="explorador__kpi-valor explorador__kpi-valor--chico">
            {mayor?.nombre ?? '—'}
          </p>
          {mayor && (
            <p className="explorador__kpi-nota">
              {mayor.delta > 0 ? '+' : ''}
              {formato(mayor.delta)}
            </p>
          )}
        </div>
      </div>

      {vacio ? (
        <div className="explorador__vacio">
          <p className="explorador__vacio-titulo">No hay nada que comparar</p>
          <p className="explorador__vacio-texto">
            Elegí al menos una sede y un tramo del día. Con los filtros vacíos no hay comparación
            que hacer, y no hay un valor "cero" que dibujar.
          </p>
        </div>
      ) : (
        <Tooltip.Provider delayDuration={200} skipDelayDuration={400}>
          <div className="explorador__panel">
            <div className="explorador__principal">
              <div className="explorador__titulos">
                <span className="explorador__leyenda">
                  <span className="explorador__marca explorador__marca--a" aria-hidden="true" />
                  {mesA_.label}
                </span>
                <span className="explorador__leyenda">
                  <span className="explorador__marca explorador__marca--b" aria-hidden="true" />
                  {mesB_.label}
                </span>
              </div>

              <div className="explorador__filas">
                {filas.map(fila => {
                  return (
                    <div className="explorador__fila" key={fila.id}>
                      <div className="explorador__rotulo">
                        <span className="explorador__nombre">{fila.nombre}</span>
                        <span className="explorador__nota">{fila.nota}</span>
                      </div>

                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <button
                            type="button"
                            className="explorador__pista"
                            aria-label={`${fila.nombre}: ${formato(fila.a)} en ${mesA_.label}, ${formato(fila.b)} en ${mesB_.label}`}
                          >
                            <span
                              className="explorador__barra"
                              style={{ '--parte': fila.b / maximoFila }}
                            />
                            <span
                              className="explorador__referencia"
                              style={{ '--parte': fila.a / maximoFila }}
                              aria-hidden="true"
                            />
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tip" sideOffset={8}>
                            <strong>{fila.nombre}</strong>
                            {mesA_.label}: {formato(fila.a)}
                            <br />
                            {mesB_.label}: {formato(fila.b)}
                            <br />
                            {fila.delta > 0 ? '+' : fila.delta < 0 ? '−' : ''}
                            {formato(Math.abs(fila.delta))}
                            {fila.a > 0 ? ` (${porcentajeConSigno(fila.delta / fila.a)})` : ''}
                            <Tooltip.Arrow className="tip__arrow" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>

                      <div className="explorador__cifras">
                        <span className="explorador__cifra explorador__cifra--a">
                          {formato(fila.a)}
                        </span>
                        <span className="explorador__flecha" aria-hidden="true">
                          →
                        </span>
                        <span className="explorador__cifra explorador__cifra--b">
                          {formato(fila.b)}
                        </span>
                        <span
                          className={`explorador__cambio explorador__cambio--${
                            fila.delta > 0 ? 'sube' : fila.delta < 0 ? 'baja' : 'igual'
                          }`}
                        >
                          {fila.delta > 0 ? '+' : fila.delta < 0 ? '−' : ''}
                          {formato(Math.abs(fila.delta))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── La tendencia: el contexto de diez meses ───────────────── */}
            <div className="explorador__tendencia">
              <p className="explorador__tendencia-titulo">Los diez meses</p>
              <div className="explorador__meses">
                {tendencia.map(mes => (
                  <Tooltip.Root key={mes.id}>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        className={`explorador__mes${mes.esA ? ' es-a' : ''}${mes.esB ? ' es-b' : ''}`}
                        aria-label={`${mes.label}: ${formato(mes.valor)}`}
                      >
                        <span
                          className="explorador__mes-barra"
                          style={{ '--parte': mes.valor / maximoTendencia }}
                        />
                        <span className="explorador__mes-corto">{mes.corto}</span>
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
            </div>
          </div>
        </Tooltip.Provider>
      )}
    </section>
  );
}
