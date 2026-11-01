import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    /**
     * ESBUILD Y NO LIGHTNINGCSS.
     *
     * Vite 8 minifica el CSS con lightningcss salvo que se le diga otra
     * cosa, y lightningcss deja `backdrop-filter` SOLO con el prefijo
     * `-webkit-`. Ese alias ya no lo aplica Chrome 156: el valor computado
     * da `none` y el desenfoque no existe.
     *
     * Medido en produccion: el dock, la lengueta y la burbuja del asistente
     * quedaban con `rgba(255,255,255,0.05)` de fondo y SIN desenfoque, asi
     * que el texto del `main` se leia a traves de los iconos. El fondo del
     * modal, por el mismo motivo, no desenfocaba.
     *
     * Esbuild deja la propiedad como esta escrita.
     */
    cssMinify: 'esbuild',
  },
});
