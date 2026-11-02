import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../../shared/theme.jsx';
import { useDocumentTitle } from '../../shared/useDocumentTitle.js';

/**
 * LA PORTADA — lo que hay en la raiz.
 *
 * Hasta ahora `/` redirigia a `/olibia`, y esa redireccion decidia por
 * quien entra: de las dos experiencias que el proyecto presenta, una se
 * abria sola y la otra habia que adivinarla. Tambien dejaba al sitemap
 * apuntando a una URL intermedia y al enlace compartido cayendo en una
 * de las dos mitades sin decir que habia otra.
 *
 * La portada no es un menu: es la carta del proyecto. Dice QUE es esto
 * —una prueba de Design Engineer—, QUIEN lo hizo, y recien despues
 * ofrece las dos puertas. El orden importa: quien abre el enlace desde
 * un chat llega sin contexto.
 *
 * LA LINEA GRAFICA ES LA DE LA CARTA SOCIAL (`scripts/og-card.html`), que
 * es lo que esa persona acaba de ver en la previsualizacion: mismo halo
 * unico entrando por arriba a la derecha, misma pareja de titular y
 * bajada, mismo pie con la regla en gradiente. Si la pagina se viera
 * distinta de su propia miniatura, el enlace mentiria.
 *
 * CADA TARJETA LLEVA SU MARCA. El acento no es decoracion: es la primera
 * cosa que se ve de cada experiencia, y verlas una al lado de la otra es
 * la demostracion mas corta de que los tokens tienen dos capas. Por eso
 * el `data-brand` va en la tarjeta y no en <html> — ver el bloque de
 * acento por marca en `tokens.css`, que es lo que lo hace posible sin
 * romper el tema claro.
 */

const Rayo = () => (
  <svg
    className="portada__rayo"
    viewBox="0 0 24 24"
    width="22"
    height="22"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M13.6 2 4 13h6.2L10.4 22 20 11h-6.2z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const Flecha = () => (
  <svg
    className="portada__flecha"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M4 12h15m-6-6 6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Las dos puertas, en datos y no en JSX repetido: lo unico que cambia
 * entre ellas es el texto y la marca, asi que el markup se escribe una
 * sola vez y las dos no pueden desincronizarse.
 */
const EXPERIENCIAS = [
  {
    marca: 'olibia',
    nombre: 'Olibia',
    que: 'Tablero comercial',
    detalle:
      'El pipeline del trimestre, lo que se está trabando y cómo está repartida la carga del equipo.',
    accion: 'Ver el tablero',
    a: '/olibia',
  },
  {
    marca: 'bia',
    nombre: 'Bia',
    que: 'Consumo energético',
    detalle:
      'Por qué subió la factura de tres cafeterías: qué sede, qué franja horaria y qué hacer con eso.',
    accion: 'Ver el consumo',
    a: '/bia',
  },
];

export default function Portada() {
  useDocumentTitle('Bia · Olibia — Prueba de Design Engineer');

  return (
    <div className="portada">
      <header className="portada__barra">
        <p className="portada__marca">
          <Rayo />
          <span>Bia</span>
          <span className="portada__marca-sep" aria-hidden="true">
            ·
          </span>
          <span className="portada__marca-otra">Olibia</span>
        </p>
        <ThemeToggle />
      </header>

      <main className="portada__centro">
        {/* El sello va aca y no arriba a la derecha como en la carta social:
            en la carta hay 1200px de ancho garantizados, en un telefono hay
            360px y "PRUEBA DE DESIGN ENGINEER" no entra al lado de la marca
            y el control de tema sin partirse. Arriba del titular cumple la
            misma funcion —decir que es esto antes que nada— y aguanta
            cualquier ancho. */}
        <p className="portada__sello">Prueba de Design Engineer</p>

        <h1 className="portada__titular">Dos experiencias sobre un mismo sistema de diseño.</h1>

        <p className="portada__bajada">
          El tablero comercial de Olibia y la vista de consumo energético de Bia, construidos sobre
          los mismos tokens, los mismos dos temas y los mismos componentes.
        </p>

        <nav className="portada__puertas" aria-label="Las dos experiencias">
          {EXPERIENCIAS.map(exp => (
            <Link key={exp.marca} className="portada__puerta" data-brand={exp.marca} to={exp.a}>
              <span className="portada__puerta-nombre">{exp.nombre}</span>
              <span className="portada__puerta-que">{exp.que}</span>
              <span className="portada__puerta-detalle">{exp.detalle}</span>
              <span className="portada__puerta-ir">
                {exp.accion}
                <Flecha />
              </span>
            </Link>
          ))}
        </nav>
      </main>

      <footer className="portada__pie">
        <p className="portada__meta">
          <span className="portada__regla" aria-hidden="true" />
          React 19 · Vite · Tokens en dos capas
        </p>
        <p className="portada__firma">
          Diseñado y desarrollado por{' '}
          <a
            className="portada__autor"
            href="https://github.com/maoacr"
            target="_blank"
            rel="noreferrer"
          >
            @maoacr
          </a>
        </p>
      </footer>
    </div>
  );
}
