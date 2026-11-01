import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    /**
     * LOS OBJETIVOS DEL MINIFICADOR.
     *
     * Vite 8 minifica el CSS con lightningcss, y con los objetivos por
     * defecto ese deja `backdrop-filter` SOLO con el prefijo `-webkit-`.
     * Ese alias ya no lo aplica Chrome 156: el valor computado da `none`.
     *
     * Consecuencia medida en produccion: el dock, la lengueta y la burbuja
     * del asistente quedaban con `rgba(255,255,255,0.05)` de fondo y SIN
     * desenfoque, asi que el texto del `main` se leia a traves de los
     * iconos al hacer scroll. El fondo del modal, por el mismo motivo, no
     * desenfocaba.
     *
     * No es una regresion de esta sesion: el build del 30/10 tiene el CSS
     * identico. El vidrio nunca funciono en produccion, y la casa lo SEGUNIA
     * usando sin notarlo — la decision de que "el vidrio esta bien para una
     * barra fina de iconos" daba por sentado un desenfoque que no existia.
     *
     * Decirle a lightningcss que el objetivo es un navegador moderno
     * devuelve la propiedad como esta escrita, sin prefijo.
     *
     * La primera version de este fix pedia `build.cssMinify: 'esbuild'`.
     * Funciona en local, pero Vite 8 (rolldown) no trae esbuild: en Vercel
     * el build muere con "Cannot find package 'esbuild'". No hace falta
     * agregar la dependencia.
     */
    lightningcss: {
      targets: {
        chrome: 120 << 16,
        edge: 120 << 16,
        firefox: 121 << 16,
        safari: 17 << 16,
      },
    },
  },
});
