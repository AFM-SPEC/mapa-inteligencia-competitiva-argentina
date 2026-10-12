# Mapa de inteligencia competitiva · Argentina

Versión argentina del «Mapa de Inteligencia Competitiva» del MIC de Paraguay: portada, mapa logístico de nueve secciones (A a I), estudios, preguntas frecuentes, herramientas de accesibilidad y formulario de comentarios, con los 2.314 gobiernos locales del país y la identidad visual de NEETI. Es un sitio estático (sin servidor).

**Para verlo en la computadora:** doble clic en `abrir-mapa.command` (abre http://localhost:8766).

## Secciones del mapa
A Zonas y ciudades · B Rutas y fronteras · C Red eléctrica · D Red de combustibles · E Red de salud · F Industrias · G Polos y nodos logísticos · H Aduanas · I Comercio global.
Cada una tiene filtros, indicadores, mapa con panel de capas y leyenda, gráficos y tablas ordenables.

## De dónde salen los datos
- Población y viviendas por gobierno local: INDEC, Censo 2022 (cuadro actualizado el 03/06/2026).
- Ubicación de los gobiernos locales y capas (rutas, ferrocarril, energía, ductos, yacimientos, salud, fábricas, universidades, puertos, aeropuertos, peajes, pasos de frontera, aduanas, áreas protegidas): IGN, servicio WFS de Capas SIG.
- Exportaciones por provincia, rubro y destino: INDEC, «Origen provincial de las exportaciones» (anexo de cuadros del primer semestre de 2025 y serie anual hasta 2024).

## Qué falta respecto del original de Paraguay (y por qué)
- **Edad mediana y población económicamente activa por municipio:** no hay dato abierto a ese nivel.
- **Potencia disponible por subestación, distribuidores y operadores de combustibles, redes IPS/MSPBS, polos industriales y AFI:** son datos propios de Paraguay; en Argentina no hay equivalentes abiertos.
- **Importaciones y exportaciones por aduana:** no se publican en forma abierta por aduana; el IGN sólo registra 10 aduanas.
- **Parques industriales:** no hay un listado nacional abierto con ubicación.
- **Video de «Sobre el mapa»:** se reemplazó por una guía de tres pasos.
- **«Tiene POUT»:** concepto propio de Paraguay.
- **Datos de contacto y destino del formulario:** se completan en `docs/config.js`; mientras estén vacíos, la sección «Contacto» y el formulario no aparecen.

## Límites que conviene saber
- Distancias en línea recta, no por camino.
- 51 gobiernos locales no tienen dato de población en el cuadro del Censo (juntas de gobierno y comisiones, sobre todo de Entre Ríos y Formosa); 3 con población no tienen ubicación en el mapa del IGN (Manuel Derqui, Colonia Aborigen, Isla Las Lechiguanas).
- La Ciudad de Buenos Aires aparece como un solo punto con sus 15 comunas.
- Los kilómetros de rutas y ferrocarril son de trazado del IGN (las autopistas pueden contar dos veces).
- La capa de líneas eléctricas muestra las clases de tensión 2 y 6 del IGN.
- Los rubros de fábricas salen del código ISIC de la capa del IGN.
- El comercio exterior se registra por provincia, no por municipio.

## Estructura
- `docs/`: el sitio (se publica con GitHub Pages). `index.html`, `preguntas.html`, `estilo.css`, `app.js`, `widgets.js`, `comun.js`, `config.js` y `datos/` (datos ya procesados).
- `herramientas/`: scripts de Python que procesan los datos originales (`procesar.py`, `procesar_comercio.py`).
- `datos-origen/` (no se sube al repositorio por su tamaño): archivos descargados de las fuentes de arriba. Para regenerar `docs/datos/` hay que volver a bajarlos de esas fuentes y correr los dos scripts.
