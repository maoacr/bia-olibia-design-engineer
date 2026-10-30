import React from 'react';
import { Link } from 'react-router-dom';
import { ADVANCED, NEW, STALLED } from './movement.js';
import { TEAM } from './data.js';
import { filtersToSearch } from './useFilterParams.js';

/**
 * Menu vertical.
 *
 * Cada opcion es un enlace a una direccion que la aplicacion ya sabe producir:
 * las sub-opciones son los filtros que ya existen, expresados como URL. No hay
 * ningun destino fingido.
 *
 * Los recuentos no son decoracion. Alguien que abre la aplicacion con pocos
 * minutos ve que hay una oportunidad trabada antes de leer una sola linea del
 * tablero: el menu es el primer resumen, no un indice.
 *
 * El estado activo se calcula contra los filtros, no con NavLink: todas las
 * opciones apuntan a /olibia y lo que cambia es la consulta, que NavLink no
 * mira. Si se usara, todas las opciones figurarian activas a la vez.
 */

function Item({ to, label, count, active, nested = false }) {
  return (
    <li>
      <Link
        to={to}
        aria-current={active ? 'page' : undefined}
        className={`menu__link${nested ? ' menu__link--nested' : ''}${active ? ' is-active' : ''}`}
      >
        <span className="menu__label">{label}</span>
        {count != null && (
          <>
            <span className="menu__count" aria-hidden="true">
              {count}
            </span>
            <span className="sr-only">{`: ${count}`}</span>
          </>
        )}
      </Link>
    </li>
  );
}

export default function SideMenu({ id, period, filters, summary, total }) {
  const { query, stage, owner, channel, minimum, movement } = filters;
  const anyFilter = Boolean(query || stage || owner || channel || minimum || movement);

  // Las opciones conservan el periodo que se esta mirando: elegir una seccion
  // no deberia devolverte en silencio a octubre.
  const link = patch => `/olibia${filtersToSearch({ period, ...patch })}`;

  return (
    <nav className="menu" id={id} aria-label="Secciones">
      <p className="menu__group">Trabajo</p>
      <ul className="menu__list">
        <Item to={link({})} label="Resumen" active={!anyFilter} />

        <li>
          <span className="menu__section">
            <span className="menu__label">Oportunidades</span>
            <span className="menu__count" aria-hidden="true">
              {total}
            </span>
          </span>
          <ul className="menu__list menu__list--child">
            {[
              [STALLED, 'Sin movimiento'],
              [NEW, 'Nuevas este mes'],
              [ADVANCED, 'Avanzaron'],
            ].map(([status, label]) => (
              <Item
                key={status}
                to={link({ movement: status })}
                label={label}
                count={summary[status]}
                active={movement === status}
                nested
              />
            ))}
          </ul>
        </li>
      </ul>

      <p className="menu__group">Equipo</p>
      <ul className="menu__list">
        {TEAM.map(name => (
          <Item key={name} to={link({ owner: name })} label={name} active={owner === name} />
        ))}
      </ul>

      {anyFilter && (
        <p className="menu__foot">
          <Link to={link({})} className="menu__reset">
            Quitar todos los filtros
          </Link>
        </p>
      )}
    </nav>
  );
}
