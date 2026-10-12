# Prepara los datos de comercio exterior por provincia (INDEC, Origen provincial de las exportaciones).
import json, os
ORIGEN = "datos-origen/indec_opex_hojas.json"
SALIDA = "docs/datos/comercio.json"

t = json.loads(open(ORIGEN, encoding="utf-8").read())
if isinstance(t, str):
    t = json.loads(t)

PROVS = [
    "Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Córdoba", "Entre Ríos", "La Pampa", "Santa Fe", "Chubut", "Neuquén", "Río Negro",
    "Santa Cruz", "Tierra del Fuego, Antártida e Islas del Atlántico Sur", "Catamarca", "Jujuy", "La Rioja", "Salta", "Santiago del Estero",
    "Tucumán", "Mendoza", "San Juan", "San Luis", "Chaco", "Corrientes", "Formosa", "Misiones",
]


def num(x):
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x).strip()
    if s in ("-", "", "///", "…"):
        return 0.0
    try:
        return float(s)
    except ValueError:
        return None


def limpio(s):
    return str(s).strip()


prov = {p: {} for p in PROVS}

# cuadro 1: total, variación, participación (primer semestre 2025)
for r in t["cuadro1"]:
    p = limpio(r[1])
    if p in prov:
        prov[p].update({"h1_2025": num(r[2]), "var": num(r[3]), "part": num(r[4])})

# cuadro 3: grandes rubros
for r in t["cuadro3"]:
    p = limpio(r[1])
    if p in prov:
        prov[p]["rubros"] = {"PP": num(r[3]), "MOA": num(r[4]), "MOI": num(r[5]), "CyE": num(r[6])}

# zonas económicas y países
cab = [limpio(c) for c in t["OP-Zonas 2025"][2]]
zonas_cols = [c for c in cab[3:] if c]
for r in t["OP-Zonas 2025"]:
    p = limpio(r[1])
    if p in prov:
        prov[p]["zonas"] = {c: num(r[3 + i]) for i, c in enumerate(zonas_cols) if num(r[3 + i]) is not None}

# serie anual
anios = [str(a).replace("*", "").replace(".0", "") for a in t["Region-país 2015-2024 anual"][3][2:]]
for r in t["Region-país 2015-2024 anual"]:
    p = limpio(r[1])
    if p in prov:
        prov[p]["anual"] = {a: num(v) for a, v in zip(anios, r[2:])}

# principales subrubros
actual = None
for r in t["Prov-subrubros 2025 y 2024"][5:]:
    n = limpio(r[0])
    if not n:
        continue
    if n in prov:
        actual = n
        prov[n]["sub"] = []
    elif actual and num(r[1]) is not None:
        prov[actual]["sub"].append([n, num(r[1]), num(r[2])])
    elif n.startswith(("Extranjero", "Indeterminado", "Nota", "Fuente")):
        actual = None

total = {
    "h1_2025": num(t["cuadro1"][5][2]), "var": num(t["cuadro1"][5][3]),
    "rubros": {"PP": num(t["cuadro3"][5][3]), "MOA": num(t["cuadro3"][5][4]), "MOI": num(t["cuadro3"][5][5]), "CyE": num(t["cuadro3"][5][6])},
}
for r in t["OP-Zonas 2025"]:
    if limpio(r[1]).startswith("Total primer"):
        total["zonas"] = {c: num(r[3 + i]) for i, c in enumerate(zonas_cols) if num(r[3 + i]) is not None}
for r in t["Region-país 2015-2024 anual"]:
    if limpio(r[0]) == "Total general":
        total["anual"] = {a: num(v) for a, v in zip(anios, r[2:])}

for p, d in prov.items():
    faltan = [k for k in ("h1_2025", "rubros", "zonas", "anual", "sub") if k not in d]
    if faltan:
        print("FALTA", p, faltan)

out = {"provincias": prov, "nacional": total, "zonas_cols": zonas_cols,
       "periodo": "Primer semestre de 2025", "anio_anual": "2024"}
with open(SALIDA, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print("zonas:", zonas_cols)
print("ok", os.path.getsize(SALIDA), "bytes")
print(prov["Mendoza"])
