# Fuentes mejores para salud, combustibles y electricidad

**Revisión: 12 de octubre de 2026.** El mapa actual tiene 8.311 establecimientos de salud, 5.383 estaciones de servicio y 493 plantas transformadoras, tomadas de capas del IGN. Este informe busca fuentes que agreguen detalle útil antes de reemplazar esas capas.

## Cómo leer esta revisión

Las URL de fichas y descargas de abajo se abrieron con `curl`; se indica el estado HTTP observado. La búsqueda de conjuntos en datos.gob.ar se hizo con su API CKAN (`package_search` y `package_show`), que respondió **200**. Para abrir algunas descargas de `datos.salud.gob.ar` y `datos.energia.gob.ar` fue necesario usar `curl -k`: la conexión llegó y devolvió HTTP 200, pero el equipo no pudo validar la cadena del certificado TLS. Por eso el estado HTTP está comprobado, aunque la validación del certificado de esos servidores no quedó comprobada.

Las fechas de actualización del catálogo describen la ficha o el archivo, no necesariamente el día en que cada registro fue relevado. Cuando el conjunto no informa fecha de relevamiento, se dice expresamente. Los ejemplos son filas reales de los archivos descargados; se omitieron CUIT y otros datos personales.

## 1. Red de salud

### REFES — Registro Federal de Establecimientos de Salud

- **Organismo y ficha:** Ministerio de Salud de la Nación, [Listado de establecimientos asentados en el REFES](https://datos.gob.ar/dataset/listado-establecimientos-de-salud-asentados-en-el-registro-federal-refes) (**HTTP 200**). La búsqueda oficial se hizo en [API CKAN, consulta REFES](https://datos.gob.ar/api/3/action/package_search?q=REFES&rows=10) (**HTTP 200**).
- **Archivo directo:** [REFES, corte 27/12/2024, XLSX](https://datos.salud.gob.ar/dataset/336cf4d9-447a-44c4-8e34-0ba1fc293d55/resource/5d5710df-cf3f-4d91-b9c5-aecab1e06018/download/establecimientos-asistenciales-asentados-registro-federal-refes-20241227.xlsx) (**HTTP 200 con `curl -k`**).
- **Formato y actualización:** XLSX. El archivo se identifica como corte del **27/12/2024**; el recurso fue cargado/actualizado el **06/01/2025** y la ficha del catálogo se modificó el **03/08/2026**. La modificación de la ficha no significa que los datos sean de 2026.
- **Registros:** **38.767** establecimientos (filas de datos, sin encabezado).
- **Campos reales:** `ESTABLECIMIENTO_ID`, `ESTABLECIMIENTO_NOMBRE`, `LOCALIDAD_ID`, `LOCALIDAD_NOMBRE`, `PROVINCIA_ID`, `PROVINCIA_NOMBRE`, `DEPARTAMENTO_ID`, `DEPARTAMENTO_NOMBRE`, `CODLOC`, `CODENT`, `ORIGEN_FINANCIAMIENTO`, `TIPOLOGIA_ID`, `TIPOLOGIA_SIGLA`, `TIPOLOGIA_NOMBRE`, `CP`, `DOMICILIO`, `SITIO_WEB`.
- **Qué aporta:** diferencia origen público o privado y describe la tipología asistencial; por ejemplo, si ofrece atención general, diaria o especializada. Es un detalle mucho más útil que un punto genérico de edificio sanitario. **No es una columna explícita de nivel de complejidad hospitalaria**; hay que usar con cuidado la tipología oficial, sin traducirla a niveles que el archivo no declara.
- **Cobertura:** nacional; incluye provincias y CABA.
- **Ubicación en mapa:** **0 de 38.767** tienen latitud/longitud en columnas. Sí hay localidad, departamento, código postal y domicilio, así que se pueden geocodificar después. No se hizo geocodificación ni se midió cuántos domicilios terminarían ubicados correctamente. El domicilio por sí solo no garantiza un punto exacto.
- **Tres filas de ejemplo:**

  | Establecimiento | Provincia / localidad | Financiamiento | Tipología registrada | Domicilio |
  |---|---|---|---|---|
  | PUESTO EL TORO (17) | Jujuy / El Toro | Provincial | Sin atención médica en forma periódica (menos de 3 veces por semana) | Avenida Lavalle esquina 24 de Octubre |
  | PUESTO BARRO NEGRO (9) | Jujuy / La Mendieta | Provincial | Atención médica general por lo menos 3 días de la semana | Carlos Gardel s/n, Lote Barro Negro |
  | KIN SPORT | Chubut / Comodoro Rivadavia | Privado | Atención médica diaria con especialidades u otras profesiones | Avenida Rivadavia 633 |

- **Comparación con el mapa:** el registro contiene **30.456 filas más** que los 8.311 puntos IGN, pero eso no significa que haya 30.456 establecimientos adicionales: pueden existir diferencias de fecha, definición, estado y duplicados entre fuentes. REFES ofrece clasificación y financiamiento; el IGN ofrece ubicación lista para mapa. Hay que depurar y cruzar antes de reemplazar.

**SISA:** se comprobó que [SISA abre](https://sisa.msal.gov.ar/sisa/) (**HTTP 200**). No se encontró en la parte pública consultada un archivo directo actual de REFES más reciente que el corte 2024 ni una descarga geográfica pública desde SISA. No se afirma que no exista una vía de consulta autenticada.

**Recomendación de salud: sumar REFES primero, luego evaluar reemplazo parcial.** Conservar el IGN como ubicación de referencia; cruzar REFES por identificador/localidad y geocodificar direcciones de forma controlada. Mostrar tipo y financiamiento sólo donde el registro y el cruce sean confiables. No reemplazar toda la capa hasta resolver coordenadas y diferencias de cobertura.

## 2. Combustibles

### Precios en surtidor — Secretaría de Energía

- **Organismo y ficha:** Secretaría de Energía, [Precios en Surtidor — Resolución 314/2016](https://datos.gob.ar/dataset/precios-en-surtidor) (**HTTP 200**). La ficha informa que las bocas de expendio registradas notifican precios cuando cambian.
- **Archivo directo:** [Precios vigentes en surtidor, CSV](http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv) (**HTTP 200 con `curl -k`**).
- **Formato y actualización:** CSV; recurso actualizado el **09/10/2026**. Las filas descargadas corresponden a septiembre de 2026, con fechas de vigencia de precios del mismo mes. La ficha de datos.gob.ar también se actualizó el 09/10/2026.
- **Registros:** **36.649 filas** en el corte consultado. Una fila no equivale a una estación: se repiten por producto y horario. Hay **4.609 `idempresa` distintos** (uso práctico como identificador de boca) y **4.607** tienen latitud y longitud. Puede haber diferencias entre identificadores administrativos y estaciones físicas; se deben revisar antes de publicar el conteo como definitivo.
- **Campos reales:** `indice_tiempo`, `idempresa`, `cuit`, `empresa`, `direccion`, `localidad`, `provincia`, `region`, `idproducto`, `producto`, `idtipohorario`, `tipohorario`, `precio`, `fecha_vigencia`, `idempresabandera`, `empresabandera`, `latitud`, `longitud`, `geojson`.
- **Cobertura:** nacional, con registros de las jurisdicciones argentinas. En el archivo revisado aparecen las provincias y CABA.
- **Ubicación en mapa:** **4.607 de 4.609 bocas distintas** tienen coordenadas; las filas sin coordenadas también suelen incluir domicilio y localidad. No contar las 36.649 filas como estaciones.
- **Tres filas de ejemplo:** las tres corresponden a la misma boca y muestran por qué hay duplicados por producto y turno.

  | Empresa informante | Domicilio | Localidad | Bandera | Producto / turno | Coordenadas |
  |---|---|---|---|---|---|
  | 10 DE SETIEMBRE S.A. | Av. Mosconi 299 | Lomas del Mirador, Buenos Aires | PUMA | Gas Oil Grado 2 / Diurno | -34.658476, -58.529443 |
  | 10 DE SETIEMBRE S.A. | Av. Mosconi 299 | Lomas del Mirador, Buenos Aires | PUMA | Gas Oil Grado 2 / Nocturno | -34.658476, -58.529443 |
  | 10 DE SETIEMBRE S.A. | Av. Mosconi 299 | Lomas del Mirador, Buenos Aires | PUMA | Gas Oil Grado 3 / Diurno | -34.658476, -58.529443 |

- **Comparación con el mapa:** 4.607 bocas con coordenadas, frente a 5.383 puntos IGN (**776 menos**). El conjunto de Energía es más reciente y añade operador, bandera y productos, pero su cobertura observada es menor. Conviene comprobar si la diferencia responde a estaciones cerradas, registros faltantes o criterios distintos.

### Otras fuentes de combustibles revisadas

La búsqueda en la API oficial devolvió [Participación en el mercado por bandera de estaciones de servicio](https://datos.gob.ar/api/3/action/package_search?q=estaciones%20servicio&rows=10) (**HTTP 200**, consulta de catálogo). Es información agregada por bandera/mercado, no un inventario geográfico boca por boca; no sirve para sumar puntos al mapa. La consulta “precios surtidor” también confirmó la ficha de precios (**HTTP 200**).

No se localizó, dentro de la búsqueda verificada, un inventario oficial nacional reciente y descargable que reúna coordenadas de **refinerías, plantas de almacenaje y bocas de expendio** en un solo conjunto. Tampoco se presenta como verificado un registro de operadores fuera del campo `empresa`/`empresabandera` del archivo de precios. Esas capas requieren otra búsqueda específica por organismo/instalación; no se inventan enlaces ni totales.

**Recomendación de combustibles: reemplazar la capa de estaciones del IGN por el padrón geográfico de precios en surtidor, conservando temporalmente los puntos IGN que no tengan correspondencia.** El nuevo archivo trae bandera y coordenadas para 4.607 bocas; primero hay que deduplicar las filas por `idempresa` y validar los 776 puntos IGN que no aparezcan. Para precios, conservar la fecha de vigencia y no confundir la bandera comercial con la razón social operadora.

## 3. Distribución eléctrica

### Edenor — elementos de red y subestaciones

- **Organismo y ficha:** Secretaría de Energía, [Distribución Eléctrica Edenor](https://datos.gob.ar/dataset/distribucion-electrica-edenor) (**HTTP 200**).
- **Archivo directo examinado:** [Subestaciones de alta tensión Edenor, CSV](http://datos.energia.gob.ar/dataset/70f994f6-fde6-4e09-b3a4-72f5f7145181/resource/5ca0accc-cb87-4e4c-83f2-e8b8421b0f15/download/distribucin-elctrica-edenor-at-subestaciones.csv) (**HTTP 200 con `curl -k`**). Recurso fechado **04/05/2017**; la ficha completa fue modificada el **03/08/2026**, pero eso no actualiza el archivo de subestaciones.
- **Formato y registros:** CSV, **363 filas**, todas con punto geográfico en `geojson` y `geom`.
- **Campos reales:** `id`, `descripcion`, `tipo`, `clasificacion`, `tipo_red`, `jurisdiccion`, `geojson`, `geom`.
- **Tres filas de ejemplo:** `18091459 | Entrada AT | TEAT | S | AT Geografico | CABA`; `18091460 | Entrada AT | TEAT | S | AT Geografico | CABA`; `18093500 | Entrada AT | TEAT | S | AT Geografico | CABA`.
- **Cobertura:** red de Edenor en su área metropolitana, no nacional. El campo `jurisdiccion` da una referencia geográfica pero no dibuja el límite concesionado.
- **Comparación con IGN:** los 363 puntos de este archivo se pueden ubicar, pero corresponden a elementos/subestaciones de una red de una distribuidora; no son equivalentes uno a uno a las 493 plantas transformadoras IGN de todo el país.

### Edelap — subestaciones transformadoras AT/MT

- **Organismo y ficha:** Secretaría de Energía, [Distribución Eléctrica Edelap](https://datos.gob.ar/dataset/distribucion-electrica-edelap) (**HTTP 200**).
- **Archivo directo examinado:** [Subestaciones transformadoras AT/MT Edelap, CSV](http://datos.energia.gob.ar/dataset/2e0fe150-8cf4-4707-927d-94bfaf95bb53/resource/33fa6520-f489-4edc-a785-934e0dc385b1/download/distribucin-elctrica-edelap-at-mt-subestaciones-transformadoras.csv) (**HTTP 200 con `curl -k`**). Recurso modificado el **08/10/2026**.
- **Formato y registros:** CSV, **6 filas**, las seis con coordenadas en `geojson` y `geom`.
- **Campos reales:** `matricula`, `clientes`, `potinstala`, `acceso`, `geojson`, `geom`.
- **Tres filas de ejemplo:** `195 | 4.772 clientes | 14.020 | Rta. 36 y Acceso Verónica`; `194 | 7.390 | 22.718 | De La Paz y Formigo`; `099 | 38.441 | 85.910 | 9 y Camino Belgrano`. La unidad de `potinstala` no se deduce del encabezado y no se le asigna una unidad aquí.
- **Cobertura:** red de Edelap, de alcance local/provincial, no nacional. Las coordenadas acotan los puntos publicados, pero la tabla no identifica por sí sola la lista completa de municipios cubiertos.
- **Comparación con IGN:** son sólo 6 puntos de una empresa y una categoría de tensión; no sustituyen los 493 puntos nacionales.

### Estaciones transformadoras de alta tensión — Secretaría de Energía

- **Ficha:** [Transporte Eléctrico AT: Estaciones Transformadoras](https://datos.gob.ar/dataset/transporte-electrico-at-estaciones-transformadoras) (**HTTP 200**, ficha ya documentada en `docs/fuentes.html`).
- **Descarga directa:** [CSV nacional](http://datos.energia.gob.ar/dataset/5ae5fbf9-5ab3-407b-a047-625bf27835aa/resource/cedb62c4-4a4c-4124-bdc9-48f611a59862/download/transporte-elctrico-at-estaciones-transformadoras.csv) (**HTTP 200**).
- **Actualización:** catálogo y descarga consignados en la documentación del proyecto como actualizados el **05/10/2026**.
- **Formato y registros:** CSV, **323 filas**. Las 323 tienen geometría puntual en GeoJSON.
- **Campos reales:** `nombre`, `id`, `propiedad`, `concesion`, `potencia_instalada_mv`, `fecha_puesta_servicio`, `tension_entrada`, `tension_salida`, `geojson`, `geom`.
- **Tres filas de ejemplo:** `RIO TURBIO | RT | CENTRAL TÉRMICA RÍO TURBIO | TRANSPA S.A. | 400 | 220 | 13.2 | 33`; `EL CALAFATE | CE | SPSE TI | TRANSPA S.A. | 30 | 132 | 13.2 | 33`; `FUTALEUFU | FU | TRANSPA S.A. | TRANSPA S.A. | 30 | 330 | 132 | 330`. Los números de potencia se reproducen como figuran en `potencia_instalada_mv`; el conjunto los llama potencia instalada, no potencia disponible.
- **Cobertura:** puntos de alta tensión distribuidos en varias regiones y jurisdicciones. La tabla no trae provincia como columna; se obtiene mediante el punto y los límites geográficos. No es una lista completa de todas las subestaciones de distribución.
- **Comparación con IGN:** 323 ubicables frente a 493 puntos IGN (**170 menos**). La Secretaría agrega propietario, concesión, tensiones y potencia instalada; no informa margen libre para conectar nueva demanda.

### Áreas de concesión y cobertura

Las fichas de Edenor y Edelap y sus CSV están abiertas y comprobadas, pero **no se encontró ni verificó una descarga directa nacional de polígonos de concesión** para Edenor, Edesur, Edelap y las distribuidoras provinciales. Las tablas de estaciones describen puntos de red, no el área atendida completa. El catálogo de datos de Energía lista también una ficha de [Edesur](https://datos.gob.ar/dataset/distribucion-electrica-edesur) (**HTTP 200**); en los recursos inspeccionados aparecen redes y elementos, pero no quedó validado un CSV directo de subestaciones equivalente a Edenor/Edelap.

Por lo tanto, la cobertura conocida en este inventario es: **Edenor**, servicio metropolitano en CABA y zona norte/oeste del Gran Buenos Aires; **Edelap**, área local de La Plata y alrededores; **Edesur**, servicio metropolitano en CABA y zona sur del Gran Buenos Aires. Para mapear el contorno exacto de cada concesión y completar las distribuidoras provinciales, se requiere una fuente oficial de ENRE/entes provinciales con límites descargables. No se infiere el polígono a partir de puntos sueltos.

**Recomendación de electricidad: sumar primero las subestaciones de distribución publicadas y mantener la capa IGN nacional; no reemplazarla por Edenor/Edelap.** Agregar cada conjunto como capa separada con empresa, fecha y nivel de tensión. La red de alta tensión nacional de Energía puede complementar a IGN, pero representa otra clase de infraestructura. Para cobertura de distribuidoras hace falta conseguir o verificar los polígonos de concesión de ENRE y entes provinciales; para conocer capacidad disponible por subestación, estos archivos no alcanzan.

## Qué queda sin verificar

- No se halló un archivo REFES más nuevo que el corte de diciembre de 2024 en la publicación abierta examinada. SISA abrió, pero no se comprobó una descarga geográfica pública actual.
- No se hizo geocodificación de las direcciones del REFES ni se calculó su tasa de éxito.
- Los precios en surtidor contienen operadores y banderas, pero el archivo tiene filas repetidas por producto y horario y el total de identificadores no debe tomarse sin control como total definitivo de estaciones físicas.
- No se verificó un conjunto abierto y nacional de refinerías y plantas de almacenaje con campos, fecha, cobertura y coordenadas.
- No se verificaron polígonos descargables de concesión ni inventarios comparables de subestaciones para todas las distribuidoras. Tampoco se pudo producir una comparación homogénea entre los 493 puntos IGN y los inventarios de empresas, que tienen alcances y definiciones distintos.
- Algunos servidores de descargas respondieron HTTP 200 sólo al desactivar la verificación TLS de `curl`; queda pendiente una comprobación con certificados confiables desde otra conexión o equipo.
