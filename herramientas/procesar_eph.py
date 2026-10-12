# Agrega a cada gobierno local principal el aglomerado de la Encuesta Permanente de Hogares (EPH) del INDEC, para poder comparar
# con los valores del Censo 2022 que muestra el mapa. La EPH es una encuesta por muestra de 31 aglomerados urbanos (no cubre los 2.314 gobiernos locales),
# se publica por trimestre y calcula la tasa de actividad sobre la POBLACIÓN TOTAL; el Censo 2022 del mapa la calcula sobre la población de 14 años y más.
# Fuente: INDEC, «Mercado de trabajo. Tasas e indicadores socioeconómicos (EPH). Segundo trimestre de 2026», cuadros 3.2 y 3.3
#   https://www.indec.gob.ar/uploads/informesdeprensa/mercado_trabajo_eph_2trim26433FCBC5A8.pdf
# Los textos de las páginas 18 y 19 de ese PDF están en datos-origen/eph_t2_2026_paginas_18_19.txt (extraídos del PDF).
# Uso:  python3 -I herramientas/procesar_eph.py     (después de procesar.py, integrar_radios.py y procesar_energia.py)
import json, re

ORIGEN, SALIDA = "datos-origen", "docs/datos"
URL = "https://www.indec.gob.ar/uploads/informesdeprensa/mercado_trabajo_eph_2trim26433FCBC5A8.pdf"

# aglomerado EPH -> gobiernos locales (nombre, provincia) que lo componen y que figuran en el mapa. Sólo se enlazan los que el nombre del aglomerado
# o el INDEC identifican con claridad; otros gobiernos locales del mismo aglomerado quedan sin enlazar.
AGLOMERADOS = {
    "Ciudad Autónoma de Buenos Aires": [("Ciudad Autónoma de Buenos Aires", None)],
    "Gran Mendoza": [("Mendoza", "Mendoza")], "Gran San Juan": [("San Juan", "San Juan")], "Gran San Luis": [("San Luis", "San Luis")],
    "Corrientes": [("Corrientes", "Corrientes")], "Formosa": [("Formosa", "Formosa")],
    "Gran Resistencia": [("Resistencia", "Chaco"), ("Barranqueras", "Chaco"), ("Fontana", "Chaco"), ("Puerto Vilelas", "Chaco")],
    "Posadas": [("Posadas", "Misiones"), ("Garupá", "Misiones")],
    "Gran Catamarca": [("San Fernando del Valle de Catamarca", "Catamarca")], "Gran Tucumán-Tafí Viejo": [("San Miguel de Tucumán", "Tucumán")],
    "Jujuy-Palpalá": [("San Salvador de Jujuy", "Jujuy")], "La Rioja": [("La Rioja", "La Rioja")], "Salta": [("Salta", "Salta")],
    "Santiago del Estero-La Banda": [("Santiago del Estero", "Santiago del Estero"), ("La Banda", "Santiago del Estero")],
    "Bahía Blanca-Cerri": [("Bahía Blanca", "Buenos Aires")], "Concordia": [("Concordia", "Entre Ríos")], "Gran Córdoba": [("Córdoba", "Córdoba")],
    "Gran La Plata": [("La Plata", "Buenos Aires")], "Gran Rosario": [("Rosario", "Santa Fe")], "Gran Paraná": [("Paraná", "Entre Ríos")],
    "Gran Santa Fe": [("Santa Fe", "Santa Fe")], "Mar del Plata": [("General Pueyrredón", "Buenos Aires")], "Río Cuarto": [("Río Cuarto", "Córdoba")],
    "Santa Rosa-Toay": [("Santa Rosa", "La Pampa"), ("Toay", "La Pampa")],
    "San Nicolás-Villa Constitución": [("San Nicolás", "Buenos Aires"), ("Villa Constitución", "Santa Fe")],
    "Comodoro Rivadavia-Rada Tilly": [("Comodoro Rivadavia", "Chubut"), ("Rada Tilly", "Chubut")],
    "Neuquén-Plottier": [("Neuquén", "Neuquén"), ("Plottier", "Neuquén")], "Río Gallegos": [("Río Gallegos", "Santa Cruz")],
    "Ushuaia-Río Grande": [("Ushuaia", "Tierra del Fuego, Antártida e Islas del Atlántico Sur"), ("Río Grande", "Tierra del Fuego, Antártida e Islas del Atlántico Sur")],
    "Rawson-Trelew": [("Trelew", "Chubut"), ("Rawson", "Chubut")], "Viedma-Carmen de Patagones": [("Viedma", "Río Negro")],
}
NOMBRES = sorted(list(AGLOMERADOS) + ["Partidos del Gran Buenos Aires", "Total 31 aglomerados urbanos"], key=len, reverse=True)


def num(s):
    return float(s.replace(".", "").replace(",", ".")) if "," not in s else float(s.replace(",", "."))


def leer():
    p18, p19 = open(f"{ORIGEN}/eph_t2_2026_paginas_18_19.txt", encoding="utf-8").read().split("=====PAGINA=====")
    tasas, pobl = {}, {}
    for linea in p18.splitlines():
        for n in NOMBRES:
            if linea.startswith(n + " "):
                v = linea[len(n):].split()
                if len(v) >= 3 and n not in tasas:
                    tasas[n] = [num(x) for x in v[:3]]  # actividad, empleo, desocupación
    for linea in p19.splitlines():
        linea = linea.replace("0 (1)", "0")
        for n in NOMBRES:
            if linea.startswith(n + " "):
                v = linea[len(n):].split()
                if len(v) >= 4 and n not in pobl:
                    pobl[n] = [int(x.replace(".", "")) for x in v[:4]]  # miles: total, activa, ocupada, desocupada
    return tasas, pobl


def main():
    tasas, pobl = leer()
    faltan = [n for n in AGLOMERADOS if n not in tasas or n not in pobl]
    assert not faltan, faltan
    out = {"periodo": "2.º trimestre de 2026", "fuente": URL, "nacional": None, "aglomerados": {}}
    for n in list(AGLOMERADOS) + ["Total 31 aglomerados urbanos"]:
        a, e, d = tasas[n]
        pt, pa, po, pd_ = pobl[n]
        r = {"n": n, "act": a, "emp": e, "des": d, "pob": pt * 1000, "pea": pa * 1000, "deso": pd_ * 1000}
        if n.startswith("Total"):
            out["nacional"] = r
        else:
            out["aglomerados"][n] = r
    muni = json.load(open(f"{SALIDA}/municipios.json", encoding="utf-8"))
    por = {}
    for k, lista in AGLOMERADOS.items():
        for nombre, pv in lista:
            por[(nombre, pv)] = k
    enlazados = set()
    for m in muni:
        m.pop("eph", None)
        k = por.get((m["n"], m["pv"])) or (por.get((m["n"], None)) if m["pv"].startswith("Ciudad Autónoma") else None)
        if k:
            m["eph"] = k
            enlazados.add((m["n"], m["pv"]))
    sin = [x for x in por if x not in enlazados and x[1] is not None]
    json.dump(out, open(f"{SALIDA}/eph_aglomerados.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump(muni, open(f"{SALIDA}/municipios.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("aglomerados:", len(out["aglomerados"]), "| gobiernos locales enlazados:", len(enlazados), "| sin encontrar en el mapa:", sin)


if __name__ == "__main__":
    main()
