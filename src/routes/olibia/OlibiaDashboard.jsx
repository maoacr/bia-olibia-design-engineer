import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { STAGES, periods } from './data.js';
import { filterOpportunities, sortOpportunities } from './filters.js';
import { dateFromISO, formatContact, overdueOf } from './contact.js';
import { nextStage, opportunitiesWithMovement, previousPeriodOf } from './movement.js';
import Goal from './Goal.jsx';
import Opportunities from './Opportunities.jsx';
import Pipeline from './Pipeline.jsx';
import Assistant from './Assistant.jsx';
import Stalled from './Stalled.jsx';
import Trend from './Trend.jsx';
import Origin from './Origin.jsx';
import Workload from './Workload.jsx';
import OpportunityDetail from './OpportunityDetail.jsx';
import { ThemeToggle } from '../../shared/theme.jsx';
import { useBrand } from '../../shared/useBrand.js';
import { useScrolled } from '../../shared/useScrolled.js';
import { useDocumentTitle } from '../../shared/useDocumentTitle.js';
import { useFilterParams } from './useFilterParams.js';
import Dock, { useDockCollapsed } from './Dock.jsx';

const NEGOTIATION = STAGES[STAGES.length - 1];

export default function OlibiaDashboard() {
  useBrand('olibia');
  useDocumentTitle('Olibia · Tablero comercial · Prueba Design Engineer');

  const { filters, sort, update, reset } = useFilterParams();
  const { collapsed, toggle: toggleDock } = useDockCollapsed();

  // El centinela del desplazamiento. Lo consume el fundido de `.shell::before`.
  // El porque de que haga falta esta en `shared/useScrolled.js`.
  const sentinel = useScrolled();
  const { period, query, stage, owner, channel, minimum, movement } = filters;

  const // El detalle se guarda por ID y no por objeto. Guardar el objeto lo
    // congelaba en el momento del clic: al adelantar la etapa desde el propio
    // detalle, la ficha seguia mostrando la etapa vieja mientras el resto de
    // la pagina ya habia cambiado. Por id se relee de `all` en cada pintada.
    [selectedId, setSelectedId] = useState(null),
    // Lo editado a mano, por periodo:
    //   { oct: { 'hotel-central': { stage, nextContact } } }
    [overrides, setOverrides] = useState({}),
    // Lo que fue pasando con cada oportunidad durante esta sesion.
    [log, setLog] = useState({}),
    // Dos regiones vivas, no una. Antes habia un solo `role="status"` al pie
    // de la pagina para los dos avisos; el del periodo se opera en la banda
    // de arriba, o sea a dos pantallas y media de su propio acuse de recibo.
    // Cada aviso vive ahora en el bloque que lo provoca.
    [periodNotice, setPeriodNotice] = useState(''),
    [exportNotice, setExportNotice] = useState('');

  const setOwner = value => update({ owner: value });
  const setChannel = value => update({ channel: value });
  const d = periods[period];
  const all = opportunitiesWithMovement(d, overrides[period]);
  const selected = selectedId ? all.find(o => o.id === selectedId) : null;
  const scoped = filterOpportunities(all, { query, stage, owner, channel, minimum });
  const rows = sortOpportunities(filterOpportunities(scoped, { movement }), sort, d);
  const previous = previousPeriodOf(d);
  const filtersActive = Boolean(query || stage || owner || channel || minimum || movement);
  const total = rows.reduce((sum, o) => sum + o.value, 0);
  const negotiation = rows.filter(o => o.stage === NEGOTIATION);
  const overdue = overdueOf(rows, d);

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

  /**
   * El movimiento no existe como dimension si el periodo no tiene uno
   * anterior: no es que no haya resultados, es que la pregunta no aplica.
   * Mantener el filtro dejaria la lista vacia por un motivo que la persona no
   * puede ver ni deshacer.
   */
  function changePeriod(next) {
    if (!periods[next].previous && movement) {
      update({ period: next, movement: '' });
      setPeriodNotice(
        `Se quitó el filtro de movimiento: ${periods[next].label} no tiene un mes previo con el cual compararse.`,
      );
    } else {
      update({ period: next });
      setPeriodNotice('');
    }
  }

  /** Anota un hecho de esta sesion en la bitacora de una oportunidad. */
  function note(id, text, next = null) {
    const at = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const key = `${period}:${id}`;
    setLog(previous => ({ ...previous, [key]: [{ at, text, next }, ...(previous[key] ?? [])] }));
  }

  /**
   * Mueve una oportunidad a la etapa siguiente del embudo.
   *
   * Solo toca el mapa de etapas: la propagacion es gratis porque todo sale de
   * `all`. Ver el porque en opportunitiesWithMovement.
   */
  /**
   * Un clic en un encabezado ordena por esa columna; el segundo invierte el
   * sentido; el tercero deja la tabla como estaba. Volver al orden original
   * importa: es el unico que agrupa las cuentas como las trae el periodo, y
   * sin tercer clic no habria forma de recuperarlo salvo recargar.
   */
  function sortBy(field) {
    if (sort?.field !== field) return update({ sort: `${field}-asc` });
    if (sort.direction === 'asc') return update({ sort: `${field}-desc` });
    update({ sort: '' });
  }

  function patch(id, fields) {
    setOverrides(previous => ({
      ...previous,
      [period]: { ...previous[period], [id]: { ...previous[period]?.[id], ...fields } },
    }));
  }

  function promote(opportunity) {
    const next = nextStage(opportunity.stage);
    if (!next) return;
    patch(opportunity.id, { stage: next });
    note(opportunity.id, `Pasó de ${opportunity.stage} a ${next}.`);
  }

  /**
   * Registrar un contacto reemplazo a "Marcar seguimiento realizado".
   *
   * Aquel boton dejaba un tilde junto al nombre y nada mas. Una cuenta
   * recorre el embudo con muchos contactos encima, asi que un booleano no
   * contesta lo unico que importa —cuanto insistir, cuando volver— y encima
   * se borraba al recargar. Lo que si lo contesta es el registro: que se
   * hablo y para cuando quedo el proximo. La fecha ademas no es decorativa,
   * actualiza el campo del que sale la alerta de vencido.
   */
  function registerContact(opportunity, { notes, on }) {
    const when = on ? formatContact(dateFromISO(on)) : null;
    if (when) patch(opportunity.id, { nextContact: when });
    note(opportunity.id, notes.trim(), when);
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
    setExportNotice('CSV exportado con las oportunidades que muestra la tabla.');
  }
  return (
    <>
      <div ref={sentinel} className="top-sentinel" aria-hidden="true" />
      {/* La cabecera ya no cambia de aspecto al desplazarse: el centinela de
          arriba ya no enciende su vidrio —que se fue— sino el fundido del
          contenido. Ver `.shell::before` en styles.css. */}
      <header className="top">
        {/* El vidrio de la barra va de borde a borde, pero su CONTENIDO se
            alinea con el del resto de la pagina. Sin esta caja interior la
            marca quedaba a 16px del borde mientras la columna de contenido
            arrancaba a 116: cien pixeles de desfase, con la marca colgando
            sola en el angulo. Repite el ancho maximo y el centrado de `main`
            porque tiene que coincidir con el, no parecerse. */}
        <div className="top__inner">
          {/* El nivel 1 del documento. Ver el porque en la seccion .brand. */}
          <h1 className="brand">Olibia</h1>
          <div className="top-actions">
            <Link className="top__enlace" to="/bia">
              Ver Bia
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="shell">
        {/* En pantalla chica el menu se despliega sobre el contenido; al
            elegir una opcion se cierra solo, porque dejarlo abierto taparia
            justo lo que la persona acaba de pedir. */}
        <Dock collapsed={collapsed} onToggle={toggleDock} />
        <main>
          {/* La tira de filtros que habia aqui —el periodo y un boton de
              exportar CSV— se repartio entre los dos bloques que de verdad le
              corresponden: el periodo encabeza la banda del pipeline, que ya
              escribia su etiqueta; exportar se fue al panel de la tabla, que
              es lo que exporta. Ver el porque en cada uno. */}
          <Pipeline
            period={d}
            periodId={period}
            onChangePeriod={changePeriod}
            previous={previous}
            opportunities={all}
          />
          {/* Pegado a la banda: el unico aviso que anuncia una consecuencia
              que la persona no pidio —cambiar de mes puede soltarle un
              filtro— tiene que aparecer donde esta mirando al cambiarlo. */}
          <p className="period-notice" role="status">
            {periodNotice}
          </p>
          {/* La primera pregunta de quien es dueño del numero va primero, y
              recibe `all` —el periodo completo— porque la meta es del equipo
              y no responde a los filtros. */}
          <Goal period={d} opportunities={all} onSelect={o => setSelectedId(o.id)} />
          {/* Segunda pregunta. Tambien sobre `all`: una alerta que un filtro
              puede silenciar no sirve de alerta. */}
          <Stalled
            period={d}
            previous={previous}
            opportunities={all}
            onSelect={o => setSelectedId(o.id)}
          />
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
          {/* El grupo "Lo que estas viendo" se fue completo. Sus dos cifras
              —cuantas oportunidades y por cuanto— las decia tambien, palabra
              por palabra, el resumen de AI; y el titulo de la tabla dice la
              primera una tercera vez. El total del periodo, que es el dato que
              ninguno de los tres daba, encabeza la pagina.

              El resumen de AI tampoco vive ya aca: es la burbuja del
              asistente, al pie de la pantalla. Ver Assistant.jsx.

              Los cuatro graficos del starter se fueron, cada uno por su
              motivo, y cada uno tiene arriba el bloque que lo contesta:
                · "Cierres por mes" — dibujaba barras contra la meta sin decir
                  que esa meta no se alcanzo nunca  -> "Como venimos?"
                · "Cierres por ejecutivo" — una sola magnitud, hacia quedar al
                  que mas carga como el que menos trabaja  -> "Donde me meto?"
                · "Origen de oportunidades" — contaba cuentas, asi que igualaba
                  Outbound con Referidos  -> "De donde viene el valor?"
                · "Oportunidades por etapa" — no contestaba ninguna de las
                  cinco preguntas, y el reparto por etapa ya se ve en el riel
                  de "Que se esta cayendo?" y en el embudo de los canales.

              Y el panel de filtros se fue ADENTRO de la lista: era un tablero
              aparente que solo alcanzaba a la tabla de abajo. Con el se fue
              "q-explorar", que ahora es la seccion entera —controles y
              filas—, o sea la zona que el dock promete al nombrarla. Ver
              Opportunities.jsx. */}
          <Opportunities
            period={d}
            rows={rows}
            periodCount={all.length}
            filters={filters}
            sort={sort}
            onSort={sortBy}
            onChange={update}
            onClear={clearFilters}
            cause={cause}
            onRelease={releaseFilter}
            onSelect={o => setSelectedId(o.id)}
            onExport={exportCSV}
            notice={exportNotice}
          />
          {/* Un solo pie. La firma vivia aparte y fija al angulo inferior;
              junto al aviso de datos ficticios no necesita despegarse de
              nada: comparten renglon desde escritorio y se apilan antes.
              `rel="noopener noreferrer"` no es ceremonia — sin `noopener`,
              la pestaña que abre recibe una referencia a esta ventana por
              `window.opener` y puede redirigirla. */}
          <footer className="foot">
            <p>
              Datos ficticios para el ejercicio de diseño · Sin conexión a sistemas de Bia/Olibia
            </p>
            <p>
              Desarrollado con <span aria-hidden="true">💚</span>
              <span className="sr-only">amor</span> por{' '}
              <a href="https://linkedin.com/in/maoacr" target="_blank" rel="noopener noreferrer">
                @maoacr
              </a>
            </p>
          </footer>
        </main>
      </div>
      {/* Fuera de `main`: flota sobre la pagina, no corre con ella. Comparte
          rincon con el dock, que desde 40rem se va a la columna izquierda. */}
      <Assistant
        rows={rows}
        total={total}
        negotiation={negotiation}
        overdue={overdue}
        cause={cause}
        period={d}
      />
      {selected && (
        <OpportunityDetail
          opportunity={selected}
          period={d}
          previous={previous}
          log={log[`${period}:${selected.id}`]}
          onPromote={() => promote(selected)}
          onRegister={entry => registerContact(selected, entry)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
