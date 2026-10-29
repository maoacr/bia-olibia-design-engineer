# Olibia · Dashboard base en React

Material inicial de la prueba Design Engineer Bia/Olibia. El diseño es deliberadamente convencional: el reto es transformarlo a tu manera. Datos ficticios.

## Ejecutar
Requiere Node.js 20 o superior.

```sh
npm ci
npm run build
npm start
```

Abre http://localhost:3000. También puedes abrir `dist/index.html` directamente: contiene React, CSS y JavaScript y funciona sin conexión.

## Estructura
- `src/App.jsx`: componentes React y estado de la interfaz.
- `src/data.js`: datos ficticios de dos periodos.
- `src/styles.css`: estilos de partida.
- `build.mjs`: compilación y generación de un HTML autónomo.

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
