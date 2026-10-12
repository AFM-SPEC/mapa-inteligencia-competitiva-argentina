MISIÓN: Localizar todos los datos argentinos equivalentes a MAPA MIC Paraguay

Actuá como investigador senior especializado en datos públicos argentinos, estadísticas territoriales, infraestructura eléctrica, comercio exterior, sistemas de información geográfica y desarrollo industrial.

Objetivo: identificar, verificar y documentar todas las fuentes argentinas que permitan replicar las siguientes capas de https://www.mic.gov.py/mapamic/:

1. Edad mediana por municipio.
2. Población económicamente activa por municipio.
3. Potencia eléctrica disponible por subestación.
4. Importaciones y exportaciones por aduana.
5. Parques industriales.

REGLA FUNDAMENTAL

No aceptes como conclusión inicial que estos datos no existen.

Investigá exhaustivamente antes de determinar si una variable está disponible, puede calcularse, requiere integrar varias fuentes o no cuenta con información pública suficiente.

Tu misión no es solamente encontrar páginas web. Debés localizar los datos concretos y determinar cómo extraerlos, procesarlos, georreferenciarlos e integrarlos.

ETAPA 1. INVENTARIO NACIONAL DE FUENTES

Investigá sistemáticamente:

- INDEC, Censo 2022, REDATAM y documentación censal.
- Secretaría de Energía, CAMMESA, ENReGE (ex ENRE), transportistas y distribuidoras eléctricas.
- ARCA, Dirección General de Aduanas y estadísticas de comercio exterior.
- Registro Nacional de Parques Industriales (RENPI).
- Instituto Geográfico Nacional (IGN).
- API Georef, REFEGLO y datos.gob.ar.
- Ministerios nacionales y organismos descentralizados.
- Los gobiernos de las 23 provincias y CABA.
- Direcciones provinciales de estadística.
- Entes reguladores provinciales.
- Infraestructuras provinciales de datos espaciales.
- Portales provinciales de datos abiertos.
- Registros provinciales de parques industriales.
- Universidades públicas y publicaciones técnicas oficiales.

Investigá también portales históricos, bases de datos institucionales, geoservicios, APIs, directorios de descargas y documentos técnicos.

No te limites a los primeros resultados de los buscadores.

ETAPA 2. INVESTIGACIÓN POR VARIABLE

A. Edad mediana y población económicamente activa

Partí de:

https://redatam.indec.gob.ar/

https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165?lang=es

https://www.indec.gob.ar/ftp/cuadros/poblacion/censo2022_indicadores_demograficos.pdf

https://www.indec.gob.ar/ftp/cuadros/poblacion/censo2022_caracteristicas_economicas.pdf

https://www.argentina.gob.ar/georef/descarga-de-la-base-completa

Investigá:

- Indicadores publicados directamente.
- Tabulados del Censo 2022.
- Variables EDAD y CONDACT de REDATAM.
- PEA ocupada y desocupada.
- Edad simple y edad mediana.
- Códigos oficiales de gobiernos locales.
- Diferencias entre municipio, gobierno local, localidad y departamento.
- Cómo obtener valores para los municipios que no coinciden con departamentos.
- Posibilidad de agregación de radios censales a límites municipales.
- Descargas masivas y procedimientos reproducibles.

No confundas empleo registrado con población económicamente activa total.

B. Potencia disponible por subestación

Partí de:

https://datos.gob.ar/dataset/energia-transporte-electrico-at-estaciones-transformadoras

https://datos.gob.ar/dataset/energia-mapas-generacion-transporte-electrico

https://www.argentina.gob.ar/enre/solicitudes-de-accesos-ampliaciones-y-certificados

https://cammesaweb.cammesa.com/informes-y-estadisticas/

https://www.enre.gov.ar/web/inf.nsf/%28wRegAmpliacionesp%29

Buscá para cada estación:

- Nombre y código.
- Coordenadas.
- Empresa operadora.
- Tensión de entrada y salida (kV).
- Potencia instalada (MVA).
- Potencia máxima demandada (MW).
- Demanda pico registrada.
- Capacidad remanente.
- Capacidad efectiva disponible para nuevas conexiones.
- Saturación y restricciones.
- Transformadores y ampliaciones previstas.
- Fecha de medición.

Investigá balances de carga, estudios de acceso, informes de ampliación, expedientes regulatorios, memorias técnicas, planes de inversión y documentos de distribuidores.

Nunca equipares MVA instalados con MW disponibles. Si no existe el dato de capacidad disponible, identificá exactamente qué información adicional hace falta para determinarla.

C. Importaciones y exportaciones por aduana

Partí de:

https://www.afip.gob.ar/operadoresComercioExterior/informacionAgregada/

https://arca.gob.ar/operadoresComercioExterior/informacionAgregada/informacion-agregada.asp

https://www.indec.gob.ar/indec/web/Nivel3-Tema-3-2

Investigá:

- Todos los archivos mensuales disponibles.
- Todos los años históricos.
- Códigos y nombres de aduanas.
- Importaciones por aduana y mes.
- Exportaciones por aduana y mes.
- Valor FOB, CIF, peso y cantidad de declaraciones.
- País de origen y destino.
- Nomenclatura NCM.
- Aduanas interiores, fronterizas, portuarias y aeroportuarias.
- Correspondencia entre códigos aduaneros y coordenadas.

No aceptes que existen solamente diez aduanas porque el IGN represente diez puntos.

Construí un inventario completo y verificable de aduanas, distinguiendo aduanas administrativas, puntos operativos, puertos y pasos fronterizos.

Documentá cómo agrupar los archivos de ARCA por aduana y período sin duplicar operaciones.

D. Parques industriales

Partí de:

https://datos.gob.ar/dataset/produccion-registro-nacional-parques-industriales-renpi

https://portal.entrerios.gov.ar/parquesindustriales/

https://www.gba.gob.ar/produccion/programa_arriba_parques

https://datosgestionabierta.cba.gov.ar/dataset/?tags=industria

Investigá todas las provincias, no solamente las mencionadas.

Recuperá, cuando exista:

- Nombre del parque.
- Provincia, municipio y localidad.
- Coordenadas o polígono.
- Superficie total y disponible.
- Estado de habilitación.
- Cantidad de empresas instaladas.
- Empleo generado.
- Actividades industriales predominantes.
- Servicios disponibles.
- Infraestructura eléctrica y potencia.
- Contacto institucional.
- Año de actualización.

Unificá RENPI y registros provinciales, identificando duplicados y parques ausentes del registro nacional.

ETAPA 3. VERIFICACIÓN TÉCNICA

Para cada fuente:

1. Abrí la URL original.
2. Comprobá si responde correctamente.
3. Identificá el organismo responsable.
4. Determiná la fecha de actualización real.
5. Identificá formatos disponibles (CSV, XLSX, ODS, JSON, GeoJSON, SHP, PDF, WMS, WFS o API).
6. Localizá el enlace directo al recurso descargable.
7. Verificá sus campos, unidades y cobertura territorial.
8. Evaluá si permite extracción automatizada.
9. Identificá restricciones legales, técnicas o de acceso.
10. Comprobá que los datos realmente contengan la variable buscada.

Una página que menciona un indicador no demuestra que el dato sea descargable.

No presentes una URL como verificada si no conseguiste abrirla o comprobar su recurso.

ETAPA 4. INVESTIGACIÓN TERRITORIAL

Repetí el procedimiento para las 23 provincias argentinas y CABA.

No consideres terminada la búsqueda después de revisar organismos nacionales.

Cuando una provincia tenga fuentes propias, comparalas con los datos nacionales y determiná cuál ofrece mayor detalle y actualización.

ETAPA 5. MÉTODOS DE RECONSTRUCCIÓN

Cuando una variable no esté disponible directamente:

- Identificá variables equivalentes o componentes.
- Diseñá un procedimiento técnicamente válido para calcularla.
- Indicá las fuentes necesarias.
- Documentá fórmulas y supuestos.
- Determiná límites de precisión y cobertura.
- Evitá imputaciones sin fundamento.
- Señalá cuándo resulta imprescindible solicitar información a un organismo.

Clasificá cada variable como:

A. Dato abierto directamente disponible.

B. Dato abierto que requiere procesamiento.

C. Dato reconstruible integrando fuentes.

D. Dato público que requiere solicitud o consulta.

E. Dato no localizado tras investigación documentada.

ETAPA 6. ENTREGABLES OBLIGATORIOS

Entregable 1. Inventario extensivo de URL

Tabla con:

Variable | Organismo | Fuente | URL exacta | Enlace de descarga | Formato | Año | Nivel geográfico | Cobertura | Estado de verificación

Entregable 2. Matriz de equivalencia MAPA MIC-Argentina

Para cada variable paraguaya, identificá su equivalente argentino, grado de correspondencia, limitaciones y fuente óptima.

Entregable 3. Procedimiento de extracción

Explicá concretamente cómo descargar, consultar o calcular cada variable, incluyendo endpoints, filtros, campos y ejemplos de consultas.

Entregable 4. Georreferenciación

Proponé el procedimiento para cruzar datos con provincias, departamentos, municipios, gobiernos locales y coordenadas.

Entregable 5. Brechas reales

Detallá qué datos no encontraste, cuáles requieren solicitudes de acceso a la información pública y a qué organismo corresponde requerirlos.

Entregable 6. Priorización para implementación

Ordená las fuentes según:

1. Disponibilidad efectiva.
2. Calidad y confiabilidad.
3. Actualización.
4. Cobertura nacional.
5. Desagregación municipal.
6. Facilidad de automatización.

INSTRUCCIONES FINALES

- Priorizá fuentes oficiales y primarias.
- No inventes URLs, datasets, indicadores ni valores.
- Distinguí datos confirmados de inferencias.
- No confundas existencia de infraestructura con capacidad energética disponible.
- No confundas aduana con paso fronterizo.
- No confundas municipio con departamento.
- No confundas parques industriales con establecimientos industriales individuales.
- Registrá URLs rotas y buscá sus repositorios sucesores.
- Conservá las fuentes históricas cuando aporten información útil.
- Incluí citas verificables.
- No impongas un límite arbitrario de fuentes o resultados.
- Documentá los obstáculos técnicos en lugar de asumir que los datos no existen.
- Continuá investigando hasta agotar razonablemente las fuentes nacionales, provinciales y técnicas relevantes.

Resultado esperado: un catálogo exhaustivo y técnicamente verificable que permita implementar las cuatro capas temáticas argentinas equivalentes a MAPA MIC Paraguay, sin perder las diferencias metodológicas entre ambos países.
