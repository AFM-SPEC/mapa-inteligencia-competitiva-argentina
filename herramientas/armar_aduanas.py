# Arma docs/datos/aduanas_comercio.json con el comercio exterior por ADUANA (ARCA), a partir de los resúmenes mensuales que genera procesar_aduanas.py.
# Importaciones a consumo (IC + IG): FOB en dólares de cada ítem, contado una vez. Otros tipos excluyen IC e IG. Exportaciones: archivo «agregado» de ARCA (con reserva estadística: no llega al total nacional).
# La ubicación de cada aduana sale de la ciudad que nombra el código (tabla ANEXO IV de la RG 1452); no es un dato oficial de coordenadas.
# Uso:  python3 -I herramientas/armar_aduanas.py
import csv, glob, json
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

ORIGEN, SALIDA = "datos-origen", "docs/datos"

# código ARCA: (nombre, latitud, longitud, ubicación aproximada)
UBIC = {
    "001": ("Buenos Aires (Capital)", -34.60, -58.37, 0), "003": ("Bahía Blanca", -38.72, -62.27, 0), "004": ("Bariloche", -41.13, -71.31, 0),
    "008": ("Campana", -34.16, -58.96, 0), "010": ("Barranqueras", -27.49, -58.93, 0), "012": ("Clorinda", -25.29, -57.72, 0),
    "013": ("Colón", -32.22, -58.14, 0), "014": ("Comodoro Rivadavia", -45.87, -67.50, 0), "015": ("Concepción del Uruguay", -32.48, -58.23, 0),
    "016": ("Concordia", -31.39, -58.02, 0), "017": ("Córdoba", -31.42, -64.19, 0), "018": ("Corrientes", -27.47, -58.83, 0),
    "019": ("Puerto Deseado", -47.75, -65.90, 0), "020": ("Diamante", -32.07, -60.64, 0), "023": ("Esquel", -42.91, -71.32, 0),
    "024": ("Formosa", -26.19, -58.18, 0), "025": ("Goya", -29.14, -59.26, 0), "026": ("Gualeguaychú", -33.01, -58.52, 0),
    "029": ("Iguazú", -25.60, -54.57, 0), "031": ("Jujuy", -24.19, -65.30, 0), "033": ("La Plata", -34.92, -57.95, 0),
    "034": ("La Quiaca", -22.10, -65.60, 0), "037": ("Mar del Plata", -38.00, -57.55, 0), "038": ("Mendoza", -32.89, -68.84, 0),
    "040": ("Necochea", -38.55, -58.74, 0), "041": ("Paraná", -31.73, -60.53, 0), "042": ("Paso de los Libres", -29.71, -57.09, 0),
    "045": ("Pocitos", -22.47, -63.82, 0), "046": ("Posadas", -27.37, -55.90, 0), "047": ("Puerto Madryn", -42.77, -65.04, 0),
    "048": ("Río Gallegos", -51.62, -69.22, 0), "049": ("Río Grande", -53.79, -67.70, 0), "052": ("Rosario", -32.95, -60.64, 0),
    "053": ("Salta", -24.78, -65.41, 0), "054": ("San Javier", -27.87, -55.13, 0), "055": ("San Juan", -31.54, -68.54, 0),
    "057": ("San Lorenzo", -32.75, -60.73, 0), "058": ("San Martín de los Andes", -40.16, -71.35, 0), "059": ("San Nicolás", -33.33, -60.21, 0),
    "060": ("San Pedro", -33.68, -59.67, 1), "061": ("Santa Cruz", -50.02, -68.53, 1), "062": ("Santa Fe", -31.63, -60.70, 0),
    "066": ("Tinogasta", -28.06, -67.57, 0), "067": ("Ushuaia", -54.81, -68.30, 0), "069": ("Villa Constitución", -33.23, -60.33, 0),
    "073": ("Ezeiza", -34.82, -58.54, 0), "074": ("Tucumán", -26.82, -65.22, 0), "075": ("Neuquén", -38.95, -68.06, 0),
    "076": ("Orán", -23.13, -64.33, 0), "078": ("San Rafael", -34.62, -68.33, 0), "079": ("La Rioja", -29.41, -66.86, 0),
    "080": ("San Antonio Oeste", -40.73, -64.95, 0), "082": ("Bernardo de Irigoyen", -26.25, -53.64, 0), "083": ("San Luis", -33.30, -66.34, 0),
    "084": ("Santo Tomé", -28.55, -56.04, 0), "085": ("Villa Regina", -39.10, -67.07, 0), "086": ("Oberá", -27.49, -55.12, 0),
    "087": ("Caleta Olivia", -46.44, -67.52, 0), "088": ("General Deheza", -32.76, -63.58, 0), "089": ("Santiago del Estero", -27.78, -64.26, 0),
    "090": ("General Pico", -35.66, -63.76, 0), "091": ("Buenos Aires Norte", -34.57, -58.45, 1), "092": ("Buenos Aires Sur", -34.66, -58.40, 1),
    "093": ("Rafaela", -31.25, -61.49, 0), "094": ("Venado Tuerto", -33.75, -61.97, 0),
    "253": ("Zona franca Río Gallegos", -51.62, -69.22, 0), "258": ("Zona franca General Pico", -35.66, -63.76, 0),
    "266": ("Zona franca Coronel Rosales", -38.89, -62.08, 0), "267": ("Zona franca Concepción del Uruguay", -32.48, -58.23, 0),
    "268": ("Zona franca Villa Constitución", -33.23, -60.33, 0), "269": ("Zona franca Puerto Galván", -38.78, -62.33, 0),
    "274": ("Zona franca Perico", -24.38, -65.12, 0), "275": ("Zona franca Zapala", -38.90, -70.06, 0),
}

CAPITULOS = {
    "01": "Animales vivos", "02": "Carnes", "03": "Pescados y mariscos", "04": "Lácteos y huevos", "05": "Otros productos animales", "06": "Plantas vivas y flores",
    "07": "Hortalizas", "08": "Frutas", "09": "Café, té y especias", "10": "Cereales", "11": "Productos de molinería", "12": "Semillas oleaginosas",
    "13": "Gomas y resinas", "14": "Materias trenzables", "15": "Grasas y aceites", "16": "Conservas de carne y pescado", "17": "Azúcares", "18": "Cacao y chocolate",
    "19": "Preparados de cereales", "20": "Conservas de frutas y hortalizas", "21": "Preparaciones alimenticias", "22": "Bebidas", "23": "Residuos de la industria alimentaria",
    "24": "Tabaco", "25": "Sal, yeso y cemento", "26": "Minerales y metales en bruto", "27": "Combustibles y energía", "28": "Químicos inorgánicos", "29": "Químicos orgánicos",
    "30": "Productos farmacéuticos", "31": "Abonos y fertilizantes", "32": "Pinturas y colorantes", "33": "Perfumería y cosmética", "34": "Jabones y ceras",
    "35": "Colas y enzimas", "36": "Explosivos", "37": "Productos fotográficos", "38": "Otros químicos", "39": "Plásticos", "40": "Caucho", "41": "Cueros y pieles",
    "42": "Manufacturas de cuero", "43": "Peletería", "44": "Madera", "45": "Corcho", "46": "Cestería", "47": "Pasta de madera", "48": "Papel y cartón", "49": "Libros e impresos",
    "50": "Seda", "51": "Lana", "52": "Algodón", "53": "Otras fibras vegetales", "54": "Filamentos sintéticos", "55": "Fibras sintéticas cortas", "56": "Fieltros y no tejidos",
    "57": "Alfombras", "58": "Tejidos especiales", "59": "Tejidos impregnados", "60": "Tejidos de punto", "61": "Prendas de punto", "62": "Prendas de tela", "63": "Textiles confeccionados",
    "64": "Calzado", "65": "Sombreros", "66": "Paraguas", "67": "Plumas y flores artificiales", "68": "Manufacturas de piedra", "69": "Cerámica", "70": "Vidrio",
    "71": "Perlas, piedras y joyería", "72": "Fundición, hierro y acero", "73": "Manufacturas de hierro o acero", "74": "Cobre", "75": "Níquel", "76": "Aluminio", "78": "Plomo",
    "79": "Cinc", "80": "Estaño", "81": "Otros metales comunes", "82": "Herramientas y cuchillería", "83": "Manufacturas diversas de metal", "84": "Maquinaria y calderas",
    "85": "Aparatos eléctricos y electrónicos", "86": "Material ferroviario", "87": "Vehículos y autopartes", "88": "Aeronaves", "89": "Barcos", "90": "Instrumentos de óptica y médicos",
    "91": "Relojería", "92": "Instrumentos musicales", "93": "Armas y municiones", "94": "Muebles y luminarias", "95": "Juguetes y deportes", "96": "Manufacturas diversas",
    "97": "Arte y antigüedades", "98": "Operaciones especiales", "99": "Operaciones especiales", "00": "Sin clasificar",
}
PAIS_FIX = {"REP. FED DE ALEMANIA": "Alemania", "ESTADOS UNIDOS": "Estados Unidos", "REINO UNIDO": "Reino Unido", "REP. DE COREA": "Corea del Sur", "REPUBLICA DE COREA": "Corea del Sur"}
MEDIOS = {"1": "propios medios", "2": "avión", "3": "ferrocarril", "4": "camión", "5": "arreo", "6": "jangada", "7": "oleoducto o gasoducto", "8": "barco", "9": "conductor eléctrico", "A": "correo", "H": "hidrovía", " ": "sin dato"}


def bonito(s):
    s = s.strip().title().replace(" De ", " de ").replace(" Del ", " del ").replace("Rep.", "Rep.")
    return PAIS_FIX.get(s.upper(), s)


paises = {}
for r in csv.reader(open(f"{ORIGEN}/paises_codigos_ARCA.csv", encoding="utf-8-sig"), delimiter="|"):
    if r and r[0].strip().isdigit():
        paises[r[0].strip()] = bonito(PAIS_FIX.get(r[1].strip().upper(), r[1]))

# provincia de cada aduana (punto en polígono)
t = json.loads(open(f"{ORIGEN}/capa_provincias.json", encoding="utf-8").read())
t = json.loads(t) if isinstance(t, str) else t
geoms = [shape(f["geometry"]) for f in t["features"]]
cods = [f["properties"]["in1"] for f in t["features"]]
arbol = STRtree(geoms)


def prov_de(lat, lon):
    p = Point(lon, lat)
    for i in arbol.query(p):
        if geoms[i].contains(p):
            return cods[i]
    return cods[int(arbol.nearest(p))]


meses = sorted(glob.glob(f"{ORIGEN}/aduanas_mensual/*.json"))
datos = [json.load(open(f)) for f in meses]
datos = [d for d in datos if "202510" <= d["mes"] <= "202609"]
claves = [d["mes"] for d in datos]
print("meses:", claves)


def top(d, n, nom=None):
    return [[(nom or (lambda k: k))(k), round(v)] for k, v in sorted(d.items(), key=lambda kv: -kv[1])[:n] if v > 0]


def acumular(destino, origen):
    for k, v in origen.items():
        destino[k] = destino.get(k, 0.0) + v


adu = {}
nac = {"cap_i": {}, "cap_e": {}, "pais_i": {}, "pais_e": {}, "mes_i": [], "mes_e": [], "mes_te": [], "imp_otras": 0}
for d in datos:
    nac["mes_i"].append(round(sum(a["usd"] for a in d["imp"].values())))
    nac["imp_otras"] += sum(v["usd"] for aduana_tipos in d.get("imp_tipos", {}).values() for tipo, v in aduana_tipos.items() if tipo not in ("IC", "IG"))
    nac["mes_e"].append(round(sum(a["usd"] for a in d["exp"].values())))
    nac["mes_te"].append(round(d.get("tot_exp", 0)))
    for cod, tipos in d.get("imp_tipos", {}).items():
        otras = sum(v["usd"] for tipo, v in tipos.items() if tipo not in ("IC", "IG"))
        if otras:
            r = adu.setdefault(cod, {"i": {"usd": 0, "n": 0, "cap": {}, "pais": {}, "medio": {}, "mes": [0] * len(datos)},
                                     "e": {"usd": 0, "n": 0, "cap": {}, "pais": {}, "medio": {}, "mes": [0] * len(datos), "kg": 0}, "io": 0})
            r["io"] = r.get("io", 0) + otras
    for lado, clave in (("imp", "i"), ("exp", "e")):
        for cod, a in d[lado].items():
            r = adu.setdefault(cod, {"i": {"usd": 0, "n": 0, "cap": {}, "pais": {}, "medio": {}, "mes": [0] * len(datos)},
                                     "e": {"usd": 0, "n": 0, "cap": {}, "pais": {}, "medio": {}, "mes": [0] * len(datos), "kg": 0}})
            x = r[clave]
            x["usd"] += a["usd"]
            x["n"] += a.get("items", a.get("decl", 0))
            x["mes"][claves.index(d["mes"])] = round(a["usd"])
            if clave == "e":
                x["kg"] += a.get("kg", 0)
            for k in ("cap", "pais", "medio"):
                acumular(x[k], a[k])
            acumular(nac["cap_" + clave], a["cap"])
            acumular(nac["pais_" + clave], a["pais"])

nombre_pais = lambda k: paises.get(k.strip(), "Código " + k.strip() if k.strip() else "Sin dato")
nombre_cap = lambda k: CAPITULOS.get(k, "Capítulo " + k)
salida = []
for cod, r in sorted(adu.items()):
    if cod not in UBIC:
        if cod.isdigit():
            print("aduana sin ubicación:", cod)
        continue  # los renglones de encabezado repetidos en el archivo (ADU, ---) no son aduanas
    nom, la, lo, aprox = UBIC[cod]
    i, e = r["i"], r["e"]
    mi = max(i["medio"].items(), key=lambda kv: kv[1])[0] if i["medio"] else None
    me = max(e["medio"].items(), key=lambda kv: kv[1])[0] if e["medio"] else None
    salida.append({
        "c": cod, "n": nom, "la": la, "lo": lo, "ap": aprox, "pc": prov_de(la, lo), "zf": cod >= "250",
        "imp": round(i["usd"]), "imp_otras": round(r.get("io", 0)), "exp": round(e["usd"]), "items": i["n"], "decl": e["n"], "kg": round(e["kg"]),
        "medio_i": MEDIOS.get(mi, mi), "medio_e": MEDIOS.get(me, me),
        "cap_i": top(i["cap"], 6, nombre_cap), "cap_e": top(e["cap"], 6, nombre_cap),
        "pais_i": top(i["pais"], 6, nombre_pais), "pais_e": top(e["pais"], 6, nombre_pais),
        "mes_i": i["mes"], "mes_e": e["mes"],
    })
salida.sort(key=lambda a: -(a["imp"] + a["exp"]))
tot_i = sum(a["imp"] for a in salida)
tot_e = sum(a["exp"] for a in salida)
tot_te = sum(nac["mes_te"])
out = {
    "meses": claves, "desde": claves[0], "hasta": claves[-1],
    "imp_total": tot_i, "imp_otras": round(nac["imp_otras"]), "exp_total_aduanas": tot_e, "exp_total_nacional": tot_te,
    "mes_i": nac["mes_i"], "mes_e": nac["mes_e"], "mes_te": nac["mes_te"],
    "cap_i": top(nac["cap_i"], 15, nombre_cap), "cap_e": top(nac["cap_e"], 15, nombre_cap),
    "pais_i": top(nac["pais_i"], 15, nombre_pais), "pais_e": top(nac["pais_e"], 15, nombre_pais),
    "aduanas": salida,
}
json.dump(out, open(f"{SALIDA}/aduanas_comercio.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("aduanas:", len(salida), "| importaciones US$ M %.0f | exportaciones por aduana US$ M %.0f de %.0f del total nacional (%.0f %%)" % (tot_i / 1e6, tot_e / 1e6, tot_te / 1e6, 100 * tot_e / tot_te if tot_te else 0))
