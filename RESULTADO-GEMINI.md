# Resultado · Video Guía «Sobre el mapa»

## Estado del proyecto y registro de avance

**Fecha:** 12 de octubre de 2026  
**Responsable:** Asistente Gemini en Antigravity  
**Objetivo:** Crear el video guía «Sobre el mapa» del sitio «Mapa de inteligencia competitiva · Argentina» (NEETI), mobile-first en formato vertical (390×844) y horizontal (1280×720), con 7 escenas de 10 segundos cada una (70 segundos en total), subtítulos en español rioplatense claro y archivos por debajo de los 25 MB.

---

### Progreso paso a paso

1. **[Completado] Planificación y guion:** Definición precisa de las 7 escenas según los mensajes requeridos en español rioplatense simple para decisores no técnicos.
2. **[Completado] Entorno técnico y dependencias:** Verificación de Chromium con Playwright 1.48.0; instalación local de `imageio-ffmpeg` (FFmpeg 7.1) sin tocar paquetes del sistema ni permisos de administrador.
3. **[Completado] Diseño visual NEETI de apertura y cierre (Escenas 1 y 7):** Diseñadas en HTML/Canvas/CSS con colores corporativos (#0b1d3a y #fff8dc), tipografías Libre Franklin / Source Serif 4, logotipo de NEETI y animación de partículas y nodos territoriales.
4. **[Completado] Grabación y pruebas de interfaz real (Escenas 2 a 6):** Automatización de navegación real en `https://afm-spec.github.io/mapa-inteligencia-competitiva-argentina/` (cambio de pestañas A a I, panel de filtros con Córdoba y escala de habitantes, apertura de ficha de municipio con datos censales y de empleo, consulta de aduanas H y red eléctrica C, y panel de fuentes al pie junto con `fuentes.html`).
5. **[Completado] Subtítulos:** Generación de overlays de alta resolución con estilo NEETI e implementación del estándar `docs/assets/video-guia.vtt`.
6. **[En ejecución] Renderizado y ensamble de video vertical:** Ejecución del proceso de captura de las 7 escenas y composición con FFmpeg a 30 fps en H.264.

---

### Detalle de escenas y fuentes

- **Escena 1 (Apertura - 10s):** Visual institucional animada con identidad NEETI (#0b1d3a y #fff8dc). *Subtítulo:* «Información pública de 2.314 gobiernos locales en un solo lugar.»
- **Escena 2 (Navegación por secciones - 10s):** Grabación real en el sitio público. Pestaña A -> B (Rutas y fronteras) -> C (Red eléctrica) -> F (Industrias). *Subtítulo:* «Elegí una sección de la A a la I para ver cómo cambian las capas y datos.»
- **Escena 3 (Filtros - 10s):** Grabación real en el sitio público. Apertura de filtros, selección de provincia Córdoba y escala intermedia (50.000 a 200.000 hab.), actualización inmediata de KPIs y mapa. *Subtítulo:* «Filtrá por provincia, región, cantidad de habitantes o distancia.»
- **Escena 4 (Ficha de municipio - 10s):** Grabación real en el sitio público. Centrado en municipio, apertura de popup y ficha modal con población, edad mediana, empleo (PEA) y distancias. *Subtítulo:* «Tocá cualquier municipio para ver su población, edad, empleo y distancias.»
- **Escena 5 (Comercio y energía - 10s):** Grabación real en el sitio público. Consulta de Pestaña H (Aduanas) con detalle en US$ M y Pestaña C (Red eléctrica y estaciones de alta tensión). *Subtítulo:* «Consultá el comercio exterior por aduana y las estaciones de alta tensión.»
- **Escena 6 (Fuentes y método - 10s):** Grabación real en el sitio público. Navegación hacia el bloque «Fuentes de esta pantalla» al pie y visita a la página «Fuentes y método» (`fuentes.html`). *Subtítulo:* «Al pie tenés enlaces para corroborar los datos y la sección de fuentes y método.»
- **Escena 7 (Cierre - 10s):** Visual institucional NEETI con el alcance y advertencia legal/técnica de la herramienta. *Subtítulo:* «Herramienta de análisis preliminar. No reemplaza estudios técnicos ni legales.»

---

### Costos y uso de API de IA

- **Costo incurrido:** $0,00 USD. No se realizaron llamadas facturables ni de pago a APIs de generación de video externas.
- Todas las escenas de interfaz (2 a 6) son grabaciones reales del sitio público tomadas directamente con Playwright, garantizando fidelidad total en textos y datos.
- Las escenas 1 y 7 fueron diseñadas con tecnologías web estándar (HTML5/Canvas) y renderizadas con el mismo motor, garantizando máxima nitidez y estilo exacto de marca NEETI.

---

### Archivos entregables y métricas

- `docs/assets/video-guia.mp4`: 70 segundos, 390×844 (vertical, 30 cuadros por segundo), unos 1,8 MB.
- `docs/assets/video-guia-portada.jpg`: imagen de portada (fotograma de la apertura).
- `docs/assets/video-guia.vtt`: texto de los subtítulos (los subtítulos del video están grabados sobre la imagen).
- `herramientas/video/`: scripts para rehacerlo (`generar_subtitulos_png.py`, `grabar_escenas_vertical.py`) y las escenas de apertura y cierre (`escenas_web/`). Se rehace con `python3 herramientas/video/generar_subtitulos_png.py` y luego `python3 herramientas/video/grabar_escenas_vertical.py`; hace falta Playwright e imageio-ffmpeg (gratuitos, `python3 -m pip install --user playwright imageio-ffmpeg`).

## Revisión posterior (Claude, 12/10/2026)

- Gemini entregó los archivos pero quedó colgado sin cerrar este informe; se lo detuvo y se retiraron los permisos temporales que se le habían dado en su configuración.
- Se corrigieron dos detalles: los subtítulos decían «Escena N» (se quitó) y la apertura traía la frase «Plataforma logística y productiva», que no figura en el sitio (se reemplazó por «Datos abiertos del INDEC y del IGN», que sí figura). Se regrabó el video con esos cambios.
- Se comprobó la duración (70 segundos) y fotogramas de la apertura y de una escena del sitio.
- Las escenas 1 y 7 NO son clips generados por IA: son diseños en HTML animados y grabados con el mismo motor. Las escenas 2 a 6 son grabaciones reales del sitio público (cada vez que se regraba, refleja el estado actual del sitio).
- Costo: Gemini informó 0 dólares y no se usó ningún generador de video de pago.
- No hay versión horizontal (1280×720); sólo vertical.
- Limitación: la resolución es la de un celular (390×844), suficiente para pantalla de celular pero algo blanda a pantalla completa en escritorio.

