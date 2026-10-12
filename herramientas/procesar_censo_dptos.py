# Asigna a cada gobierno local su departamento y le agrega edad mediana y población económicamente activa (PEA) del Censo 2022.
# Los valores son DEL DEPARTAMENTO (el INDEC no publica estos cuadros por gobierno local); la PEA municipal es una ESTIMACIÓN.
# Excepción: en la provincia de Buenos Aires el partido es el municipio, así que ahí el dato es exacto.
# Uso:  python3 -I herramientas/procesar_censo_dptos.py     (después de procesar.py, desde la carpeta mapa-municipios-ar)
import json, os
from shapely.geometry import shape, Point
from shapely.strtree import STRtree

ORIGEN = "datos-origen"
SALIDA = "docs/datos"


def leer(nombre):
    t = json.loads(open(f"{ORIGEN}/{nombre}", encoding="utf-8").read())
    return json.loads(t) if isinstance(t, str) else t


def cod5(x):
    s = str(x).strip()
    return s.zfill(5) if s.isdigit() else None


# ---------- planillas del censo por departamento ----------
comp = leer("censo_edad_actividad_completo.json")
edad, act = {}, {}
for prov, filas in comp["edad"].items():
    for f in filas:
        c = cod5(f[0])
        if c and f[2] not in ("", None):
            edad[c] = int(f[2])  # edad mediana (total)
for prov, filas in comp["act"].items():
    for f in filas:
        c = cod5(f[0])
        if c and isinstance(f[2], (int, float)):
            act[c] = {"p14": int(f[2]), "pea": int(f[3]), "ocu": int(f[4]), "des": int(f[5]), "ina": int(f[6])}
pob = {}
for prov, filas in leer("censo_pob_dptos.json").items():
    for f in filas:
        c = cod5(f[0])
        if c and isinstance(f[3], (int, float)):
            pob[c] = int(f[3])

# ---------- departamentos (IGN) ----------
dptos = leer("capa_departamentos.json")["features"]
geoms, info = [], []
for f in dptos:
    geoms.append(shape(f["geometry"]))
    info.append((f["properties"]["in1"], f["properties"]["nam"]))
arbol = STRtree(geoms)
print("departamentos IGN:", len(geoms))

muni = json.load(open(f"{SALIDA}/municipios.json", encoding="utf-8"))
sin_match = []
contador = {}
for m in muni:
    if m["c"] == "022000":
        m["dp"], m["dpn"], m["dpm"] = "02", "Ciudad Autónoma de Buenos Aires", "exacto"
        continue
    p = Point(m["lo"], m["la"])
    idx = [i for i in arbol.query(p) if geoms[i].contains(p)]
    modo = "dentro"
    if not idx:
        i = int(arbol.nearest(p))
        idx = [i]
        modo = "cercano"
    i = idx[0]
    cod, nom = info[i]
    # el código del gobierno local empieza con la provincia: si no coincide con la del departamento, se busca el más cercano de su provincia
    if cod[:2] != m["pc"]:
        cand = [j for j in range(len(info)) if info[j][0][:2] == m["pc"]]
        j = min(cand, key=lambda k: geoms[k].distance(p))
        cod, nom = info[j]
        modo = "cercano"
    m["dp"], m["dpn"] = cod, nom
    m["dpm"] = modo
    contador[cod] = contador.get(cod, 0) + 1

# ---------- valores por gobierno local ----------
faltan = set()
for m in muni:
    cod = m["dp"]
    if m["c"] == "022000":
        a = act.get("00002")
        e = edad.get("00002")
    else:
        a, e = act.get(cod), edad.get(cod)
    if e is None or a is None:
        faltan.add((cod, m["dpn"]))
    m["ngl"] = contador.get(cod, 1)
    # En la provincia de Buenos Aires el partido es el municipio: el dato es exacto.
    exacto = m["pc"] == "06" or m["c"] == "022000"
    m["dex"] = 1 if exacto else 0
    m["em"] = e
    if a:
        m["pea_t"] = round(100 * a["pea"] / a["p14"], 1)      # tasa de actividad del departamento (PEA / población de 14+), %
        m["des_t"] = round(100 * a["des"] / a["pea"], 1) if a["pea"] else None  # desocupados / PEA, %
        pd = pob.get(cod) if m["c"] != "022000" else pob.get("00002")
        # PEA estimada del municipio = población municipal x (14+ / población total del departamento) x tasa de actividad
        if m["pob"] and pd:
            m["pea"] = round(m["pob"] * a["p14"] / pd * a["pea"] / a["p14"]) if not exacto else None
            if exacto and m["c"] != "022000":
                m["pea"] = a["pea"]  # partido = municipio: PEA censal
            elif m["c"] == "022000":
                m["pea"] = a["pea"]
        else:
            m["pea"] = a["pea"] if exacto else None

print("sin dato censal:", sorted(faltan))
print("con edad mediana:", sum(1 for m in muni if m.get("em") is not None), "de", len(muni))
print("con PEA:", sum(1 for m in muni if m.get("pea") is not None))
print("fuera de polígono (asignados al departamento más cercano):", sum(1 for m in muni if m["dpm"] == "cercano"))

with open(f"{SALIDA}/municipios.json", "w", encoding="utf-8") as f:
    json.dump(muni, f, ensure_ascii=False, separators=(",", ":"))

# tabla por departamento (útil para la ficha y las tablas)
tab = []
for cod, (nom) in {i[0]: i[1] for i in info}.items():
    a = act.get(cod)
    tab.append({"c": cod, "n": nom, "em": edad.get(cod), "pob": pob.get(cod),
                "pea": a["pea"] if a else None, "ocu": a["ocu"] if a else None, "des": a["des"] if a else None,
                "p14": a["p14"] if a else None, "ina": a["ina"] if a else None})
with open(f"{SALIDA}/departamentos_censo.json", "w", encoding="utf-8") as f:
    json.dump(tab, f, ensure_ascii=False, separators=(",", ":"))
print("Listo. municipios.json actualizado y departamentos_censo.json:", len(tab))
