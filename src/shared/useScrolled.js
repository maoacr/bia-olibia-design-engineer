import { useEffect, useRef, useState } from 'react';

/**
 * Si la pagina esta desplazada.
 *
 * HACE FALTA, y lo descubri sacandolo. Esta maquinaria existia para
 * encender el vidrio de la cabecera; al quitar el vidrio la borre como
 * codigo muerto, y resulta que el fundido tiene la misma necesidad por
 * otro motivo: en scroll 0 no hay nada subiendo bajo la cabecera, asi que
 * el velo no tiene trabajo y lo unico que hace es apagar el primer
 * titulo. Medido: entre el borde de la barra y "PIPELINE ABIERTO" hay 37px
 * en escritorio y 28 en movil — no alcanza para un degradado, asi que
 * acortarlo no era una opcion. Apagarlo arriba, si.
 *
 * Un centinela de 1px en el tope del documento y un observador por
 * interseccion: mientras se vea, la pagina esta sin desplazar. No es un
 * oyente de scroll, asi que no corre una vez por cuadro mientras se baja.
 * Va en absoluto, asi que no ocupa lugar ni corre el contenido.
 *
 * No sirve que la cabecera se observe a si misma con `rootMargin`: nace
 * pegada al tope, o sea que nace recortada, y la marca quedaria puesta
 * desde el primer cuadro. Probado en su momento.
 *
 * Vive aca y no dentro de una pagina porque las dos lo necesitan: sin el,
 * el contenido se ve POR DEBAJO de la cabecera pegajosa, que es
 * transparent.
 */
export function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Se publica en la raiz, junto a `data-theme` y `data-brand`: el velo vive
  // en `.shell` y la cabecera tambien podria quererlo algun dia.
  useEffect(() => {
    const root = document.documentElement;
    if (scrolled) root.setAttribute('data-scrolled', '');
    else root.removeAttribute('data-scrolled');
  }, [scrolled]);

  return sentinel;
}
