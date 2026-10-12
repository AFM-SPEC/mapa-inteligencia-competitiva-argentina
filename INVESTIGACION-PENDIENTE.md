# Misión pendiente: datos argentinos equivalentes al Mapa MIC de Paraguay

Estado al 12/10/2026. Pedido del usuario (resumen fiel; el texto completo lo escribió en el chat del 12/10):
localizar, verificar y documentar fuentes argentinas para cinco capas del Mapa MIC (https://www.mic.gov.py/mapamic/):
1. Edad mediana por municipio. 2. Población económicamente activa (PEA) por municipio.
3. Potencia eléctrica disponible por subestación. 4. Importaciones y exportaciones por aduana. 5. Parques industriales.

Reglas del pedido: no concluir de entrada que no existen; no inventar URLs ni valores; no confundir MVA instalados con MW disponibles,
aduana con paso fronterizo, municipio con departamento, parque con establecimiento industrial, empleo registrado con PEA.
Clasificar cada variable: A abierto directo · B abierto con procesamiento · C reconstruible integrando fuentes · D público pero requiere solicitud · E no localizado tras investigación documentada.
Entregables: (1) inventario de URL con estado de verificación, (2) matriz de equivalencia MIC-Argentina, (3) procedimiento de extracción con endpoints y campos,
(4) georreferenciación, (5) brechas reales y a qué organismo pedir, (6) priorización. Recorrer 23 provincias + CABA.

## Ya verificado (sí abrí y descargué)
- **Edad mediana y PEA, nivel departamento:** censo.gob.ar publica por provincia las planillas `c2022_<prov>_est_c6_*.xlsx` (edad mediana por departamento) y
  `c2022_<prov>_actividad_economica_c1_*.xlsx` (población de 14+ , PEA total/ocupada/desocupada, no activa, por departamento; CABA por comuna) y `est_c1` (población por departamento).
  Ya descargadas en `datos-origen/censo_edad_actividad_completo.json` y `censo_pob_dptos.json`. Falta asignar cada gobierno local a su departamento
  (límites en `datos-origen/capa_departamentos.json`, 529 departamentos del IGN, 140 MB) y rotular el valor como «del departamento» o «estimado». REDATAM y radios censales sin explorar (permitirían municipal exacto).
- **Parques industriales:** mapa de la Comisión de Industria y Comercio del Senado (Google My Maps mid=1kGazlxYcEyhAJ17QkTae1x4LjhLoadk, exportado como KML, 606 parques con coordenadas, tipo, condición, empresas, superficie, provincia, actualizado 24/06/2024). Procesado en `docs/datos/capa_parques.json`. La carpeta «Zonas francas» (13) no trae coordenadas en los campos: sacarlas de la geometría Point del KML.
  El RENPI en datos.gob.ar / datos.produccion.gob.ar figura como planilla con nombre y provincia (sin coordenadas); datos.gob.ar estuvo caído (error 523) el 12/10. Falta cruzar con RENPI, Buenos Aires (catalogo.datos.gba.gob.ar/dataset/parques-industriales, con coordenadas), Entre Ríos, Córdoba y las demás provincias.
- **Aduanas:** el IGN tiene sólo 10 puntos «Aduana» en la capa controles_AH070 (no sirve como inventario). Falta ARCA (información agregada de comercio exterior), códigos de aduana y su ubicación.
- **Subestaciones:** el IGN tiene 493 «plantas transformadoras» sin tensión ni potencia. Falta datos.gob.ar (estaciones transformadoras AT, mapas de generación y transporte), ENRE/ENReGE, CAMMESA, transportistas y distribuidoras.
- **POUT (plan de ordenamiento urbano y territorial):** no hay registro nacional abierto localizado; Mendoza informó que 15 de 18 departamentos tienen plan municipal aprobado (mendoza.gov.ar). Sin investigar las demás provincias.

## Estado del sitio
Publicado: https://afm-spec.github.io/mapa-inteligencia-competitiva-argentina/ (repo AFM-SPEC/mapa-inteligencia-competitiva-argentina, rama main, carpeta docs/).
Contacto del sitio: info@neetipol.com (docs/config.js). Falta mostrar parques, edad mediana y PEA en la interfaz (docs/app.js, docs/widgets.js).
