import React from 'react';
import { Link } from 'react-router-dom';
import { ADVANCED, NEW, STALLED } from './movement.js';
import { TEAM } from './data.js';
import { filtersToSearch } from './useFilterParams.js';

/**
 * Menu vertical, con dos formas.
 *
 * Desplegado muestra el texto completo. Recogido queda como una barra de
 * iconos: no desaparece, de modo que los modulos siguen al alcance y —esto es
 * lo que lo hace coherente— el control que cambia entre las dos formas puede
 * vivir dentro del propio menu, como su primer icono, en vez de flotar fuera.
 *
 * Cada opcion es un enlace a una direccion que la aplicacion ya sabe producir:
 * las sub-opciones son los filtros que ya existen, expresados como URL. No hay
 * ningun destino fingido.
 *
 * El estado activo se calcula contra los filtros, no con NavLink: todas las
 * opciones apuntan a /olibia y lo que cambia es la consulta, que NavLink no
 * mira. Si se usara, todas las opciones figurarian activas a la vez.
 */

const Icon = ({ children }) => (
  <svg
    className="menu__icon"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

const IconPanel = () => (
  <Icon>
    <rect x="3.25" y="4.25" width="17.5" height="15.5" rx="2.25" />
    <line x1="9.5" y1="4.25" x2="9.5" y2="19.75" />
  </Icon>
);

const IconResumen = () => (
  <Icon>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Icon>
);

const IconPipeline = () => (
  <Icon>
    <line x1="4" y1="6.5" x2="20" y2="6.5" />
    <line x1="6.5" y1="12" x2="17.5" y2="12" />
    <line x1="9.5" y1="17.5" x2="14.5" y2="17.5" />
  </Icon>
);

const IconEquipo = () => (
  <Icon>
    <circle cx="9" cy="8" r="3.25" />
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.4a3.25 3.25 0 0 1 0 5.2" />
    <path d="M17.5 14.6a5.5 5.5 0 0 1 3 4.9" />
  </Icon>
);

function Item({ to, label, count, active, icon, nested = false }) {
  return (
    <li>
      <Link
        to={to}
        aria-current={active ? 'page' : undefined}
        title={label}
        className={`menu__link${nested ? ' menu__link--nested' : ''}${active ? ' is-active' : ''}`}
      >
        {icon}
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

export default function SideMenu({ id, period, filters, summary, total, collapsed, onToggle }) {
  const { query, stage, owner, channel, minimum, movement } = filters;
  const anyFilter = Boolean(query || stage || owner || channel || minimum || movement);

  // Las opciones conservan el periodo que se esta mirando: elegir una seccion
  // no deberia devolverte en silencio a octubre.
  const link = patch => `/olibia${filtersToSearch({ period, ...patch })}`;

  return (
    <nav className="menu" id={id} aria-label="Secciones">
      {/* Primer icono de la barra: cambia entre las dos formas del menu. */}
      <button
        type="button"
        className="menu__toggle"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Desplegar el menú' : 'Recoger el menú'}
        title={collapsed ? 'Desplegar el menú' : 'Recoger el menú'}
        onClick={onToggle}
      >
        <IconPanel />
        <span className="menu__label">Recoger</span>
      </button>

      <p className="menu__group">Trabajo</p>
      <ul className="menu__list">
        <Item to={link({})} label="Resumen" active={!anyFilter} icon={<IconResumen />} />

        <li>
          <span className="menu__section" title="Oportunidades">
            <IconPipeline />
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
        {/* En la barra de iconos el equipo se representa con uno solo: cuatro
            avatares identicos no distinguirian nada. */}
        <li className="menu__rail-icon">
          <span className="menu__section" title="Equipo">
            <IconEquipo />
          </span>
        </li>
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
