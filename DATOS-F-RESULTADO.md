# Resultado del encargo F · Capas de combustibles, salud y electricidad

Fecha: 12/10/2026

Se agregaron los datos procesados y tres scripts reproducibles. No se modificaron archivos de pantalla ni se hizo commit o push. Los originales descargados quedaron en `datos-origen/`, que no se sube a GitHub.

## F1 · Combustibles

Se descargó el [CSV de precios en surtidor](http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv) con `curl -k`: **HTTP 200**. El archivo trae 36.649 filas y los campos esperados, entre ellos `idempresa`, `empresa`, `direccion`, `localidad`, `provincia`, `empresabandera`, `latitud` y `longitud`.

Se tomó una fila por cada uno de los 4.609 identificadores de boca. Dos no tenían coordenadas utilizables dentro del país. Resultado: **4.607 bocas de Energía**, **1.214 puntos IGN conservados** por no tener una boca de Energía a menos de 300 metros, **5.821 puntos en total**. El código de provincia quedó como último elemento de cada fila. La capa conserva el nombre de empresa y marca su fuente como “Energía” o “IGN”.

Las diez banderas más frecuentes entre las bocas de Energía son:

| Bandera | Bocas |
|---|---:|
| YPF | 1.559 |
| SHELL C.A.P.S.A. | 896 |
| BLANCA | 895 |
| AXION | 542 |
| PUMA | 401 |
| DAPSA S.A. | 126 |
| GULF | 93 |
| REFINOR | 59 |
| VOY | 34 |
| SIN EMPRESA BANDERA | 1 |

Se recalculó `est10` para los 2.314 gobiernos locales contando puntos a 10 km o menos. No se alteraron los demás campos de `municipios.json`.

## F2 · Salud

Se descargó el [XLSX del REFES, corte 27/12/2024](https://datos.salud.gob.ar/dataset/336cf4d9-447a-44c4-8e34-0ba1fc293d55/resource/5d5710df-cf3f-4d91-b9c5-aecab1e06018/download/establecimientos-asistenciales-asentados-registro-federal-refes-20241227.xlsx) con `curl -k`: **HTTP 200**. La hoja principal tiene 38.767 establecimientos y los campos previstos. Se leyó con `openpyxl`, ya instalado; no se instaló nada.

Se compararon provincia y departamento con `departamentos_censo.json`, y luego los nombres dentro del mismo departamento. Para aceptar un cruce se exigió que, al quitar tildes, mayúsculas y términos genéricos, las palabras coincidieran en alto grado y que hubiera una única candidata clara. En CABA, donde algunos códigos administrativos REFES no coinciden con el código geográfico del mapa, se usó sólo la coincidencia exacta del nombre de la comuna; el resto de los códigos se validó directamente. No se geocodificaron domicilios.

Se cruzaron con certeza **3.318 establecimientos**: **8,56 %** de los 38.767 del REFES y **39,92 %** de los 8.311 puntos IGN. `capa_salud_refes.json` tiene 8.311 posiciones paralelas a la capa IGN; las posiciones sin cruce seguro son `null`. `salud_refes_resumen.json` reúne totales y cantidades por departamento, tipología y origen de financiamiento, además del número cruzado.

Muestra de diez cruces elegidos al azar con semilla fija. En todos, el nombre normalizado tuvo coincidencia completa y una sola candidata en el departamento:

| REFES | Punto IGN | Departamento | Evaluación |
|---|---|---:|---|
| Centro de Salud Ciudad Nueva | Centro de Salud Ciudad Nueva | 82042 | Clara |
| Centro de Salud N° 63 - Barrio Parque República | Centro de Salud N° 63 Barrio Parque República | 14014 | Clara |
| Hospital Nuestro Señor de la Buena Esperanza (8) | Hospital Nuestro Señor de la Buena Esperanza | 38063 | Clara |
| Hospital de Autogestión - Dr. Fermín de la Colina | Hospital de Autogestión Doctor Fermín de la Colina | 14140 | Clara |
| Establecimiento Asistencial Dr. Diego B. Morón | Establecimiento Asistencial Doctor Diego B. Morón | 42007 | Clara |
| Hospital Los Frentones | Hospital Los Frentones | 22007 | Clara |
| Centro de Salud Las Angustias | Centro de Salud Las Angustias | 62042 | Clara |
| Centro de Salud Villa Don Alberto | Centro de Salud Villa Don Alberto | 22140 | Clara |
| Puesto Sanitario Corralito | Puesto Sanitario Corralito | 66056 | Clara |
| Puesto Sanitario Villa Mercedes | Puesto Sanitario Villa Mercedes | 66147 | Clara |

Límites: el REFES tiene corte de diciembre de 2024, el total puede diferir de los puntos IGN por fecha, cobertura y definición. El archivo no informa nivel de complejidad hospitalaria. Los cruces dudosos se dejaron sin completar; esto puede omitir coincidencias verdaderas.

## F3 · Distribuidoras eléctricas

Se descargaron y comprobaron los dos CSV con `curl -k`, ambos con **HTTP 200** y la cantidad de filas prevista:

- [Edenor, subestaciones de alta tensión](http://datos.energia.gob.ar/dataset/70f994f6-fde6-4e09-b3a4-72f5f7145181/resource/5ca0accc-cb87-4e4c-83f2-e8b8421b0f15/download/distribucin-elctrica-edenor-at-subestaciones.csv): **363 filas**.
- [Edelap, subestaciones transformadoras AT/MT](http://datos.energia.gob.ar/dataset/2e0fe150-8cf4-4707-927d-94bfaf95bb53/resource/33fa6520-f489-4edc-a785-934e0dc385b1/download/distribucin-elctrica-edelap-at-mt-subestaciones-transformadoras.csv): **6 filas**.

Se generaron capas separadas: `capa_distribucion_edenor.json` (363 puntos: 272 en provincia de Buenos Aires y 91 en CABA) y `capa_distribucion_edelap.json` (6 en provincia de Buenos Aires). Se comprobó cada punto contra los límites departamentales ya procesados; las provincias coinciden. Se conservó el detalle de red, clientes, potencia o acceso tal como aparece en cada CSV, sin agregar unidades no declaradas. Son inventarios de esas empresas y zonas solamente; no reemplazan la capa nacional del IGN.

La ficha de [Edesur](https://datos.gob.ar/dataset/distribucion-electrica-edesur) abrió con **HTTP 200**. También respondió **HTTP 200** la consulta de recursos de la [API del catálogo](https://datos.gob.ar/api/3/action/package_show?id=distribucion-electrica-edesur). Los CSV listados corresponden a líneas, postes, salidas, empalmes y líneas de media tensión; no se encontró una descarga de subestaciones equivalente. Por eso no se generó una capa Edesur.

## Archivos y verificación

- Datos: `docs/datos/capa_estaciones_servicio.json`, `docs/datos/capa_salud_refes.json`, `docs/datos/salud_refes_resumen.json`, `docs/datos/capa_distribucion_edenor.json`, `docs/datos/capa_distribucion_edelap.json` y `docs/datos/municipios.json` (sólo cambió `est10`).
- Scripts: `herramientas/procesar_combustibles.py`, `herramientas/procesar_salud_refes.py` y `herramientas/procesar_distribucion.py`.
- Los cuatro servidores de descargas de Energía y Salud respondieron **HTTP 200 usando `curl -k`**. Esto desactivó la validación del certificado TLS. Se inspeccionaron encabezados/filas del CSV y hoja/campos del XLSX antes de procesarlos.
- No se pudo verificar el certificado TLS de esos servidores durante esta descarga. No se encontró un CSV equivalente de subestaciones de Edesur.
