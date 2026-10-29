import React, { useState } from 'react';
import { CHANNELS, MONTHLY_GOAL, MONTH_NAMES, PERIOD_IDS, STAGES, TEAM, periods } from './data.js';
import { EMPTY_FILTERS, filterOpportunities } from './filters.js';
import { opportunitiesWithMovement } from './movement.js';
import { ThemeToggle } from '../../shared/theme.jsx';

const NEGOTIATION = STAGES[STAGES.length - 1];

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
function Chart({ values, labels, goal = false, highlight = null }) {
  return (
    <svg
      className="chart"
      viewBox="0 0 540 220"
      role="img"
      aria-label={
        goal ? 'Cierres por mes y meta de diez cierres' : 'Oportunidades abiertas por canal'
      }
    >
      {[0, 5, 10].map(n => (
        <g key={n}>
          <line x1="35" x2="525" y1={185 - n * 15} y2={185 - n * 15} stroke="var(--chart-grid)" />
          <text x="10" y={189 - n * 15} fontSize="11" fill="currentColor">
            {n}
          </text>
        </g>
      ))}
      {goal && (
        <line x1="35" x2="525" y1="35" y2="35" stroke="var(--chart-axis)" strokeDasharray="5 5" />
      )}
      {values.map((n, i) => {
        const focused = highlight != null && labels[i] === highlight;
        return (
          <g key={labels[i]} className={focused ? 'bar-group bar-group--focus' : 'bar-group'}>
            <rect
              x={55 + i * (460 / values.length)}
              y={185 - n * 15}
              width="36"
              height={n * 15}
              className="bar"
            >
              <title>
                {labels[i]}: {n}
              </title>
            </rect>
            <text
              x={73 + i * (460 / values.length)}
              y={177 - n * 15}
              fontSize="12"
              textAnchor="middle"
              fill="currentColor"
            >
              {n}
            </text>
            <text
              x={73 + i * (460 / values.length)}
              y="207"
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
  const [period, setPeriod] = useState('oct'),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState(null),
    [done, setDone] = useState({}),
    [notice, setNotice] = useState('');
  const [stage, setStage] = useState(''),
    [owner, setOwner] = useState(''),
    [channel, setChannel] = useState(''),
    [minimum, setMinimum] = useState(''),
    [banner, setBanner] = useState(true);
  const d = periods[period];
  const all = opportunitiesWithMovement(d);
  const rows = filterOpportunities(all, { query, stage, owner, channel, minimum });
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

  function clearFilters() {
    setStage(EMPTY_FILTERS.stage);
    setOwner(EMPTY_FILTERS.owner);
    setChannel(EMPTY_FILTERS.channel);
    setMinimum(EMPTY_FILTERS.minimum);
    setQuery(EMPTY_FILTERS.query);
  }

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
        <div>
          <span className="brand">olibia</span>
          <small>Gestión comercial</small>
        </div>
        <div className="top-actions">
          <span className="muted">Equipo comercial</span>
          <ThemeToggle />
        </div>
      </header>
      <div className="shell">
        <aside>
          <div className="menu-placeholder">Diseña el menú vertical y sus opciones</div>
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
                  setPeriod(e.target.value);
                  setNotice('');
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
          <section className="panel filter-panel">
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
          <section className="panel ai-widget" aria-label="Resumen AI">
            <div className="ai-heading">
              <h2>Resumen AI</h2>
              <span className="badge">Vista de demostración</span>
            </div>
            <div aria-live="polite">
              {rows.length ? (
                <>
                  <p>
                    Hay <strong>{rows.length} oportunidades abiertas</strong> en esta vista, por un
                    valor mensual estimado de <strong>${total} millones COP</strong>.{' '}
                    {negotiation.length
                      ? `${negotiation.length} están en negociación y concentran $${negotiation.reduce((sum, o) => sum + o.value, 0)} millones COP del pipeline.`
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
                <p>No hay oportunidades con estos filtros. Prueba ampliando la selección.</p>
              )}
            </div>
            <p className="scope-note">
              Resumen simulado a partir de los datos visibles; no utiliza un servicio de AI.
            </p>
          </section>
          <div className="kpis">
            {[
              ['Oportunidades abiertas', rows.length, 'Según los filtros'],
              ['Valor del pipeline', `$${total} M`, 'COP millones / mes'],
              ['Cierres del mes', d.closed, closedDeltaNote],
              [
                'Meta comercial',
                `${Math.round((d.closed / MONTHLY_GOAL) * 100)}%`,
                `De ${MONTHLY_GOAL} cierres mensuales`,
              ],
            ].map(([label, value, note]) => (
              <div className="card" key={label}>
                {label}
                <div className="value">{value}</div>
                <div className="muted">{note}</div>
              </div>
            ))}
          </div>
          <div className="charts">
            <section className="panel">
              <h2>Cierres por mes · Equipo completo</h2>
              <Chart
                values={d.history.map(h => h.closed)}
                labels={d.history.map(h => h.month)}
                highlight={d.history[d.history.length - 1].month}
                goal
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
                highlight={channel || null}
              />
            </section>
            <section className="panel">
              <h2>Cierres por ejecutivo · Total del periodo</h2>
              <Bars
                items={d.closesByOwner.map(({ owner, closed }) => [owner, closed])}
                max={4}
                highlight={owner || null}
              />
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
              {!rows.length && <p>No se encontraron oportunidades.</p>}
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
