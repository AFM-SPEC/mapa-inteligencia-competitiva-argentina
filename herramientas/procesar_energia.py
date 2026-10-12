# Capa de estaciones transformadoras de alta tensión (Secretaría de Energía, datos.gob.ar) y distancia de cada gobierno local a la más cercana.
# Fuente: http://datos.energia.gob.ar/dataset/5ae5fbf9-5ab3-407b-a047-625bf27835aa  (CSV «transporte-elctrico-at-estaciones-transformadoras.csv»)
# La potencia es INSTALADA (campo potencia_instalada_mv); no es potencia disponible para nuevas conexiones.
# Uso:  python3 -I herramientas/procesar_energia.py     (después de procesar.py)
import csv, json
import numpy as np
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

ORIGEN, SALIDA = "datos-origen", "docs/datos"


def provincias():
    t = json.loads(open(f"{ORIGEN}/capa_provincias.json", encoding="utf-8").read())
    t = json.loads(t) if isinstance(t, str) else t
    g = [shape(f["geometry"]) for f in t["features"]]
    return g, [f["properties"]["in1"] for f in t["features"]]


def prov_de(lat, lon, geoms, codigos, arbol):
    p = Point(lon, lat)
    for i in arbol.query(p):
        if geoms[i].contains(p):
            return codigos[i]
    return codigos[int(arbol.nearest(p))]


def num(x):
    try:
        return float(x)
    except ValueError:
        return None


geoms, cods = provincias()
arbol = STRtree(geoms)
filas = []
for r in csv.DictReader(open(f"{ORIGEN}/estaciones_transformadoras_AT.csv", encoding="utf-8-sig")):
    lon, lat = json.loads(r["geojson"])["coordinates"][0]
    mva = num(r["potencia_instalada_mv"])
    kv = [v.strip() for v in r["tension_entrada"].split("|") if v.strip()]
    sal = [v.strip() for v in r["tension_salida"].split("|") if v.strip()]
    filas.append([round(lat, 4), round(lon, 4), r["nombre"].title().replace(" De ", " de ").strip(), (r["concesion"] or "").replace("SIN DATOS", "").strip(),
                  "/".join(kv), "/".join(sal), mva if mva else None, (r["fecha_puesta_servicio"] or "")[:4], prov_de(lat, lon, geoms, cods, arbol)])
json.dump(filas, open(f"{SALIDA}/capa_estaciones_at.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("estaciones AT:", len(filas), "| con potencia:", sum(1 for f in filas if f[6]), "| MVA instalados informados:", sum(f[6] or 0 for f in filas))

# distancia de cada gobierno local a la estación AT más cercana
def hav(la1, lo1, la2, lo2):
    la1, lo1, la2, lo2 = map(np.radians, (la1, lo1, la2, lo2))
    a = np.sin((la2 - la1) / 2) ** 2 + np.cos(la1) * np.cos(la2) * np.sin((lo2 - lo1) / 2) ** 2
    return 6371.0 * 2 * np.arcsin(np.sqrt(a))


ela = np.array([f[0] for f in filas]); elo = np.array([f[1] for f in filas])
muni = json.load(open(f"{SALIDA}/municipios.json", encoding="utf-8"))
for m in muni:
    d = hav(m["la"], m["lo"], ela, elo)
    i = int(np.argmin(d))
    m["d_at"] = int(round(float(d[i])))
    m["at"] = filas[i][2]
json.dump(muni, open(f"{SALIDA}/municipios.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("Listo.")
