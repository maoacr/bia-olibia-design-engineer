import { useEffect } from 'react';

/**
 * El titulo del documento lo define la ruta.
 *
 * La aplicacion es una sola pagina con dos rutas y el HTML es el mismo para
 * las dos: sin esto, las dos pestanas dicen lo mismo y la segunda
 * experiencia queda sin nombre.
 *
 * El crawler NO ejecuta React, asi que el titulo del HTML sigue siendo el
 * del proyecto -- esto solo cambia la pestana de quien esta mirando la
 * aplicacion de verdad.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
