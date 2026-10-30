# Bia · Olibia — Prueba Design Engineer

Dos experiencias sobre un mismo sistema de diseño: el tablero comercial de **Olibia** y la vista de consumo energético de **Bia**.

**Demo:** https://bia-olibia-design-engineer.vercel.app/olibia

---

## Ejecutar

Requiere Node.js **20.19+ o 22.12+** — el rango que exige Vite 8, declarado en `engines`. Node 21 no sirve.

```sh
npm ci
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

| Comando                  | Qué hace                                                     |
| ------------------------ | ------------------------------------------------------------ |
| `npm run dev`            | Servidor de desarrollo                                       |
| `npm run build`          | Compilación de producción                                    |
| `npm run preview`        | Sirve el build                                               |
| `npm run check:contrast` | **Verifica el contraste WCAG de los tokens, en ambos temas** |

Ese último no es decorativo: lee `src/tokens.css`, resuelve las variables y corre **72 comprobaciones** — 36 pares texto/superficie en los dos temas. Sale con código 1 si alguno baja del mínimo. Encontró cuatro errores reales antes de que llegaran a un commit.

Y tiene un techo que conviene decir: **compara token contra token, así que no ve nada translúcido.** Un lavado de color sobre una superficie compone un tercer color que no está en `tokens.css` y que ningún par cubre. Ese agujero dejó pasar un relleno proporcional que hundía la segunda línea de las fichas a 3.36:1; apareció midiendo el color compuesto en el navegador, no acá.

---

## Sistema de diseño

Lo comparten las dos experiencias; se diferencian sólo por un acento cromático.

La paleta sale de la **identidad pública de Bia**, no de una invención: teal `#08DDBC`, gradiente a `#17FFDB`, neutrales zinc, tipografía Inter, y el vidrio tenue que usa su sitio.

El modo oscuro es el canónico porque **sus colores sólo existen sobre oscuro**: 15.21:1 contra 1.27:1 sobre blanco. El claro se deriva oscureciendo el acento hasta alcanzar AA.

Los tokens van en **dos capas**: primitivas de marca y roles semánticos. Ningún componente nombra un color crudo, y por eso ni el cambio de tema ni la variación de identidad entre Olibia y Bia tocan un solo componente.

---

## Decisiones · Olibia

El starter mostraba indicadores. La decisión de fondo fue cambiar la pregunta: **el sitio no muestra números, contesta las cinco que se hace quien es dueño de la meta.** ¿Vamos a llegar? ¿Qué se está cayendo? ¿Dónde me meto? ¿De dónde viene el valor? ¿Cómo venimos?

Cada bloque reemplaza un gráfico que engañaba. "Cierres por ejecutivo" hacía ver a Mateo como el que menos trabaja: cerró 1, el que menos — **pero carga $96 M, el pipeline más pesado del equipo**. Van hoy en la misma fila.

Auditar los datos antes de diseñar definió la dirección. Ahí apareció que **la meta de 10 no se alcanzó ni una vez en siete meses** (máximo: 8), que el canal de una empresa **cambiaba entre periodos** porque se derivaba del índice de la fila en un array, y que los referidos valen el doble que el outbound: $64,7 M contra $31,3 M.

Septiembre no tiene ninguna oportunidad en Negociación. No lo traté como caso borde a cubrir: con la misma estructura, los lugares vacíos se quedan sin candidatos y **el estado vacío es la pantalla más informativa de las dos**.

El alcance de cada bloque es una decisión, no un detalle. La meta y las alertas **no responden a los filtros**: una alerta que un filtro puede silenciar no sirve de alerta.

Ningún color se eligió a ojo. El acento marca sólo lo que se está interrogando, y con el teal reservado el ámbar queda libre para lo que pide atención.

---

## Decisiones · Bia

_(pendiente)_

---

## Qué deberíamos probar

El PDF pide esto explícitamente, y sale de los fallos que fueron apareciendo:

**Recorridos con estado heredado.** Filtrar por algo que no existe en el otro periodo y cambiar de periodo. Septiembre no tiene Negociación. Hay dos casos distintos que conviene no confundir: la dimensión existe y no hay datos (etapa) frente a la dimensión no existe (movimiento, porque septiembre no tiene mes previo). El segundo retira el filtro solo y lo anuncia.

**Teclado completo en el detalle.** Abrir, tabular hasta el final y seguir: el foco debe circular dentro. Escape cierra y **el foco vuelve al botón que lo abrió**. Sin el encierro, el tabulador se va a la página de atrás, que está oculta para el lector de pantalla pero sigue siendo tabulable.

**Un teléfono real, no el navegador achicado.** Safari en iOS hace zoom al enfocar un campo de menos de 16px. En ancho de móvil los seis campos están en 16px exactos; desde 1024px bajan a 12-14px, y ahí convendría verificar en un iPad en horizontal. Eso no se reproduce redimensionando una ventana de escritorio.

**Una ventana baja, no sólo una angosta.** Con el teléfono acostado (844×390) el dock flotante se le monta a la marca: 24px de solape vertical. Es anterior a este rediseño y está sin resolver.

**El alto de la cabecera contra los enlaces profundos.** `scroll-margin-top` se calcula con `--header-height`, que es un valor fijo. Si la cabecera crece y el token no, `/olibia#q-meta` aterriza con el título tapado. Cada cambio de tipografía ahí hay que medirlo: hoy son 69.00px con desfase 0.00 en siete anchos.

**Ambos temas en cada cambio, midiendo el color compuesto.** El gate de contraste compara tokens y no ve transparencias. Lo que se pinta encima de una superficie hay que medirlo en el navegador.

---

## Herramientas y AI

- **Vite + React 19 + React Router.** El starter traía un build de esbuild sin dev server: cada ajuste visual exigía rebuild y refresco manual. Para una prueba que evalúa microinteracciones, esa fricción se nota en el acabado.
- **Radix Tooltip + Motion.** Radix aporta comportamiento —posicionamiento con detección de colisión, apertura por foco de teclado, Escape, roles ARIA— y ni un pixel de apariencia.
- **Prettier.** El starter venía en líneas de hasta 2.000 caracteres: el dashboard entero ocupaba 13 líneas.
- **Claude Code** como par de trabajo, dirigido: yo tomé las decisiones de producto y diseño, y las empujé hasta que resistieran. Varias propuestas suyas las rechacé y se rehicieron. Dos ejemplos: esconder siete de las ocho filas del bloque de trabadas para ahorrar alto en móvil —que destruye la comparación que hace legible el bloque— y dar por bueno un truco de observador sobre la propia cabecera que resultó encenderse desde el primer cuadro.
- **Chrome DevTools vía CDP**, manejando un Chrome propio para medir y capturar en ambos temas y a distintos anchos. Ahí aparecieron los bugs que el código no delata, y los números que están en este README.
- **Scripts de medición propios**, para contraste, geometría y composición de color. Uno quedó versionado como `check:contrast`.

### Qué refiné personalmente

Las decisiones de producto y de diseño, y la revisión visual completa. El marco de las cinco preguntas, el criterio de que el acento señale en vez de decorar, el ámbar reservado, qué bloque responde a los filtros y cuál no, el peso de la marca en la cabecera y el rediseño del detalle salieron de mirar la pantalla y decir "esto no está bien", no de aceptar la primera versión.

### Tiempo dedicado

_(a completar)_

---

## Estructura

```
src/
  tokens.css              sistema de diseño en dos capas
  styles.css              estilos, escritos mobile-first
  shared/
    theme.jsx             tema claro/oscuro con preferencia del sistema
  routes/olibia/
    OlibiaDashboard.jsx   arma la página y reparte el alcance de cada bloque
    Goal.jsx              ¿Vamos a llegar?
    Stalled.jsx           ¿Qué se está cayendo?
    Workload.jsx          ¿Dónde me meto?
    Origin.jsx            ¿De dónde viene el valor?
    Trend.jsx             ¿Cómo venimos?
    Dock.jsx              índice navegable de las cinco preguntas
    OpportunityDetail.jsx
    Movement.jsx
    data.js               datos con identidad estable por oportunidad
    movement.js           comparación entre periodos
    filters.js
    useFilterParams.js    los filtros viven en la URL
scripts/
  check-contrast.mjs      72 comprobaciones WCAG, falla el proceso si algo baja
```

### Accesibilidad

El starter traía una base razonable (ARIA, HTML semántico, `focus-visible`, `prefers-reduced-motion`) y **la condición fue no perder nada de eso**: sólo sumar.

- 72 comprobaciones de contraste verificadas en ambos temas, automatizadas.
- Foco encerrado en el diálogo, con retorno al disparador.
- Un solo `h1` y ningún salto de nivel: `h1 Olibia` → nueve `h2`, uno por pregunta.
- `prefers-reduced-motion` por fin reduce algo — en el starter el media query existía pero no había una sola transición.
- Nada se codifica sólo por color: el realce suma peso tipográfico, el movimiento suma un punto, las etapas llevan su nombre escrito.
- Áreas táctiles de 44px como mínimo, **incluidos los desplegables y el buscador** — el piso estaba declarado sólo en `button` y seis controles quedaban por debajo.
- Tipografía en `rem`: quien agranda la letra del navegador recibe texto proporcionalmente mayor.

---

Datos ficticios. Sin conexión a sistemas reales de Bia u Olibia.
