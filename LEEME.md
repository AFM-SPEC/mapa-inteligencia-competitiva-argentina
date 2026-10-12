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

## Qué se agregó para parecerse al original de Paraguay
- **Edad mediana y población económicamente activa por gobierno local:** calculadas con el Censo 2022 por radio censal (INDEC). Validadas contra el dato oficial por departamento (edad mediana: 510 de 512 coinciden, 2 difieren en un año; población activa: coincide exacta). 186 gobiernos locales sin dato propio muestran el de su departamento, rotulado.
- **Estaciones transformadoras de alta tensión (323):** Secretaría de Energía; potencia INSTALADA en MVA, no potencia disponible.
- **Comercio exterior por aduana:** ARCA, 12 meses (octubre 2025 a septiembre 2026). Importaciones completas; exportaciones parciales por reserva estadística de ARCA (cerca del 45 % del total; se excluyeron renglones con errores de carga evidentes, documentados en `herramientas/procesar_aduanas.py` y `fuentes.html`).
- **Parques industriales (606) y zonas francas (13):** mapa del Senado, 2024.
- **Fuentes:** cada pantalla trae su bloque «Fuentes de esta pantalla» con enlaces; la página `fuentes.html` reúne el inventario, el método, las brechas y la priorización.

## Qué sigue sin existir (y por qué)
- **Potencia eléctrica DISPONIBLE por subestación:** no se halló publicada; habría que pedirla a CAMMESA, al ENRE (ENReGE) y a las transportistas.
- **Exportaciones por aduana completas:** ARCA las reserva en parte.
- **Parques industriales unificados:** falta cruzar con el RENPI (planilla de 2023 sin coordenadas) y con los registros provinciales.
- **POUT:** concepto propio de Paraguay; no hay registro nacional abierto.
- **Video de «Sobre el mapa»:** se reemplazó por una guía de tres pasos.
- **Datos de contacto y destino del formulario:** se completan en `docs/config.js` (el correo de contacto es info@neetipol.com; sin destino de formulario).

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
- `herramientas/`: scripts de Python que procesan los datos originales: `procesar.py` (base), `procesar_comercio.py`, `procesar_censo_dptos.py` y `integrar_radios.py` (censo), `procesar_radios.py` (radios censales), `procesar_energia.py`, `procesar_aduanas.py` y `armar_aduanas.py` (aduanas). Orden: `procesar.py`, `procesar_censo_dptos.py`, `integrar_radios.py`, `procesar_energia.py`.
- `datos-origen/` (no se sube al repositorio por su tamaño): archivos descargados de las fuentes de arriba. Para regenerar `docs/datos/` hay que volver a bajarlos de esas fuentes y correr los dos scripts.
