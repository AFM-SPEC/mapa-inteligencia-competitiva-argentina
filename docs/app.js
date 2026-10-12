"use strict";
/* Mapa Logístico Municipal · Argentina
   Datos: Censo 2022 (INDEC) + capas del IGN, procesados con herramientas/procesar.py */

const $ = (s, r = document) => r.querySelector(s);
const fmt = n => (n == null ? "—" : Math.round(n).toLocaleString("es-AR"));
const fmt1 = n => (n == null ? "—" : n.toLocaleString("es-AR", { maximumFractionDigits: 1 }));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

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
  limites: { n: "Límite internacional", f: "capa_limites.json", t: "lineas", c: "#0b1d3a", w: 1.3, dash: "2 4" },
  ferrocarril: { n: "Ferrocarril", f: "capa_ferrocarril.json", t: "lineas", c: "#46567a", w: 1.4, dash: "5 4" },
  lineas_electricas: { n: "Líneas de transmisión eléctrica", f: "capa_lineas_electricas.json", t: "lineas", c: "#c4892b", w: 1.4 },
  ductos: { n: "Ductos", f: "capa_ductos.json", t: "lineas", c: "#5f7f5a", w: 1.4 },
  areas_protegidas: { n: "Áreas protegidas (límites)", f: "capa_areas_protegidas.json", t: "lineas", c: "#5f7f5a", w: 1 },
  pasos: { n: "Pasos de frontera", f: "capa_pasos.json", t: "puntos", c: "#8a5b12", r: 5, info: p => ({ t: p[2], s: `${p[3]} · ${p[4]}${p[5] ? " · con " + p[5] : ""}`, x: p[6] ? "Cruce " + p[6].toLowerCase() : "" }) },
  aduanas: { n: "Aduanas", f: "capa_aduanas.json", t: "puntos", c: "#0b1d3a", r: 6, info: p => ({ t: p[2] }) },
  centrales: { n: "Centrales eléctricas", f: "capa_centrales.json", t: "puntos", c: "#9b2c22", r: 4.5, info: p => ({ t: p[2], s: p[3] }) },
  transformadoras: { n: "Plantas transformadoras", f: "capa_transformadoras.json", t: "puntos", c: "#3a5f8a", r: 3.5, info: p => ({ t: p[2] }) },
  yacimientos: { n: "Yacimientos de hidrocarburos", f: "capa_yacimientos.json", t: "puntos", c: "#0b1d3a", r: 5, info: p => ({ t: p[2] }) },
  estaciones_servicio: { n: "Estaciones de servicio", f: "capa_estaciones_servicio.json", t: "puntos", c: "#c4892b", r: 2.5, info: p => ({ t: p[2] || "Estación de servicio" }) },
  tanques: { n: "Tanques de combustible", f: "capa_tanques.json", t: "puntos", c: "#57657f", r: 3, info: () => ({ t: "Tanque de combustible" }) },
  salud: { n: "Establecimientos de salud", f: "capa_salud.json", t: "puntos", c: "#9b2c22", r: 2.6, info: p => ({ t: p[2], s: p[3] }) },
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
    id: "A", nombre: "A · Zonas y ciudades", capas: ["areas_protegidas"], capasOff: ["areas_protegidas"], coropleta: true, metricas: ["pob"],
    titulo: "A1 · Población por provincia y gobierno local",
    nota: "Cada círculo es un gobierno local; su tamaño y color dependen de los habitantes del Censo 2022. Tocá un círculo o una provincia para ver el detalle.",
    kpis: v => [
      ["Provincias", fmt(new Set(v.map(m => m.pv)).size), "jurisdicciones"],
      ["Gobiernos locales", fmt(v.length), "con ubicación"],
      ["Habitantes", fmt(sum(v, m => m.pob)), "Censo 2022"],
      ["Viviendas", fmt(sum(v, m => m.viv)), "Censo 2022"],
      ["Habitantes por vivienda", fmt1(sum(v, m => m.pob) / (sum(v, m => m.viv) || 1)), "promedio"],
      ["Mayor población", v.length ? [...v].sort((a, b) => (b.pob || 0) - (a.pob || 0))[0].n.replace(/ \(15 comunas\)/, "") : "—", "en la selección"],
    ],
  },
  {
    id: "B", nombre: "B · Rutas y fronteras", capas: ["rutas", "ferrocarril", "pasos", "limites"], metricas: ["d_ruta", "d_tren", "d_paso"],
    titulo: "B1 · Rutas nacionales, ferrocarril y pasos de frontera",
    nota: "Rutas nacionales y ferrocarril según el IGN. Las distancias son en línea recta desde cada gobierno local.",
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
    id: "C", nombre: "C · Red eléctrica", capas: ["lineas_electricas", "centrales", "transformadoras"], metricas: ["d_central", "d_transf"],
    titulo: "C1 · Centrales, plantas transformadoras y líneas de transmisión",
    nota: "Se muestran las líneas de transmisión principales de la capa del IGN (clases de tensión 2 y 6). La distancia a una central o planta no equivale a tener conexión.",
    kpis: v => [
      ["Centrales eléctricas", "445", "todo el país"],
      ["Plantas transformadoras", "493", "todo el país"],
      ["Gobiernos locales", fmt(v.length), "en la selección"],
      ["A ≤10 km de una planta transformadora", fmt(cuenta(v, m => m.d_transf <= 10)), pct(cuenta(v, m => m.d_transf <= 10), v.length)],
      ["A más de 50 km de una planta transformadora", fmt(cuenta(v, m => m.d_transf > 50)), pct(cuenta(v, m => m.d_transf > 50), v.length)],
      ["Distancia media a central", fmt1(prom(v, "d_central")) + " km", "en la selección"],
    ],
  },
  {
    id: "D", nombre: "D · Red de combustibles", capas: ["yacimientos", "ductos", "estaciones_servicio", "tanques"], metricas: ["est10"],
    titulo: "D1 · Yacimientos, ductos, tanques y estaciones de servicio",
    nota: "Yacimientos de hidrocarburos (se marca el centro de cada área), ductos subterráneos, tanques de combustible y estaciones de servicio del IGN.",
    kpis: v => [
      ["Yacimientos", "872", "todo el país"],
      ["Estaciones de servicio", "5.383", "todo el país"],
      ["Tanques de combustible", "1.242", "todo el país"],
      ["Gobiernos locales", fmt(v.length), "en la selección"],
      ["Sin estación de servicio a ≤10 km", fmt(cuenta(v, m => m.est10 === 0)), pct(cuenta(v, m => m.est10 === 0), v.length)],
      ["Con 5 o más a ≤10 km", fmt(cuenta(v, m => m.est10 >= 5)), pct(cuenta(v, m => m.est10 >= 5), v.length)],
    ],
  },
  {
    id: "E", nombre: "E · Red de salud", capas: ["salud"], metricas: ["salud10"],
    titulo: "E1 · Establecimientos de salud",
    nota: "Edificios de salud registrados por el IGN (hospitales, centros sanitarios, etc.). No distingue nivel de complejidad.",
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
    id: "F", nombre: "F · Industrias", capas: ["fabricas", "universidades"], metricas: ["fab20", "univ30"],
    titulo: "F1 · Fábricas y universidades",
    nota: "Establecimientos de fabricación y procesamiento registrados por el IGN (un relevamiento cartográfico, no un registro de empresas) y universidades como referencia de formación.",
    kpis: v => [
      ["Fábricas registradas", "2.226", "todo el país"],
      ["Gobiernos locales", fmt(v.length), "en la selección"],
      ["Con alguna fábrica a ≤20 km", fmt(cuenta(v, m => m.fab20 > 0)), pct(cuenta(v, m => m.fab20 > 0), v.length)],
      ["Con 10 o más a ≤20 km", fmt(cuenta(v, m => m.fab20 >= 10)), pct(cuenta(v, m => m.fab20 >= 10), v.length)],
            ["Universidades", "1.132", "todo el país"],
      ["Con alguna universidad a ≤30 km", fmt(cuenta(v, m => m.univ30 > 0)), pct(cuenta(v, m => m.univ30 > 0), v.length)],
    ],
  },
  {
    id: "G", nombre: "G · Polos y nodos logísticos", capas: ["puertos", "aeropuertos", "aerodromos", "peajes", "pesaje", "rutas", "ferrocarril"], capasOff: ["aerodromos"], metricas: ["d_puerto", "d_aero"],
    titulo: "G1 · Puertos, aeropuertos, peajes y estaciones de pesaje",
    nota: "Nodos de transporte del IGN. Es el equivalente a los polos logísticos del mapa original, con la información pública disponible.",
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
    id: "H", nombre: "H · Aduanas", capas: ["pasos", "aduanas", "limites"], metricas: ["d_paso"],
    titulo: "H1 · Pasos de frontera y aduanas",
    nota: "El IGN registra 10 aduanas y 158 pasos de frontera internacionales; las aduanas interiores no figuran en la capa pública.",
    kpis: v => [
      ["Pasos de frontera", "158", "todo el país"],
      ["Aduanas registradas", "10", "capa del IGN"],
      ["Gobiernos locales", fmt(v.length), "en la selección"],
      ["A ≤50 km de un paso", fmt(cuenta(v, m => m.d_paso <= 50)), pct(cuenta(v, m => m.d_paso <= 50), v.length)],
      ["A más de 300 km de un paso", fmt(cuenta(v, m => m.d_paso > 300)), pct(cuenta(v, m => m.d_paso > 300), v.length)],
      ["Distancia media a un paso", fmt1(prom(v, "d_paso")) + " km", "en la selección"],
    ],
  },
  {
    id: "I", nombre: "I · Comercio global", capas: [], metricas: ["pob"], especial: true,
    titulo: "I1 · Exportaciones por provincia de origen",
    nota: "Exportaciones de bienes según la provincia de origen (INDEC): primer semestre de 2025 y serie anual hasta 2024. El comercio exterior se registra por provincia, no por gobierno local; en esta sección se aplican los filtros de región y de provincia.",
    kpis: () => [],
  },
];

/* ---------- estado ---------- */
const est = {
  tab: "A", munis: [], prov: [], resumenProv: [], cobertura: null,
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
  $("#seccionProvincias").hidden = true; // lo reemplaza el gráfico A2
  armarSelectorCapas(t);
  await aplicar(true);
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

function dibujarMunis(t) {
  grupoMunis.clearLayers();
  const colorear = t.coropleta;
  const orden = [...est.vis].sort((a, b) => (b.pob || 0) - (a.pob || 0)); // los grandes abajo, los chicos arriba
  for (const m of orden) {
    let r, col, borde, op;
    if (colorear) {
      const c = m.pob == null ? -1 : claseDe(m.pob, CORTES_POB);
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
    const fill = t.coropleta && r ? RAMPA[claseDe(r.pob, cortes)] : "#fffefb";
    const sel = est.f.prov && r && r.pv === est.f.prov;
    const poly = L.polygon(p.r.map(anillo => anillo.map(([x, y]) => [y, x])), {
      renderer: paneles.prov, pane: "prov", color: sel ? "#9b2c22" : "#46567a", weight: sel ? 2.2 : 0.8, fillColor: fill, fillOpacity: t.coropleta ? 0.45 : 0.05,
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
    if (def.t === "lineas") {
      g.addLayer(L.polyline(datos.map(l => l.map(([x, y]) => [y, x])), { renderer: paneles.lineas, pane: "lineas", color: def.c, weight: def.w, opacity: 0.85, dashArray: def.dash || null, interactive: false, smoothFactor: 1.2 }));
    } else {
      for (const p of datos) {
        const mk = L.circleMarker([p[0], p[1]], { renderer: paneles.puntos, pane: "puntos", radius: def.r, color: "#ffffff", weight: 0.6, fillColor: def.c, fillOpacity: 0.9 });
        mk.on("click", () => {
          const i = def.info(p);
          popup.setLatLng([p[0], p[1]]).setContent(`<div class="pop"><b>${esc(i.t)}</b>${i.s ? `<small>${esc(i.s)}</small><br>` : ""}${i.x ? esc(i.x) : ""}<br><small>${esc(def.n)}</small></div>`).openOn(mapa);
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
    const et = ["Menos de 2.000", "2.000 a 10.000", "10.000 a 50.000", "50.000 a 200.000", "Más de 200.000"];
    el.innerHTML = "<b>Habitantes</b><br>" + RAMPA.map((c, i) => `<i style="background:${c}"></i>${et[i]}`).join("<br>") + `<br><i style="background:#b8bcc4"></i>Sin dato`;
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
  if (s) s.addEventListener("change", e => { est.metrica = e.target.value; est.orden = METRICAS[est.metrica].dir; est.nRank = 15; dibujarRanking(); });

  $("#btnOrden").hidden = false;
  $("#btnOrden").textContent = est.orden === "desc" ? "De mayor a menor" : "De menor a mayor";
  const ver = filas.slice(0, est.nRank);
  $("#ranking").innerHTML = ver.length
    ? ver.map((m, i) => `<li><button type="button" data-ir="${m.c}"><span class="pos">${i + 1}</span><span class="nom">${esc(m.n)}<small>${esc(m.pv)}${est.metrica !== "pob" && m.pob != null ? " · " + fmt(m.pob) + " hab." : ""}</small></span><span class="val">${fmt(m[est.metrica])}${met.u}</span></button></li>`).join("")
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
function abrirFicha(m) {
  if (!m) return;
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
      ${dato("Habitantes por vivienda", m.pob != null && m.viv ? fmt1(m.pob / m.viv) : "—")}
      ${dato("Código INDEC", esc(m.c))}
    </dl>
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
    <dl>${dato("Central eléctrica más cercana", km(m.d_central))}${dato("Planta transformadora más cercana", km(m.d_transf))}</dl>
    <h4>Servicios en el entorno</h4>
    <dl>${dato("Establecimientos de salud a ≤10 km", fmt(m.salud10))}${dato("Fábricas a ≤20 km", fmt(m.fab20))}${dato("Estaciones de servicio a ≤10 km", fmt(m.est10))}</dl>
    <p class="nota" style="padding:0">Distancias en línea recta desde el punto que el IGN asigna al gobierno local.</p>`;
  const d = $("#ficha");
  if (!d.open) d.showModal();
  d.scrollTop = 0;
}
$("#ficha").addEventListener("click", e => { if (e.target === $("#ficha")) $("#ficha").close(); });

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

window.addEventListener("hashchange", () => {
  const h = (location.hash || "").replace("#", "").toUpperCase();
  if (est.munis.length && h !== est.tab && TABS.some(t => t.id === h)) cambiarTab(h);
});

iniciar();
