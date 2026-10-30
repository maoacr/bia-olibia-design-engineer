# Bia · Olibia — Prueba Design Engineer

Dos experiencias sobre un mismo sistema de diseño: el tablero comercial de **Olibia** y la vista de consumo energético de **Bia**.

**Demo:** _(pendiente de desplegar)_

---

## Ejecutar

Requiere Node.js 20 o superior.

```sh
npm ci
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run preview` | Sirve el build |
| `npm run check:contrast` | **Verifica el contraste WCAG de todos los tokens, en ambos temas** |

Ese último no es decorativo: lee `src/tokens.css`, resuelve las variables y comprueba 48 pares texto/superficie. Sale con código 1 si alguno baja del mínimo. Encontró cuatro errores reales antes de que llegaran a un commit.

---

## Cómo trabajé

Esto importa tanto como el resultado, así que va primero.

### 1. Auditar antes de tocar

No escribí una línea de diseño hasta cruzar los datos con scripts. Ahí apareció lo que terminó definiendo toda la dirección:

```
Grupo Andino          Contacto     → Calificación    avanza
Hotel Central         Contacto     → Contacto     ESTANCADA   ($18M)
Industrias Atlas      nueva        → Negociación               ($78M)
```

Los datos contenían **una película y el tablero mostraba una foto**. Cinco oportunidades avanzan de etapa, una lleva un mes sin moverse, dos entran nuevas. Todo estaba ahí y ninguna pantalla lo decía.

La auditoría también encontró que el canal de una empresa **cambiaba entre periodos** (se derivaba del índice de la fila en un array), que la escala de las gráficas estaba escrita a mano, y que septiembre no tiene ninguna oportunidad en Negociación — lo que dejaba la pantalla en blanco sin explicación.

### 2. Medir antes de afirmar

Ninguna decisión de color se tomó a ojo:

| Qué | Medido | Consecuencia |
|---|---|---|
| Acentos de Bia sobre oscuro | **15.21:1** | — |
| Los mismos sobre blanco | **1.27:1** | La marca es dark-first *por construcción*, no por gusto |
| `#777` del starter sobre blanco | **4.48:1** | Fallaba AA por dos centésimas, en tres usos |
| Separación contexto/acento en claro | **1.43:1** | El realce no puede depender sólo del color |
| Medida de lectura del resumen | **178 caracteres** | Lo cómodo son 45–75 |
| Valor medio por canal | **$64,7M vs $31,3M** | Los referidos valen el doble que el outbound |

Ese último número no lo inventé: salió de asignar los canales respetando el comportamiento que los datos ya mostraban. Es un hallazgo de negocio que el tablero no estaba contando.

### 3. Mirar la pantalla

Varias cosas **sólo aparecieron viendo el render**, no leyendo el código:

- El gráfico de canales con un filtro activo mostraba `[0, 2, 0]` sobre una grilla que llegaba a 10: **80% del panel en aire vacío**.
- `NavLink` marcaba **todas** las opciones del menú como activas (compara el *pathname*, y todas apuntan a `/olibia`; lo que cambia es el query).
- El botón flotante aparecía pegado al control de tema: `backdrop-filter` **crea un containing block** para descendientes `position: fixed`, así que su `bottom` se resolvía contra la cabecera.

La auditoría ya había detectado la escala rota y el `max={4}` arbitrario. Pero **leer `185 - n * 15` no transmite lo grave que se ve**.

### 4. Un commit por decisión

30 commits, con el porqué en el mensaje. El starter quedó aislado en su propio commit (`20d0034`) para que el diff posterior **sea** la evidencia del uplift — y para que se distinga sin ambigüedad qué código era de ellos y cuál es mío.

---

## Decisiones · Olibia

El starter trataba cada periodo como una instantánea aislada, aunque los datos contenían el movimiento entre ambos. Esa fue la decisión de fondo: **el periodo deja de ser un filtro y pasa a ser una comparación** — qué avanzó, qué se trabó, qué entró nuevo. No agregué datos; mostré los que se estaban desperdiciando.

De ahí se derivó todo lo demás. El acento dejó de pintar las cuatro gráficas y pasó a marcar **sólo lo que el usuario está interrogando**: un color omnipresente se normaliza y deja de leerse. Con el teal reservado, el ámbar quedó libre para señalar lo que pide atención, y "1 sin moverse" es hoy lo primero que se ve en la pantalla.

Los cuatro indicadores se veían idénticos pero dos responden a los filtros y dos no; el starter lo avisaba con una nota al pie. **Si hace falta un disclaimer para saber qué mira cada número, el diseño no está resuelto**: ahora van en dos grupos rotulados.

Los filtros viven en la URL, así que una vista filtrada es una dirección compartible y el botón atrás funciona. Eso convirtió el menú en navegación real en vez de un índice: cada opción lleva a un estado que la aplicación ya sabía producir, sin un solo destino fingido.

Cuando no queda nada visible, se prueba a soltar cada filtro por separado para nombrar al responsable y ofrecer la salida en un clic.

*(≈245 palabras)*

### Dirección visual

La paleta sale de la **identidad pública de Bia**, no de una invención: teal `#08DDBC`, gradiente a `#17FFDB`, neutrales zinc, tipografía Inter, y el vidrio tenue que usa su sitio.

El modo oscuro es el canónico porque **sus colores sólo existen sobre oscuro** (15:1 contra 1.27:1). El claro se deriva oscureciendo el acento hasta alcanzar AA.

Los tokens van en **dos capas**: primitivas de marca y roles semánticos. Ningún componente nombra un color crudo, y por eso ni el cambio de tema ni la variación de identidad entre Olibia y Bia tocan un solo componente.

Dónde hay expresividad y dónde calma: el color se reserva para lo interrogado y para lo que pide atención; el vidrio, para capas que flotan sobre el contenido. El halo sólo sobrevive donde la proporción lo justifica — un desenfoque de 24px sobre un renglón de menú no comunica estado, ensucia.

---

## Decisiones · Bia

_(pendiente)_

---

## Qué deberíamos probar

El PDF pide esto explícitamente, y sale de los fallos que fueron apareciendo:

**Recorridos con estado heredado.** Filtrar por algo que no existe en el otro periodo y cambiar de periodo. Septiembre no tiene Negociación; antes la pantalla quedaba en blanco. Hay dos casos distintos que conviene no confundir: la dimensión existe y no hay datos (etapa) frente a la dimensión no existe (movimiento, porque septiembre no tiene mes previo). El segundo retira el filtro solo y lo anuncia.

**Teclado completo en el detalle.** Abrir, tabular hasta el final y seguir: el foco debe circular dentro. Escape cierra y **el foco vuelve al botón que lo abrió**. Sin el encierro, el tabulador se va a la página de atrás, que está oculta para el lector de pantalla pero sigue siendo tabulable.

**Un teléfono real, no el navegador achicado.** Safari en iOS hace zoom al enfocar un campo de menos de 16px. Eso no se reproduce redimensionando una ventana de escritorio.

**Ambos temas en cada cambio.** Dos bugs pasaron las 48 comprobaciones de contraste en verde: el recuento seleccionado perdía el color de su categoría, y los valores del botón flotante hardcodeados en oscuro lo volvían invisible en claro.

**Los SVG al cambiar de tema.** Sus `<text>` sin `fill` son negros por defecto y no heredan el `color` del CSS: en oscuro quedaban invisibles, y con ellos se perdía leer el valor de cada barra sin pasar el mouse.

---

## Herramientas y AI

- **Vite + React 19 + React Router.** El starter traía un build de esbuild sin dev server: cada ajuste visual exigía rebuild y refresco manual. Para una prueba que evalúa microinteracciones, esa fricción se nota en el acabado.
- **Prettier.** El starter venía en líneas de hasta 2.000 caracteres — el dashboard entero ocupaba 13 líneas.
- **Claude Code** como par de trabajo, dirigido: yo tomé las decisiones de producto y diseño, y las empujé hasta que resistieran. Varias propuestas suyas las rechacé y se rehicieron — el halo disperso del menú, el control de colapso puesto en la cabecera, el menú que desaparecía en vez de volverse barra de iconos.
- **Chrome DevTools vía automatización**, para revisar el render en ambos temas y a distintos anchos. Ahí aparecieron los bugs que el código no delata.
- **Scripts de medición propios**, para contraste, medida de lectura y escalas. Uno quedó versionado como `check:contrast`.

### Qué refiné personalmente

Las decisiones de producto y de diseño, y la revisión visual completa. El criterio de que el acento señale en vez de decorar, el ámbar reservado, la jerarquía del menú, el rail de iconos, el peso de las sombras, la escala tipográfica recalibrada por pantalla y el rediseño del detalle salieron de mirar la pantalla y decir "esto no está bien", no de aceptar la primera versión.

### Tiempo dedicado

_(a completar)_

---

## Estructura

```
src/
  tokens.css            sistema de diseño en dos capas
  styles.css            estilos, escritos mobile-first
  shared/
    theme.jsx           tema claro/oscuro con preferencia del sistema
    scale.js            escalas derivadas del dato
  routes/olibia/
    OlibiaDashboard.jsx
    data.js             datos con identidad estable por oportunidad
    movement.js         comparación entre periodos
    filters.js
    useFilterParams.js  los filtros viven en la URL
    SideMenu.jsx        menú con dos formas: texto y barra de iconos
    Movement.jsx
    OpportunityDetail.jsx
scripts/
  check-contrast.mjs    verificación WCAG, falla el proceso si algo baja
```

### Accesibilidad

El starter traía una base razonable (ARIA, HTML semántico, `focus-visible`, `prefers-reduced-motion`) y **la condición fue no perder nada de eso**: sólo sumar.

- 48 pares de contraste verificados en ambos temas, automatizado.
- Foco encerrado en el diálogo, con retorno al disparador.
- La navegación ya no desaparece en móvil: se despliega como hoja inferior.
- `prefers-reduced-motion` por fin reduce algo — en el starter el media query existía pero no había una sola transición.
- Nada se codifica sólo por color: el realce suma peso tipográfico, el movimiento suma un punto, las etapas llevan su nombre escrito.
- Áreas táctiles de 44px como mínimo.
- Tipografía en `rem`: quien agranda la letra del navegador recibe texto proporcionalmente mayor.

---

Datos ficticios. Sin conexión a sistemas reales de Bia u Olibia.
