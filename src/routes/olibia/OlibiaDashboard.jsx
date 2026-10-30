import React, { useState } from 'react';
import { CHANNELS, STAGE_SLUG, PERIOD_IDS, STAGES, TEAM, periods } from './data.js';
import { EMPTY_FILTERS, filterOpportunities } from './filters.js';
import { opportunitiesWithMovement, previousPeriodOf } from './movement.js';
import Goal from './Goal.jsx';
import { MovementTag } from './Movement.jsx';
import Stalled from './Stalled.jsx';
import Trend from './Trend.jsx';
import Origin from './Origin.jsx';
import Workload from './Workload.jsx';
import OpportunityDetail from './OpportunityDetail.jsx';
import { ThemeToggle } from '../../shared/theme.jsx';
import { useFilterParams } from './useFilterParams.js';
import Dock from './Dock.jsx';

const NEGOTIATION = STAGES[STAGES.length - 1];

/** Concordancia de numero: "1 oportunidad abierta", no "1 oportunidades abiertas". */
const plural = (count, singular, many) => `${count} ${count === 1 ? singular : many}`;

export default function OlibiaDashboard() {
  const { filters, update, reset } = useFilterParams();
  const { period, query, stage, owner, channel, minimum, movement } = filters;

  const [selected, setSelected] = useState(null),
    [done, setDone] = useState({}),
    [notice, setNotice] = useState('');

  const setQuery = value => update({ query: value }, { replace: true });
  const setStage = value => update({ stage: value });
  const setOwner = value => update({ owner: value });
  const setChannel = value => update({ channel: value });
  const setMinimum = value => update({ minimum: value });
  const d = periods[period];
  const all = opportunitiesWithMovement(d);
  const scoped = filterOpportunities(all, { query, stage, owner, channel, minimum });
  const rows = filterOpportunities(scoped, { movement });
  const previous = previousPeriodOf(d);
  const filtersActive = Boolean(query || stage || owner || channel || minimum || movement);
  const total = rows.reduce((sum, o) => sum + o.value, 0);
  const negotiation = rows.filter(o => o.stage === NEGOTIATION);
  const key = selected ? `${period}:${selected.id}` : '';

  // Cuando no queda nada visible, probar a soltar cada filtro por separado
  // dice cual es el responsable. Septiembre, por ejemplo, no tiene ninguna
  // oportunidad en Negociacion: sin esto la pantalla queda en blanco y la
  // persona no sabe si se rompio algo, si no hay datos o si fue culpa suya.
  const activeFilters = { query, stage, owner, channel, minimum, movement };
  const FILTER_NAMES = {
    query: 'la búsqueda',
    stage: 'la etapa',
    owner: 'el responsable',
    channel: 'el canal',
    minimum: 'el valor mínimo',
    movement: 'el movimiento',
  };

  function emptyCause() {
    if (rows.length || !filtersActive) return null;
    const culprits = Object.keys(activeFilters).filter(key => {
      if (!activeFilters[key]) return false;
      return filterOpportunities(all, { ...activeFilters, [key]: '' }).length > 0;
    });
    if (culprits.length !== 1) return null;
    const key = culprits[0];
    return { key, name: FILTER_NAMES[key], value: activeFilters[key] };
  }

  const cause = emptyCause();

  function releaseFilter(key) {
    update({ [key]: '' });
  }

  const clearFilters = reset;

  function exportCSV() {
    const header = [
      'Empresa',
      'Etapa',
      'Canal',
      'Valor mensual COP millones',
      'Responsable',
      'Proximo contacto',
    ];
    const body = rows.map(o => [o.company, o.stage, o.channel, o.value, o.owner, o.nextContact]);
    const blob = new Blob(['\ufeff' + [header, ...body].map(r => r.join(';')).join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `olibia-${period}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('CSV exportado con las oportunidades filtradas.');
  }
  return (
    <>
      <header className="top">
        <div className="top-brand">
          <span className="brand">Olibia</span>
          <small>Gestión comercial</small>
        </div>
        <div className="top-actions">
          <span className="muted">Equipo comercial</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="shell">
        {/* En pantalla chica el menu se despliega sobre el contenido; al
            elegir una opcion se cierra solo, porque dejarlo abierto taparia
            justo lo que la persona acaba de pedir. */}
        <Dock filtersActive={filtersActive} onClear={clearFilters} />
        <main>
          <div className="toolbar">
            <div>
              <h1>Dashboard comercial</h1>
              <span className="muted">Resumen de resultados y oportunidades</span>
            </div>
            <div className="filters">
              <label htmlFor="period">Periodo</label>
              <select
                id="period"
                value={period}
                onChange={e => {
                  const next = e.target.value;
                  // El movimiento no existe como dimension si el periodo no
                  // tiene uno anterior: no es que no haya resultados, es que la
                  // pregunta no aplica. Mantener el filtro dejaria la pantalla
                  // vacia y, peor, sin control visible para salir, porque la
                  // tira pasa a mostrar el mensaje en lugar de los recuentos.
                  if (!periods[next].previous && movement) {
                    update({ period: next, movement: '' });
                    setNotice(
                      `Se quitó el filtro de movimiento: ${periods[next].label} no tiene un mes previo con el cual compararse.`,
                    );
                  } else {
                    update({ period: next });
                    setNotice('');
                  }
                }}
              >
                {PERIOD_IDS.map(id => (
                  <option key={id} value={id}>
                    {periods[id].label}
                  </option>
                ))}
              </select>
              <button onClick={exportCSV}>Exportar CSV</button>
            </div>
          </div>
          {/* La primera pregunta de quien es dueño del numero va primero, y
              recibe `all` —el periodo completo— porque la meta es del equipo
              y no responde a los filtros. */}
          <Goal period={d} opportunities={all} onSelect={setSelected} />
          {/* Segunda pregunta. Tambien sobre `all`: una alerta que un filtro
              puede silenciar no sirve de alerta. */}
          <Stalled period={d} previous={previous} opportunities={all} onSelect={setSelected} />
          {/* Tercera pregunta. Tambien sin filtrar: los cierres por ejecutivo
              son del periodo, y la carga tiene que medirse con la misma vara
              o se estarian comparando dos cosas distintas. */}
          <Workload period={d} opportunities={all} activeOwner={owner} onSelectOwner={setOwner} />
          {/* Cuarta pregunta. De donde viene el valor es un hecho del mes,
              no de la vista: tambien sin filtrar. */}
          <Origin
            period={d}
            opportunities={all}
            activeChannel={channel}
            onSelectChannel={setChannel}
          />
          {/* Quinta y ultima pregunta. El historial es del equipo. */}
          <Trend period={d} onSelectPeriod={id => update({ period: id })} />
          {/* Cierres y meta ya no viven aqui: los contesta el bloque "Vamos a
              llegar?" de arriba, y repetirlos seria mostrar el mismo hecho dos
              veces. Queda solo lo que SI responde a los filtros, que es
              justamente lo que el starter no sabia separar. */}
          <div className="kpi-groups">
            {[
              {
                title: 'Lo que estás viendo',
                hint: filtersActive ? 'con los filtros aplicados' : 'sin filtros aplicados',
                cards: [
                  ['Oportunidades abiertas', rows.length, `de ${all.length} en el periodo`],
                  ['Valor del pipeline', `$${total} M`, 'COP millones / mes'],
                ],
              },
            ].map(({ title, hint, cards }) => (
              <section className="kpi-group" key={title} aria-label={title}>
                <h2 className="kpi-group__title">
                  {title} <span className="kpi-group__hint">{hint}</span>
                </h2>
                <div className="kpis">
                  {cards.map(([label, value, note]) => (
                    <div className="card" key={label}>
                      {label}
                      <div className="value">{value}</div>
                      <div className="muted">{note}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <section className="panel ai-widget" id="q-explorar" aria-label="Resumen AI">
            <div className="ai-heading">
              <h2>Resumen AI</h2>
              <span className="badge">Vista de demostración</span>
            </div>
            <div aria-live="polite">
              {rows.length ? (
                <>
                  <p>
                    Hay{' '}
                    <strong>
                      {plural(rows.length, 'oportunidad abierta', 'oportunidades abiertas')}
                    </strong>{' '}
                    en esta vista, por un valor mensual estimado de{' '}
                    <strong>${total} millones COP</strong>.{' '}
                    {negotiation.length
                      ? `${plural(negotiation.length, 'está', 'están')} en negociación y ${negotiation.length === 1 ? 'concentra' : 'concentran'} $${negotiation.reduce((sum, o) => sum + o.value, 0)} millones COP del pipeline.`
                      : 'Ninguna de las oportunidades visibles está en negociación.'}
                  </p>
                  <p>
                    <strong>Siguiente paso sugerido:</strong> revisar{' '}
                    {negotiation.length
                      ? 'las negociaciones pendientes'
                      : 'las próximas fechas de contacto'}{' '}
                    y confirmar responsables.
                  </p>
                </>
              ) : (
                <p>
                  {cause
                    ? `Ninguna oportunidad de ${d.label} tiene ${cause.name} "${cause.value}".`
                    : 'No hay oportunidades con esta combinación de filtros.'}
                </p>
              )}
            </div>
            <p className="scope-note">
              Resumen simulado a partir de los datos visibles; no utiliza un servicio de AI.
            </p>
          </section>
          <section className="panel panel--control filter-panel">
            <h2>Filtrar oportunidades abiertas</h2>
            <div className="filter-grid">
              <label>
                Etapa
                <select value={stage} onChange={e => setStage(e.target.value)}>
                  <option value="">Todas las etapas</option>
                  {STAGES.map(x => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Responsable
                <select value={owner} onChange={e => setOwner(e.target.value)}>
                  <option value="">Todos los responsables</option>
                  {TEAM.map(x => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Canal
                <select value={channel} onChange={e => setChannel(e.target.value)}>
                  <option value="">Todos los canales</option>
                  {CHANNELS.map(x => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Valor mensual
                <select value={minimum} onChange={e => setMinimum(e.target.value)}>
                  <option value="">Todos los valores</option>
                  <option value="30">Desde $30 M COP</option>
                  <option value="50">Desde $50 M COP</option>
                </select>
              </label>
              <button onClick={clearFilters}>Limpiar filtros</button>
            </div>
            <p className="scope-note">
              Aplican al pipeline, al resumen AI, a las gráficas de oportunidades y a la tabla. Los
              cierres muestran el total del periodo.
            </p>
          </section>
          {/* Los cuatro graficos del starter se fueron, cada uno por su
              motivo, y cada uno tiene arriba el bloque que lo contesta:
                · "Cierres por mes" — dibujaba barras contra la meta sin decir
                  que esa meta no se alcanzo nunca  -> "Como venimos?"
                · "Cierres por ejecutivo" — una sola magnitud, hacia quedar al
                  que mas carga como el que menos trabaja  -> "Donde me meto?"
                · "Origen de oportunidades" — contaba cuentas, asi que igualaba
                  Outbound con Referidos  -> "De donde viene el valor?"
                · "Oportunidades por etapa" — no contestaba ninguna de las
                  cinco preguntas, y el reparto por etapa ya se ve en el riel
                  de "Que se esta cayendo?" y en el embudo de los canales. */}
          <section className="panel">
            <div className="tabletools">
              <h2>Oportunidades abiertas</h2>
              <input
                type="search"
                aria-label="Buscar empresa"
                placeholder="Buscar empresa..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      'Empresa',
                      'Etapa',
                      'Movimiento',
                      'Valor mensual · COP M',
                      'Responsable',
                      'Próximo contacto',
                      'Detalle',
                    ].map(x => (
                      <th key={x}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(o => {
                    const followed = done[`${period}:${o.id}`];
                    return (
                      <tr key={o.id} className={followed ? 'is-followed' : undefined}>
                        <td>
                          {o.company}
                          {followed && (
                            <span className="followed-tag" title="Seguimiento realizado">
                              <span aria-hidden="true">✓</span>
                              <span className="sr-only">Seguimiento realizado</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge--${STAGE_SLUG[o.stage]}`}>{o.stage}</span>
                        </td>
                        <td>
                          <MovementTag movement={o.movement} />
                        </td>
                        <td>${o.value} M</td>
                        <td>{o.owner}</td>
                        <td>{o.nextContact}</td>
                        <td>
                          <button aria-label={`Ver ${o.company}`} onClick={() => setSelected(o)}>
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!rows.length && (
                <div className="empty">
                  <p className="empty__title">
                    {cause
                      ? `No hay oportunidades con ${cause.name} "${cause.value}" en ${d.label}.`
                      : 'No hay oportunidades con esta combinación de filtros.'}
                  </p>
                  {cause ? (
                    <button onClick={() => releaseFilter(cause.key)}>Quitar {cause.name}</button>
                  ) : (
                    <button onClick={clearFilters}>Limpiar todos los filtros</button>
                  )}
                </div>
              )}
            </div>
          </section>
          <p role="status">{notice}</p>
          <footer className="foot">
            Datos ficticios para el ejercicio de diseño · Sin conexión a sistemas de Bia/Olibia
          </footer>
        </main>
      </div>
      {selected && (
        <OpportunityDetail
          opportunity={selected}
          year={d.year}
          done={done[key]}
          onFollowUp={() => setDone({ ...done, [key]: true })}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
