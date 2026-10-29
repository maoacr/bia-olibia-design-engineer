import React, { useState } from 'react';
import { CHANNELS, MONTHLY_GOAL, MONTH_NAMES, PERIOD_IDS, STAGES, TEAM, periods } from './data.js';
import { EMPTY_FILTERS, filterOpportunities } from './filters.js';
import { movementSummary, opportunitiesWithMovement, previousPeriodOf } from './movement.js';
import MovementBar, { MovementTag, movementSentence } from './Movement.jsx';
import { ThemeToggle } from '../../shared/theme.jsx';
import { useFilterParams } from './useFilterParams.js';
import SideMenu from './SideMenu.jsx';
import { niceScale } from '../../shared/scale.js';

const NEGOTIATION = STAGES[STAGES.length - 1];

/** Concordancia de numero: "1 oportunidad abierta", no "1 oportunidades abiertas". */
const plural = (count, singular, many) => `${count} ${count === 1 ? singular : many}`;

/**
 * El acento no decora: marca lo que el usuario esta interrogando. Si hay un
 * filtro activo, esa barra se enciende y el resto queda de contexto.
 *
 * El realce no se apoya solo en el color. En tema claro el acento y el gris
 * neutro tienen luminancia parecida —no existe un gris que pase 3:1 contra el
 * blanco y a la vez se separe del teal—, asi que la barra interrogada lleva
 * ademas peso tipografico y texto a color pleno.
 */
function Bars({ items, max, highlight = null }) {
  return items.map(([name, n]) => {
    const focused = highlight != null && name === highlight;
    return (
      <div className={focused ? 'row row--focus' : 'row'} key={name}>
        <span>{name}</span>
        <div className="track">
          <div className="fill" style={{ width: `${(n / max) * 100}%` }} />
        </div>
        <strong>{n}</strong>
      </div>
    );
  });
}
/**
 * Grafico de barras con escala derivada del dato.
 *
 * El starter calculaba la altura como `185 - valor * 15` con la grilla fija en
 * 0/5/10. Al filtrar, los canales mostraban valores de 0 a 2 sobre una escala
 * que llegaba a 10: cuatro quintos del panel en aire vacio. El ancho de barra
 * tambien era fijo (36px) mientras el paso dependia de cuantas barras hubiera,
 * asi que con tres quedaban huecos enormes y con seis se apretaban.
 */
const PLOT = { top: 18, bottom: 182, left: 38, right: 524 };
const AXIS_LABEL_Y = 203;

function Chart({ values, labels, label, goal = null, highlight = null }) {
  // La meta entra en el dominio para que la linea siempre quede dentro del area.
  const { max, ticks } = niceScale(Math.max(...values, goal ?? 0));
  const y = value => PLOT.bottom - (value / max) * (PLOT.bottom - PLOT.top);

  const band = (PLOT.right - PLOT.left) / values.length;
  const barWidth = Math.min(band * 0.52, 48);
  const center = i => PLOT.left + band * (i + 0.5);

  return (
    <svg className="chart" viewBox="0 0 540 220" role="img" aria-label={label}>
      {ticks.map(tick => (
        <g key={tick}>
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="var(--chart-grid)"
          />
          <text
            x={PLOT.left - 8}
            y={y(tick) + 4}
            fontSize="11"
            textAnchor="end"
            fill="currentColor"
          >
            {tick}
          </text>
        </g>
      ))}

      {goal != null && (
        <line
          x1={PLOT.left}
          x2={PLOT.right}
          y1={y(goal)}
          y2={y(goal)}
          stroke="var(--chart-axis)"
          strokeDasharray="5 5"
        />
      )}

      {values.map((value, i) => {
        const focused = highlight != null && labels[i] === highlight;
        return (
          <g key={labels[i]} className={focused ? 'bar-group bar-group--focus' : 'bar-group'}>
            <title>
              {labels[i]}: {value}
            </title>
            {value > 0 && (
              <rect
                x={center(i) - barWidth / 2}
                y={y(value)}
                width={barWidth}
                height={PLOT.bottom - y(value)}
                rx="3"
                className="bar"
              />
            )}
            <text
              x={center(i)}
              y={y(value) - 7}
              fontSize="12"
              textAnchor="middle"
              fill="currentColor"
            >
              {value}
            </text>
            <text
              x={center(i)}
              y={AXIS_LABEL_Y}
              fontSize="11"
              textAnchor="middle"
              fill="currentColor"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
export default function OlibiaDashboard() {
  const { filters, update, reset } = useFilterParams();
  const { period, query, stage, owner, channel, minimum, movement } = filters;

  const [selected, setSelected] = useState(null),
    [done, setDone] = useState({}),
    [notice, setNotice] = useState(''),
    [banner, setBanner] = useState(true),
    [menuOpen, setMenuOpen] = useState(false);

  const setQuery = value => update({ query: value }, { replace: true });
  const setStage = value => update({ stage: value });
  const setOwner = value => update({ owner: value });
  const setChannel = value => update({ channel: value });
  const setMinimum = value => update({ minimum: value });
  const setMovement = value => update({ movement: value });
  const d = periods[period];
  const all = opportunitiesWithMovement(d);
  const scoped = filterOpportunities(all, { query, stage, owner, channel, minimum });
  const rows = filterOpportunities(scoped, { movement });
  const previous = previousPeriodOf(d);
  const filtersActive = Boolean(query || stage || owner || channel || minimum || movement);
  const summary = movementSummary(scoped);
  const total = rows.reduce((sum, o) => sum + o.value, 0);
  const negotiation = rows.filter(o => o.stage === NEGOTIATION);
  const key = selected ? `${period}:${selected.id}` : '';

  // Variacion de cierres contra el mes anterior, derivada del historial en
  // lugar de quedar escrita a mano en el texto del KPI.
  const previousMonth = d.history[d.history.length - 2];
  const closedDelta = d.closed - previousMonth.closed;
  const closedDeltaNote = `${closedDelta > 0 ? '+' : '−'}${Math.abs(closedDelta)} frente a ${
    MONTH_NAMES[previousMonth.month]
  }`;

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
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="menu-principal"
            onClick={() => setMenuOpen(open => !open)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              {[7, 12, 17].map(y => (
                <line
                  key={y}
                  x1="4"
                  x2="20"
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ))}
            </svg>
            <span className="sr-only">{menuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
          </button>
          <span className="brand">olibia</span>
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
        <aside
          className={menuOpen ? 'is-open' : undefined}
          onClick={e => {
            if (e.target.closest('a')) setMenuOpen(false);
          }}
        >
          <SideMenu
            id="menu-principal"
            period={period}
            filters={filters}
            summary={summary}
            total={scoped.length}
          />
        </aside>
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
          {banner && (
            <section className="banner" aria-label="Aviso comercial">
              <div>
                <strong>Recta final del mes</strong>
                <p>
                  Revisa las oportunidades abiertas y coordina los próximos contactos con tu equipo.
                </p>
              </div>
              <button
                onClick={() => {
                  clearFilters();
                  setStage(NEGOTIATION);
                }}
              >
                Ver negociaciones
              </button>
              <button aria-label="Cerrar banner" onClick={() => setBanner(false)}>
                ×
              </button>
            </section>
          )}
          {/* Los cuatro indicadores se veian identicos pero dos responden a los
              filtros y dos no. El starter avisaba con una nota al pie; aqui lo
              resuelve la estructura, que es la unica forma de que no haya que
              leer un disclaimer para saber que mira cada numero. */}
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
              {
                title: `${d.label} · equipo completo`,
                hint: 'no cambia con los filtros',
                cards: [
                  ['Cierres del mes', d.closed, closedDeltaNote],
                  [
                    'Meta comercial',
                    `${Math.round((d.closed / MONTHLY_GOAL) * 100)}%`,
                    `de ${MONTHLY_GOAL} cierres mensuales`,
                  ],
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
          <MovementBar
            summary={summary}
            previousLabel={previous?.label}
            active={movement}
            onSelect={setMovement}
          />
          <section className="panel ai-widget" aria-label="Resumen AI">
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
          <div className="charts">
            <section className="panel">
              <h2>Cierres por mes · Equipo completo</h2>
              <Chart
                values={d.history.map(h => h.closed)}
                labels={d.history.map(h => h.month)}
                label={`Cierres por mes del equipo, con la meta de ${MONTHLY_GOAL} cierres`}
                highlight={d.history[d.history.length - 1].month}
                goal={MONTHLY_GOAL}
              />
              <div className="legend">Barras: cierres del mes · Línea discontinua: meta de 10</div>
            </section>
            <section className="panel">
              <h2>Oportunidades por etapa</h2>
              <Bars
                items={STAGES.map(n => [n, rows.filter(o => o.stage === n).length])}
                max={Math.max(rows.length, 1)}
                highlight={stage || null}
              />
              <p className="muted">Oportunidades abiertas según los filtros</p>
            </section>
          </div>
          <div className="split">
            <section className="panel">
              <h2>Origen de oportunidades abiertas</h2>
              <Chart
                values={CHANNELS.map(c => rows.filter(o => o.channel === c).length)}
                labels={CHANNELS}
                label="Oportunidades abiertas por canal de origen"
                highlight={channel || null}
              />
            </section>
            <section className="panel">
              <h2>Cierres por ejecutivo · Total del periodo</h2>
              <Bars
                items={d.closesByOwner.map(({ owner, closed }) => [owner, closed])}
                max={Math.max(d.closed, 1)}
                highlight={owner || null}
              />
              <p className="muted">Participación en los {d.closed} cierres del periodo</p>
            </section>
          </div>
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
                  {rows.map(o => (
                    <tr key={o.id}>
                      <td>{o.company}</td>
                      <td>
                        <span className="badge">{o.stage}</span>
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
                  ))}
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
        <div
          className="modal"
          onKeyDown={e => {
            if (e.key === 'Escape') setSelected(null);
          }}
        >
          <article role="dialog" aria-modal="true" aria-labelledby="detailTitle">
            <header>
              <h2 id="detailTitle">{selected.company}</h2>
              <button autoFocus onClick={() => setSelected(null)}>
                Cerrar
              </button>
            </header>
            <div className="detail-grid">
              {[
                ['Etapa', selected.stage],
                ['Movimiento', movementSentence(selected.movement)],
                ['Valor mensual estimado', `$${selected.value} millones COP`],
                ['Responsable', selected.owner],
                ['Próximo contacto', `${selected.nextContact} ${d.year}`],
              ].map(([label, value]) => (
                <div key={label}>
                  <small>{label}</small>
                  {value}
                </div>
              ))}
            </div>
            <button disabled={done[key]} onClick={() => setDone({ ...done, [key]: true })}>
              Marcar seguimiento realizado
            </button>
            <p role="status">{done[key] ? 'Seguimiento registrado en esta sesión.' : ''}</p>
          </article>
        </div>
      )}
    </>
  );
}
