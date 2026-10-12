# Aduanas · resultado del encargo E · actualización E2

## Qué quedó hecho

- El resumen principal de importaciones cuenta las destinaciones **IC + IG** (importación a consumo, incluida la modalidad para grandes operadores), una sola vez por aduana, destinación e ítem. Cada archivo mensual conserva además los importes y la cantidad de ítems por tipo, en `imp_tipos`.
- Se agregó `--solo-importaciones AAAAMM …`: vuelve a procesar las importaciones de meses ya resumidos y conserva exportaciones, `tot_exp` y `excluidos`.
- Se procesaron los 12 meses, de octubre de 2025 a septiembre de 2026, en tres procesos. Los 12 JSON tienen `imp_tipos`; los ZIP temporales se borraron al terminar.
- `docs/datos/aduanas_comercio.json` usa IC+IG como importación principal, informa aparte las otras operaciones y mantiene los campos restantes. Las series mensuales de importación usan IC+IG.
- En `docs/fuentes.html` se actualizaron el método y la fila del inventario que describen las importaciones por aduana. No se modificaron `docs/app.js` ni `docs/widgets.js`.

## Qué significan los códigos

La destinación lleva un código de tipo; en los archivos mensuales se tomó el código de dos letras que sigue al prefijo numérico. Las normas de ARCA detallan subtipos de cuatro caracteres, por eso estas descripciones se refieren a los grupos observados:

| Código | Descripción confirmada |
|---|---|
| IC | Importación a consumo. ARCA también incluye dentro de este grupo algunos retornos y regularizaciones; no cada subtipo es una importación definitiva nueva. |
| IG | Importación a consumo para grandes operadores. También es importación a consumo, y ahora se suma a IC en la importación principal. |
| EC | Exportación a consumo. |
| PI | Importación particular. El manual de ARCA detalla varias formas de importación particular. |
| PZ | Otras operaciones (código PZ). No confirmé su significado en una tabla argentina de ARCA. |
| IS | Otras operaciones (código IS). No confirmé su significado en una tabla argentina de ARCA. |
| ZF | Otras operaciones (código ZF). No confirmé el significado del tipo en una tabla argentina de ARCA. |

También aparecen los códigos `NA` y `--`; no se les asignó un significado. La descripción de un código no reemplaza la revisión de cada subdestinación.

En esta revisión, estas fuentes de ARCA se abrieron con `curl` y respondieron HTTP 200: [manual de comercio exterior](https://www.arca.gob.ar/operadoresComercioExterior/documentos/Procedimiento-descarga-y-lectura-archivos-de-ComExAFIP-2018.pdf), [tabla de destinaciones incluida en documentación de ARCA](https://biblioteca.arca.gob.ar/pdfp/rg_afip_1492_2003_a002.htm), [códigos para grandes operadores y otras destinaciones](https://arca.gob.ar/genericos/documentos/FormulariodeValor.pdf), [manual de importaciones particulares](https://arca.gob.ar/destinacionesdeclaradasconcodigosafip/documentos/particularesManualExternos.PDF) y [ejemplo de exportación a consumo](https://arca.gob.ar/USAduaneros/regimen-consignacion/registro.asp). El [portal de información de comercio exterior de ARCA](https://www.arca.gob.ar/operadoresComercioExterior/informacionAgregada/informacion-agregada.asp) también respondió HTTP 200.

## Validación mensual con el INDEC

Importes en millones de dólares, redondeados al millón. Las razones muestran cuánto se aparta cada total de ARCA del total del INDEC: por ejemplo, `−9,5 %` significa que ARCA quedó 9,5 % por debajo. ARCA informa valores FOB; el INDEC, valores CIF, que incluyen flete y seguro.

| Mes | ARCA, todos los tipos (FOB) | ARCA, IC + IG (FOB) | INDEC (CIF) | Todos los tipos vs. INDEC | IC + IG vs. INDEC |
|---|---:|---:|---:|---:|---:|
| Oct. 2025 | 6.471 | 5.932 | 7.154 | −9,5 % | −17,1 % |
| Nov. 2025 | 5.183 | 4.764 | 5.598 | −7,4 % | −14,9 % |
| Dic. 2025 | 5.520 | 5.151 | 5.556 | −0,6 % | −7,3 % |
| Ene. 2026 | 5.012 | 4.650 | 5.070 | −1,1 % | −8,3 % |
| Feb. 2026 | 4.797 | 4.408 | 5.174 | −7,3 % | −14,8 % |
| Mar. 2026 | 5.500 | 5.037 | 6.122 | −10,2 % | −17,7 % |
| Abr. 2026 | 6.883 | 6.398 | 6.204 | +10,9 % | +3,1 % |
| May. 2026 | 6.924 | 6.479 | 6.033 | +14,8 % | +7,4 % |
| Jun. 2026 | 7.957 | 7.506 | 6.861 | +16,0 % | +9,4 % |
| Jul. 2026 | 8.010 | 7.515 | 6.739 | +18,9 % | +11,5 % |
| Ago. 2026 | 6.379 | 5.884 | 6.696 | −4,7 % | −12,1 % |

### Qué muestra la comparación

En los 11 meses comparables, ARCA con todos los tipos suma **US$ 68.636 millones**, frente a **US$ 67.207 millones** del INDEC: queda **US$ 1.429 millones (2,1 %) por encima**.

La importación a consumo **IC + IG** suma **US$ 63.722 millones**: queda **US$ 3.485 millones (5,2 %) por debajo** del INDEC. Mes a mes, queda por debajo entre octubre y marzo y en agosto; supera el valor del INDEC entre abril y julio. La diferencia más baja es −17,7 % en marzo y la más alta +11,5 % en julio. El criterio IC+IG se acerca más al INDEC que IC solo y representa las dos modalidades identificadas por ARCA como importación a consumo.

La diferencia restante es esperable en parte porque ARCA informa valor FOB y el INDEC valor CIF, que suma flete y seguro. También pueden influir los distintos momentos de registro: la destinación puede anotarse en un mes y oficializarse en otro. Estas causas son probables; la comparación agregada no permite medir cuánto explica cada una.

Septiembre de 2026 no se compara: al corte de esta revisión, el INDEC anunciaba su publicación para el 19 de octubre de 2026. La [página de comercio exterior del INDEC](https://www.indec.gob.ar/indec/web/Nivel3-Tema-3-2) respondió HTTP 200. Se descargaron y leyeron con `pypdf` los 11 informes mensuales; cada PDF respondió HTTP 200:

| Mes informado | Informe ICA del INDEC |
|---|---|
| Oct. 2025 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_11_259C5EA1125E.pdf) |
| Nov. 2025 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_12_25FDC51E164D.pdf) |
| Dic. 2025 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_01_26ABE4F7373E.pdf) |
| Ene. 2026 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_02_2625C336A71D.pdf) |
| Feb. 2026 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_03_26F8A1F5EA02.pdf) |
| Mar. 2026 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_04_26D04DBA25EB.pdf) |
| Abr. 2026 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_05_264AC7F6FF63.pdf) |
| May. 2026 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_06_26DD4A27ECEA.pdf) |
| Jun. 2026 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_07_26EF37859542.pdf) |
| Jul. 2026 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_08_26E158B1D119.pdf) |
| Ago. 2026 | [PDF](https://www.indec.gob.ar/uploads/informesdeprensa/ica_09_266E5973E036.pdf) |

## Nuevos totales del mapa

Para los 12 meses, octubre de 2025 a septiembre de 2026:

- **Importaciones a consumo (IC + IG):** US$ 69.651 millones FOB.
- **Otros tipos, excluidos IC e IG:** US$ 5.388 millones FOB.
- **Importaciones de todos los tipos:** US$ 75.039 millones FOB.

Las diez aduanas con más importaciones a consumo (IC + IG) acumuladas son:

| Aduana | IC + IG, US$ millones |
|---|---:|
| Buenos Aires (Capital) | 24.562 |
| Campana | 9.341 |
| Ezeiza | 8.283 |
| Posadas | 7.995 |
| Concordia | 3.630 |
| Paso de los Libres | 2.130 |
| Rosario | 1.869 |
| Córdoba | 1.861 |
| San Nicolás | 1.778 |
| Santo Tomé | 1.438 |

## Por qué puede no cerrar la comparación

- ARCA presenta FOB y el INDEC CIF; el segundo incluye flete y seguro.
- Los sistemas pueden asignar una operación a meses distintos: ARCA registra la destinación y el INDEC arma su estadística con información aduanera recibida y criterios estadísticos propios.
- Los archivos pueden estar incompletos al momento de descargarse o recibir ajustes posteriores.

## Textos pendientes en la pantalla

No se editaron `docs/app.js` ni `docs/widgets.js`. Para que la pantalla H describa el criterio nuevo (IC+IG, importación a consumo, en valor FOB), quedan por ajustar estos textos:

- En `docs/app.js`: nota de H1 sobre el tamaño de los círculos; KPI «Importaciones»; renglón «Importaciones» de la ficha de aduana; detalle «Importaciones» del globo del mapa. Aclarar el período y que esos importes suman IC+IG.
- En `docs/widgets.js`: título «H2 · Importaciones por aduana»; títulos «H4 · Qué se importa (todo el país)» y «H5 · De dónde se importa»; encabezado de tabla «Importaciones (US$ M)». Añadir “IC + IG” o “importación a consumo” para indicar qué se suma.

## Comprobaciones realizadas

Los 12 JSON mensuales conservan `imp_tipos` con todos los tipos; en cada mes, `imp` coincide con la suma IC+IG sin repetir ítems. El modo `--solo-importaciones` modifica sólo `imp` e `imp_tipos`; exportaciones, `tot_exp` y `excluidos` coinciden con sus valores previos al reproceso (exportaciones y total exportado cotejados al millón). El agregado del sitio tiene 12 meses, US$ 69.651 millones en `imp` y US$ 5.388 millones en `imp_otras`; los otros tipos no incluyen IC ni IG. No quedaron ZIP. Los dos scripts se compilaron correctamente y los enlaces listados respondieron HTTP 200 con `curl`. No se hizo commit ni push.
