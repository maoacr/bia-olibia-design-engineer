import React from 'react';

/**
 * LOS ESTADOS QUE NO SON CONTENIDO.
 *
 * El enunciado los pide: carga, error, y vacio. El de carga es lo primero
 * que ve quien abre la pagina; el de error se alcanza desde el pie, sin
 * romper nada; el vacio lo produce la propia pagina cuando la sede
 * elegida no tiene nada que explicar.
 *
 * Los esqueletos son bloques grises, no texto de relleno: un "cargando..."
 * gigante hace saltar la pagina cuando llega el dato, y el salto se lee como
 * un error.
 */

export function Cargando() {
  return (
    <div className="cargando" role="status">
      <span className="sr-only">Cargando el consumo de las tres sedes.</span>
      <div className="cargando__linea cargando__linea--ancha" aria-hidden="true" />
      <div className="cargando__linea" aria-hidden="true" />
      <div className="cargando__bloque" aria-hidden="true" />
      <div className="cargando__bloque cargando__bloque--corto" aria-hidden="true" />
    </div>
  );
}

export function Error({ mensaje, onReintentar }) {
  return (
    <div className="bia__error" role="alert">
      <p className="bia__error-titulo">No pudimos leer el consumo</p>
      <p className="bia__error-texto">{mensaje}</p>
      <button type="button" className="bia__error-boton" onClick={onReintentar}>
        Reintentar
      </button>
    </div>
  );
}
