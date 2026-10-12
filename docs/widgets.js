"use strict";
/* Gráficos, tablas, panel de capas, buscador del mapa y mapa mundial.
   Se carga después de app.js y usa sus datos (est, TABS, CAPAS, json, etc.). */

const ISIC = {
  10: "Alimentos", 11: "Bebidas", 12: "Tabaco", 13: "Textiles", 14: "Prendas de vestir", 15: "Cuero y calzado", 16: "Madera",
  17: "Papel", 18: "Impresión", 19: "Refinación de petróleo", 20: "Químicos", 21: "Farmacéuticos", 22: "Caucho y plástico",
  23: "Minerales no metálicos", 24: "Metales básicos", 25: "Productos metálicos", 26: "Electrónica", 27: "Equipo eléctrico",
  28: "Maquinaria", 29: "Vehículos", 30: "Otro equipo de transporte", 31: "Muebles", 32: "Otras manufacturas", 33: "Reparación de maquinaria",
  100: "Alimentos", "-1": "Sin clasificar", "-2": "Sin clasificar",
};
const PAISES_MUNDO = {
  "Brasil": [-14.2, -51.9], "Paraguay": [-23.4, -58.4], "Uruguay": [-32.5, -55.8], "Chile": [-35.7, -71.5], "Perú": [-9.2, -75.0],
  "Estados Unidos": [39.8, -98.6], "Unión Europea (2)": [50.1, 9.0], "China": [35.9, 104.2], "India": [20.6, 79.0], "ASEAN": [3.0, 108.0],
  "Medio Oriente": [27.0, 45.0], "Magreb y Egipto": [29.0, 15.0], "SACU": [-27.0, 25.0], "OCEANIA": [-25.0, 134.0],
};

const pvDePc = () => Object.fromEntries(est.resumenProv.map(p => [p.pc, p.pv]));
const corto = pv => (typeof nombreCorto === "function" ? nombreCorto(pv) : pv);
const ultimo = r => r[r.length - 1];

function pcsPermitidos() {
  const { reg, prov } = est.f;
  if (!reg && !prov) return null;
  return new Set(est.resumenProv.filter(p => (!prov || p.pv === prov) && (!reg || REGION_DE[p.pv] === reg)).map(p => p.pc));
}
async function filasCapa(nombre) {
  const d = await json(`capa_${nombre}.json`);
  const ok = pcsPermitidos();
  return ok ? d.filter(r => ok.has(ultimo(r))) : d;
}
function contar(filas, clave) {
  const m = new Map();
  for (const r of filas) { const k = clave(r) || "Sin clasificar"; m.set(k, (m.get(k) || 0) + 1); }
  return [...m.entries()].map(([n, v]) => ({ n, v })).sort((a, b) => b.v - a.v);
}

/* ---------- componentes ---------- */
function barrasHTML(items, { fmtV = fmt, max = 0, top = 0 } = {}) {
  const lista = top ? items.slice(0, top) : items;
  const m = max || Math.max(...lista.map(i => i.v), 1);
  if (!lista.length) return `<p class="nota">Sin datos con los filtros elegidos.</p>`;
  return `<ol class="barras">${lista.map(i => `<li><div class="fila-barra"><div class="fila"><span>${esc(i.n)}</span><span>${fmtV(i.v)}</span></div><div class="riel"><b style="width:${Math.max(1, (100 * i.v) / m)}%"></b></div></div></li>`).join("")}</ol>`;
}

const tablasEstado = {};
function tablaHTML(id, cols, filas) {
  const e = (tablasEstado[id] ||= { orden: -1, dir: 1, n: 25 });
  let datos = [...filas];
  if (e.orden >= 0) {
    const c = cols[e.orden];
    datos.sort((a, b) => {
      const x = a[e.orden], y = b[e.orden];
      if (c.num) return ((x ?? -Infinity) - (y ?? -Infinity)) * e.dir;
      return String(x ?? "").localeCompare(String(y ?? ""), "es") * e.dir;
    });
  }
  const ver = datos.slice(0, e.n);
  const cab = cols.map((c, i) => `<th scope="col" class="${c.num ? "num" : ""}" aria-sort="${e.orden === i ? (e.dir > 0 ? "ascending" : "descending") : "none"}"><button type="button" data-ord="${id}|${i}">${esc(c.t)}${e.orden === i ? (e.dir > 0 ? " ▲" : " ▼") : ""}</button></th>`).join("");
  const cuerpo = ver.map((f, n) => `<tr><td class="num pos">${n + 1}</td>${f.map((v, i) => `<td class="${cols[i].num ? "num" : ""}">${cols[i].num ? (v == null ? "—" : (cols[i].f || fmt)(v)) : esc(v ?? "")}</td>`).join("")}</tr>`).join("");
  return `<div class="tabla-caja"><table class="tabla"><thead><tr><th class="pos" aria-hidden="true"></th>${cab}</tr></thead><tbody>${cuerpo || `<tr><td colspan="${cols.length + 1}">Sin datos con los filtros elegidos.</td></tr>`}</tbody></table></div>
    <p class="tabla-pie"><span>${fmt(Math.min(e.n, datos.length))} de ${fmt(datos.length)} filas</span>${datos.length > e.n ? `<button type="button" class="enlace" data-mas="${id}">Ver más</button>` : ""}</p>`;
}

/* ---------- definición de widgets por pestaña ---------- */
function W(titulo, fn) { return { titulo, fn }; }
const barrasProv = async (capa, titulo) => W(titulo, async () => {
  const pv = pvDePc();
  return barrasHTML(contar(await filasCapa(capa), r => corto(pv[ultimo(r)] || "")), { top: 24 });
});

const WIDGETS = {
  A: [
    W("A2 · Población por provincia", async () => {
      const por = {};
      for (const m of est.vis) por[m.pv] = (por[m.pv] || 0) + (m.pob || 0);
      return barrasHTML(Object.entries(por).map(([n, v]) => ({ n: corto(n), v })).sort((a, b) => b.v - a.v));
    }),
    W("A3 · Población según Censo 2022", async () => {
      const filas = [...est.vis].sort((a, b) => a.pv.localeCompare(b.pv, "es") || (b.pob || 0) - (a.pob || 0))
        .map(m => [corto(m.pv), m.n, m.pob, m.em, m.pea, m.pea_t, m.d_ba, m.d_cor, m.d_ros, m.d_puerto]);
      return tablaHTML("tA", [{ t: "Provincia" }, { t: "Gobierno local" }, { t: "Habitantes", num: 1 }, { t: "Edad mediana (años)", num: 1 }, { t: "Pobl. económicamente activa", num: 1 }, { t: "Tasa de actividad (%)", num: 1, f: v => v.toLocaleString("es-AR", { maximumFractionDigits: 1 }) }, { t: "Dist. Buenos Aires (km)", num: 1 }, { t: "Dist. Córdoba (km)", num: 1 }, { t: "Dist. Rosario (km)", num: 1 }, { t: "Dist. al puerto más cercano (km)", num: 1 }], filas);
    }),
    W("A4 · Población económicamente activa por provincia", async () => {
      const por = {};
      for (const m of est.vis) por[m.pv] = (por[m.pv] || 0) + (m.pea || 0);
      return barrasHTML(Object.entries(por).map(([n, v]) => ({ n: corto(n), v })).sort((a, b) => b.v - a.v)) +
        "<p class='nota'>Población de 14 años y más ocupada o que busca trabajo (Censo 2022). Calculada por gobierno local a partir de los radios censales; cuando un gobierno local no tiene dato propio se estima con la tasa de su departamento.</p>";
    }),
    W("A5 · Edad mediana por provincia", async () => {
      const por = {};
      for (const m of est.vis) if (m.em != null && m.pob) { const r = (por[m.pv] ||= { s: 0, p: 0 }); r.s += m.em * m.pob; r.p += m.pob; }
      return barrasHTML(Object.entries(por).map(([n, r]) => ({ n: corto(n), v: r.s / r.p })).sort((a, b) => b.v - a.v), { fmtV: v => fmt1(v) + " años" }) +
        "<p class='nota'>Promedio de las edades medianas de los gobiernos locales, ponderado por habitantes: es una aproximación, no la edad mediana oficial de la provincia.</p>";
    }),
  ],
  B: [
    W("B2 · Km de trazado por ruta nacional (las 15 mayores)", async () => {
      const r = await json("resumen_rutas.json");
      return barrasHTML(r.rutas.slice(0, 15).map(x => ({ n: "Ruta Nacional " + x.rtn, v: x.km })), { fmtV: v => fmt(v) + " km" });
    }),
    W("B3 · Pasos de frontera por país vecino", async () => barrasHTML(contar(await filasCapa("pasos"), r => r[5]).map(x => ({ n: x.n[0] + x.n.slice(1).toLowerCase(), v: x.v })))),
    W("B4 · Pasos de frontera internacionales", async () => tablaHTML("tB", [{ t: "Paso" }, { t: "Categoría" }, { t: "Provincia" }, { t: "Localidad" }, { t: "País vecino" }, { t: "Cruce" }],
      (await filasCapa("pasos")).map(r => [r[2], r[3], r[4], r[7], r[5], r[6]]))),
  ],
  C: [
    W("C2 · Estaciones de alta tensión por provincia", async () => {
      const pv = pvDePc();
      return barrasHTML(contar(await filasCapa("estaciones_at"), r => corto(pv[ultimo(r)] || "")), { top: 24 });
    }),
    W("C2b · Potencia instalada en estaciones de alta tensión, por provincia (MVA)", async () => {
      const pv = pvDePc(); const por = {};
      for (const r of await filasCapa("estaciones_at")) { const n = corto(pv[ultimo(r)] || ""); por[n] = (por[n] || 0) + (r[6] || 0); }
      return barrasHTML(Object.entries(por).map(([n, v]) => ({ n, v })).sort((a, b) => b.v - a.v), { top: 24, fmtV: v => fmt(v) + " MVA" }) +
        "<p class='nota'>Es potencia INSTALADA de las estaciones que informan el dato (243 de 323). No es potencia disponible para nuevas conexiones: ese dato no se publica en forma abierta.</p>";
    }),
    W("C2c · Estaciones por concesionaria o propietaria", async () => barrasHTML(contar(await filasCapa("estaciones_at"), r => r[3]), { top: 15 })),
    W("C2d · Estaciones transformadoras de alta tensión", async () => {
      const pv = pvDePc();
      return tablaHTML("tC2", [{ t: "Estación" }, { t: "Empresa" }, { t: "Provincia" }, { t: "Tensión de entrada (kV)" }, { t: "Tensión de salida (kV)" }, { t: "Potencia instalada (MVA)", num: 1 }, { t: "En servicio desde" }],
        (await filasCapa("estaciones_at")).map(r => [r[2], r[3], corto(pv[ultimo(r)] || ""), r[4], r[5], r[6], r[7]]));
    }),
    barrasProv("transformadoras", "C2e · Plantas transformadoras (capa del IGN) por provincia"),
    W("C3 · Centrales eléctricas por tipo", async () => barrasHTML(contar(await filasCapa("centrales"), r => r[3]))),
    W("C4 · Centrales eléctricas", async () => { const pv = pvDePc(); return tablaHTML("tC", [{ t: "Nombre" }, { t: "Tipo" }, { t: "Provincia" }], (await filasCapa("centrales")).map(r => [r[2], r[3], corto(pv[ultimo(r)] || "")])); }),
  ],
  D: [
    barrasProv("estaciones_servicio", "D2 · Estaciones de servicio por provincia"),
    barrasProv("yacimientos", "D3 · Yacimientos de hidrocarburos por provincia"),
    W("D4 · Yacimientos de hidrocarburos", async () => { const pv = pvDePc(); return tablaHTML("tD", [{ t: "Yacimiento" }, { t: "Provincia" }], (await filasCapa("yacimientos")).map(r => [r[2], corto(pv[ultimo(r)] || "")])); }),
  ],
  E: [
    W("E2 · Establecimientos de salud por tipo", async () => barrasHTML(contar(await filasCapa("salud"), r => r[3]), { top: 12 })),
    barrasProv("salud", "E3 · Establecimientos de salud por provincia"),
    W("E4 · Habitantes por establecimiento de salud", async () => {
      const filas = await filasCapa("salud"); const n = {}; for (const r of filas) n[ultimo(r)] = (n[ultimo(r)] || 0) + 1;
      const ok = pcsPermitidos();
      return tablaHTML("tE", [{ t: "Provincia" }, { t: "Habitantes", num: 1 }, { t: "Establecimientos", num: 1 }, { t: "Habitantes por establecimiento", num: 1 }],
        est.resumenProv.filter(p => !ok || ok.has(p.pc)).map(p => [corto(p.pv), p.pob, n[p.pc] || 0, n[p.pc] ? Math.round(p.pob / n[p.pc]) : null]));
    }),
  ],
  F: [
    W("F1b · Parques y áreas industriales por provincia", async () => {
      const pv = pvDePc();
      return barrasHTML(contar(await filasCapa("parques"), r => corto(pv[ultimo(r)] || "")), { top: 24 });
    }),
    W("F1c · Parques y áreas industriales por tipo y estado", async () => {
      const f = await filasCapa("parques");
      const may = t => (t || "Sin dato").toLowerCase().replace(/^./, c => c.toUpperCase());
      return barrasHTML(contar(f, r => may(r[3]))) + `<p class="rotulo" style="margin:10px 14px 0">Estado</p>` + barrasHTML(contar(f, r => may(r[4])));
    }),
    W("F1d · Parques y áreas industriales", async () => {
      const pv = pvDePc();
      return tablaHTML("tF1", [{ t: "Nombre" }, { t: "Tipo" }, { t: "Estado" }, { t: "Provincia" }, { t: "Empresas", num: 1 }, { t: "Superficie (ha)", num: 1, f: v => v.toLocaleString("es-AR", { maximumFractionDigits: 1 }) }, { t: "Gestión" }],
        (await filasCapa("parques")).map(r => [r[2], r[3], r[4], corto(pv[ultimo(r)] || ""), r[6] || null, r[7], r[8]])) +
        "<p class='nota'>Fuente: mapa de parques industriales de la Comisión de Industria y Comercio del Senado (2024). Las empresas instaladas y la superficie sólo figuran en parte de los casos. El Registro Nacional de Parques Industriales (RENPI) tiene una planilla de 2023 sin coordenadas, con problemas de cobertura reconocidos por el propio organismo.</p>";
    }),
    W("F1e · Zonas francas", async () => {
      const pv = pvDePc();
      return tablaHTML("tZF", [{ t: "Zona franca" }, { t: "Provincia" }, { t: "Norma de creación" }, { t: "Fecha" }], (await filasCapa("zonas_francas")).map(r => [r[2], corto(pv[ultimo(r)] || ""), r[3], r[4]]));
    }),
    W("F2 · Fábricas por rubro (código ISIC del IGN)", async () => barrasHTML(contar(await filasCapa("fabricas"), r => ISIC[r[3]] || "Otros"), { top: 15 })),
    W("F3 · Fábricas por región", async () => { const pv = pvDePc(); return barrasHTML(contar(await filasCapa("fabricas"), r => REGION_DE[pv[ultimo(r)]] || "")); }),
    W("F4 · Fábricas y universidades por provincia", async () => {
      const f = await filasCapa("fabricas"), u = await filasCapa("universidades"); const a = {}, b = {};
      for (const r of f) a[ultimo(r)] = (a[ultimo(r)] || 0) + 1;
      for (const r of u) b[ultimo(r)] = (b[ultimo(r)] || 0) + 1;
      const ok = pcsPermitidos();
      return tablaHTML("tF", [{ t: "Provincia" }, { t: "Fábricas", num: 1 }, { t: "Universidades", num: 1 }], est.resumenProv.filter(p => !ok || ok.has(p.pc)).map(p => [corto(p.pv), a[p.pc] || 0, b[p.pc] || 0]));
    }),
  ],
  G: [
    W("G2 · Nodos logísticos por tipo", async () => {
      const n = [["Puertos", "puertos"], ["Aeropuertos", "aeropuertos"], ["Aeródromos", "aerodromos"], ["Peajes", "peajes"], ["Estaciones de pesaje", "pesaje"]];
      return barrasHTML(await Promise.all(n.map(async ([t, c]) => ({ n: t, v: (await filasCapa(c)).length }))));
    }),
    barrasProv("puertos", "G3 · Puertos por provincia"),
    W("G4 · Puertos y aeropuertos", async () => { const pv = pvDePc(); const p = (await filasCapa("puertos")).map(r => [r[2], "Puerto", corto(pv[ultimo(r)] || "")]); const a = (await filasCapa("aeropuertos")).map(r => [r[2], "Aeropuerto", corto(pv[ultimo(r)] || "")]); return tablaHTML("tG", [{ t: "Nombre" }, { t: "Tipo" }, { t: "Provincia" }], [...p, ...a]); }),
  ],
  H: [
    W("H2 · Importaciones por aduana", async () => {
      const a = await json("aduanas_comercio.json"); const ok = pcsPermitidos();
      return barrasHTML(a.aduanas.filter(x => !ok || ok.has(x.pc)).sort((x, y) => y.imp - x.imp).map(x => ({ n: x.n, v: x.imp / 1e6 })), { top: 15, fmtV: v => "US$ " + fmt(v) + " M" });
    }),
    W("H3 · Exportaciones registradas por aduana", async () => {
      const a = await json("aduanas_comercio.json"); const ok = pcsPermitidos();
      return barrasHTML(a.aduanas.filter(x => !ok || ok.has(x.pc)).sort((x, y) => y.exp - x.exp).map(x => ({ n: x.n, v: x.exp / 1e6 })), { top: 15, fmtV: v => "US$ " + fmt(v) + " M" }) +
        `<p class='nota'>El archivo de exportaciones por aduana de ARCA reserva parte de los datos por secreto estadístico: lo que se muestra es el ${Math.round(100 * a.exp_total_aduanas / a.exp_total_nacional)} % del total de exportaciones que ARCA informa en el mismo período. Sirve para comparar aduanas, no para sumar el total del país.</p>`;
    }),
    W("H4 · Qué se importa (todo el país)", async () => { const a = await json("aduanas_comercio.json"); return barrasHTML(a.cap_i.map(([n, v]) => ({ n, v: v / 1e6 })), { fmtV: v => "US$ " + fmt(v) + " M" }); }),
    W("H5 · De dónde se importa", async () => { const a = await json("aduanas_comercio.json"); return barrasHTML(a.pais_i.map(([n, v]) => ({ n, v: v / 1e6 })), { fmtV: v => "US$ " + fmt(v) + " M" }) + "<p class='nota'>País de origen de la mercadería.</p>"; }),
    W("H6 · Qué se exporta (según el archivo por aduana)", async () => { const a = await json("aduanas_comercio.json"); return barrasHTML(a.cap_e.map(([n, v]) => ({ n, v: v / 1e6 })), { fmtV: v => "US$ " + fmt(v) + " M" }); }),
    W("H7 · A dónde se exporta (según el archivo por aduana)", async () => { const a = await json("aduanas_comercio.json"); return barrasHTML(a.pais_e.map(([n, v]) => ({ n: n === "Sin dato" ? "Sin país asignado" : n, v: v / 1e6 })), { fmtV: v => "US$ " + fmt(v) + " M" }); }),
    W("H8 · Comercio exterior por aduana", async () => {
      const a = await json("aduanas_comercio.json"); const ok = pcsPermitidos(); const pv = pvDePc();
      return tablaHTML("tH1", [{ t: "Aduana" }, { t: "Tipo" }, { t: "Provincia" }, { t: "Importaciones (US$ M)", num: 1 }, { t: "Exportaciones registradas (US$ M)", num: 1 }, { t: "Medio principal de importación" }],
        a.aduanas.filter(x => !ok || ok.has(x.pc)).map(x => [x.n, x.zf ? "Zona franca" : "Aduana", corto(pv[x.pc] || ""), Math.round(x.imp / 1e6), Math.round(x.exp / 1e6), x.medio_i])) +
        "<p class='nota'>Aduana de registro de la operación; no es el paso de frontera por donde cruzó la mercadería. Los códigos de aduana y su ubicación (por la ciudad que nombran) salen del anexo de la RG 1452 de ARCA.</p>";
    }),
    barrasProv("pasos", "H9 · Pasos de frontera por provincia"),
    W("H10 · Pasos de frontera por país vecino", async () => barrasHTML(contar(await filasCapa("pasos"), r => r[5]).map(x => ({ n: x.n[0] + x.n.slice(1).toLowerCase(), v: x.v })))),
    W("H11 · Pasos de frontera y puestos de control", async () => { const pv = pvDePc(); const a = (await filasCapa("pasos")).map(r => [r[2], "Paso de frontera", corto(pv[ultimo(r)] || ""), r[5]]); const d = (await filasCapa("aduanas")).map(r => [r[2], "Puesto de control (IGN)", corto(pv[ultimo(r)] || ""), ""]); return tablaHTML("tH", [{ t: "Nombre" }, { t: "Tipo" }, { t: "Provincia" }, { t: "País vecino" }], [...d, ...a]); }),
  ],
  I: [
    W("I2 · Destinos de las exportaciones (1.er semestre de 2025)", async () => "<div id='mapaMundo' class='mapa-mundo' aria-label='Mapa mundial de destinos'></div><p class='nota'>Cada círculo es un destino o bloque; su tamaño muestra el monto exportado. Las zonas no se superponen.</p>"),
    W("I3 · Ranking de destinos", async () => {
      const z = (await cargarComercio()).nacional.zonas || {};
      return barrasHTML(Object.entries(z).filter(([k]) => DESTINOS.includes(k) && k !== "Resto del mundo").map(([k, v]) => ({ n: sinNota(k), v })).sort((a, b) => b.v - a.v), { fmtV: v => "US$ " + fmt(v) + " M" });
    }),
    W("I4 · Exportaciones por provincia", async () => {
      const com = await cargarComercio(); const ok = pcsPermitidos(); const pcDe = Object.fromEntries(est.resumenProv.map(p => [p.pv, p.pc]));
      return tablaHTML("tI", [{ t: "Provincia" }, { t: "1.er sem. 2025 (US$ M)", num: 1 }, { t: "Variación interanual (%)", num: 1, f: v => v.toLocaleString("es-AR", { maximumFractionDigits: 1 }) }, { t: "Año 2024 (US$ M)", num: 1 }, { t: "Participación (%)", num: 1, f: v => v.toLocaleString("es-AR", { maximumFractionDigits: 1 }) }],
        Object.entries(com.provincias).filter(([n]) => !ok || ok.has(pcDe[n])).map(([n, d]) => [corto(n), d.h1_2025, d.var, (d.anual || {})["2024"], d.part]));
    }),
  ],
};

let mundo = null;
async function dibujarMundo() {
  const el = $("#mapaMundo");
  if (!el) return;
  if (mundo) { mundo.remove(); mundo = null; }
  mundo = L.map(el, { minZoom: 1, maxZoom: 5, worldCopyJump: true, scrollWheelZoom: false }).setView([15, -30], 1);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(mundo);
  const z = (await cargarComercio()).nacional.zonas || {};
  const vals = Object.entries(z).filter(([k]) => PAISES_MUNDO[k]);
  const max = Math.max(...vals.map(([, v]) => v), 1);
  for (const [k, v] of vals) {
    L.circleMarker(PAISES_MUNDO[k], { radius: 4 + 16 * Math.sqrt(v / max), color: "#0b1d3a", weight: 1, fillColor: "#0b1d3a", fillOpacity: 0.55 })
      .bindPopup(`<div class="pop"><b>${esc(sinNota(k))}</b>${mill(v)}<br><small>1.er semestre de 2025</small></div>`).addTo(mundo);
  }
  L.circleMarker([-38, -64], { radius: 5, color: "#9b2c22", weight: 2, fillColor: "#9b2c22", fillOpacity: 1 }).bindTooltip("Argentina").addTo(mundo);
}

async function dibujarWidgets(t) {
  const caja = $("#widgets");
  if (!caja) return;
  const marca = est.tab + JSON.stringify(est.f);
  est.marcaWidgets = marca;
  const defs = await Promise.all((WIDGETS[t.id] || []).map(d => (d.then ? d : Promise.resolve(d))));
  const html = [];
  for (const [i, d] of defs.entries()) {
    let cuerpo = "";
    try { cuerpo = await d.fn(); } catch (e) { cuerpo = `<p class="nota">No se pudo armar este gráfico (${esc(e.message)}).</p>`; }
    html.push(`<div class="panel widget" id="w${i}"><div class="panel-titulo"><h3>${esc(d.titulo)}</h3></div>${cuerpo}</div>`);
    if (est.marcaWidgets !== marca) return; // cambió algo mientras se calculaba
  }
  caja.innerHTML = html.join("");
  if (t.id === "I") dibujarMundo();
}

/* ordenar y paginar tablas */
document.addEventListener("click", async e => {
  const o = e.target.closest("[data-ord]");
  const m = e.target.closest("[data-mas]");
  if (!o && !m) return;
  if (o) {
    const [id, i] = o.dataset.ord.split("|"); const s = (tablasEstado[id] ||= { orden: -1, dir: 1, n: 25 });
    if (s.orden === +i) s.dir *= -1; else { s.orden = +i; s.dir = 1; }
  } else tablasEstado[m.dataset.mas].n += 50;
  const t = TABS.find(x => x.id === est.tab); await dibujarWidgets(t);
});

/* ---------- panel de capas y leyenda dentro del mapa ---------- */
function armarPanelCapas(t) {
  const cont = $("#panelCapas");
  if (!cont) return;
  const filas = t.capas.map(c => `<label><input type="checkbox" data-capa-panel="${c}" ${est.activas[c] ? "checked" : ""}><i style="background:${CAPAS[c].c}"></i>${esc(CAPAS[c].n)}</label>`).join("");
  const rampa = htmlRampa(t);
  cont.innerHTML = `<p class="rotulo">Capas</p>${filas || "<span class='leg'>Sólo el mapa base y los gobiernos locales</span>"}${rampa}
    <div class="panel-acciones"><button type="button" class="enlace" data-vista="fijar">Establecer vista actual como inicio</button><button type="button" class="enlace" data-vista="reset">Restablecer valores predeterminados</button></div>`;
}
document.addEventListener("change", async e => {
  const c = e.target.dataset && e.target.dataset.capaPanel;
  if (!c) return;
  est.activas[c] = e.target.checked;
  await dibujarCapas();
});
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-vista]");
  if (!b) return;
  if (b.dataset.vista === "fijar") {
    est.inicio = mapa.getBounds();
    try { localStorage.setItem("mapa-ar-inicio", JSON.stringify([mapa.getBounds().getSouthWest(), mapa.getBounds().getNorthEast()])); } catch (err) { /* sin almacenamiento */ }
    b.textContent = "Vista guardada ✓";
  } else {
    est.inicio = null;
    try { localStorage.removeItem("mapa-ar-inicio"); } catch (err) { /* sin almacenamiento */ }
    const t = TABS.find(x => x.id === est.tab);
    est.activas = Object.fromEntries(t.capas.map(c => [c, !(t.capasOff || []).includes(c)]));
    armarPanelCapas(t);
    await dibujarCapas();
    encuadrar(false);
  }
});

function agregarControlesMapa() {
  if (!mapa || mapa._controlesExtra) return;
  mapa._controlesExtra = true;
  const Capas = L.Control.extend({
    options: { position: "topright" },
    onAdd() {
      const caja = L.DomUtil.create("div", "ctl-capas");
      caja.innerHTML = `<button type="button" class="ctl-boton" aria-expanded="false" aria-controls="panelCapas" title="Capas y leyenda"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 5h12M3 9h12M3 13h12"/></svg><span>Capas</span></button><div id="panelCapas" class="panel-capas" hidden></div>`;
      L.DomEvent.disableClickPropagation(caja); L.DomEvent.disableScrollPropagation(caja);
      const bt = caja.querySelector("button"), pn = caja.querySelector("#panelCapas");
      bt.addEventListener("click", () => { pn.hidden = !pn.hidden; bt.setAttribute("aria-expanded", String(!pn.hidden)); });
      return caja;
    },
  });
  mapa.addControl(new Capas());
  const Busca = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const caja = L.DomUtil.create("div", "leaflet-bar ctl-busca");
      caja.innerHTML = `<a href="#" class="ctl-mapa" role="button" aria-label="Buscar en el mapa" title="Buscar"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg></a>`;
      L.DomEvent.disableClickPropagation(caja);
      caja.querySelector("a").addEventListener("click", ev => { ev.preventDefault(); const i = $("#buscar"); i.scrollIntoView({ block: "center", behavior: "smooth" }); setTimeout(() => i.focus(), 350); });
      return caja;
    },
  });
  mapa.addControl(new Busca());
}
