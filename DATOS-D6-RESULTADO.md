# D6 · Fronteras: resultado de auditoría

## Resultado

Se revisaron los 104 objetos de `capa_limites_internacionales.json`. El campo `gna` identifica cinco vecinos: Paraguay (70 objetos), Chile (17), Uruguay (7), Brasil (4) y Bolivia (3). Hay además dos objetos sin valor (`gna` vacío) y uno marcado `-2`. El objeto `-2` (gid 40691) tiene una caja geográfica que abarca de −90° a −25° de latitud y de −74° a −60° de longitud; no es un tramo local que pueda asignarse con seguridad a un país. Los dos objetos vacíos se ubican en el sector del Río de la Plata, pero cercanía sola no basta para asignarlos a Uruguay.

El servicio WFS del IGN no respondió a dos intentos de `GetCapabilities` (curl: tiempo agotado, HTTP 000). Por eso no se bajó hidrografía ni se calcularon intersecciones. No se publica una división río/seco: faltan los datos necesarios para verificarla. El archivo v2 deja esos kilómetros como sin clasificar y marca `confiable_separacion: false`.

| País | Km de límite | Río | Seco | Sin clasificar | % río | Control esperado |
|---|---:|---:|---:|---:|---:|---|
| Bolivia | 858,6 | — | — | 858,6 | — | Mixto: sin comprobar |
| Brasil | 1.284,4 | — | — | 1.284,4 | — | Mixto: sin comprobar |
| Chile | 7.096,6 | — | — | 7.096,6 | — | Casi todo terrestre: sin comprobar |
| Paraguay | 2.515,5 | — | — | 2.515,5 | — | Mayormente fluvial: sin comprobar |
| Uruguay | 510,5 | — | — | 510,5 | — | Casi todo fluvial: sin comprobar |
| **Total identificado** | **12.265,6** | — | — | **12.265,6** | — | — |
| Sin país identificado (−2) | 9.395,5 | — | — | 9.395,5 | — | Sin asignación segura |

Los dos objetos vacíos suman aproximadamente 249 km de trazado según el método geográfico del script y no se mezclan con los países. Sumados al total identificado, elevan el total continental representado a unos 12.514,6 km; queda unos 2.914,6 km por encima del intervalo de control de 9.400–9.600 km. El `-2` no se suma al total continental: su caja incluye territorio antártico y no describe una frontera terrestre de un solo país. Las longitudes por vecino siguen excedidas respecto de referencias conocidas; unir geometrías coincidentes dentro de cada país sólo cambió Chile de 7.097,0 a 7.096,6 km. No hay evidencia en la capa que permita decidir qué objetos son duplicados y cuáles son tramos distintos, así que no se descartaron objetos por conjetura.

## Archivos actualizados

- `herramientas/procesar_limites.py`: reúne trazados coincidentes dentro de cada país y genera el formato v2. Mantiene `-2` y objetos sin país separados; deja río/seco sin clasificar.
- `docs/datos/limites_km.json`: salida v2 regenerada desde los datos originales disponibles.

## Límites de esta revisión

La descarga de hidrografía por WFS no fue posible desde este entorno (HTTP 000; no llegó respuesta HTTP). Por eso no se pudieron probar tolerancias de 150–500 m ni medir paralelismo con cursos de agua perennes. Tampoco se reasignó `-2`: su geometría no permite inferir un país vecino de manera segura. Hace falta que el WFS responda y revisar la capa original con una proyección métrica adecuada antes de publicar longitudes fiables o una clasificación por tipo de frontera.

La salida v2 es una auditoría conservadora, no satisface el objetivo de reconciliar longitudes. Se deja `confiable_separacion: false` para que el sitio no presente como comprobada una separación que no se pudo calcular.
