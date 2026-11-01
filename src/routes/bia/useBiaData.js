import { useCallback, useEffect, useState } from 'react';
import { REPORT } from './data.js';

/**
 * Cargar el informe.
 *
 * Los datos son ficticios y estan en el modulo, pero la pagina los pide
 * como si vinieran de una API. Con eso los estados que el enunciado pide
 * —carga, error y contenido— existen de verdad y se pueden ver, en vez de
 * quedar escritos en un comentario.
 *
 * `recargar(true)` fuerza el fallo: es lo que dispara el link del pie para
 * que el estado de error sea alcanzable sin romper nada.
 */
export function useBiaData() {
  const [state, setState] = useState({ status: 'cargando', report: null, error: null });

  const load = useCallback((falla = false) => {
    setState({ status: 'cargando', report: null, error: null });

    const timer = window.setTimeout(() => {
      if (falla) {
        setState({
          status: 'error',
          report: null,
          error:
            'No pudimos leer el consumo de las tres sedes. Puede ser un problema de conexión con el medidor.',
        });
        return;
      }
      setState({ status: 'listo', report: REPORT, error: null });
    }, 600);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cancelar = load();
    return cancelar;
  }, [load]);

  return { ...state, recargar: load };
}
