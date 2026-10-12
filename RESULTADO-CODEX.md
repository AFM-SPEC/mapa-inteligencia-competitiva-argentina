# Resultado

## Qué cambió

- La capa de parques conserva los 606 puntos del Senado y agrega, en cada ficha de datos, de qué fuente proviene y si también figura en el RENPI o en el registro bonaerense.
- El cruce encontró 234 coincidencias con RENPI y 78 con el registro de Buenos Aires. Como las nuevas fuentes no aportan ubicaciones suficientes para agregar puntos confiables, los indicadores por municipio siguen calculados con las 606 ubicaciones existentes.
- Se recalcularon `d_parque`, `parque` y `parq30` en `docs/datos/municipios.json` con esas ubicaciones.
- La pantalla F ahora explica el cruce y sus límites. Se actualizaron sus fuentes, el inventario y las brechas en `docs/fuentes.html`.
- Se creó `herramientas/unificar_parques.py`. Descarga RENPI y el archivo bonaerense, normaliza nombres y compara nombre y provincia. Se puede volver a ejecutar después de regenerar las capas originales.
- Se subió la versión de `app.js` y `widgets.js` a `?v=23` en `docs/index.html`.

## Fuentes nuevas comprobadas

- [Registro Nacional de Parques Industriales (RENPI), ficha y descarga](https://datos.gob.ar/dataset/registro-nacional-de-parques-industriales-renpi). La planilla descargada contiene nombre y provincia, no coordenadas. Se encontraron 362 registros utilizables.
- [Agrupamientos industriales aprobados de Buenos Aires, archivo CSV](https://catalogo.datos.gba.gob.ar/dataset/348dddc1-9578-4fad-9349-6b8bb72630dc/resource/0945236f-6aea-4ff3-8899-41c347c2b0f9/download/agrupamientos-industriales-aprobados-por-decreto-2026.csv). Informa denominación y municipio, pero no dirección exacta ni coordenadas. Se descargaron 100 filas.
- [Servicio cartográfico WMS de Santa Fe (IDESF)](https://aswe.santafe.gov.ar/idesf/wms?service=WMS&request=GetCapabilities). El servicio responde y anuncia una capa llamada “Parques y Áreas Industriales”. No pude confirmar una descarga directa de sus objetos geográficos para incorporarlos.

Las direcciones de descarga usadas se comprobaron con `curl` antes de incluirlas. El KML del Senado ya estaba en `datos-origen/parques.kml`; no se encontró un enlace oficial estable para citarlo.

## Qué quedó pendiente

- Siete registros bonaerenses no se pudieron ubicar: la fuente solo da el municipio y no una dirección o coordenada. No se colocaron en el centro del municipio porque eso daría una ubicación inventada.
- No se incorporaron conjuntos descargables de Entre Ríos, Córdoba ni Mendoza. La búsqueda no confirmó una fuente provincial abierta con archivos de parques que se pudieran procesar. Santa Fe tiene la capa geográfica publicada por WMS, pero no quedó descargada en esta tarea.
- El catálogo bonaerense actualiza el recuento de coincidencias, pero no permite agregar siete parques a la capa cartográfica. Las marcas visibles siguen siendo los 606 puntos del Senado.
- No se completó la revisión visual de A, C, F y H ni de `fuentes.html` en 390×844, 768×1024 y 1280×800. Se inició el servidor local, pero Chromium se cerró con un error del sistema antes de cargar el sitio. Por eso no pude observar desbordes ni hacer correcciones visuales basadas en pantalla.


## Revisión posterior (Claude, 12/10/2026)

- Se corrigió un problema del trabajo de Codex: los datos nuevos de cada parque se agregaron al final y los gráficos por provincia esperan que el último dato sea el código de provincia. Ahora el código vuelve a quedar al final, y el script `unificar_parques.py` se puede correr dos veces seguidas sin perder datos (se probó).
- La revisión visual que Codex no pudo hacer se hizo a mano para las pantallas A, C, F y H en 768×1024 y 1280×800 (y las de celular ya estaban revisadas): sin desbordes horizontales, sin gráficos rotos y sin errores en la consola.
- Se comprobaron los tres enlaces nuevos (RENPI, CSV de Buenos Aires y servicio de Santa Fe): abren. De Santa Fe sólo se confirmó que el servicio anuncia la capa; sus parques no se incorporaron.
