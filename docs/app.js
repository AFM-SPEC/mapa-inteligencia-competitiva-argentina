"use strict";
/* Mapa Logístico Municipal · Argentina
   Datos: Censo 2022 (INDEC) + capas del IGN, procesados con herramientas/procesar.py */

const $ = (s, r = document) => r.querySelector(s);
const fmt = n => (n == null ? "—" : Math.round(n).toLocaleString("es-AR"));
const fmt1 = n => (n == null ? "—" : n.toLocaleString("es-AR", { maximumFractionDigits: 1 }));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Textos nuevos de la actualización de pantallas; centralizados para traducir después. */
const TEXTOS_PANTALLAS = {
  hombres: "Hombres", mujeres: "Mujeres", sinDatoPropio: "Sin dato propio",
  notaSexo: "La suma de hombres y mujeres (45.618.787) difiere de la población del cuadro (45.892.285) porque los radios censales compartidos se repartieron por viviendas. No se completaron los datos faltantes.",
  tasa14: "Tasa de actividad (14 años y más)", tasaTotal: "Tasa de actividad (población total)",
  potencia: "potencia instalada (MVA, unidad sin confirmar)",
  limite: "Los kilómetros se muestran por país vecino, sin separar frontera por río y frontera seca: esa separación todavía no se pudo calcular de forma confiable.",
  estacionesNota: "Se conservaron 1.214 puntos del IGN porque no tenían una boca de Energía a menos de 300 m.",
  saludNota: "REFES, corte 27/12/2024. Cruce seguro para el 8,56 % de los 38.767 establecimientos y el 39,92 % de los puntos IGN; los cruces dudosos quedaron sin completar.",
  distribNota: "Inventarios de Edenor y Edelap para sus empresas y zonas; no reemplazan la capa nacional. Edesur no tiene subestaciones descargables.",
  aduanaNota: "En 11 meses comparables, ARCA IC+IG quedó 5,2 % por debajo del INDEC. ARCA informa valor FOB y el INDEC valor CIF, que incluye flete y seguro.",
};

/* Avisos breves por pantalla; mantener todos los textos aquí para traducirlos juntos. */
const TEXTOS_AVISOS = {
  titulo: "Datos que faltan",
  A: [
    "188 de 2.314 gobiernos locales no tienen datos propios de hombres y mujeres; se muestran como «sin dato propio».",
    "A 51 gobiernos locales les falta población en el cuadro del Censo 2022 (sobre todo juntas de gobierno y comisiones de Entre Ríos y Formosa); otros 3 tienen población, pero no ubicación del IGN en el mapa.",
    "En 186 gobiernos locales, la edad mediana y la población activa corresponden al departamento; está indicado en pantalla.",
    "La suma de hombres y mujeres (45.618.787) no coincide con la población del cuadro (45.892.285).",
  ],
  B: [
    "Las fronteras se miden de forma aproximada por país vecino. No se separan tramos por río y tramos terrestres ni hay una capa de ríos.",
    "Unos 9.395 km de frontera no tienen país identificado en la fuente y no se suman.",
    "Las longitudes de rutas siguen los trazados del IGN; autopistas y tramos paralelos pueden contarse más de una vez.",
  ],
  C: [
    "Falta la potencia disponible de cada subestación, necesaria para saber si puede conectarse una industria. Solo hay potencia instalada (MVA, unidad sin confirmar) para 243 de 323 estaciones. Hay que pedir el dato a CAMMESA, al ENRE y a las transportistas.",
    "Solo hay subestaciones descargables de Edenor y Edelap; faltan Edesur y las distribuidoras provinciales.",
  ],
  D: ["1.214 puntos vienen del IGN y no aparecen en el registro de Energía: no se confirmó su empresa ni su bandera."],
  E: ["Solo se confirmó el cruce del 8,56 % de los 38.767 establecimientos de REFES y del 39,92 % de los puntos del IGN. El resto no muestra tipo ni origen. REFES tiene corte del 27/12/2024 y no informa complejidad."],
  F: [
    "Faltan parques industriales de varias provincias: siete registros bonaerenses no tienen ubicación exacta; la capa de Santa Fe no se pudo descargar; no se encontró una fuente abierta para Entre Ríos, Córdoba y Mendoza.",
    "Argentina no tiene un registro de POUT (plan de ordenamiento urbano y territorial), concepto usado en Paraguay.",
  ],
  G: ["La cobertura de parques es parcial: siete registros bonaerenses no tienen ubicación exacta y faltan datos descargables de varias provincias."],
  H: [
    "Las exportaciones por aduana son parciales: ARCA reserva parte de los datos y se ve cerca del 45 % del total.",
    "La comparación con INDEC llega hasta agosto de 2026. Septiembre se sumará cuando INDEC lo publique; está anunciado para el 19/10/2026.",
    "Las fronteras se miden de forma aproximada por país vecino, sin separar río y tierra; unos 9.395 km sin país identificado no se suman.",
  ],
  I: ["Las exportaciones se informan por provincia de origen; no hay un desglose por gobierno local."],
};

function dibujarAviso(id) {
  const aviso = $("#avisoDatos");
  const puntos = TEXTOS_AVISOS[id] || [];
  aviso.innerHTML = puntos.length
    ? `<h3>${esc(TEXTOS_AVISOS.titulo)}</h3><ul>${puntos.map(p => `<li>${esc(p)}</li>`).join("")}</ul>`
    : "";
  aviso.hidden = !puntos.length;
}

/* ---------- catálogos ---------- */
const TIPOS_GRUPOS = [
  { id: "mun", nombre: "Municipios", cods: ["MU", "M1", "M2", "M3"] },
  { id: "com", nombre: "Comunas", cods: ["CO", "CO1", "CO2"] },
  { id: "cr", nombre: "Comunas rurales", cods: ["CR", "CR1", "CR2", "CR3"] },
  { id: "cf", nombre: "Comisiones de fomento y municipales", cods: ["CF", "CM", "CMA", "CMB"] },
  { id: "jg", nombre: "Juntas de gobierno y vecinales", cods: ["JG1", "JG2", "JG3", "JG4", "JV"] },
];
const TIPO_NOMBRE = {
  MU: "Municipio de única categoría", M1: "Municipio de 1.ª categoría", M2: "Municipio de 2.ª categoría", M3: "Municipio de 3.ª categoría",
  CO: "Comuna", CO1: "Comuna de 1.ª categoría", CO2: "Comuna de 2.ª categoría",
  CR: "Comuna rural", CR1: "Comuna rural de 1.ª categoría", CR2: "Comuna rural de 2.ª categoría", CR3: "Comuna rural de 3.ª categoría",
  CF: "Comisión de fomento", CM: "Comisión municipal", CMA: "Comisión municipal categoría A", CMB: "Comisión municipal categoría B",
  JG1: "Junta de gobierno de 1.ª categoría", JG2: "Junta de gobierno de 2.ª categoría", JG3: "Junta de gobierno de 3.ª categoría", JG4: "Junta de gobierno de 4.ª categoría",
  JV: "Junta vecinal",
};
const RANGOS_POB = [
  { id: "p1", l: "Muy pequeño (menos de 2.000)", min: 0, max: 2000 },
  { id: "p2", l: "Pequeño (2.000 a 10.000)", min: 2000, max: 10000 },
  { id: "p3", l: "Mediano (10.000 a 50.000)", min: 10000, max: 50000 },
  { id: "p4", l: "Intermedio (50.000 a 200.000)", min: 50000, max: 200000 },
  { id: "p5", l: "Grande (más de 200.000)", min: 200000, max: Infinity },
];
const RANGOS_DIST = [
  { id: "d1", l: "Menos de 100 km", min: 0, max: 100 },
  { id: "d2", l: "100 a 300 km", min: 100, max: 300 },
  { id: "d3", l: "300 a 600 km", min: 300, max: 600 },
  { id: "d4", l: "600 a 1.000 km", min: 600, max: 1000 },
  { id: "d5", l: "Más de 1.000 km", min: 1000, max: Infinity },
];
const REGIONES = {
  "Pampeana": ["Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Córdoba", "Entre Ríos", "La Pampa", "Santa Fe"],
  "Patagonia": ["Chubut", "Neuquén", "Río Negro", "Santa Cruz", "Tierra del Fuego, Antártida e Islas del Atlántico Sur"],
  "Noroeste (NOA)": ["Catamarca", "Jujuy", "La Rioja", "Salta", "Santiago del Estero", "Tucumán"],
  "Cuyo": ["Mendoza", "San Juan", "San Luis"],
  "Noreste (NEA)": ["Chaco", "Corrientes", "Formosa", "Misiones"],
};
const REGION_DE = Object.fromEntries(Object.entries(REGIONES).flatMap(([r, ps]) => ps.map(p => [p, r])));
const RAMPA = ["#d3d9e4", "#a7b3c9", "#7384a6", "#3d5078", "#0b1d3a"];
const CORTES_POB = [2000, 10000, 50000, 200000];
const claseDe = (v, cortes) => { let i = 0; while (i < cortes.length && v >= cortes[i]) i++; return i; };

/* ---------- capas del mapa ---------- */
const CAPAS = {
  rutas: { n: "Rutas nacionales", f: "capa_rutas.json", t: "lineas", c: "#9b2c22", w: 1.8 },
  rutas_provinciales: { n: "Rutas provinciales", f: "capa_rutas_provinciales.json", t: "lineas", c: "#c4892b", w: 1.1 },
  limites: { n: "Límite internacional", f: "capa_limites.json", t: "lineas", c: "#0b1d3a", w: 1.3, dash: "2 4" },
  ferrocarril: { n: "Ferrocarril", f: "capa_ferrocarril.json", t: "lineas", c: "#46567a", w: 1.4, dash: "5 4" },
  lineas_electricas: { n: "Líneas de transmisión eléctrica", f: "capa_lineas_electricas.json", t: "lineas", c: "#c4892b", w: 1.4 },
  ductos: { n: "Ductos", f: "capa_ductos.json", t: "lineas", c: "#5f7f5a", w: 1.4 },
  areas_protegidas: { n: "Áreas protegidas (límites)", f: "capa_areas_protegidas.json", t: "lineas", c: "#5f7f5a", w: 1 },
  pasos: { n: "Pasos de frontera", f: "capa_pasos.json", t: "puntos", c: "#8a5b12", r: 5, info: p => ({ t: p[2], s: `${p[3]} · ${p[4]}${p[5] ? " · con " + p[5] : ""}`, x: p[6] ? "Cruce " + p[6].toLowerCase() : "" }) },
  aduanas_com: { n: "Aduanas (comercio exterior)", f: "aduanas_comercio.json", t: "aduanas", c: "#0b1d3a" },
  aduanas: { n: "Puestos de control aduanero (IGN)", f: "capa_aduanas.json", t: "puntos", c: "#8a5b12", r: 4, info: p => ({ t: p[2] }) },
  estaciones_at: { n: "Estaciones transformadoras de alta tensión", f: "capa_estaciones_at.json", t: "puntos", c: "#3a5f8a", r: 4.5, info: p => ({ t: p[2], s: [p[3], p[4] ? p[4] + " kV" : ""].filter(Boolean).join(" · "), x: p[6] ? `${TEXTOS_PANTALLAS.potencia}: ${fmt(p[6])}` + (p[7] ? ` · en servicio desde ${p[7]}` : "") : `${TEXTOS_PANTALLAS.potencia}: sin dato` }) },
  parques: { n: "Parques y áreas industriales", f: "capa_parques.json", t: "puntos", c: "#9b2c22", r: 3.6, info: p => ({ t: p[2], s: `${p[3]} · ${p[4]} · ${p[5]}`, x: [p[6] ? p[6] + " empresas" : "", p[7] ? fmt1(p[7]) + " ha" : "", p[8] || ""].filter(Boolean).join(" · ") }) },
  zonas_francas: { n: "Zonas francas", f: "capa_zonas_francas.json", t: "puntos", c: "#c4892b", r: 6, info: p => ({ t: p[2], s: p[3], x: p[4] ? "Habilitada el " + p[4] : "" }) },
  centrales: { n: "Centrales eléctricas", f: "capa_centrales.json", t: "puntos", c: "#9b2c22", r: 4.5, info: p => ({ t: p[2], s: p[3] }) },
  transformadoras: { n: "Plantas transformadoras", f: "capa_transformadoras.json", t: "puntos", c: "#3a5f8a", r: 3.5, info: p => ({ t: p[2] }) },
  yacimientos: { n: "Yacimientos de hidrocarburos", f: "capa_yacimientos.json", t: "puntos", c: "#0b1d3a", r: 5, info: p => ({ t: p[2] }) },
  estaciones_servicio: { n: "Estaciones de servicio", f: "capa_estaciones_servicio.json", t: "puntos", c: "#c4892b", r: 2.5, info: p => ({ t: p[2] || "Estación de servicio", s: [p[3], p[4]].filter(Boolean).join(" · ") }) },
  edenor: { n: "Distribución Edenor (inventario propio)", f: "capa_distribucion_edenor.json", t: "puntos", c: "#7a4d9b", r: 4, info: p => ({ t: p[2], s: p[3], x: p[4] }) },
  edelap: { n: "Distribución Edelap (inventario propio)", f: "capa_distribucion_edelap.json", t: "puntos", c: "#167d78", r: 4, info: p => ({ t: p[2], s: p[3], x: p[4] }) },
  tanques: { n: "Tanques de combustible", f: "capa_tanques.json", t: "puntos", c: "#57657f", r: 3, info: () => ({ t: "Tanque de combustible" }) },
  salud: { n: "Establecimientos de salud", f: "capa_salud.json", t: "puntos", c: "#9b2c22", r: 2.6, info: (p, i) => { const x = est.saludRefes?.[i]; return { t: p[2], s: [p[3], x?.[0], x?.[1]].filter(Boolean).join(" · ") }; } },
  fabricas: { n: "Fábricas", f: "capa_fabricas.json", t: "puntos", c: "#46567a", r: 3.4, info: p => ({ t: p[2] || "Fábrica" }) },
  universidades: { n: "Universidades", f: "capa_universidades.json", t: "puntos", c: "#c4892b", r: 3.4, info: p => ({ t: p[2] }) },
  puertos: { n: "Puertos", f: "capa_puertos.json", t: "puntos", c: "#3a5f8a", r: 5, info: p => ({ t: p[2] }) },
  aeropuertos: { n: "Aeropuertos", f: "capa_aeropuertos.json", t: "puntos", c: "#0b1d3a", r: 5.5, info: p => ({ t: p[2] }) },
  aerodromos: { n: "Aeródromos", f: "capa_aerodromos.json", t: "puntos", c: "#57657f", r: 2.6, info: p => ({ t: p[2] || "Aeródromo" }) },
  peajes: { n: "Peajes", f: "capa_peajes.json", t: "puntos", c: "#c4892b", r: 4, info: p => ({ t: p[2] }) },
  pesaje: { n: "Estaciones de pesaje", f: "capa_pesaje.json", t: "puntos", c: "#8a5b12", r: 4.5, info: () => ({ t: "Estación de pesaje" }) },
};

/* indicadores por gobierno local que se pueden ordenar */
const METRICAS = {
  pob: { l: "Habitantes", u: "", dir: "desc" },
  em: { l: "Edad mediana", u: " años", dir: "desc" },
  pea: { l: "Población económicamente activa", u: "", dir: "desc" },
  pea_t: { l: "Tasa de actividad (Censo 2022, sobre 14 años y más)", u: " %", dir: "desc", dec: 1 },
  hom: { l: "Hombres (Censo 2022)", u: "", dir: "desc" },
  des_t: { l: "Desocupación (Censo 2022, sobre la PEA)", u: " %", dir: "desc", dec: 1 },
  d_at: { l: "Distancia a estación transformadora AT", u: " km", dir: "desc" },
  d_parque: { l: "Distancia a parque industrial", u: " km", dir: "asc" },
  parq30: { l: "Parques industriales a ≤30 km", u: "", dir: "desc" },
  d_ruta: { l: "Distancia a ruta nacional", u: " km", dir: "desc" },
  d_tren: { l: "Distancia a ferrocarril", u: " km", dir: "desc" },
  d_paso: { l: "Distancia a paso de frontera", u: " km", dir: "asc" },
  d_central: { l: "Distancia a central eléctrica", u: " km", dir: "desc" },
  d_transf: { l: "Distancia a planta transformadora", u: " km", dir: "desc" },
  est10: { l: "Estaciones de servicio a ≤10 km", u: "", dir: "desc" },
  salud10: { l: "Establecimientos de salud a ≤10 km", u: "", dir: "desc" },
  fab20: { l: "Fábricas a ≤20 km", u: "", dir: "desc" },
  univ30: { l: "Universidades a ≤30 km", u: "", dir: "desc" },
  d_puerto: { l: "Distancia a puerto", u: " km", dir: "asc" },
  d_aero: { l: "Distancia a aeropuerto", u: " km", dir: "asc" },
};

const sum = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);
const prom = (a, k) => (a.length ? sum(a, x => x[k]) / a.length : 0);
const cuenta = (a, f) => a.filter(f).length;
const pct = (n, t) => (t ? Math.round((100 * n) / t) + " %" : "—");

const TABS = [
  {
    id: "A", nombre: "A · Zonas y ciudades", capas: ["areas_protegidas"], capasOff: ["areas_protegidas"], coropleta: true, metricas: ["pob", "em", "pea", "pea_t", "des_t"],
    titulo: "A1 · Población por provincia y gobierno local",
    nota: "El relleno y los bordes marcados corresponden a provincias; cada círculo representa un gobierno local y su tamaño depende de la población del Censo 2022. Tocá un círculo o una provincia para ver el detalle.",
    kpis: v => [
      ["Provincias", fmt(new Set(v.map(m => m.pv)).size), "jurisdicciones"],
      ["Gobiernos locales", fmt(v.length), "con ubicación"],
      ["Habitantes", fmt(sum(v, m => m.pob)), "Censo 2022"],
      ["Viviendas", fmt(sum(v, m => m.viv)), "Censo 2022"],
      ["Población económicamente activa", fmt(sum(v, m => m.pea)), "Censo 2022 · 14 años y más"],
      [TEXTOS_PANTALLAS.tasaTotal, fmt1(100 * sum(v, m => m.pea) / (sum(v, m => m.pob_r || m.pob) || 1)) + " %", "sobre población total"],
      ["Edad mediana", fmt1(sum(v.filter(m => m.em != null && m.pob), m => m.em * m.pob) / (sum(v.filter(m => m.em != null && m.pob), m => m.pob) || 1)) + " años", "promedio ponderado por habitantes"],
      ["Mayor población", v.length ? [...v].sort((a, b) => (b.pob || 0) - (a.pob || 0))[0].n.replace(/ \(15 comunas\)/, "") : "—", "en la selección"],
    ],
  },
  {
    id: "B", nombre: "B · Rutas y fronteras", capas: ["rutas", "rutas_provinciales", "ferrocarril", "pasos", "limites"], metricas: ["d_ruta", "d_tren", "d_paso"],
    titulo: "B1 · Rutas nacionales y provinciales, ferrocarril y pasos de frontera",
    nota: "Rutas nacionales y provinciales y ferrocarril según el IGN. Las distancias son en línea recta desde cada gobierno local.",
    kpis: v => [
      ["Gobiernos locales", fmt(v.length), "en la selección"],
      ["A ≤5 km de ruta nacional", fmt(cuenta(v, m => m.d_ruta <= 5)), pct(cuenta(v, m => m.d_ruta <= 5), v.length)],
      ["A más de 25 km de ruta nacional", fmt(cuenta(v, m => m.d_ruta > 25)), pct(cuenta(v, m => m.d_ruta > 25), v.length)],
      ["A ≤5 km del ferrocarril", fmt(cuenta(v, m => m.d_tren <= 5)), pct(cuenta(v, m => m.d_tren <= 5), v.length)],
      ["Pasos de frontera", "158", "todo el país"],
      ["A ≤50 km de un paso", fmt(cuenta(v, m => m.d_paso <= 50)), pct(cuenta(v, m => m.d_paso <= 50), v.length)],
    ],
  },
  {
    id: "C", nombre: "C · Red eléctrica", capas: ["lineas_electricas", "estaciones_at", "centrales", "transformadoras", "edenor", "edelap"], capasOff: ["transformadoras", "edenor", "edelap"], metricas: ["d_at", "d_central", "d_transf"],
    titulo: "C1 · Estaciones transformadoras de alta tensión, centrales y líneas de transmisión",
    nota: "Las estaciones de alta tensión (323) vienen de la Secretaría de Energía. El dato se rotula como potencia instalada (MVA, unidad sin confirmar); no indica capacidad libre para nuevas conexiones.",
    kpis: v => [
      ["Estaciones de alta tensión", "323", "Secretaría de Energía"],
      [TEXTOS_PANTALLAS.potencia, "33.013 MVA", "243 estaciones con dato"],
      ["Centrales eléctricas", "445", "todo el país"],
      ["A ≤25 km de una estación AT", fmt(cuenta(v, m => m.d_at <= 25)), pct(cuenta(v, m => m.d_at <= 25), v.length)],
      ["A más de 100 km de una estación AT", fmt(cuenta(v, m => m.d_at > 100)), pct(cuenta(v, m => m.d_at > 100), v.length)],
      ["Distancia media a estación AT", fmt1(prom(v, "d_at")) + " km", "en la selección"],
    ],
  },
  {
    id: "D", nombre: "D · Red de combustibles", capas: ["yacimientos", "ductos", "estaciones_servicio", "tanques"], metricas: ["est10"],
    titulo: "D1 · Yacimientos, ductos, tanques y estaciones de servicio",
    nota: "Yacimientos de hidrocarburos (se marca el centro de cada área), ductos subterráneos y tanques. Estaciones: Energía (empresa y bandera) más puntos IGN sin boca de Energía a menos de 300 m. " + TEXTOS_PANTALLAS.estacionesNota,
    kpis: v => [
      ["Yacimientos", "872", "todo el país"],
      ["Estaciones de servicio", "5.821", "4.607 Energía + 1.214 IGN"],
      ["Tanques de combustible", "1.242", "todo el país"],
      ["Gobiernos locales", fmt(v.length), "en la selección"],
      ["Sin estación de servicio a ≤10 km", fmt(cuenta(v, m => m.est10 === 0)), pct(cuenta(v, m => m.est10 === 0), v.length)],
      ["Con 5 o más a ≤10 km", fmt(cuenta(v, m => m.est10 >= 5)), pct(cuenta(v, m => m.est10 >= 5), v.length)],
    ],
  },
  {
    id: "E", nombre: "E · Red de salud", capas: ["salud"], metricas: ["salud10"],
    titulo: "E1 · Establecimientos de salud",
    nota: "Edificios de salud registrados por el IGN. Cuando hay cruce seguro, la ficha agrega tipología y origen de financiamiento de REFES; no informa nivel de complejidad. " + TEXTOS_PANTALLAS.saludNota,
    kpis: v => [
      ["Establecimientos de salud", "8.311", "todo el país"],
      ["Gobiernos locales", fmt(v.length), "en la selección"],
      ["Sin establecimiento a ≤10 km", fmt(cuenta(v, m => m.salud10 === 0)), pct(cuenta(v, m => m.salud10 === 0), v.length)],
      ["Con 10 o más a ≤10 km", fmt(cuenta(v, m => m.salud10 >= 10)), pct(cuenta(v, m => m.salud10 >= 10), v.length)],
      ["Habitantes sin establecimiento a ≤10 km", fmt(sum(v.filter(m => m.salud10 === 0), m => m.pob)), "en la selección"],
      ["Promedio a ≤10 km", fmt1(prom(v, "salud10")), "por gobierno local"],
    ],
  },
  {
    id: "F", nombre: "F · Industrias", capas: ["parques", "zonas_francas", "fabricas", "universidades"], capasOff: ["universidades"], metricas: ["d_parque", "parq30", "fab20", "univ30"],
    titulo: "F1 · Parques industriales, zonas francas, fábricas y universidades",
    nota: "606 ubicaciones del mapa del Senado (2024), cruzadas con el RENPI (234 coincidencias por nombre y provincia) y el registro bonaerense (78 coincidencias). Siete registros bonaerenses siguen sin ubicar porque la fuente solo indica el municipio. Las marcas muestran las ubicaciones del Senado; fábricas del IGN (un relevamiento cartográfico, no un registro de empresas).",
    kpis: v => [
      ["Parques ubicados", "606", "mapa del Senado, 2024"],
      ["Zonas francas", "13", "todo el país"],
      ["Con un parque a ≤30 km", fmt(cuenta(v, m => m.parq30 > 0)), pct(cuenta(v, m => m.parq30 > 0), v.length)],
      ["Fábricas registradas", "2.226", "IGN, todo el país"],
      ["Con alguna fábrica a ≤20 km", fmt(cuenta(v, m => m.fab20 > 0)), pct(cuenta(v, m => m.fab20 > 0), v.length)],
      ["Con 10 o más fábricas a ≤20 km", fmt(cuenta(v, m => m.fab20 >= 10)), pct(cuenta(v, m => m.fab20 >= 10), v.length)],
    ],
  },
  {
    id: "G", nombre: "G · Parques industriales y nodos logísticos", capas: ["puertos", "aeropuertos", "aerodromos", "peajes", "pesaje", "rutas", "rutas_provinciales", "ferrocarril", "parques"], capasOff: ["aerodromos", "parques"], metricas: ["d_puerto", "d_aero"],
    titulo: "G1 · Puertos, aeropuertos, peajes y estaciones de pesaje",
    nota: "Nodos de transporte y rutas nacionales y provinciales del IGN. Se incorpora la capa de parques industriales.",
    kpis: v => [
      ["Puertos", "155", "todo el país"],
      ["Aeropuertos", "60", "todo el país"],
      ["Peajes", "161", "todo el país"],
      ["A ≤50 km de un puerto", fmt(cuenta(v, m => m.d_puerto <= 50)), pct(cuenta(v, m => m.d_puerto <= 50), v.length)],
      ["A ≤50 km de un aeropuerto", fmt(cuenta(v, m => m.d_aero <= 50)), pct(cuenta(v, m => m.d_aero <= 50), v.length)],
      ["Gobiernos locales", fmt(v.length), "en la selección"],
    ],
  },
  {
    id: "H", nombre: "H · Aduanas", capas: ["aduanas_com", "pasos", "limites", "aduanas", "rutas", "rutas_provinciales"], capasOff: ["aduanas", "rutas", "rutas_provinciales"], metricas: ["d_paso"],
    titulo: "H1 · Comercio exterior por aduana",
    nota: "Cada círculo es una aduana (de registro); su tamaño muestra importaciones IC+IG más exportaciones de 12 meses. Una aduana no es un paso. Las exportaciones por aduana son parciales. " + TEXTOS_PANTALLAS.aduanaNota,
    kpis: () => {
      const a = est.adu;
      if (!a) return [];
      const top = [...a.aduanas].sort((x, y) => y.imp - x.imp)[0];
      const topE = [...a.aduanas].sort((x, y) => y.exp - x.exp)[0];
      const M = v => "US$ " + Math.round(v / 1e6).toLocaleString("es-AR") + " M";
      return [
        ["Aduanas con operaciones", fmt(a.aduanas.length), "incluye zonas francas"],
      ["Importaciones a consumo (IC + IG, FOB)", M(a.imp_total), `${a.desde.slice(4)}/${a.desde.slice(0, 4)} a ${a.hasta.slice(4)}/${a.hasta.slice(0, 4)}`],
        ["Exportaciones por aduana", M(a.exp_total_aduanas), `${Math.round(100 * a.exp_total_aduanas / a.exp_total_nacional)} % del total de ARCA`],
        ["Mayor aduana importadora", top.n, M(top.imp)],
        ["Mayor aduana exportadora", topE.n, M(topE.exp)],
        ["Pasos de frontera", "158", "todo el país"],
      ];
    },
  },
  {
    id: "I", nombre: "I · Comercio global", capas: [], metricas: ["pob"], especial: true,
    titulo: "I1 · Exportaciones por provincia de origen",
    nota: "Exportaciones de bienes según la provincia de origen (INDEC): primer semestre de 2025 y serie anual hasta 2024. El comercio exterior se registra por provincia, no por gobierno local; en esta sección se aplican los filtros de región y de provincia.",
    kpis: () => [],
  },
];


/* ---------- fuentes de cada pantalla (enlaces comprobados; «sin enlace» = no se halló una dirección oficial estable) ---------- */
const F_IGN = { t: "Instituto Geográfico Nacional (IGN) · Capas SIG: ubicación de los gobiernos locales y capas de infraestructura", u: "https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG" };
const F_CENSO = { t: "INDEC · Censo Nacional de Población, Hogares y Viviendas 2022", u: "https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165" };
const F_CODIGOS = { t: "INDEC · Códigos de gobiernos locales del Censo 2022 (planilla)", u: "https://www.indec.gob.ar/ftp/cuadros/geoestadistica/c2022_codigos_gobiernos_locales.xlsx" };
const F_RADIOS = { t: "INDEC · Censo 2022 por radio censal, un archivo por provincia (datos.gob.ar): base de la edad mediana y la población activa por gobierno local", u: "https://datos.gob.ar/dataset/censo-nacional-de-poblacion-hogares-y-viviendas-2022" };
const F_ARCA = { t: "ARCA · Información de comercio exterior (archivos mensuales por aduana, octubre 2025 a septiembre 2026)", u: "https://www.arca.gob.ar/operadoresComercioExterior/informacionAgregada/informacion-agregada.asp" };
const F_ARCA_MAN = { t: "ARCA · Manual de descarga y lectura de los archivos de comercio exterior", u: "https://www.arca.gob.ar/operadoresComercioExterior/documentos/Procedimiento-descarga-y-lectura-archivos-de-ComExAFIP-2018.pdf" };
const F_ARCA_COD = { t: "ARCA · Códigos de aduanas y de países (anexo de la RG 1452)", u: "https://www.arca.gob.ar/Aplicativos/oProgramasAduaneros/prestadores/rg1452.zip" };
const F_SENADO = { t: "Mapa de Parques Industriales de la Argentina · Comisión de Industria y Comercio del Senado (archivo del 24/06/2024; copia local de datos-origen/parques.kml)" };
const F_RENPI = { t: "Secretaría de Industria y Comercio · Registro Nacional de Parques Industriales (RENPI), con la base descargable", u: "https://datos.gob.ar/dataset/registro-nacional-de-parques-industriales-renpi" };
const F_BA_PARQUES = { t: "Provincia de Buenos Aires · Agrupamientos industriales aprobados por decreto (CSV; nombre y municipio, sin coordenadas)", u: "https://catalogo.datos.gba.gob.ar/dataset/348dddc1-9578-4fad-9349-6b8bb72630dc/resource/0945236f-6aea-4ff3-8899-41c347c2b0f9/download/agrupamientos-industriales-aprobados-por-decreto-2026.csv" };
const F_SF_PARQUES = { t: "Santa Fe · Parques y áreas industriales, capa geográfica del geoportal IDESF", u: "https://aswe.santafe.gov.ar/idesf/wms?service=WMS&request=GetCapabilities" };
const F_ENERGIA = { t: "Secretaría de Energía · Transporte eléctrico de alta tensión: estaciones transformadoras (potencia instalada; unidad MVA sin confirmar)", u: "https://datos.gob.ar/dataset/transporte-electrico-at-estaciones-transformadoras" };
const F_OPEX = { t: "INDEC · Origen provincial de las exportaciones (informe con anexo de cuadros)", u: "https://www.indec.gob.ar/uploads/informesdeprensa/opex_03_26929F77A2CA.pdf" };
const F_INDEC_CE = { t: "INDEC · Comercio exterior (estadísticas y publicaciones)", u: "https://www.indec.gob.ar/indec/web/Nivel3-Tema-3-2" };
const F_EPH = { t: "INDEC · Encuesta Permanente de Hogares, 2.º trimestre de 2026 (cuadros 3.2 y 3.3): comparación que se ve en la ficha de los gobiernos locales de 31 aglomerados", u: "https://www.indec.gob.ar/uploads/informesdeprensa/mercado_trabajo_eph_2trim26433FCBC5A8.pdf" };
const F_MIC = { t: "Mapa de Inteligencia Competitiva de Paraguay (el modelo que sigue esta versión)", u: "https://www.mic.gov.py/mapamic/" };
const F_ENERGIA_COMB = { t: "Secretaría de Energía · Precios en surtidor (empresa y bandera) y puntos de servicio", u: "https://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17" };
const F_ENERGIA_RED = { t: "Secretaría de Energía · Subestaciones de distribución de Edenor", u: "https://datos.energia.gob.ar/dataset/70f994f6-fde6-4e09-b3a4-72f5f7145181" };
const F_ENERGIA_EDELAP = { t: "Secretaría de Energía · Subestaciones de distribución de Edelap", u: "https://datos.energia.gob.ar/dataset/2e0fe150-8cf4-4707-927d-94bfaf95bb53" };
const F_REFES = { t: "Ministerio de Salud · Registro Federal de Establecimientos de Salud (REFES), corte 27/12/2024", u: "https://datos.salud.gob.ar/dataset/336cf4d9-447a-44c4-8e34-0ba1fc293d55" };
const F_IGN_RUTAS = { t: "IGN · Red vial provincial (WFS)", u: "https://wms.ign.gob.ar/geoserver/ows" };
const F_IGN_LIMITES = { t: "IGN · Límites internacionales y departamentos (WFS)", u: "https://wms.ign.gob.ar/geoserver/ows" };
const F_INDEC_SEXO = { t: "INDEC · Censo 2022, sexo registrado al nacer y radios censales", u: "https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165" };
const FUENTES = {
  A: [F_CENSO, F_CODIGOS, F_RADIOS, F_INDEC_SEXO, F_EPH, F_IGN, F_MIC],
  B: [F_IGN, F_IGN_RUTAS, F_IGN_LIMITES],
  C: [F_ENERGIA, F_ENERGIA_RED, F_ENERGIA_EDELAP, F_IGN],
  D: [F_IGN, F_ENERGIA_COMB],
  E: [F_IGN, F_REFES],
  F: [F_IGN, F_SENADO, F_RENPI, F_BA_PARQUES, F_SF_PARQUES],
  G: [F_IGN, F_IGN_RUTAS],
  H: [F_ARCA, F_ARCA_MAN, F_ARCA_COD, F_INDEC_CE, F_IGN, F_IGN_LIMITES],
  I: [F_OPEX, F_INDEC_CE],
};

/* ---------- estado ---------- */
const est = {
  tab: "A", munis: [], prov: [], resumenProv: [], cobertura: null, saludRefes: null,
  f: { reg: "", prov: "", tipo: "", pob: "", ba: "", cor: "", ros: "", dato: "" },
  metrica: "pob", orden: "desc", nRank: 15, activas: {}, cache: {}, vis: [],
};

let mapa, paneles = {}, grupoMunis, grupoProv, gruposCapa = {}, popup;

/* ---------- carga ---------- */
async function json(nombre) {
  if (est.cache[nombre]) return est.cache[nombre];
  const r = await fetch("datos/" + nombre);
  if (!r.ok) throw new Error("No se pudo cargar " + nombre);
  return (est.cache[nombre] = await r.json());
}

async function iniciar() {
  armarPestanas();
  armarFiltros();
  armarMapa();
  try {
    [est.munis, est.resumenProv, est.cobertura] = await Promise.all([json("municipios.json"), json("provincias_resumen.json"), json("sin_ubicacion.json")]);
    est.prov = await json("capa_provincias.json");
  } catch (e) {
    $("#kpis").innerHTML = `<p class="nota">No se pudieron cargar los datos. ${esc(e.message)}</p>`;
    return;
  }
  llenarProvincias();
  pieCobertura();
  const h = (location.hash || "").replace("#", "").toUpperCase();
  est.tab = TABS.some(t => t.id === h) ? h : "A";
  cambiarTab(est.tab, true);
}

/* ---------- pestañas ---------- */
function armarPestanas() {
  const nav = $("#pestanas");
  nav.setAttribute("role", "tablist");
  nav.innerHTML = TABS.map(t => `<button role="tab" type="button" data-tab="${t.id}" aria-selected="false">${esc(t.nombre)}</button>`).join("");
  nav.addEventListener("click", e => {
    const b = e.target.closest("button[data-tab]");
    if (b) cambiarTab(b.dataset.tab);
  });
}

async function cambiarTab(id, inicial) {
  est.tab = id;
  const t = TABS.find(x => x.id === id);
  if (!inicial) history.replaceState(null, "", "#" + id);
  document.querySelectorAll("#pestanas button").forEach(b => {
    const on = b.dataset.tab === id;
    b.setAttribute("aria-selected", on);
    if (on && !inicial) b.scrollIntoView({ inline: "center", block: "nearest" });
  });
  est.metrica = t.metricas[0];
  est.orden = METRICAS[est.metrica].dir;
  est.nRank = 15;
  est.activas = Object.fromEntries(t.capas.map(c => [c, !(t.capasOff || []).includes(c)]));
  $("#tituloMapa").textContent = t.titulo;
  $("#notaMapa").textContent = t.nota;
  dibujarAviso(id);
  $("#seccionProvincias").hidden = true; // lo reemplaza el gráfico A2
  dibujarFuentes(t);
  armarSelectorCapas(t);
  await aplicar(true);
}

function dibujarFuentes(t) {
  const el = $("#fuentesPantalla");
  if (!el) return;
  const lista = FUENTES[t.id] || [];
  $("#listaFuentes").innerHTML = lista.map(f => `<li>${f.u ? `<a href="${esc(f.u)}" target="_blank" rel="noopener noreferrer">${esc(f.t)}</a>` : esc(f.t)}</li>`).join("");
  el.hidden = !lista.length;
}

function armarSelectorCapas(t) {
  $("#capas").innerHTML = t.capas.map(c => {
    const d = CAPAS[c];
    return `<label><input type="checkbox" data-capa="${c}" ${est.activas[c] ? "checked" : ""}><i style="background:${d.c}"></i>${esc(d.n)}</label>`;
  }).join("");
  $("#capas").hidden = true; // las capas se manejan desde el panel «Capas» del mapa
  armarPanelCapas(t);
}

/* ---------- filtros ---------- */
function opciones(sel, lista, textoTodos) {
  sel.innerHTML = `<option value="">${textoTodos}</option>` + lista.map(o => `<option value="${esc(o.id)}">${esc(o.l)}</option>`).join("");
}

function armarFiltros() {
  $("#fRegion").innerHTML = `<option value="">Todas</option>` + Object.keys(REGIONES).map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join("");
  opciones($("#fTipo"), TIPOS_GRUPOS.map(g => ({ id: g.id, l: g.nombre })), "Todos");
  opciones($("#fPob"), RANGOS_POB, "Todas");
  for (const [id, k] of [["#fBA", "ba"], ["#fCOR", "cor"], ["#fROS", "ros"]]) opciones($(id), RANGOS_DIST, "Todas");

  const mapaIds = { fRegion: "reg", fProvincia: "prov", fTipo: "tipo", fPob: "pob", fBA: "ba", fCOR: "cor", fROS: "ros", fDato: "dato" };
  for (const [id, k] of Object.entries(mapaIds)) {
    $("#" + id).addEventListener("change", e => { est.f[k] = e.target.value; est.nRank = 15; aplicar(false, true); });
  }
  $("#btnFiltros").addEventListener("click", () => {
    const abierto = $("#filtrosCuerpo").classList.toggle("abierto");
    $("#btnFiltros").setAttribute("aria-expanded", abierto);
  });
  $("#btnMas").addEventListener("click", () => {
    const m = $("#masFiltros");
    m.hidden = !m.hidden;
    $("#btnMas").textContent = m.hidden ? "Mostrar más filtros" : "Mostrar menos filtros";
  });
  $("#btnLimpiar").addEventListener("click", () => {
    for (const k of Object.keys(est.f)) est.f[k] = "";
    for (const id of Object.keys(mapaIds)) $("#" + id).value = "";
    est.nRank = 15;
    aplicar(false, true);
  });

  $("#capas").addEventListener("change", async e => {
    const c = e.target.dataset.capa;
    if (!c) return;
    est.activas[c] = e.target.checked;
    await dibujarCapas();
  });

  $("#btnOrden").addEventListener("click", () => { est.orden = est.orden === "desc" ? "asc" : "desc"; dibujarRanking(); });
  $("#btnMasRanking").addEventListener("click", () => { est.nRank += 15; dibujarRanking(); });

  /* buscador */
  const inp = $("#buscar"), lista = $("#sugerencias");
  inp.addEventListener("input", () => {
    const q = norm(inp.value.trim());
    if (q.length < 2) { lista.hidden = true; return; }
    const res = est.munis.filter(m => norm(m.n).includes(q)).sort((a, b) => (norm(a.n).startsWith(q) ? 0 : 1) - (norm(b.n).startsWith(q) ? 0 : 1) || (b.pob || 0) - (a.pob || 0)).slice(0, 8);
    lista.innerHTML = res.length
      ? res.map(m => `<li><button type="button" data-cod="${m.c}">${esc(m.n)}<small>${esc(m.pv)} · ${m.pob != null ? fmt(m.pob) + " hab." : "sin dato de población"}</small></button></li>`).join("")
      : `<li><button type="button" disabled>Sin resultados</button></li>`;
    lista.hidden = false;
  });
  lista.addEventListener("click", e => {
    const b = e.target.closest("button[data-cod]");
    if (!b) return;
    lista.hidden = true;
    inp.value = "";
    irA(est.munis.find(m => m.c === b.dataset.cod));
  });
  document.addEventListener("click", e => { if (!e.target.closest(".buscador")) lista.hidden = true; });

  /* botones "Ver ficha" dentro de popups y listas */
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-ficha]");
    if (b) abrirFicha(est.munis.find(m => m.c === b.dataset.ficha));
    const p = e.target.closest("[data-filtrar-prov]");
    if (p) { setProvincia(p.dataset.filtrarProv); mapa.closePopup(); }
  });
}

function llenarProvincias() {
  const lista = [...est.resumenProv].sort((a, b) => a.pv.localeCompare(b.pv, "es"));
  $("#fProvincia").innerHTML = `<option value="">Todas</option>` + lista.map(p => `<option value="${esc(p.pv)}">${esc(p.pv.replace("Tierra del Fuego, Antártida e Islas del Atlántico Sur", "Tierra del Fuego"))}</option>`).join("");
}

function setProvincia(pv) {
  est.f.prov = pv;
  $("#fProvincia").value = pv;
  aplicar(false, true);
}

function filtrar() {
  const f = est.f;
  const grupo = TIPOS_GRUPOS.find(g => g.id === f.tipo);
  const rp = RANGOS_POB.find(r => r.id === f.pob);
  const rd = k => RANGOS_DIST.find(r => r.id === f[k]);
  const [rba, rcor, rros] = [rd("ba"), rd("cor"), rd("ros")];
  return est.munis.filter(m => {
    if (f.reg && REGION_DE[m.pv] !== f.reg) return false;
    if (f.prov && m.pv !== f.prov) return false;
    if (grupo && !grupo.cods.includes(m.t)) return false;
    if (rp && (m.pob == null || m.pob < rp.min || m.pob >= rp.max)) return false;
    if (rba && (m.d_ba < rba.min || m.d_ba >= rba.max)) return false;
    if (rcor && (m.d_cor < rcor.min || m.d_cor >= rcor.max)) return false;
    if (rros && (m.d_ros < rros.min || m.d_ros >= rros.max)) return false;
    if (f.dato === "si" && m.pob == null) return false;
    if (f.dato === "no" && m.pob != null) return false;
    return true;
  });
}

/* ---------- aplicar filtros / redibujar ---------- */
async function aplicar(reencuadrar, conFiltro) {
  est.vis = filtrar();
  if (est.tab === "H" && !est.adu) { try { est.adu = await json("aduanas_comercio.json"); } catch (e) { /* se muestra sin datos de aduanas */ } }
  if (est.tab === "E" && !est.saludRefes) { try { est.saludRefes = await json("capa_salud_refes.json"); } catch (e) { /* capa principal sigue disponible */ } }
  const activos = Object.values(est.f).filter(Boolean).length;
  $("#contFiltros").hidden = !activos;
  $("#contFiltros").textContent = activos;
  const t = TABS.find(x => x.id === est.tab);
  if (t.especial) {
    await dibujarEspecial(t);
    if (reencuadrar || conFiltro) encuadrar(conFiltro && !!est.f.prov);
    dibujarWidgets(t);
    return;
  }
  dibujarKpis(t);
  dibujarMunis(t);
  dibujarProvincias(t);
  dibujarRanking();
  dibujarBarras();
  dibujarLeyenda(t);
  await dibujarCapas();
  if (reencuadrar || conFiltro) encuadrar(conFiltro && activos > 0);
  dibujarWidgets(t);
}

function encuadrar(aVisibles) {
  mapa.invalidateSize();
  const pts = est.vis.map(m => [m.la, m.lo]);
  if (aVisibles && pts.length) {
    mapa.fitBounds(L.latLngBounds(pts).pad(0.15), { maxZoom: 9, animate: true });
  } else {
    let b = est.inicio;
    if (!b) {
      try { const g = JSON.parse(localStorage.getItem("mapa-ar-inicio") || "null"); if (g) b = L.latLngBounds(g); } catch (e) { /* sin almacenamiento */ }
    }
    mapa.fitBounds(b || [[-55, -73.8], [-21.7, -53.6]], { animate: true });
  }
}

function dibujarKpis(t) {
  $("#kpis").innerHTML = t.kpis(est.vis).map(([l, v, s]) => `<div class="kpi" title="${esc(l)}: ${esc(s)}"><small>${esc(l)}</small><strong${String(v).length > 12 ? ' class="largo"' : ""}>${esc(v)}</strong><span>${esc(s)}</span><em class="info" aria-hidden="true">i</em></div>`).join("");
}

/* ---------- mapa ---------- */
function armarMapa() {
  mapa = L.map("mapa", { zoomControl: true, minZoom: 3, maxZoom: 14, preferCanvas: true, worldCopyJump: false });
  mapa.fitBounds([[-55, -73.8], [-21.7, -53.6]]);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapa);
  for (const [n, z] of [["prov", 250], ["lineas", 410], ["puntos", 420], ["munis", 430]]) {
    mapa.createPane(n).style.zIndex = z;
    paneles[n] = L.canvas({ pane: n, padding: 0.4 });
  }
  const Ctl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const caja = L.DomUtil.create("div", "leaflet-bar");
      const boton = (txt, titulo, fn, html) => {
        const a = L.DomUtil.create("a", "ctl-mapa", caja);
        a.href = "#"; a.title = titulo; a.setAttribute("role", "button"); a.setAttribute("aria-label", titulo); if (html) a.innerHTML = html; else a.textContent = txt;
        L.DomEvent.on(a, "click", e => { L.DomEvent.stop(e); fn(); });
      };
      boton("⌂", "Ver todo el país", () => encuadrar(false));
      boton("", "Pantalla completa", alternarPantallaCompleta, '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/></svg>');
      return caja;
    },
  });
  mapa.addControl(new Ctl());
  agregarControlesMapa();
  grupoProv = L.layerGroup().addTo(mapa);
  grupoMunis = L.layerGroup().addTo(mapa);
  popup = L.popup({ maxWidth: 260 });
}

function alternarPantallaCompleta() {
  const caja = $("#mapaCaja");
  const activa = document.fullscreenElement === caja || caja.classList.contains("pantalla-completa");
  if (activa) {
    caja.classList.remove("pantalla-completa");
    if (document.fullscreenElement) document.exitFullscreen();
  } else if (caja.requestFullscreen) {
    caja.requestFullscreen().catch(() => caja.classList.add("pantalla-completa"));
  } else {
    caja.classList.add("pantalla-completa");
  }
  setTimeout(() => mapa.invalidateSize(), 250);
}
document.addEventListener("fullscreenchange", () => setTimeout(() => mapa.invalidateSize(), 250));
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && $("#mapaCaja").classList.contains("pantalla-completa")) alternarPantallaCompleta();
});

function popupMuni(m) {
  const pob = m.pob != null ? `${fmt(m.pob)} habitantes` : "Sin dato de población";
  return `<div class="pop"><b>${esc(m.n)}</b><small>${esc(TIPO_NOMBRE[m.t] || m.t)} · ${esc(m.pv)}</small><br>${pob}<br><button type="button" data-ficha="${m.c}">Ver ficha</button></div>`;
}

function irA(m) {
  if (!m) return;
  $("#mapa").scrollIntoView({ block: "center", behavior: "smooth" });
  mapa.flyTo([m.la, m.lo], Math.max(mapa.getZoom(), 9), { duration: 0.8 });
  popup.setLatLng([m.la, m.lo]).setContent(popupMuni(m)).openOn(mapa);
}

/* escala de color de los círculos en la pantalla A: habitantes (cortes fijos) o el indicador elegido (cortes por quintiles de la selección) */
function escalaMapa() {
  const k = est.metrica, met = METRICAS[k];
  if (k === "pob") return { k, titulo: "Habitantes", cortes: CORTES_POB, et: ["Menos de 2.000", "2.000 a 10.000", "10.000 a 50.000", "50.000 a 200.000", "Más de 200.000"] };
  const v = est.vis.map(m => m[k]).filter(x => x != null).sort((a, b) => a - b);
  const cortes = [0.2, 0.4, 0.6, 0.8].map(q => (v.length ? v[Math.floor(q * (v.length - 1))] : 0));
  const f = x => (met.dec ? fmt1(x) : fmt(x));
  return { k, titulo: met.l + (met.u ? " (" + met.u.trim() + ")" : ""), cortes,
    et: [`Menos de ${f(cortes[0])}`, `${f(cortes[0])} a ${f(cortes[1])}`, `${f(cortes[1])} a ${f(cortes[2])}`, `${f(cortes[2])} a ${f(cortes[3])}`, `${f(cortes[3])} o más`] };
}
function htmlRampa(t) {
  if (!t.coropleta) return "";
  const e = escalaMapa();
  return `<p class="rotulo">${esc(e.titulo)}</p>` + RAMPA.map((c, i) => `<span class="leg"><i style="background:${c}"></i>${esc(e.et[i])}</span>`).join("") + `<span class="leg"><i style="background:#b8bcc4"></i>Sin dato</span>`;
}

function dibujarMunis(t) {
  grupoMunis.clearLayers();
  const colorear = t.coropleta;
  const esc_ = colorear ? escalaMapa() : null;
  const orden = [...est.vis].sort((a, b) => (b.pob || 0) - (a.pob || 0)); // los grandes abajo, los chicos arriba
  for (const m of orden) {
    let r, col, borde, op;
    if (colorear) {
      const val = m[esc_.k];
      const c = val == null ? -1 : claseDe(val, esc_.cortes);
      r = m.pob == null ? 3 : Math.min(20, Math.max(3, Math.sqrt(m.pob) / 55));
      col = c < 0 ? "#b8bcc4" : RAMPA[c];
      borde = "#0b1d3a"; op = 0.85;
    } else {
      r = 2; col = "#9aa3b5"; borde = "#fffefb"; op = 0.55;
    }
    const mk = L.circleMarker([m.la, m.lo], { renderer: paneles.munis, pane: "munis", radius: r, color: borde, weight: colorear ? 0.7 : 0.4, opacity: colorear ? 0.6 : 1, fillColor: col, fillOpacity: op });
    mk.on("click", () => popup.setLatLng([m.la, m.lo]).setContent(popupMuni(m)).openOn(mapa));
    grupoMunis.addLayer(mk);
  }
}

function dibujarProvincias(t) {
  grupoProv.clearLayers();
  if (t.especial) { dibujarProvinciasComercio(); return; }
  const porCod = Object.fromEntries(est.resumenProv.map(p => [p.pc, p]));
  const pobs = est.resumenProv.map(p => p.pob).sort((a, b) => a - b);
  const cortes = [0.2, 0.4, 0.6, 0.8].map(q => pobs[Math.floor(q * (pobs.length - 1))]);
  for (const p of est.prov) {
    const r = porCod[p.c];
    const fill = t.coropleta && est.metrica === "pob" && r ? RAMPA[claseDe(r.pob, cortes)] : "#fffefb";
    const sel = est.f.prov && r && r.pv === est.f.prov;
    const poly = L.polygon(p.r.map(anillo => anillo.map(([x, y]) => [y, x])), {
      renderer: paneles.prov, pane: "prov", color: sel ? "#9b2c22" : "#46567a", weight: sel ? 2.2 : 0.8, fillColor: fill, fillOpacity: t.coropleta && est.metrica === "pob" ? 0.45 : 0.05,
    });
    poly.on("click", e => {
      if (!r) return;
      popup.setLatLng(e.latlng).setContent(`<div class="pop"><b>${esc(r.pv)}</b>${fmt(r.pob)} habitantes<br><small>${fmt(r.gl)} gobiernos locales con ubicación</small><br><button type="button" data-filtrar-prov="${esc(r.pv)}">Filtrar por esta provincia</button></div>`).openOn(mapa);
    });
    grupoProv.addLayer(poly);
  }
}

async function dibujarCapas() {
  const t = TABS.find(x => x.id === est.tab);
  const marca = est.tab;
  for (const [id, g] of Object.entries(gruposCapa)) { mapa.removeLayer(g); }
  gruposCapa = {};
  for (const c of t.capas) {
    if (!est.activas[c]) continue;
    const def = CAPAS[c];
    let datos;
    try { datos = await json(def.f); } catch { continue; }
    if (est.tab !== marca) return; // el usuario ya cambió de pestaña
    const agrupar = def.t === "puntos" && datos.length > 700 && typeof L.markerClusterGroup === "function";
    const g = agrupar ? L.markerClusterGroup({
      chunkedLoading: true, showCoverageOnHover: false, disableClusteringAtZoom: 9, maxClusterRadius: 48,
      iconCreateFunction: c => L.divIcon({ html: `<span>${c.getChildCount()}</span>`, className: "cluster-neeti", iconSize: [34, 34] }),
    }) : L.layerGroup();
    const lote = [];
    if (def.t === "aduanas") {
      const ok = pcsPermitidos();
      const lista = datos.aduanas.filter(a => !ok || ok.has(a.pc));
      const max = Math.max(...lista.map(a => a.imp + a.exp), 1);
      for (const a of lista) {
        const mk = L.circleMarker([a.la, a.lo], { renderer: paneles.puntos, pane: "puntos", radius: 5 + 20 * Math.sqrt((a.imp + a.exp) / max), color: "#ffffff", weight: 1, fillColor: a.zf ? "#c4892b" : def.c, fillOpacity: 0.62 });
        mk.on("click", () => popup.setLatLng([a.la, a.lo]).setContent(`<div class="pop"><b>${esc(a.n)}</b><small>${a.zf ? "Zona franca" : "Aduana"}${a.ap ? " · ubicación aproximada" : ""}</small><br>Importaciones IC + IG (FOB) ${mill(a.imp / 1e6)}<br>Exportaciones ${mill(a.exp / 1e6)}<br><button type="button" data-adu="${a.c}">Ver detalle</button></div>`).openOn(mapa));
        g.addLayer(mk);
      }
    } else if (def.t === "lineas") {
      g.addLayer(L.polyline(datos.map(l => l.map(([x, y]) => [y, x])), { renderer: paneles.lineas, pane: "lineas", color: def.c, weight: def.w, opacity: 0.85, dashArray: def.dash || null, interactive: false, smoothFactor: 1.2 }));
    } else {
      for (const [i, p] of datos.entries()) {
        const mk = L.circleMarker([p[0], p[1]], { renderer: paneles.puntos, pane: "puntos", radius: def.r, color: "#ffffff", weight: 0.6, fillColor: def.c, fillOpacity: 0.9 });
        mk.on("click", () => {
          const detalle = def.info(p, i);
          popup.setLatLng([p[0], p[1]]).setContent(`<div class="pop"><b>${esc(detalle.t)}</b>${detalle.s ? `<small>${esc(detalle.s)}</small><br>` : ""}${detalle.x ? esc(detalle.x) : ""}<br><small>${esc(def.n)}</small></div>`).openOn(mapa);
        });
        lote.push(mk);
      }
      if (agrupar) g.addLayers(lote); else lote.forEach(m => g.addLayer(m));
    }
    g.addTo(mapa);
    gruposCapa[c] = g;
  }
}

function dibujarLeyenda(t) {
  const el = $("#leyenda");
  if (t.coropleta) {
    const e = escalaMapa();
    el.innerHTML = `<b>${esc(e.titulo)}</b><br>` + RAMPA.map((c, i) => `<i style="background:${c}"></i>${esc(e.et[i])}`).join("<br>") + `<br><i style="background:#b8bcc4"></i>Sin dato`;
  } else {
    el.innerHTML = "";
  }
}

/* ---------- ranking ---------- */
function dibujarRanking() {
  const t = TABS.find(x => x.id === est.tab);
  const met = METRICAS[est.metrica];
  const filas = est.vis.filter(m => m[est.metrica] != null).sort((a, b) => (est.orden === "desc" ? b[est.metrica] - a[est.metrica] : a[est.metrica] - b[est.metrica]) || (b.pob || 0) - (a.pob || 0));

  const sel = t.metricas.length > 1
    ? `<select id="selMetrica" aria-label="Indicador">${t.metricas.map(k => `<option value="${k}" ${k === est.metrica ? "selected" : ""}>${esc(METRICAS[k].l)}</option>`).join("")}</select>`
    : esc(met.l);
  $("#tituloRanking").innerHTML = `Gobiernos locales · ${sel}`;
  const s = $("#selMetrica");
  if (s) s.addEventListener("change", e => {
    est.metrica = e.target.value; est.orden = METRICAS[est.metrica].dir; est.nRank = 15; dibujarRanking();
    if (t.coropleta) { dibujarMunis(t); dibujarProvincias(t); dibujarLeyenda(t); armarPanelCapas(t); }
  });

  $("#btnOrden").hidden = false;
  $("#btnOrden").textContent = est.orden === "desc" ? "De mayor a menor" : "De menor a mayor";
  const ver = filas.slice(0, est.nRank);
  $("#ranking").innerHTML = ver.length
    ? ver.map((m, i) => `<li><button type="button" data-ir="${m.c}"><span class="pos">${i + 1}</span><span class="nom">${esc(m.n)}<small>${esc(m.pv)}${est.metrica !== "pob" && m.pob != null ? " · " + fmt(m.pob) + " hab." : ""}</small></span><span class="val">${(met.dec ? fmt1 : fmt)(m[est.metrica])}${met.u}</span></button></li>`).join("")
    : `<li class="nota">No hay gobiernos locales con estos filtros.</li>`;
  $("#btnMasRanking").hidden = filas.length <= est.nRank;
  $("#btnMasRanking").textContent = `Ver más (${fmt(filas.length - est.nRank)} restantes)`;
}
$("#ranking").addEventListener("click", e => {
  const b = e.target.closest("[data-ir]");
  if (b) irA(est.munis.find(m => m.c === b.dataset.ir));
  const c = e.target.closest("[data-com]");
  if (c) abrirFichaComercio(c.dataset.com);
});
document.addEventListener("click", e => {
  const c = e.target.closest("#mapa [data-com], .leaflet-popup [data-com]");
  if (c) abrirFichaComercio(c.dataset.com);
});

/* ---------- barras por provincia ---------- */
function dibujarBarras() {
  const por = {};
  for (const m of est.vis) {
    const r = (por[m.pv] ||= { pv: m.pv, pob: 0, gl: 0 });
    r.pob += m.pob || 0; r.gl++;
  }
  const lista = Object.values(por).sort((a, b) => b.pob - a.pob);
  const max = lista[0]?.pob || 1;
  $("#barrasProv").innerHTML = lista.map(r => {
    const nombre = r.pv.replace("Tierra del Fuego, Antártida e Islas del Atlántico Sur", "Tierra del Fuego");
    return `<li><button type="button" data-prov="${esc(r.pv)}"><div class="fila"><span>${esc(nombre)} <small>(${fmt(r.gl)} gob. locales)</small></span><span>${fmt(r.pob)}</span></div><div class="riel"><b style="width:${Math.max(1, (100 * r.pob) / max)}%"></b></div></button></li>`;
  }).join("");
}
$("#barrasProv").addEventListener("click", e => {
  const b = e.target.closest("[data-prov]");
  if (b) setProvincia(b.dataset.prov);
});

/* ---------- ficha ---------- */
async function abrirFicha(m) {
  if (!m) return;
  if (m.eph && !est.eph) { try { est.eph = await json("eph_aglomerados.json"); } catch (e) { /* se muestra sin la comparación */ } }
  mapa.closePopup();
  const km = v => (v == null ? "—" : fmt(v) + " km");
  const dato = (l, v) => `<div><dt>${esc(l)}</dt><dd>${v}</dd></div>`;
  $("#fichaCuerpo").className = "ficha-cuerpo";
  $("#fichaCuerpo").innerHTML = `
    <h3>${esc(m.n)}</h3>
    <p class="sub">${esc(TIPO_NOMBRE[m.t] || m.t)} · ${esc(m.pv)}</p>
    <dl>
      ${dato("Habitantes", m.pob != null ? fmt(m.pob) : "Sin dato")}
      ${dato("Viviendas", m.viv != null ? fmt(m.viv) : "Sin dato")}
      ${dato(TEXTOS_PANTALLAS.hombres, m.hom != null ? fmt(m.hom) : TEXTOS_PANTALLAS.sinDatoPropio)}
      ${dato(TEXTOS_PANTALLAS.mujeres, m.muj != null ? fmt(m.muj) : TEXTOS_PANTALLAS.sinDatoPropio)}
      ${dato("Habitantes por vivienda", m.pob != null && m.viv ? fmt1(m.pob / m.viv) : "—")}
      ${dato("Código INDEC", esc(m.c))}
    </dl>
    <h4>Población y trabajo</h4>
    <dl>
      ${dato("Edad mediana", m.em != null ? m.em + " años" : "Sin dato")}
      ${dato("Población económicamente activa", m.pea != null ? fmt(m.pea) : "Sin dato")}
      ${dato(TEXTOS_PANTALLAS.tasa14, m.pea_t != null ? fmt1(m.pea_t) + " %" : "Sin dato")}
      ${dato(TEXTOS_PANTALLAS.tasaTotal, m.pea != null && (m.pob_r || m.pob) ? fmt1((100 * m.pea) / (m.pob_r || m.pob)) + " %" : "Sin dato")}
      ${dato("Desocupación (sobre la población activa)", m.des_t != null ? fmt1(m.des_t) + " %" : "Sin dato")}
    </dl>
    <p class="nota" style="padding:0">${origenDemografico(m)} ${TEXTOS_PANTALLAS.notaSexo}</p>
    ${bloqueEPH(m)}
    <h4>Distancia a las grandes ciudades</h4>
    <dl>${dato("Buenos Aires", km(m.d_ba))}${dato("Córdoba", km(m.d_cor))}${dato("Rosario", km(m.d_ros))}</dl>
    <h4>Transporte y logística</h4>
    <dl>
      ${dato("Ruta nacional más cercana", km(m.d_ruta))}
      ${dato("Ferrocarril más cercano", km(m.d_tren))}
      ${dato("Puerto más cercano", `${km(m.d_puerto)}<br><small>${esc(m.puerto)}</small>`)}
      ${dato("Aeropuerto más cercano", `${km(m.d_aero)}<br><small>${esc(m.aero)}</small>`)}
      ${dato("Paso de frontera más cercano", `${km(m.d_paso)}<br><small>${esc(m.paso)}</small>`)}
    </dl>
    <h4>Energía</h4>
    <dl>${dato("Estación de alta tensión más cercana", `${km(m.d_at)}<br><small>${esc(m.at)}</small>`)}${dato("Central eléctrica más cercana", km(m.d_central))}${dato("Planta transformadora más cercana (IGN)", km(m.d_transf))}</dl>
    <h4>Industria</h4>
    <dl>${dato("Parque industrial más cercano", `${km(m.d_parque)}<br><small>${esc(m.parque)}</small>`)}${dato("Parques industriales a ≤30 km", fmt(m.parq30))}</dl>
    <h4>Servicios en el entorno</h4>
    <dl>${dato("Establecimientos de salud a ≤10 km", fmt(m.salud10))}${dato("Fábricas a ≤20 km", fmt(m.fab20))}${dato("Estaciones de servicio a ≤10 km", fmt(m.est10))}</dl>
    <p class="nota" style="padding:0">Distancias en línea recta desde el punto que el IGN asigna al gobierno local.</p>`;
  const d = $("#ficha");
  if (!d.open) d.showModal();
  d.scrollTop = 0;
}
$("#ficha").addEventListener("click", e => { if (e.target === $("#ficha")) $("#ficha").close(); });

function bloqueEPH(m) {
  const a = m.eph && est.eph && est.eph.aglomerados[m.eph];
  if (!a) return "";
  const pc = v => fmt1(v) + " %";
  const ag = a.n === m.n ? "" : ` (aglomerado ${esc(a.n)})`;
  return `<h4>Encuesta Permanente de Hogares · INDEC · ${esc(est.eph.periodo)}${ag}</h4>
    <dl>
      <div><dt>Tasa de actividad (sobre la población total)</dt><dd>${pc(a.act)}</dd></div>
      <div><dt>Tasa de empleo</dt><dd>${pc(a.emp)}</dd></div>
      <div><dt>Desocupación</dt><dd>${pc(a.des)}</dd></div>
      <div><dt>Población del aglomerado</dt><dd>${fmt(a.pob)}</dd></div>
      <div><dt>Población económicamente activa</dt><dd>${fmt(a.pea)}</dd></div>
    </dl>
    <p class="nota" style="padding:0">Estas cifras no coinciden con las del Censo y no es un error: la Encuesta de Hogares es una muestra trimestral (hay un margen de error), mide el conjunto del aglomerado, que puede incluir otros gobiernos locales, y calcula la actividad sobre la población total. El Censo 2022 es de mayo de 2022 y cuenta a todos los habitantes; su tasa de actividad se calcula sobre los de 14 años y más. Sólo existe para 31 aglomerados urbanos.</p>`;
}

function origenDemografico(m) {
  if (m.fx === "radios") return `Censo 2022, calculado por radio censal${m.comp > 0 ? ` (el ${fmt1(m.comp)} % de la población está en radios compartidos con otro gobierno local y se repartió según las viviendas)` : ""}.`;
  if (m.fx === "oficial") return "Censo 2022: dato oficial del INDEC para toda la Ciudad Autónoma de Buenos Aires.";
  if (m.fx === "dpto") return `Censo 2022, sin dato propio: son valores del departamento ${esc(m.dpn || "")} (el cuadro por radios no incluye este gobierno local).`;
  return "";
}

/* ---------- pie ---------- */
function pieCobertura() {
  const c = est.cobertura;
  const sinDato = est.munis.filter(m => m.pob == null).length;
  $("#pieCobertura").innerHTML = `<strong>Cobertura.</strong> El Censo 2022 contó ${fmt(c.total_censo)} personas; el mapa ubica a ${fmt(c.total_mapa)} (${(100 * c.total_mapa / c.total_censo).toFixed(1).replace(".", ",")} %). El resto vive en zonas «sin gobierno local» o con gobierno local indeterminado (${fmt(c.sin_gobierno_local.reduce((s, x) => s + x.pob, 0))} personas) o en ${c.sin_ubicacion.length} gobiernos locales que el IGN no ubica en el mapa (${c.sin_ubicacion.map(x => esc(x.n) + ", " + esc(x.pv)).join("; ")}). Además, ${fmt(sinDato)} gobiernos locales con ubicación (juntas de gobierno y comisiones, sobre todo de Entre Ríos y Formosa) no tienen dato de población en el cuadro del Censo. La Ciudad Autónoma de Buenos Aires figura como un solo punto que suma sus 15 comunas.`;
}

/* ---------- pestaña I: comercio exterior por provincia ---------- */
const COM_CORTES = [100, 300, 700, 2000];
const COM_ETQ = ["Menos de 100", "100 a 300", "300 a 700", "700 a 2.000", "Más de 2.000"];
const RUBROS = { PP: "Productos primarios", MOA: "Manufacturas de origen agropecuario", MOI: "Manufacturas de origen industrial", CyE: "Combustibles y energía" };
const DESTINOS = ["Brasil", "Paraguay", "Uruguay", "Chile", "Perú", "Estados Unidos", "Unión Europea (2)", "China", "India", "ASEAN", "Medio Oriente", "Magreb y Egipto", "SACU", "OCEANIA", "Resto del mundo"];
const nombreCorto = pv => pv.replace("Tierra del Fuego, Antártida e Islas del Atlántico Sur", "Tierra del Fuego");
const sinNota = z => z.replace(/ \(\d\)$/, "");
const mill = v => (v == null ? "—" : "US$ " + Math.round(v).toLocaleString("es-AR") + " M");
const signo = v => (v == null ? "—" : (v > 0 ? "+" : "") + v.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " %");

async function cargarComercio() {
  if (!est.com) est.com = await json("comercio.json");
  return est.com;
}

function agregarRegion(com, reg) {
  const ps = REGIONES[reg].map(n => com.provincias[n]).filter(Boolean);
  const total = { h1_2025: 0, h1_2024: 0, part: 0, rubros: {}, zonas: {}, anual: {} };
  for (const p of ps) {
    total.h1_2025 += p.h1_2025 || 0;
    total.h1_2024 += (p.h1_2025 || 0) / (1 + (p.var || 0) / 100);
    total.part += p.part || 0;
    for (const [k, v] of Object.entries(p.rubros || {})) total.rubros[k] = (total.rubros[k] || 0) + (v || 0);
    for (const [k, v] of Object.entries(p.zonas || {})) total.zonas[k] = (total.zonas[k] || 0) + (v || 0);
    for (const [k, v] of Object.entries(p.anual || {})) total.anual[k] = (total.anual[k] || 0) + (v || 0);
  }
  total.var = total.h1_2024 ? (100 * (total.h1_2025 / total.h1_2024 - 1)) : null;
  return total;
}

function dibujarProvinciasComercio() {
  const com = est.com;
  if (!com) return;
  const porNombre = com.provincias;
  const cod = Object.fromEntries(est.resumenProv.map(p => [p.pc, p.pv]));
  for (const p of est.prov) {
    const pv = cod[p.c];
    const d = pv && porNombre[pv];
    const sel = est.f.prov && pv === est.f.prov;
    const fuera = (est.f.reg && REGION_DE[pv] !== est.f.reg) || (est.f.prov && pv !== est.f.prov);
    const fill = d && !fuera ? RAMPA[claseDe(d.h1_2025, COM_CORTES)] : "#ece9df";
    const poly = L.polygon(p.r.map(a => a.map(([x, y]) => [y, x])), {
      renderer: paneles.prov, pane: "prov", color: sel ? "#9b2c22" : "#46567a", weight: sel ? 2.4 : 0.8, fillColor: fill, fillOpacity: 0.7,
    });
    poly.on("click", e => {
      if (!d) return;
      popup.setLatLng(e.latlng).setContent(`<div class="pop"><b>${esc(nombreCorto(pv))}</b>${mill(d.h1_2025)}<br><small>1.er semestre de 2025 · ${signo(d.var)} interanual</small><br><button type="button" data-com="${esc(pv)}">Ver detalle</button></div>`).openOn(mapa);
    });
    grupoProv.addLayer(poly);
  }
}

async function dibujarEspecial(t) {
  const com = await cargarComercio();
  if (est.tab !== t.id) return;
  grupoMunis.clearLayers();
  dibujarProvinciasComercio();
  await dibujarCapas();

  const pv = est.f.prov;
  const reg = est.f.reg;
  const d = pv ? com.provincias[pv] : reg ? agregarRegion(com, reg) : com.nacional;
  const etiqueta = pv ? nombreCorto(pv) : reg || "Todo el país";
  const mayor = obj => Object.entries(obj || {}).sort((a, b) => b[1] - a[1])[0];
  const rub = mayor(d.rubros);
  const dest = Object.entries(d.zonas || {}).filter(([k]) => DESTINOS.includes(k) && k !== "Resto del mundo").sort((a, b) => b[1] - a[1])[0];
  const anual = d.anual ? d.anual["2024"] : null;
  $("#kpis").innerHTML = [
    [etiqueta, "", ""],
    ["Exportaciones 1.er sem. 2025", mill(d.h1_2025), "bienes, INDEC"],
    ["Variación interanual", signo(d.var), "1.er sem. 2025 vs 2024"],
    ["Exportaciones año 2024", mill(anual), "año completo"],
    [pv || reg ? "Participación en el país" : "Provincias que exportan", pv || reg ? (d.part != null ? d.part.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " %" : "—") : "24", pv || reg ? "1.er sem. 2025" : "jurisdicciones"],
    ["Principal rubro", rub ? RUBROS[rub[0]].replace("Manufacturas de origen", "Manuf. de origen") : "—", rub ? `${Math.round(100 * rub[1] / (d.h1_2025 || 1))} % del total` : ""],
    ["Principal destino", dest ? sinNota(dest[0]) : "—", dest ? `${mill(dest[1])}` : ""],
  ].slice(1).map(([l, v, s]) => `<div class="kpi" title="${esc(l)}: ${esc(s)}"><small>${esc(l)}</small><strong${String(v).length > 12 ? ' class="largo"' : ""}>${esc(v)}</strong><span>${esc(s)}</span><em class="info" aria-hidden="true">i</em></div>`).join("");

  $("#tituloRanking").textContent = "Provincias · exportaciones del 1.er semestre de 2025";
  $("#btnOrden").hidden = true;
  $("#btnMasRanking").hidden = true;
  const filas = Object.entries(com.provincias).filter(([n]) => (!reg || REGION_DE[n] === reg) && (!pv || n === pv)).sort((a, b) => b[1].h1_2025 - a[1].h1_2025);
  $("#ranking").innerHTML = filas.map(([n, v], i) => `<li><button type="button" data-com="${esc(n)}"><span class="pos">${i + 1}</span><span class="nom">${esc(nombreCorto(n))}<small>${signo(v.var)} interanual</small></span><span class="val">${mill(v.h1_2025)}</span></button></li>`).join("");

  $("#leyenda").innerHTML = "<b>Exportaciones 1.er sem. 2025 (US$ millones)</b><br>" + RAMPA.map((c, i) => `<i style="background:${c}"></i>${COM_ETQ[i]}`).join("<br>");
}

function barraMini(etq, valor, max, texto) {
  return `<div class="mini"><div class="fila"><span>${esc(etq)}</span><span>${esc(texto)}</span></div><div class="riel"><b style="width:${Math.max(1, (100 * valor) / (max || 1))}%"></b></div></div>`;
}

function abrirFichaComercio(pv, silencioso) {
  const com = est.com;
  const d = com && com.provincias[pv];
  if (!d) return;
  mapa.closePopup();
  const anios = Object.keys(d.anual || {});
  const maxA = Math.max(...anios.map(a => d.anual[a] || 0), 1);
  const rubs = Object.entries(d.rubros || {});
  const dest = Object.entries(d.zonas || {}).filter(([k, v]) => DESTINOS.includes(k) && v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const subs = (d.sub || []).filter(x => !/^Resto/.test(x[0])).slice(0, 6);
  const maxS = Math.max(...subs.map(x => x[1]), 1);
  $("#fichaCuerpo").className = "ficha-cuerpo";
  $("#fichaCuerpo").innerHTML = `
    <h3>${esc(nombreCorto(pv))}</h3>
    <p class="sub">Exportaciones de bienes · origen provincial · INDEC</p>
    <dl>
      <div><dt>1.er sem. 2025</dt><dd>${mill(d.h1_2025)}</dd></div>
      <div><dt>Variación interanual</dt><dd>${signo(d.var)}</dd></div>
      <div><dt>Año 2024</dt><dd>${mill((d.anual || {})["2024"])}</dd></div>
      <div><dt>Participación en el país</dt><dd>${d.part != null ? d.part.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " %" : "—"}</dd></div>
    </dl>
    <h4>Evolución anual (US$ millones)</h4>
    ${anios.map(a => barraMini(a, d.anual[a] || 0, maxA, Math.round(d.anual[a] || 0).toLocaleString("es-AR"))).join("")}
    <h4>Qué exporta (1.er sem. 2025)</h4>
    ${rubs.map(([k, v]) => barraMini(RUBROS[k], v || 0, d.h1_2025, mill(v))).join("")}
    ${subs.length ? `<h4>Principales productos</h4>${subs.map(x => barraMini(x[0], x[1], maxS, mill(x[1]))).join("")}` : ""}
    ${dest.length ? `<h4>Principales destinos</h4>${dest.map(([k, v]) => barraMini(sinNota(k), v, dest[0][1], mill(v))).join("")}<p class="nota" style="padding:4px 0 0">Los destinos se muestran sin superponer zonas; no suman el total.</p>` : ""}
    <p class="nota" style="padding:8px 0 0">Los datos del año 2025 completo están en el informe del INDEC «Origen provincial de las exportaciones. Año 2025»; esta ficha usa el primer semestre porque es lo que publica el INDEC en planilla.</p>`;
  const dlg = $("#ficha");
  if (!dlg.open && !silencioso) dlg.showModal();
  dlg.scrollTop = 0;
}

function abrirFichaAduana(cod) {
  const a = est.adu && est.adu.aduanas.find(x => x.c === cod);
  if (!a) return;
  mapa.closePopup();
  const M = v => "US$ " + Math.round(v / 1e6).toLocaleString("es-AR") + " M";
  const lista = (titulo, filas) => filas.length ? `<h4>${titulo}</h4>${filas.map(([n, v]) => barraMini(n, v, filas[0][1], M(v))).join("")}` : "";
  const meses = est.adu.meses.map((k, i) => [k.slice(4) + "/" + k.slice(2, 4), a.mes_i[i], a.mes_e[i]]);
  const maxM = Math.max(...meses.map(x => Math.max(x[1], x[2])), 1);
  $("#fichaCuerpo").className = "ficha-cuerpo";
  $("#fichaCuerpo").innerHTML = `
    <h3>${esc(a.n)}</h3>
    <p class="sub">${a.zf ? "Zona franca" : "Aduana"} · ARCA · ${est.adu.desde.slice(4)}/${est.adu.desde.slice(0, 4)} a ${est.adu.hasta.slice(4)}/${est.adu.hasta.slice(0, 4)}</p>
    <dl>
      <div><dt>Importaciones a consumo (IC + IG, FOB)</dt><dd>${M(a.imp)}</dd></div>
      <div><dt>Exportaciones registradas</dt><dd>${M(a.exp)}</dd></div>
      <div><dt>Ítems importados</dt><dd>${fmt(a.items)}</dd></div>
      <div><dt>Medio principal (import. / export.)</dt><dd>${esc(a.medio_i || "—")} / ${esc(a.medio_e || "—")}</dd></div>
    </dl>
    ${lista("Qué importa", a.cap_i)}${lista("De dónde importa", a.pais_i)}
    ${lista("Qué exporta", a.cap_e)}${lista("A dónde exporta", a.pais_e)}
    <h4>Mes a mes (millones de US$)</h4>
    ${meses.map(([k, i, e]) => barraMini(k, i, maxM, `import. ${Math.round(i / 1e6).toLocaleString("es-AR")} · export. ${Math.round(e / 1e6).toLocaleString("es-AR")}`)).join("")}
    <p class="nota" style="padding:8px 0 0">Es la aduana donde se registró la operación, no el lugar por donde pasó la mercadería${a.ap ? "; la ubicación en el mapa es aproximada (zona metropolitana)" : ""}. Las exportaciones salen del archivo agregado de ARCA, que reserva parte de los datos por secreto estadístico.</p>`;
  const dlg = $("#ficha");
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-adu]");
  if (b) abrirFichaAduana(b.dataset.adu);
});

window.addEventListener("hashchange", () => {
  const h = (location.hash || "").replace("#", "").toUpperCase();
  if (est.munis.length && h !== est.tab && TABS.some(t => t.id === h)) cambiarTab(h);
});

iniciar();
