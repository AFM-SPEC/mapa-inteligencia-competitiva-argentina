# Reemplaza en docs/datos/municipios.json la edad mediana y la PEA «del departamento» por las calculadas con radios censales
# (resultado de procesar_radios.py). Correr DESPUÉS de procesar_censo_dptos.py.
# Uso:  python3 -I herramientas/integrar_radios.py
import glob, json

gl = {}
for fn in glob.glob("datos-origen/radios_gl/*.json"):
    gl.update(json.load(open(fn))["gl"])
ALIAS = {"309005": "309029"}  # Junta de Gobierno San Miguel (Entre Ríos): mismo gobierno local con otro código
muni = json.load(open("docs/datos/municipios.json", encoding="utf-8"))
usados, con = set(), 0
for m in muni:
    if m["c"] == "022000":  # CABA: se deja el dato oficial del INDEC para toda la ciudad
        m["fx"] = "oficial"
        continue
    g = gl.get(ALIAS.get(m["c"], m["c"]))
    m["emd"] = m.get("em") if m.get("fx") != "radios" else m.get("emd")  # edad mediana del departamento (referencia)
    if not g or not g["pob"]:
        m["fx"] = "dpto"
        continue
    usados.add(ALIAS.get(m["c"], m["c"]))
    m.update({"em": g["em"], "pea": g["pea"], "pea_t": g["pea_t"], "des_t": g["des_t"], "dex": 1, "fx": "radios", "comp": g["comp"], "pob_r": g["pob"]})
    con += 1
print("gobiernos locales con dato por radios:", con, "de", len(muni))
print("sin dato por radios (quedan con el del departamento):", [(m["n"], m["pv"]) for m in muni if m.get("fx") == "dpto"][:20])
print("códigos del censo por radios que no están en el mapa:", len(set(gl) - usados))
con_p = [m for m in muni if m.get("fx") == "radios" and m.get("pob")]
dif = [abs(m["pob_r"] - m["pob"]) / m["pob"] for m in con_p]
print("diferencia de población (radios vs cuadro de gobiernos locales): mediana %.2f%%, >5%%: %d" % (100 * sorted(dif)[len(dif) // 2], sum(1 for d in dif if d > 0.05)))
json.dump(muni, open("docs/datos/municipios.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
