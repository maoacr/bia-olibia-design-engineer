/**
 * Oportunidades abiertas — la lista, y los controles que la mueven.
 *
 * ANTES ERAN DOS PANELES. Uno se llamaba "Filtrar oportunidades abiertas" y
 * el otro "Oportunidades abiertas": dos encabezados casi iguales, uno encima
 * del otro, con una frontera de panel en el medio. El de arriba estaba
 * vestido de tablero general —superficie propia, titulo de seccion, su boton
 * de limpiar— y en realidad solo alcanzaba a la tabla de abajo. Tanto, que
 * necesitaba un parrafo para aclararlo:
 *
 *   "Aplican a la tabla y al asistente. El pipeline y los cinco bloques de
 *    arriba muestran el periodo completo, sin filtrar."
 *
 * Cuando un control necesita prosa para explicar su alcance, el problema no
 * es la prosa: es la ubicacion. Un control ADENTRO de lo que afecta no tiene
 * que explicar nada, y es la unica forma de declarar alcance que no se puede
 * ignorar. Por eso los seis controles —los cuatro desplegables, el buscador
 * y el movimiento— viven aqui, en el panel de la lista que recortan, y la
 * nota de alcance se borro sin reemplazo.
 *
 * NO SE VOLVIERON GENERALES, a proposito. Filtrar los cinco bloques romperia
 * lo que cada uno promete: una meta de equipo recortada por una persona deja
 * de ser la meta, y una alerta que un filtro puede silenciar no sirve de
 * alerta. Los bloques siguen leyendo el periodo completo; lo que hacen es
 * ESCRIBIR aqui —al tocar una persona en "Donde me meto?" o un canal en "De
 * donde viene el valor?"— y esta es la unica zona que responde.
 *
 * DE AHI LAS FICHAS. Ese camino existia y era invisible: se tocaba a Ana en
 * un bloque y el unico efecto quedaba cientos de pixeles mas abajo, sin aviso
 * ni vuelta atras. Cada filtro puesto es ahora una ficha que se puede sacar
 * de un clic, junto al recuento de lo que queda. Y le da cuerpo al filtro de
 * movimiento, que se podia aplicar desde la direccion y no tenia ni un
 * control en pantalla para salir.
 */

import React from 'react';
import { CHANNELS, STAGES, STAGE_SLUG, TEAM } from './data.js';
import { MOVEMENT_FILTER_LABELS } from './Movement.jsx';
import { ContactTag } from './Contact.jsx';

/**
 * SE FUE LA COLUMNA "MOVIMIENTO". Decia si la cuenta avanzo o sigue quieta
 * contra el mes anterior, que es una medida de REPORTE —como viene el mes— y
 * no de trabajo. En una lista de la que se sale a llamar gente, la pregunta
 * es a quien le debo una llamada y cuando, no como vino el mes.
 *
 * Y lo decia por tercera vez: el riel de "Que se esta cayendo?" dibuja el
 * recorrido completo de cada cuenta, con mas contexto que una etiqueta, y el
 * historial del detalle lo repite en palabras. Una columna entera de ancho
 * para la version mas pobre de algo que ya esta dos veces arriba.
 *
 * El dato sigue vivo: alimenta ese bloque y el filtro de movimiento.
 */
const COLUMNS = [
  { label: 'Empresa', field: 'empresa' },
  { label: 'Etapa' },
  { label: 'Valor mensual · COP M' },
  { label: 'Responsable' },
  { label: 'Próximo contacto', field: 'contacto' },
  { label: 'Detalle' },
];

/** Lo que `aria-sort` espera decir de una columna. */
const ARIA_SORT = { asc: 'ascending', desc: 'descending' };

/** Concordancia de numero, para no escribir "1 oportunidades". */
const plural = (count, singular, many) => `${count} ${count === 1 ? singular : many}`;

/**
 * Como se nombra cada filtro puesto, y como se lee su valor.
 *
 * El nombre va en la ficha y el valor al lado, porque "Ana López" sin mas no
 * dice si es la responsable o la empresa buscada. `minimum` y `movement`
 * guardan claves —"30", "stalled"— que no son texto para leer: se traducen.
 */
const CHIPS = [
  { key: 'stage', name: 'Etapa' },
  { key: 'owner', name: 'Responsable' },
  { key: 'channel', name: 'Canal' },
  { key: 'minimum', name: 'Valor', read: value => `desde $${value} M` },
  { key: 'movement', name: 'Movimiento', read: value => MOVEMENT_FILTER_LABELS[value] },
  { key: 'query', name: 'Búsqueda', read: value => `"${value}"` },
];

export default function Opportunities({
  period,
  rows,
  periodCount,
  filters,
  sort,
  onSort,
  onChange,
  onClear,
  cause,
  onRelease,
  onSelect,
  onExport,
  notice,
}) {
  const { query, stage, owner, channel, minimum } = filters;
  const applied = CHIPS.filter(chip => filters[chip.key]).map(chip => ({
    ...chip,
    value: filters[chip.key],
  }));

  return (
    <section className="panel" id="q-explorar" aria-labelledby="explore-title">
      <header className="explore__head">
        <h2 id="explore-title">Oportunidades abiertas</h2>
        {/* El buscador y la exportacion comparten renglon con el titulo: los
            dos operan sobre la lista entera, no sobre una dimension suya.
            Exportar bajo aqui desde la tira del periodo, donde no tenia nada
            que hacer: no filtra nada, se lleva justo las filas que la tabla
            esta mostrando. */}
        <div className="explore__tools">
          <input
            type="search"
            aria-label="Buscar empresa"
            placeholder="Buscar empresa..."
            value={query}
            onChange={e => onChange({ query: e.target.value }, { replace: true })}
          />
          <button onClick={onExport}>Exportar CSV</button>
        </div>
      </header>

      <div className="explore__filters">
        <label>
          Etapa
          <select value={stage} onChange={e => onChange({ stage: e.target.value })}>
            <option value="">Todas las etapas</option>
            {STAGES.map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Responsable
          <select value={owner} onChange={e => onChange({ owner: e.target.value })}>
            <option value="">Todos los responsables</option>
            {TEAM.map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Canal
          <select value={channel} onChange={e => onChange({ channel: e.target.value })}>
            <option value="">Todos los canales</option>
            {CHANNELS.map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Valor mensual
          <select value={minimum} onChange={e => onChange({ minimum: e.target.value })}>
            <option value="">Todos los valores</option>
            <option value="30">Desde $30 M COP</option>
            <option value="50">Desde $50 M COP</option>
          </select>
        </label>
      </div>

      {/* Aparece solo con algun filtro puesto. Sin filtros, el recuento
          repetiria el que ya da la banda del pipeline —"en 8 oportunidades
          abiertas"— y "Limpiar" seria un boton permanentemente inerte: dos
          formas de enseñar a ignorar una zona de la pantalla. */}
      {applied.length > 0 && (
        <div className="refine">
          <p className="refine__count">
            {rows.length} de {plural(periodCount, 'oportunidad', 'oportunidades')} de {period.label}
          </p>
          <ul className="chips">
            {applied.map(({ key, name, read, value }) => (
              <li key={key}>
                <button type="button" className="chip" onClick={() => onRelease(key)}>
                  <span className="chip__name">{name}</span>
                  <span className="chip__value">{read ? read(value) : value}</span>
                  <span className="chip__x" aria-hidden="true">
                    ×
                  </span>
                  <span className="sr-only">· quitar este filtro</span>
                </button>
              </li>
            ))}
          </ul>
          {/* Sin condicion. Llego a mostrarse solo con dos filtros o mas,
              con el argumento de que con uno solo su propia ficha ya era la
              salida. Es cierto y no alcanza: deja un control que aparece y
              desaparece segun una cuenta que nadie esta llevando, asi que
              quien lo busca no sabe si no esta o si no lo encuentra. Una
              salida general que a veces no esta es peor que una redundante. */}
          <button type="button" className="refine__clear" onClick={onClear}>
            Limpiar todo
          </button>
        </div>
      )}

      <div className="scroll">
        <table>
          <thead>
            <tr>
              {COLUMNS.map(({ label, field }) => {
                const active = sort?.field === field;
                if (!field) {
                  return (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  );
                }
                return (
                  // `aria-sort` va en la CELDA, no en el boton: describe el
                  // estado de la columna. El boton es solo lo que se activa.
                  <th
                    key={label}
                    scope="col"
                    className="th--sortable"
                    aria-sort={active ? ARIA_SORT[sort.direction] : 'none'}
                  >
                    <button type="button" className="th-sort" onClick={() => onSort(field)}>
                      {label}
                      {/* La flecha solo aparece en la columna activa. Que la
                          columna SEA ordenable se anuncia de otra forma: con
                          el subrayado punteado, que esta siempre y no depende
                          de pasar el raton. */}
                      <span className="th-sort__arrow" aria-hidden="true">
                        {active ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
                      </span>
                      <span className="sr-only">
                        {active
                          ? sort.direction === 'asc'
                            ? '· ordenado de menor a mayor, activar para invertir'
                            : '· ordenado de mayor a menor, activar para quitar el orden'
                          : '· activar para ordenar por esta columna'}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map(o => (
              <tr key={o.id}>
                <td>{o.company}</td>
                <td>
                  <span className={`badge badge--${STAGE_SLUG[o.stage]}`}>{o.stage}</span>
                </td>
                <td>${o.value} M</td>
                <td>{o.owner}</td>
                {/* La columna que SI es de trabajo: dice a quien se le debe
                    una llamada. Ver Contact.jsx. */}
                <td>
                  <ContactTag opportunity={o} period={period} />
                </td>
                <td>
                  <button aria-label={`Ver ${o.company}`} onClick={() => onSelect(o)}>
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
                ? `No hay oportunidades con ${cause.name} "${cause.value}" en ${period.label}.`
                : 'No hay oportunidades con esta combinación de filtros.'}
            </p>
            {cause ? (
              <button onClick={() => onRelease(cause.key)}>Quitar {cause.name}</button>
            ) : (
              <button onClick={onClear}>Limpiar todos los filtros</button>
            )}
          </div>
        )}
      </div>

      {/* El aviso de exportacion vive en el panel que exporta. Antes caia en
          una sola region al pie de la pagina, compartida con el aviso del
          periodo, que se opera desde la banda de arriba: un acuse de recibo a
          pantallas de distancia de lo que acuso no se ve. */}
      <p className="explore__notice" role="status">
        {notice}
      </p>
    </section>
  );
}
