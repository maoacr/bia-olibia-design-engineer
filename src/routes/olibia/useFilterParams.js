/**
 * Los filtros viven en la URL, no en el estado del componente.
 *
 * Asi una vista filtrada es una direccion: se puede compartir, el boton atras
 * la deshace y recargar no la pierde. Es lo que cualquiera espera al hacer
 * clic en una opcion de menu, y es la diferencia entre un menu que parece
 * navegacion y uno que lo es.
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ADVANCED, NEW, REGRESSED, STALLED } from './movement.js';

/** Nombre de cada filtro en la direccion. En español, porque se leen. */
const PARAM = {
  period: 'periodo',
  query: 'q',
  stage: 'etapa',
  owner: 'responsable',
  channel: 'canal',
  minimum: 'desde',
  movement: 'movimiento',
  sort: 'orden',
};

/** Columnas por las que la tabla se deja ordenar. */
export const SORTABLE = ['empresa', 'contacto'];

/** El movimiento usa claves internas en ingles; en la URL va en español. */
const MOVEMENT_TO_URL = {
  [STALLED]: 'trabadas',
  [ADVANCED]: 'avanzaron',
  [NEW]: 'nuevas',
  [REGRESSED]: 'retrocedieron',
};
const URL_TO_MOVEMENT = Object.fromEntries(
  Object.entries(MOVEMENT_TO_URL).map(([key, value]) => [value, key]),
);

export const DEFAULT_PERIOD = 'oct';

export function filtersToSearch(patch) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(patch)) {
    if (!value) continue;
    search.set(PARAM[key], key === 'movement' ? MOVEMENT_TO_URL[value] : value);
  }
  return `?${search.toString()}`;
}

export function useFilterParams() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      period: params.get(PARAM.period) || DEFAULT_PERIOD,
      query: params.get(PARAM.query) || '',
      stage: params.get(PARAM.stage) || '',
      owner: params.get(PARAM.owner) || '',
      channel: params.get(PARAM.channel) || '',
      minimum: params.get(PARAM.minimum) || '',
      movement: URL_TO_MOVEMENT[params.get(PARAM.movement)] || '',
    }),
    [params],
  );

  /**
   * El orden de la tabla, FUERA del objeto de filtros.
   *
   * Comparte la direccion con ellos —una vista ordenada tambien se comparte y
   * tambien se deshace con el boton atras— pero no es un filtro: no esconde
   * ninguna fila, no merece una ficha y "Limpiar todo" no debe deshacerlo.
   * Mezclarlo en `filters` lo habria arrastrado a las tres cosas.
   */
  const sort = useMemo(() => {
    const [field, direction] = (params.get(PARAM.sort) || '').split('-');
    if (!SORTABLE.includes(field)) return null;
    return { field, direction: direction === 'desc' ? 'desc' : 'asc' };
  }, [params]);

  /**
   * `replace` evita que cada pulsacion del buscador deje una entrada en el
   * historial: con eso, el boton atras tendria que recorrer el texto letra
   * por letra. Los demas filtros si son acciones deliberadas y se apilan.
   */
  const update = useCallback(
    (patch, { replace = false } = {}) => {
      setParams(
        previous => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(patch)) {
            const name = PARAM[key];
            const urlValue = key === 'movement' ? MOVEMENT_TO_URL[value] : value;
            if (urlValue) next.set(name, urlValue);
            else next.delete(name);
          }
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );

  const reset = useCallback(
    () => update({ query: '', stage: '', owner: '', channel: '', minimum: '', movement: '' }),
    [update],
  );

  return { filters, sort, update, reset };
}
