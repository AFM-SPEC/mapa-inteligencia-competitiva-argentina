# Misión: datos argentinos equivalentes al Mapa MIC de Paraguay

Estado al 12/10/2026 (segunda sesión). Pedido del usuario: localizar, verificar y documentar fuentes argentinas para cinco capas del Mapa MIC (https://www.mic.gov.py/mapamic/):
1. Edad mediana por municipio. 2. Población económicamente activa (PEA) por municipio. 3. Potencia eléctrica disponible por subestación. 4. Importaciones y exportaciones por aduana. 5. Parques industriales. (Más: POUT.)

Reglas: no concluir de entrada que no existen; no inventar URLs ni valores; no confundir MVA instalados con MW disponibles, aduana con paso fronterizo, municipio con departamento, parque con establecimiento industrial, empleo registrado con PEA.
Clasificación: A abierto directo · B abierto con procesamiento · C reconstruible integrando fuentes · D público pero requiere solicitud · E no localizado tras investigación documentada.
Entregables: (1) inventario de URL con verificación, (2) matriz de equivalencia MIC-Argentina, (3) procedimiento de extracción, (4) georreferenciación, (5) brechas y a qué organismo pedir, (6) priorización.

IMPORTANTE: en esta sesión la terminal SÍ llegó con curl a casi todo (ARCA, INDEC, datos.gob.ar, infra.datos.gob.ar, datos.energia.gob.ar). datos.gob.ar volvió a funcionar (API CKAN: https://datos.gob.ar/api/3/action/package_search?q=...). Probar siempre curl antes de usar el navegador.

## HECHO en esta sesión

### 1 y 2. Edad mediana y PEA — nivel departamento (hecho, ya en municipios.json)
- Script `herramientas/procesar_censo_dptos.py`: asigna cada gobierno local a su departamento (punto en polígono, IGN) y agrega a `docs/datos/municipios.json` los campos: `dp` `dpn` (departamento), `dpm` (dentro/cercano), `ngl` (cuántos gobiernos locales hay en ese departamento), `dex` (1 = dato exacto: partidos de Buenos Aires y CABA, donde partido = municipio), `em` (edad mediana del departamento), `pea_t` (tasa de actividad %), `des_t` (desocupación %), `pea` (PEA: exacta si `dex`=1, estimada si no = población municipal × tasa de actividad del departamento × 14+/población). También `docs/datos/departamentos_censo.json` (529 departamentos).
- TODAVÍA NO SE MUESTRA EN LA PANTALLA (falta app.js / widgets.js; rotular «del departamento» o «estimada»).

### HALLAZGO CLAVE: dato municipal exacto por radio censal (clase B)
- INDEC publica el Censo 2022 agregado por RADIO CENSAL, en formato largo, por provincia: https://infra.datos.gob.ar/catalog/indec/dataset/48/distribution/48.N/download/NN-provincia-2022.zip (lista completa de las 24 en `herramientas/referencias/urls_radios_por_provincia.json`; N = 2 a 25 aprox.). Cada zip trae `-persona.csv`, `-hogar.csv`, `-vivienda.csv` con columnas: codigo (radio), cod_prov, provincia, cod_dep, departamento, fraccion, radio, cod_variable, cod_categoria, categoria, cantidad.
- Variables útiles (probado con Catamarca): `PERSONA_EDAD` (edad simple, 109 categorías: cod_categoria = años), `PERSONA_CONDACT` (1 Ocupado, 2 Desocupado, 3 Inactivo; población de 14+; PEA = 1+2), `PERSONA_EDADGRU`, `PERSONA_LETRA` (rama de actividad), `PERSONA_MNI` (nivel educativo), `PERSONA_P30` (categoría ocupacional), etc.; `HOGAR_NBI_TOT`, `HOGAR_H14` (agua), etc.
- El archivo `-vivienda.csv` trae `VIVIENDA_CODGL` (código de GOBIERNO LOCAL de 6 dígitos, p.ej. 100014 La Puerta) con la cantidad de viviendas por radio ⇒ permite asignar radios a gobiernos locales (si un radio cae en dos gobiernos locales, repartir las personas en proporción a las viviendas). También `VIVIENDA_CODLOC` (localidad) y `VIVIENDA_CODAGLO` (aglomerado).
- Pendiente: script `herramientas/procesar_radios.py` que baje las 24 provincias, calcule por gobierno local la edad mediana (de PERSONA_EDAD) y la PEA/tasa de actividad/desocupación (de PERSONA_CONDACT), y VALIDE contra el dato oficial de los departamentos (censo_edad_actividad_completo.json) antes de usarlo. Rotular «calculado a partir de radios censales; radios compartidos repartidos por viviendas». Los códigos de VIVIENDA_CODGL deberían coincidir con el campo `c` de municipios.json (probar).
- Otros recursos del mismo conjunto: radios con geometría (https://infra.datos.gob.ar/catalog/indec/dataset/50/distribution/50.1/download/radios-censales-2022.csv, 131 MB, WKT; .geojson 50.2; .zip shp 50.3), códigos geográficos (https://www.indec.gob.ar/ftp/cuadros/geoestadistica/c2022_codigos_gobiernos_locales.xlsx), definiciones (…/48.30/download/Redatam_definicion_de_indicadores.pdf).
- REDATAM web (https://redatam.indec.gob.ar) no hace falta para esto.

### 4. Aduanas (clase B, muy buena)
- ARCA publica por mes, desde 02/2017 hasta 09/2026, «Información de comercio exterior» con detalle por ADUANA: https://www.arca.gob.ar/operadoresComercioExterior/informacionAgregada/informacion-agregada.asp ; descarga: `…/informacionAgregada/download.aspx?filename=AAAAMM.zip` (≈160 MB; octubre y diciembre de 2026 aún vacíos). Cada zip: `impo_AAAAMM.lst` (5,7 GB, un renglón por ítem y concepto arancelario ⇒ hay que contar el ítem una sola vez; incluye nombre del importador, NO publicarlo), `expo_agregado_AAAAMM.lst` (1 MB: aduana, NCM, país, medio, kg, FOB), `total_expo_agregado_AAAAMM.lst`. Separador: apóstrofo ('). Manual: https://www.arca.gob.ar/operadoresComercioExterior/documentos/Procedimiento-descarga-y-lectura-archivos-de-ComExAFIP-2018.pdf. Nueva norma: Disposición ARCA 219/2025.
- Tabla de códigos de aduana (68 códigos, incluye zonas francas 253–275): ANEXO IV en https://www.arca.gob.ar/Aplicativos/oProgramasAduaneros/prestadores/rg1452.zip (copiada a `datos-origen/aduanas_codigos_ARCA.csv`; países en `paises_codigos_ARCA.csv`; medios de transporte: 1 propios medios, 2 avión, 3 ferrocarril, 4 camión, 5 arreo, 6 jangada, 7 oleoducto/gasoducto, 8 acuático, 9 conductor eléctrico, A postal, H hidrovía).
- Script `herramientas/procesar_aduanas.py AAAAMM …` (baja el zip, lo resume leyendo directo del .zip, guarda `datos-origen/aduanas_mensual/AAAAMM.json` y borra el zip). Se lanzaron los 12 meses 202510–202609 en 3 procesos en segundo plano (tardan ~1 h en total). Revisar `datos-origen/aduanas_mensual/`; si faltan meses, volver a correr el comando (saltea los ya hechos). Logs: /tmp/ad1.log, ad2.log, ad3.log.
- Interpretación de columnas de importación (a confirmar con el PDF del manual): FOB_DOLAR = valor del ítem en dólares, FOB_TOTAL = total de la destinación (por eso no se suma).
- Falta: (a) unir con ubicación de cada aduana (68 códigos → coordenadas; el IGN sólo tiene 10 puntos; la ubicación se puede reconstruir con la ciudad del nombre: BAHIA BLANCA, ROSARIO, etc.; las zonas francas con la capa de zonas francas del Senado), (b) armar `docs/datos/aduanas_comercio.json`, (c) mostrar en sección H (Aduanas) e I.
- Distinguir: aduana de registro de la destinación ≠ lugar de paso fronterizo.

### 3. Subestaciones (clase B para potencia INSTALADA; clase D/E para potencia DISPONIBLE)
- datos.gob.ar «Transporte Eléctrico AT Estaciones Transformadoras» (Secretaría de Energía, actualizado 05/10/2026): CSV http://datos.energia.gob.ar/dataset/5ae5fbf9-5ab3-407b-a047-625bf27835aa/resource/cedb62c4-4a4c-4124-bdc9-48f611a59862/download/transporte-elctrico-at-estaciones-transformadoras.csv ; SHP …/resource/669e80b9-6d4b-45cc-ba96-60ffc2fcfa5d/download/transporte-elctrico-at-estaciones-transformadoras.zip. Copia local: `datos-origen/estaciones_transformadoras_AT.csv` (323 estaciones). Campos: nombre, id, propiedad, concesion (Transener, Transba, Transnoa, Transpa, Transnea, Distrocuyo, EPEN…), potencia_instalada_mv (80 vacías; suma 33.013; probablemente MVA — confirmar con metadatos), fecha_puesta_servicio (107 vacías), tension_entrada, tension_salida, coordenadas (geojson MultiPoint).
- NO es potencia disponible. Rotular «potencia instalada (MVA)».
- Otros conjuntos de la Secretaría de Energía (por ver/usar): líneas AT y estructuras AT (mismas páginas «transporte-electrico-at-lineas», «…-estructuras»), centrales de generación (CSV/SHP, actualizado 22/09/2026), Edelap y Edenor (subestaciones AT/MT de distribuidoras, formato CSV/SHP), CAMMESA en datos.energia.gob.ar (potencia instalada, disponibilidad por central, demanda, agentes del MEM), mapas PDF de generación y transporte por región.
- Potencia DISPONIBLE (MW libres para nueva demanda): no se encontró publicación abierta. Posibles vías: CAMMESA (informes de capacidad de transporte / estudios de acceso al MEM), ENRE (ENReGE), transportistas (Transener, Transba…), distribuidoras. Buscar más antes de declarar clase E; mientras tanto, es D.

### 5. Parques industriales
- Ya en el mapa de datos: 606 parques del mapa del Senado (24/06/2024) en `docs/datos/capa_parques.json`. Falta: zonas francas (capa_zonas_francas.json salió vacía: sacar las coordenadas de la geometría Point del KML, no de los campos), y mostrar la capa en pantalla.
- RENPI en datos.gob.ar: https://cdn.produccion.gob.ar/cdn-secind/rempi-datos-abiertos/base-rempi-para-publicar.ods (actualizado 29/08/2023; planilla nombre/provincia, sin coordenadas; informes regionales en argentina.gob.ar/sites/default/files/informe_no_1_-_*.pdf advierten problemas de cobertura y actualización y que se prevé un Censo Nacional de Parques Industriales). Falta cruzar con el Senado por nombre/localidad.
- Pendiente: Buenos Aires (catalogo.datos.gba.gob.ar/dataset/parques-industriales, con coordenadas), Entre Ríos, Córdoba, Santa Fe, Mendoza y demás.

### 6. POUT
- Sin registro nacional abierto localizado; Mendoza informa 15 de 18 departamentos con plan. El buscador de datos.gob.ar con «ordenamiento territorial» no devuelve nada útil. Pendiente buscar por provincia.

## Orden sugerido para seguir
1. Revisar que los 12 meses de aduanas terminaron; armar `docs/datos/aduanas_comercio.json` y la pantalla.
2. `procesar_radios.py` (edad mediana y PEA municipales exactas) + validación contra departamentos; reemplazar las cifras «del departamento».
3. Capa de estaciones transformadoras (323, con kV y MVA) en la sección C; reemplaza/complementa la de 493 puntos del IGN.
4. Mostrar parques, zonas francas, edad mediana y PEA en la interfaz (docs/app.js, docs/widgets.js).
5. Cruzar RENPI y registros provinciales de parques.
6. Documento final: inventario de URL, matriz de equivalencia, procedimiento, georreferenciación, brechas y priorización (podría ir como página dentro del sitio y en este repo).
7. Subir a GitHub (rama main, carpeta docs/).

## Pendiente de aclarar con el usuario
Hostinger lo vinculó a Claude; en esta sesión aparece como herramienta de correo («Hostinger Mail»), no de alojamiento web. Confirmar si es lo que esperaba.
