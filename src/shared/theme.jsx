/**
 * Tema claro / oscuro.
 *
 * Sin eleccion explicita del usuario no se escribe `data-theme`, de modo que
 * manda `prefers-color-scheme` del sistema operativo. El primer uso del
 * control convierte la preferencia en explicita y queda guardada.
 *
 * Tener modo oscuro no es, por si mismo, una mejora de accesibilidad: hay
 * personas a las que el texto claro sobre fondo oscuro les cuesta mas. Lo que
 * si lo es: respetar la preferencia del sistema, permitir cambiarla, y
 * sostener contraste AA en los dos temas. Las tres cosas estan cubiertas.
 */

import React, { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

const systemPrefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

function storedTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // Modo privado o almacenamiento bloqueado: se sigue sin preferencia guardada.
    return null;
  }
}

export function useTheme() {
  const [explicit, setExplicit] = useState(storedTheme);

  // El tema efectivo: el elegido, o el del sistema si no hay eleccion.
  const resolved = explicit ?? (systemPrefersDark() ? 'dark' : 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (explicit) root.setAttribute('data-theme', explicit);
    else root.removeAttribute('data-theme');
  }, [explicit]);

  // Si el usuario no eligio, seguir al sistema cuando este cambie en vivo.
  useEffect(() => {
    if (explicit || !window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setExplicit(null);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, [explicit]);

  const toggle = useCallback(() => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    setExplicit(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin almacenamiento la eleccion vale solo para esta sesion.
    }
  }, [resolved]);

  return { theme: resolved, toggle };
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="4.2" fill="currentColor" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
      <line
        key={angle}
        x1="12"
        y1="2.6"
        x2="12"
        y2="5.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        transform={`rotate(${angle} 12 12)`}
      />
    ))}
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <path
      d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const goingTo = theme === 'dark' ? 'claro' : 'oscuro';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Cambiar a tema ${goingTo}`}
      title={`Cambiar a tema ${goingTo}`}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
