import { useEffect } from 'react';

/**
 * La marca de la pagina.
 *
 * El atributo va en <html>, junto a `data-theme`, porque los tokens del
 * acento por marca se resuelven ahi: puesto en un contenedor mas hondo,
 * partes de la pagina quedarian con el acento de la otra marca.
 *
 * Se quita al desmontar. Dos rutas no se montan a la vez, asi que el
 * cambio del acento pasa en el mismo cuadro que el cambio de contenido.
 */
export function useBrand(brand) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-brand', brand);
    return () => root.removeAttribute('data-brand');
  }, [brand]);
}
