# Arma los archivos que usa la web a partir de lo descargado (IGN + Censo 2022 del INDEC).
# Uso:  python3 -I herramientas/procesar.py      (desde la carpeta mapa-municipios-ar)
import json, math, os, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
ORIGEN = "datos-origen"
SALIDA = "docs/datos"
os.makedirs(SALIDA, exist_ok=True)


def cargar(nombre):
    t = json.loads(open(f"{ORIGEN}/{nombre}", encoding="utf-8").read())
    if isinstance(t, str):
        t = json.loads(t)
    return t["features"]


def limpiar(txt):
    return (txt or "").replace("\r", "").replace("\n", " ").strip()


def guardar(nombre, obj):
    ruta = f"{SALIDA}/{nombre}"
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  {nombre}: {os.path.getsize(ruta)/1024:.0f} KB")


# ---------- simplificación de líneas (Douglas-Peucker) ----------
def dp(pts, tol):
    pts = np.asarray(pts, dtype=float)
    n = len(pts)
    if n < 3:
        return pts
    keep = np.zeros(n, bool)
    keep[0] = keep[-1] = True
    pila = [(0, n - 1)]
    while pila:
        a, b = pila.pop()
        if b <= a + 1:
            continue
        p, q = pts[a], pts[b]
        seg = pts[a + 1:b]
        d = q - p
        l2 = d @ d
        if l2 == 0:
            dist = np.hypot(*(seg - p).T)
        else:
            t = np.clip(((seg - p) @ d) / l2, 0, 1)
            proy = p + np.outer(t, d)
            dist = np.hypot(*(seg - proy).T)
        i = int(np.argmax(dist))
        if dist[i] > tol:
            k = a + 1 + i
            keep[k] = True
            pila.append((a, k))
            pila.append((k, b))
    return pts[keep]


def lineas_de(feats, tol, dec=3):
    salida = []
    for f in feats:
        g = f["geometry"]
        if not g:
            continue
        partes = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
        for parte in partes:
            s = dp(parte, tol)
            if len(s) >= 2:
                salida.append([[round(float(x), dec), round(float(y), dec)] for x, y in s])
    return salida


def puntos_de(feats, extra=None):
    res = []
    for f in feats:
        g = f["geometry"]
        if not g:
            continue
        c = g["coordinates"]
        if g["type"] == "MultiPoint":
            c = c[0]
        fila = [round(c[1], 4), round(c[0], 4)]
        if extra:
            fila += extra(f["properties"])
        res.append(fila)
    return res


def haversine_km(la1, lo1, la2, lo2):
    la1, lo1, la2, lo2 = map(np.radians, (la1, lo1, la2, lo2))
    a = np.sin((la2 - la1) / 2) ** 2 + np.cos(la1) * np.cos(la2) * np.sin((lo2 - lo1) / 2) ** 2
    return 6371.0 * 2 * np.arcsin(np.sqrt(a))


# ---------- capas ----------
print("Capas...")
capas = {}

capas["rutas"] = lineas_de(cargar("capa_rutas_nacionales.json"), 0.004)
capas["ferrocarril"] = lineas_de(cargar("capa_ferrocarril.json"), 0.004)
capas["lineas_electricas"] = lineas_de(cargar("capa_lineas_electricas.json"), 0.006)
capas["ductos"] = lineas_de(cargar("capa_ductos.json"), 0.006)

# límites internacionales (sólo el límite político, no los marítimos)
lim_feats = [f for f in cargar("capa_limites_internacionales.json") if (f["properties"].get("objeto") or "").strip() == "Límite internacional"]
capas["limites"] = lineas_de(lim_feats, 0.004)

pasos = cargar("capa_pasos_frontera.json")
capas["pasos"] = puntos_de(pasos, lambda p: [
    p.get("nom_pfi") or "", p.get("cat_pfi") or "", p.get("prov") or "",
    p.get("pvecino") or "", p.get("cruce_pfi") or "", p.get("muni") or "",
])
capas["centrales"] = puntos_de(cargar("capa_centrales.json"), lambda p: [limpiar(p.get("fna")) or "Central eléctrica", limpiar(p.get("gna"))])
capas["transformadoras"] = puntos_de(cargar("capa_transformadoras.json"), lambda p: [limpiar(p.get("fna")) or "Planta transformadora"])

# yacimientos: se guarda el centro de cada área
yac = []
for f in cargar("capa_yacimientos.json"):
    g = f["geometry"]
    if not g:
        continue
    anillos = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    pts = np.array([p for poli in anillos for p in poli[0]])
    yac.append([round(float(pts[:, 1].mean()), 4), round(float(pts[:, 0].mean()), 4), limpiar(f["properties"].get("fna")) or "Yacimiento"])
capas["yacimientos"] = yac

capas["estaciones_servicio"] = puntos_de(cargar("capa_estaciones_servicio.json"), lambda p: [limpiar(p.get("fna"))])
capas["tanques"] = puntos_de(cargar("capa_tanques_combustible.json"))
capas["salud"] = puntos_de(cargar("capa_salud.json"), lambda p: [limpiar(p.get("fna")) or "Establecimiento de salud", limpiar(p.get("gna"))])
capas["fabricas"] = puntos_de(cargar("capa_fabricas.json"), lambda p: [limpiar(p.get("fna")), p.get("isic")])
capas["puertos"] = puntos_de(cargar("capa_puertos.json"), lambda p: [limpiar(p.get("fna")) or "Puerto"])
capas["aeropuertos"] = puntos_de(cargar("capa_aeropuertos.json"), lambda p: [limpiar(p.get("fna")) or "Aeropuerto"])
capas["peajes"] = puntos_de(cargar("capa_peajes.json"), lambda p: [limpiar(p.get("fna")) or "Estación de peaje"])
capas["universidades"] = puntos_de(cargar("capa_universidades.json"), lambda p: [limpiar(p.get("fna")) or "Universidad"])
capas["aerodromos"] = puntos_de(cargar("capa_aerodromos.json"), lambda p: [limpiar(p.get("fna")) or "Aeródromo"])
capas["areas_protegidas"] = lineas_de(cargar("capa_areas_protegidas.json"), 0.005)
# parques industriales y zonas francas: mapa de la Comisión de Industria y Comercio del Senado (Google My Maps)
import xml.etree.ElementTree as ET
_kml = open(f"{ORIGEN}/parques.kml", encoding="utf-8").read()
_ns = {"k": "http://www.opengis.net/kml/2.2"}
_doc = ET.fromstring(_kml.encode("utf-8")).find("k:Document", _ns)


def _datos(pm):
    d = {}
    for x in pm.findall(".//k:Data", _ns):
        v = x.find("k:value", _ns)
        d[x.get("name")] = (v.text or "").strip() if v is not None else ""
    return d


def _num(x):
    try:
        return float(str(x).replace(",", "."))
    except ValueError:
        return None


parques, zfrancas = [], []
for fol in _doc.findall("k:Folder", _ns):
    nombre_fol = fol.find("k:name", _ns).text
    if nombre_fol not in ("LISTADO DE PARQUES", "ZONAS FRANCAS"):
        continue
    for pm in fol.findall("k:Placemark", _ns):
        d = _datos(pm)
        la_, lo_ = _num(d.get("Latitud")), _num(d.get("Longitud"))
        nom = (pm.find("k:name", _ns).text or "").strip()
        if nombre_fol == "ZONAS FRANCAS":
            # las zonas francas no traen latitud/longitud en los campos: la ubicación sale de la geometría Point
            xy = pm.find(".//k:Point/k:coordinates", _ns)
            if xy is None:
                continue
            lo_, la_ = [float(v) for v in xy.text.strip().split(",")[:2]]
            desc = (pm.find("k:description", _ns).text or "").split("<br>")
            norma = desc[0].strip()
            vig = desc[1].replace("vigencia:", "").strip() if len(desc) > 1 else ""
            zfrancas.append([round(la_, 4), round(lo_, 4), nom, norma, vig])
            continue
        if la_ is None or lo_ is None:
            continue
        emp = _num(d.get("Cantidad de empresas establecidas"))
        parques.append([round(la_, 4), round(lo_, 4), nom, d.get("Tipo", ""), d.get("Condicion", ""), d.get("Provincia", ""),
                        int(emp) if emp is not None else None, _num(d.get("Superficie Has.")), d.get("Origen", "")])
capas["parques"] = parques
capas["zonas_francas"] = zfrancas
capas["pesaje"] = puntos_de(cargar("capa_pesaje.json"))
capas["aduanas"] = puntos_de(
    [f for f in cargar("capa_controles.json") if "aduana" in limpiar(f["properties"].get("gna") or f["properties"].get("fna")).lower()],
    lambda p: [limpiar(p.get("fna")) or "Aduana"],
)

# provincias (contornos simplificados)
prov = []
for f in cargar("capa_provincias.json"):
    g = f["geometry"]
    anillos = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    salida = []
    for poli in anillos:
        ext = np.asarray(poli[0], dtype=float)
        if len(ext) > 4000:
            ext = ext[:: len(ext) // 4000]
        s = dp(ext, 0.012)
        ancho = max(np.ptp(s[:, 0]), np.ptp(s[:, 1]))
        if len(s) >= 4 and ancho > 0.15:
            salida.append([[round(float(x), 3), round(float(y), 3)] for x, y in s])
    prov.append({"c": f["properties"]["in1"], "n": f["properties"]["nam"], "r": salida})
capas["provincias"] = prov

# ---------- provincia de cada punto (punto en polígono; si cae fuera, la del gobierno local más cercano) ----------
def pip(lat, lon, anillo):
    x = np.array([p[0] for p in anillo]); y = np.array([p[1] for p in anillo])
    x2 = np.roll(x, -1); y2 = np.roll(y, -1)
    dentro = np.zeros(len(lat), bool)
    for i in range(len(x)):
        cruza = (y[i] > lat) != (y2[i] > lat)
        with np.errstate(divide="ignore", invalid="ignore"):
            xi = (x2[i] - x[i]) * (lat - y[i]) / (y2[i] - y[i]) + x[i]
        dentro ^= cruza & (lon < xi)
    return dentro


def provincia_de(puntos, muni_la, muni_lo, muni_pc):
    a = np.array([[p[0], p[1]] for p in puntos])
    la_, lo_ = a[:, 0], a[:, 1]
    res = np.full(len(puntos), "", dtype=object)
    for pv in capas["provincias"]:
        libre = res == ""
        if not libre.any():
            break
        for anillo in pv["r"]:
            ar = np.array(anillo)
            caja = (lo_ >= ar[:, 0].min()) & (lo_ <= ar[:, 0].max()) & (la_ >= ar[:, 1].min()) & (la_ <= ar[:, 1].max()) & (res == "")
            if caja.any():
                dentro = np.zeros(len(puntos), bool)
                dentro[caja] = pip(la_[caja], lo_[caja], anillo)
                res[dentro & (res == "")] = pv["c"]
    for i in np.where(res == "")[0]:
        d = haversine_km(la_[i], lo_[i], muni_la, muni_lo)
        res[i] = muni_pc[int(np.argmin(d))]
    return res


# ---------- municipios ----------
print("Municipios...")
import armar_datos_censo as ac  # noqa: E402

censo = ac.leer_censo(f"{ORIGEN}/censo2022_gobiernos_locales.xlsx.b64.txt")
ALIAS = {"309005": "309029"}  # Junta de Gobierno San Miguel (Entre Ríos): mismo gobierno local con otro código

muni = []
usados = set()
for ft in cargar("ign_gobiernos_locales_2022.json.txt"):
    p = ft["properties"]
    lon, lat = ft["geometry"]["coordinates"][0]
    cod = ALIAS.get(p["in1"], p["in1"])
    c = censo.get(cod)
    if c:
        usados.add(cod)
    muni.append({
        "c": p["in1"], "n": p["nam"], "t": p["cod_tgl"], "pv": p["nam_prov"], "pc": p["cod_prov"],
        "la": round(lat, 4), "lo": round(lon, 4),
        "pob": c["pob"] if c else None, "viv": c["viv"] if c else None,
    })

# Ciudad Autónoma de Buenos Aires: el IGN no la trae como punto; se suma como un solo gobierno local (15 comunas)
caba = [v for k, v in censo.items() if k.startswith("022")]
muni.append({
    "c": "022000", "n": "Ciudad Autónoma de Buenos Aires (15 comunas)", "t": "CO", "pv": "Ciudad Autónoma de Buenos Aires", "pc": "02",
    "la": -34.6037, "lo": -58.3816,
    "pob": sum(v["pob"] for v in caba), "viv": sum(v["viv"] for v in caba),
})
for k in censo:
    if k.startswith("022"):
        usados.add(k)

sin_ubicacion = [
    {"c": k, "n": v["nombre_censo"], "pv": v["prov"], "t": v["cat"], "pob": v["pob"]}
    for k, v in censo.items() if k not in usados
]
sin_gl = [x for x in sin_ubicacion if x["n"] in ("Sin Gobierno Local", "Indeterminado")]
sin_ubic = [x for x in sin_ubicacion if x["n"] not in ("Sin Gobierno Local", "Indeterminado")]
print("  gobiernos locales con punto:", len(muni), "| sin población:", sum(1 for m in muni if m["pob"] is None))
print("  con población pero sin ubicación:", [(x["n"], x["pv"]) for x in sin_ubic])
print("  población 'sin gobierno local / indeterminado':", sum(x["pob"] for x in sin_gl))
tot_censo = sum(v["pob"] for v in censo.values())
tot_mapa = sum(m["pob"] or 0 for m in muni)
print("  total censo:", tot_censo, "| total en el mapa:", tot_mapa)

# ---------- indicadores por municipio ----------
print("Indicadores...")
la = np.array([m["la"] for m in muni])
lo = np.array([m["lo"] for m in muni])


def pts_arr(clave):
    a = np.array([[p[0], p[1]] for p in capas[clave]])
    return a[:, 0], a[:, 1]


def mas_cercano(clave, nombres=True):
    pla, plo = pts_arr(clave)
    d = np.empty(len(muni))
    idx = np.empty(len(muni), int)
    for i in range(len(muni)):
        dd = haversine_km(la[i], lo[i], pla, plo)
        idx[i] = int(np.argmin(dd))
        d[i] = dd[idx[i]]
    return d, idx


def cuenta_radio(clave, radio):
    pla, plo = pts_arr(clave)
    out = np.empty(len(muni), int)
    for i in range(len(muni)):
        out[i] = int((haversine_km(la[i], lo[i], pla, plo) <= radio).sum())
    return out


def dist_a_lineas(feats_lineas):
    v = np.array([p for ln in feats_lineas for p in ln])  # lon, lat
    vla, vlo = v[:, 1], v[:, 0]
    out = np.empty(len(muni))
    for i in range(len(muni)):
        out[i] = haversine_km(la[i], lo[i], vla, vlo).min()
    return out


mpc = np.array([m["pc"] for m in muni])
for nombre in ["pasos", "centrales", "transformadoras", "yacimientos", "estaciones_servicio", "tanques", "salud", "fabricas",
               "universidades", "puertos", "aeropuertos", "aerodromos", "peajes", "pesaje", "aduanas", "parques", "zonas_francas"]:
    if not capas[nombre]:
        continue
    pcs = provincia_de(capas[nombre], la, lo, mpc)
    for fila, pc in zip(capas[nombre], pcs):
        fila.append(str(pc))

def km_lineas(feats, clave=None):
    tot = {}
    for f in feats:
        g = f["geometry"]
        if not g:
            continue
        k = (f["properties"].get(clave) if clave else "total")
        k = (k or "").strip() if isinstance(k, str) or k is None else str(k)
        partes = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
        for parte in partes:
            a = np.array(parte)
            if len(a) > 1:
                tot[k] = tot.get(k, 0.0) + float(haversine_km(a[:-1, 1], a[:-1, 0], a[1:, 1], a[1:, 0]).sum())
    return tot

rutas_km = km_lineas(cargar("capa_rutas_nacionales.json"), "rtn")
tren_km = sum(km_lineas(cargar("capa_ferrocarril.json")).values())
lim_km = km_lineas(lim_feats, "gna")
guardar("resumen_rutas.json", {
    "rutas": sorted([{"rtn": k, "km": round(v)} for k, v in rutas_km.items()], key=lambda r: -r["km"]),
    "rutas_total_km": round(sum(rutas_km.values())),
    "tren_km": round(tren_km),
    "limites": {k.replace("Argentina - ", ""): round(v) for k, v in sorted(lim_km.items(), key=lambda kv: -kv[1]) if k.strip()},
    "limites_total_km": round(sum(lim_km.values())),
})

referencias = {"ba": (-34.6037, -58.3816), "cor": (-31.4201, -64.1888), "ros": (-32.9442, -60.6505)}
ind = {}
for k, (rla, rlo) in referencias.items():
    ind["d_" + k] = haversine_km(la, lo, rla, rlo)

d, i = mas_cercano("pasos"); ind["d_paso"] = d; paso_i = i
d, i = mas_cercano("puertos"); ind["d_puerto"] = d; puerto_i = i
d, i = mas_cercano("aeropuertos"); ind["d_aero"] = d; aero_i = i
d, i = mas_cercano("centrales"); ind["d_central"] = d
d, i = mas_cercano("parques"); ind["d_parque"] = d; parque_i = i
ind["parq30"] = cuenta_radio("parques", 30)
d, i = mas_cercano("transformadoras"); ind["d_transf"] = d
ind["salud10"] = cuenta_radio("salud", 10)
ind["fab20"] = cuenta_radio("fabricas", 20)
ind["univ30"] = cuenta_radio("universidades", 30)
ind["est10"] = cuenta_radio("estaciones_servicio", 10)
ind["d_ruta"] = dist_a_lineas(capas["rutas"])
ind["d_tren"] = dist_a_lineas(capas["ferrocarril"])

for j, m in enumerate(muni):
    for k, arr in ind.items():
        v = arr[j]
        m[k] = int(round(float(v))) if k.startswith("d_") else int(v)
    m["paso"] = capas["pasos"][paso_i[j]][2]
    m["puerto"] = capas["puertos"][puerto_i[j]][2]
    m["aero"] = capas["aeropuertos"][aero_i[j]][2]
    m["parque"] = capas["parques"][parque_i[j]][2]

# ---------- totales por provincia ----------
por_prov = {}
for m in muni:
    r = por_prov.setdefault(m["pv"], {"pv": m["pv"], "pc": m["pc"], "gl": 0, "pob": 0, "viv": 0})
    r["gl"] += 1
    r["pob"] += m["pob"] or 0
    r["viv"] += m["viv"] or 0

guardar("municipios.json", muni)
guardar("provincias_resumen.json", sorted(por_prov.values(), key=lambda r: -r["pob"]))
guardar("sin_ubicacion.json", {"sin_ubicacion": sin_ubic, "sin_gobierno_local": sin_gl, "total_censo": tot_censo, "total_mapa": tot_mapa})
for nombre, datos in capas.items():
    guardar(f"capa_{nombre}.json", datos)
print("Listo.")
