# Olibia · Dashboard base en React

Material inicial de la prueba Design Engineer Bia/Olibia. El diseño es deliberadamente convencional: el reto es transformarlo a tu manera. Datos ficticios.

## Ejecutar
Requiere Node.js 20 o superior.

```sh
npm ci
npm run dev
```

Abre la URL que imprime Vite (por defecto http://localhost:5173). Para revisar el build de producción: `npm run build && npm run preview`.

## Estructura
- `src/main.jsx`: punto de entrada y rutas.
- `src/routes/olibia/`: dashboard comercial (tarea 1).
- `src/styles.css`: estilos de partida.
- `vite.config.js`: configuración de build y servidor de desarrollo.

Puedes cambiar composición, gráficos, componentes, estilos y librerías. Conserva el significado de los datos y las acciones útiles. Las instrucciones completas están en el PDF de la prueba.

## Entrega
Un repositorio de GitHub con ambas tareas en React, README con instrucciones, explicación de decisiones y enlace a una demo. Puedes crear dos rutas o dos aplicaciones. Incluye la reflexión de la tarea 3 en el README o en `criterio.md`. No se necesita backend. Si el repositorio es privado, concede acceso al equipo evaluador por el canal de entrega.

Los seguimientos se guardan solo durante la sesión. La exportación CSV y los filtros funcionan localmente.

## Elementos añadidos al ejercicio
- Banner comercial con acción para ver negociaciones y opción de cerrar.
- Resumen AI simulado que refleja las oportunidades visibles, sin API externa.
- Filtros combinables por etapa, responsable, canal y valor mensual, además de periodo y búsqueda.
- Los filtros afectan las oportunidades, el pipeline, el resumen y el CSV. Los cierres conservan el total del equipo y se identifican así.
- Espacio lateral con la instrucción: «Diseña el menú vertical y sus opciones».
