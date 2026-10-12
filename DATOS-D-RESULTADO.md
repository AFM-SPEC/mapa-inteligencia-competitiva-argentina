# Resultado del encargo D

Fecha: 12/10/2026

Se agregaron datos y scripts de procesamiento. No se modificaron archivos de pantalla. No se hizo commit ni push.

## D1 · Hombres y mujeres

Se confirmó en los archivos del Censo la variable `PERSONA_P02`, “Sexo registrado al nacer”. Sus categorías observadas son `1 = Mujer / Femenino` y `2 = Varón / Masculino`. Se agregaron los campos numéricos enteros `hom` y `muj` a los gobiernos locales con datos y a los departamentos con datos. Para radios compartidos, se aplicó el reparto por viviendas de `VIVIENDA_CODGL`, como en `procesar_radios.py`.

- Gobiernos locales con ambos campos: 2126 de 2314; 188 no tienen registros asignables por `VIVIENDA_CODGL` y quedaron sin esos campos.
- Departamentos con ambos campos: 527 de 529; sin registros: Islas del Atlántico Sur (94021) y Antártida Argentina (94028).
- Comparación con población departamental cargada: 22 de 527 departamentos con sexo coinciden exactamente. En conjunto, hombres + mujeres suman 45.618.787 frente a 45.892.285 habitantes (diferencia -273.498). No se repartió esa diferencia ni se completaron valores faltantes.

Hay 172 gobiernos locales con una diferencia mayor al 5 % entre hombres + mujeres y la población del mapa:

| Código | Gobierno local | Hombres + mujeres | Población del mapa | Diferencia |
|---|---|---:|---:|---:|
| 309330 | Costa Uruguay Norte | 63 | 282 | -77,7% |
| 142350 | Villa Elisa | 17 | 42 | -59,5% |
| 143204 | Churqui Cañada | 146 | 93 | +57,0% |
| 268021 | Cerro Centinela | 124 | 80 | +55,0% |
| 142938 | Colonia Iturraspe | 28 | 19 | +47,4% |
| 142322 | Pacheco de Melo | 73 | 138 | -47,1% |
| 823421 | Piñero | 2,484 | 4,618 | -46,2% |
| 143211 | El Rodeo | 120 | 206 | -41,7% |
| 143162 | Punta del Agua | 142 | 237 | -40,1% |
| 142329 | Paso del Durazno | 23 | 38 | -39,5% |
| 866613 | Villa Nueva | 320 | 231 | +38,5% |
| 823267 | Sarmiento | 1,145 | 1,778 | -35,6% |
| 309230 | Distrito Chañar | 423 | 656 | -35,5% |
| 142063 | San Ignacio | 225 | 171 | +31,6% |
| 866413 | San José del Boquerón | 1,089 | 832 | +30,9% |
| 309625 | Arroyo Palo Seco | 72 | 103 | -30,1% |
| 822238 | Eustolia | 107 | 153 | -30,1% |
| 866340 | Punta Pozo | 7 | 10 | -30,0% |
| 425105 | Perú | 64 | 91 | -29,7% |
| 866557 | Villa Mercedes | 110 | 85 | +29,4% |
| 866024 | Hoyón | 172 | 133 | +29,3% |
| 822875 | Villa Guillermina | 3,921 | 5,500 | -28,7% |
| 540357 | Campo Ramón | 7,128 | 9,986 | -28,6% |
| 866487 | Tres Cruces | 199 | 155 | +28,4% |
| 866462 | Doña Luisa | 120 | 167 | -28,1% |
| 625252 | Pilquiniyeu | 68 | 94 | -27,7% |
| 625210 | Comicó | 79 | 109 | -27,5% |
| 142287 | Los Pozos | 48 | 66 | -27,3% |
| 143148 | Las Isletillas | 191 | 262 | -27,1% |
| 142805 | Colonia Videla | 71 | 97 | -26,8% |
| 268147 | Dr. Atilio Oscar Viglione | 135 | 184 | -26,6% |
| 142616 | Cañada de Machado | 139 | 186 | -25,3% |
| 142959 | Colonia Valtelina | 187 | 249 | -24,9% |
| 866529 | Campo Grande | 143 | 190 | -24,7% |
| 866325 | Huachana | 181 | 146 | +24,0% |
| 142231 | Onagoity | 39 | 51 | -23,5% |
| 866405 | Ahí Veremos | 99 | 129 | -23,3% |
| 302666 | Ombú | 527 | 428 | +23,1% |
| 142595 | Villa El Chacay | 102 | 83 | +22,9% |
| 823071 | Felicia | 3,158 | 2,575 | +22,6% |
| 142637 | Colonia Las Cuatro Esquinas | 72 | 93 | -22,6% |
| 143169 | Candelaria Sud | 137 | 112 | +22,3% |
| 625133 | Pichi Mahuida | 7 | 9 | -22,2% |
| 540077 | Loreto | 1,116 | 1,414 | -21,1% |
| 142245 | Ranqueles | 48 | 60 | -20,0% |
| 866599 | La Paliza | 225 | 188 | +19,7% |
| 142714 | Plaza de Mercedes | 45 | 56 | -19,6% |
| 866392 | San Pedro | 661 | 558 | +18,5% |
| 866186 | Sauce Solo | 156 | 132 | +18,2% |
| 746287 | La Vertiente | 127 | 155 | -18,1% |
| 746308 | Las Lagunas | 146 | 178 | -18,0% |
| 866606 | Atoj Pozo | 152 | 129 | +17,8% |
| 625259 | Prahuaniyeu | 154 | 187 | -17,6% |
| 143190 | Los Mistoles | 103 | 125 | -17,6% |
| 866357 | Cañada Escobar | 24 | 29 | -17,2% |
| 625126 | Yaminue | 101 | 121 | -16,5% |
| 142742 | Chañar Viejo | 157 | 187 | -16,0% |
| 143246 | Villa Los Patos | 21 | 25 | -16,0% |
| 142609 | Atahona | 132 | 157 | -15,9% |
| 585042 | Sauzal Bonito | 278 | 329 | -15,5% |
| 625161 | Cona Niyeu | 211 | 183 | +15,3% |
| 142665 | Esquina | 243 | 286 | -15,0% |
| 866546 | Quebracho Coto | 226 | 264 | -14,4% |
| 866427 | Colonia San Juan | 335 | 293 | +14,3% |
| 866578 | Lescano | 162 | 189 | -14,3% |
| 746301 | Las Chacras | 169 | 148 | +14,2% |
| 302976 | Paraje Las Tunas | 347 | 404 | -14,1% |
| 866420 | Villa Matoque | 57 | 50 | +14,0% |
| 142945 | Colonia Las Pichanas | 221 | 256 | -13,7% |
| 142630 | Chalacea | 148 | 171 | -13,5% |
| 625231 | Laguna Blanca | 112 | 99 | +13,1% |
| 142966 | Plaza Luxardo | 254 | 225 | +12,9% |
| 141218 | Colonia Vignaud | 643 | 737 | -12,8% |
| 142686 | La Quinta | 166 | 190 | -12,6% |
| 866620 | Sumamao | 316 | 281 | +12,5% |
| 422007 | Casa de Piedra | 185 | 211 | -12,3% |
| 142315 | El Rastreador | 115 | 131 | -12,2% |
| 268049 | Aldea Epulef | 146 | 166 | -12,0% |
| 142861 | Panaholma | 272 | 243 | +11,9% |
| 820098 | Las Toscas | 14,397 | 12,865 | +11,9% |
| 268056 | Carrenleufú | 282 | 320 | -11,9% |
| 142133 | Alto de los Quebrachos | 173 | 155 | +11,6% |
| 142168 | La Batea | 156 | 176 | -11,4% |
| 302780 | Don Cristóbal II | 616 | 688 | -10,5% |
| 866382 | Negra Muerta | 43 | 48 | -10,4% |
| 625035 | Paso Flores | 112 | 125 | -10,4% |
| 268042 | Lagunita Salada | 138 | 154 | -10,4% |
| 585014 | Aguada San Roque | 246 | 223 | +10,3% |
| 142364 | El Chacho | 148 | 165 | -10,3% |
| 143001 | Dique Chico | 538 | 488 | +10,2% |
| 100077 | Hualfin | 1,450 | 1,612 | -10,0% |
| 866528 | Ahí Veremos | 445 | 494 | -9,9% |
| 820245 | Coronda | 19,499 | 21,643 | -9,9% |
| 100056 | Antofagasta de la Sierra | 1,822 | 2,022 | -9,9% |
| 866168 | Gramilla | 1,119 | 1,019 | +9,8% |
| 303034 | Tezanos Pinto | 291 | 265 | +9,8% |
| 300098 | Villa Libertador San Martín | 8,499 | 9,419 | -9,8% |
| 866515 | Libertad | 607 | 553 | +9,8% |
| 866187 | Tío Pozo | 653 | 595 | +9,7% |
| 142070 | Segunda Usina | 215 | 196 | +9,7% |
| 625203 | Colan Conhue | 76 | 84 | -9,5% |
| 822987 | Emilia | 1,028 | 1,134 | -9,3% |
| 142560 | La Carolina El Potosí | 175 | 193 | -9,3% |
| 386252 | Cangrejillos | 378 | 347 | +8,9% |
| 660021 | General Pizarro | 6,602 | 7,244 | -8,9% |
| 300305 | El Pingo | 1,267 | 1,166 | +8,7% |
| 740108 | Desaguadero | 369 | 403 | -8,4% |
| 268084 | Los Altares | 185 | 202 | -8,4% |
| 746231 | Alto Pelado | 164 | 179 | -8,4% |
| 866527 | Villa Brana | 340 | 371 | -8,4% |
| 142980 | Villa San Esteban | 78 | 85 | -8,2% |
| 142952 | Colonia San Pedro | 134 | 124 | +8,1% |
| 143064 | San Clemente | 228 | 211 | +8,1% |
| 425028 | Colonia Santa María | 322 | 298 | +8,1% |
| 302133 | Colonia Ensayo | 895 | 972 | -7,9% |
| 866579 | Los Ovejeros | 287 | 266 | +7,9% |
| 822889 | Carrizales | 1,206 | 1,309 | -7,9% |
| 585021 | Los Chihuidos | 261 | 242 | +7,9% |
| 142182 | Las Cañadas | 272 | 295 | -7,8% |
| 420011 | Algarrobo del Águila | 567 | 526 | +7,8% |
| 866509 | Granadero Gatica | 695 | 753 | -7,7% |
| 625140 | Pilquiniyeu del Limay | 70 | 65 | +7,7% |
| 302376 | San Víctor | 608 | 658 | -7,6% |
| 142196 | Los Chañaritos | 558 | 603 | -7,5% |
| 142693 | Las Gramillas | 112 | 121 | -7,4% |
| 142028 | Las Bajadas | 214 | 231 | -7,4% |
| 142791 | Santa Elena | 394 | 367 | +7,4% |
| 866602 | Sabagasta | 133 | 124 | +7,3% |
| 785035 | Tres Lagos | 385 | 415 | -7,2% |
| 908595 | Anca Juli | 375 | 404 | -7,2% |
| 386063 | Tres Cruces | 666 | 622 | +7,1% |
| 141239 | El Fortín | 1,579 | 1,699 | -7,1% |
| 866028 | Medellín | 1,259 | 1,176 | +7,1% |
| 142707 | Maquinista Gallini | 93 | 100 | -7,0% |
| 866364 | Chaupi Pozo | 477 | 446 | +7,0% |
| 142014 | Parque Calmayo | 171 | 160 | +6,9% |
| 866396 | Sol de Mayo | 109 | 102 | +6,9% |
| 824191 | Margarita | 4,566 | 4,900 | -6,8% |
| 866616 | Manogasta | 836 | 784 | +6,6% |
| 625217 | Clemente Onelli | 156 | 167 | -6,6% |
| 142413 | Las Palmas | 340 | 319 | +6,6% |
| 866322 | Donadeu | 898 | 961 | -6,6% |
| 425049 | Chacharramendi | 374 | 351 | +6,6% |
| 866368 | El Aibé | 383 | 360 | +6,4% |
| 142056 | Lutti | 88 | 94 | -6,4% |
| 142266 | Cañada de Río Pinto | 303 | 323 | -6,2% |
| 141162 | Alicia | 3,312 | 3,529 | -6,1% |
| 866459 | La Nena - La Simona | 439 | 414 | +6,0% |
| 866391 | San Benito | 219 | 233 | -6,0% |
| 140182 | Cruz del Eje | 34,786 | 37,001 | -6,0% |
| 345007 | Los Chiriguanos | 1,851 | 1,747 | +6,0% |
| 386091 | Arrayanal | 822 | 874 | -5,9% |
| 386154 | Catua | 507 | 539 | -5,9% |
| 625077 | Aguada Guzmán | 175 | 186 | -5,9% |
| 866388 | El Deán | 948 | 1,007 | -5,9% |
| 866565 | Amicha | 401 | 379 | +5,8% |
| 142448 | Leguizamón | 37 | 35 | +5,7% |
| 143232 | Ana Zumarán | 227 | 215 | +5,6% |
| 866576 | El Sauzal | 19 | 18 | +5,6% |
| 386179 | El Moreno | 804 | 851 | -5,5% |
| 386161 | Coranzuli | 553 | 585 | -5,5% |
| 866350 | Ardiles | 514 | 543 | -5,3% |
| 141582 | Villa Tulumba | 1,525 | 1,610 | -5,3% |
| 142833 | Ambul | 1,238 | 1,307 | -5,3% |
| 625182 | Nahuel Niyeu | 54 | 57 | -5,3% |
| 866185 | San Vicente | 301 | 286 | +5,2% |
| 866315 | Casares | 235 | 248 | -5,2% |
| 585028 | Pilo Lil | 199 | 210 | -5,2% |
| 309045 | El Redomón | 365 | 385 | -5,2% |
| 141645 | Colonia Bismarck | 420 | 443 | -5,2% |
| 386238 | Valle Grande | 634 | 668 | -5,1% |
| 866200 | Kilómetro 49 | 505 | 532 | -5,1% |

Script: `herramientas/procesar_sexo.py`. Descarga y elimina cada ZIP al terminar. Ejecuta con `python3 -I herramientas/procesar_sexo.py` (o una lista de códigos de provincia).

## D2 · Límites departamentales

Se generó `docs/datos/capa_departamentos.json`: 1.299.203 bytes, por debajo de 2 MB. Contiene 529 departamentos; los 529 (código de cinco dígitos) coinciden con `departamentos_censo.json`. No quedaron departamentos sin correspondencia. Se conservaron anillos exteriores, con coordenadas redondeadas a cuatro decimales y geometría simplificada.

Script: `herramientas/procesar_departamentos.py`.

## D3 · Rutas

Se descargaron 12.928 tramos provinciales del IGN. La capa liviana ocupa 1.093.931 bytes. El cálculo departamental intersecta la geometría simplificada de D2. `rutas_por_departamento.json` contiene 529 departamentos. La suma de kilómetros nacionales por departamento es 44.531,33 km, frente a 44.506 km del resumen existente: diferencia +25,33 km. La suma provincial por departamento es 143.233,26 km.

Se identificaron 15 rutas agrupadas que tienen al menos un tramo a menos de 3 km de uno o más pasos de frontera. El archivo registra número o nombre de ruta, categoría, longitud completa de la ruta agrupada por categoría y número; en rutas provinciales, el mismo número se separa por provincia. Se enumeran las provincias que recorre, los pasos cercanos y los países vecinos. El número y la provincia se asignan a partir del punto medio de cada tramo vial.

Criterio y límites: la cercanía se midió en línea recta desde la geometría vial hasta el punto del paso; una ruta puede quedar seleccionada aunque el trazado no termine exactamente en el paso. Si una ruta está dividida o repite el mismo número, se agrupan los tramos con ese número y se informa su longitud total. Las distancias y longitudes son aproximadas y dependen de la geometría del IGN; los tramos paralelos o superpuestos pueden contarse más de una vez.

Script: `herramientas/procesar_rutas.py`.

La última repetición integral del script se detuvo porque el cruce de las rutas con los polígonos detallados demoró varios minutos. `rutas_por_departamento.json` quedó de una ejecución completa con los polígonos D2; `rutas_internacionales.json` se actualizó en una pasada separada para sumar la ruta completa y separar números provinciales repetidos por provincia. El script incluye ambos cálculos para regenerarlos juntos.

## D4 · Límite internacional

La capa del IGN aporta el objeto y el nombre de los países, pero no un atributo que separe con seguridad fronteras por río y fronteras terrestres. Una línea hidrográfica cercana, por sí sola, no demuestra que el límite internacional siga ese curso; sin una coincidencia validada con precisión adecuada, esa separación podría ser errónea. Por eso no se inventó esa división. El archivo contiene longitudes aproximadas por país vecino y deja aparte la geometría que el IGN etiqueta `-2`, sin país identificable. Se calculan sobre las líneas del IGN; son aproximaciones.

| País vecino | Km aproximados |
|---|---:|
| Bolivia | 858,6 |
| Brasil | 1.284,4 |
| Chile | 7.097,0 |
| Paraguay | 2.515,5 |
| Uruguay | 510,5 |
| Sin país identificable (`-2`) | 9.395,5 |

Script: `herramientas/procesar_limites.py`.

## D5 · Departamento de cada punto

Se generó `puntos_departamento.json` para 18 capas de puntos y 22.518 filas, en el mismo orden de cada capa. Nueve puntos de yacimientos quedaron en `null` por no caer dentro ni a menos de 20 km de un departamento. En los demás puntos se asignó el código del departamento que los contiene o el más cercano dentro de 20 km.

Capas incluidas: `fabricas` (2.226), `parques` (606), `salud` (8.311), `pesaje` (44), `estaciones_at` (323), `tanques` (1.242), `zonas_francas` (13), `peajes` (161), `yacimientos` (872), `aeropuertos` (60), `centrales` (445), `puertos` (155), `estaciones_servicio` (5.383), `pasos` (158), `transformadoras` (493), `aerodromos` (884), `universidades` (1.132), `aduanas` (10).

Script: `herramientas/procesar_puntos_departamento.py`.

## Fuentes comprobadas con curl

- ZIP de radios del INDEC (Buenos Aires): `https://infra.datos.gob.ar/catalog/indec/dataset/48/distribution/48.2/download/06-buenos-aires-2022.zip` — HTTP 200. Los 24 ZIP provinciales se descargaron mediante `curl -fSL` durante el procesamiento.
- Diccionario de variables del INDEC: `https://infra.datos.gob.ar/catalog/indec/dataset/48/distribution/48.26/download/diccionario-variables.csv` — HTTP 200.
- Servicio WFS del IGN `https://wms.ign.gob.ar/geoserver/ows`, WFS 1.0.0, pedido `GetFeature`, `typeName=vial_provincial`, `outputFormat=application/json` — HTTP 200. Respondió con 12.928 tramos.
- Mismo servicio WFS y formato, `typeName=vial_nacional` — HTTP 200.

## Qué queda pendiente

Los conteos por sexo no alcanzan la población cargada en todos los departamentos y 188 gobiernos locales no tienen valor propio de sexo en los datos de radio asignables. Se conservaron los valores publicados y se documentaron las diferencias en vez de estimarlas. La frontera `-2` del IGN no se repartió entre países. Los puntos fuera de los departamentos y a más de 20 km quedan en `null`.
