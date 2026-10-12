# Resume por aduana los archivos mensuales de «Información de comercio exterior» de ARCA (importaciones a consumo IC + IG y exportaciones).
# Los importes salen del FOB en dólares de cada ítem (FOB_DOLAR), contado una sola vez; las exportaciones salen del archivo «agregado»,
# que ARCA publica con reserva estadística (por eso suma menos que el total nacional).
# Cada mes pesa ~160 MB comprimido y ~5,7 GB descomprimido: se lee directo del .zip, sin descomprimir en disco.
# Uso:  python3 -I herramientas/procesar_aduanas.py AAAAMM [AAAAMM ...]
#       python3 -I herramientas/procesar_aduanas.py --solo-exportaciones AAAAMM ...   (rehace sólo las exportaciones de meses ya procesados)
#       python3 -I herramientas/procesar_aduanas.py --solo-importaciones AAAAMM ...  (rehace sólo las importaciones de meses ya procesados)
#       (baja el zip de ARCA, lo resume en datos-origen/aduanas_mensual/AAAAMM.json y borra el zip)
# Fuente: https://www.arca.gob.ar/operadoresComercioExterior/informacionAgregada/informacion-agregada.asp
import json, os, subprocess, sys, zipfile

CARPETA = "datos-origen/aduanas_mensual"
TMP = os.environ.get("TMP_ADUANAS", "datos-origen/aduanas_tmp")
URL = "https://www.arca.gob.ar/operadoresComercioExterior/informacionAgregada/download.aspx?filename={}.zip"


def num(b):
    try:
        return float(b.strip() or 0)
    except ValueError:
        return 0.0


def suma(d, k, v):
    d[k] = d.get(k, 0.0) + v


def atipico(fob, kg, ncm=""):
    """Error de carga evidente en el archivo de ARCA. Se excluye y se informa en «excluidos». Dos reglas:
    a) más de US$ 1.000 millones en un solo renglón y más de US$ 20 por kilo (agosto de 2026: naftas por US$ 16.925 millones para 40.000 toneladas);
    b) combustibles y energía (capítulo 27) con más de US$ 200 millones y más de US$ 3 por kilo (el combustible vale alrededor de US$ 1 por kilo)."""
    if kg <= 0:
        return False
    return (fob > 1e9 and fob / kg > 20) or (ncm.startswith("27") and fob > 2e8 and fob / kg > 3)


def resumir_exportaciones(z, mes):
    exp, excl, tot_exp = {}, [], 0.0
    # ---- exportaciones (archivo ya agregado por aduana, NCM y país)
    with z.open(f"expo_agregado_{mes}.lst") as f:
        for linea in f:
            c = linea.split(b"'")
            if len(c) < 10 or c[0] != b"E":
                continue
            adu = c[2].decode()
            ncm = c[3].decode()[:2]
            fob = num(c[8])
            if atipico(fob, num(c[7]), c[3].decode()):
                excl.append([adu, c[3].decode(), round(fob), round(num(c[7]))])
                continue
            a = exp.setdefault(adu, {"usd": 0.0, "kg": 0.0, "decl": 0, "cap": {}, "pais": {}, "medio": {}})
            a["usd"] += fob
            a["kg"] += num(c[7])
            a["decl"] += int(num(c[9]))
            suma(a["cap"], ncm, fob)
            suma(a["pais"], c[4].decode(), fob)
            suma(a["medio"], c[5].decode(), fob)
    # ---- total nacional de exportaciones (archivo «total_expo_agregado»): sirve para saber qué parte del total aparece por aduana
    with z.open(f"total_expo_agregado_{mes}.lst") as f:
        for linea in f:
            c = linea.split(b"'")
            if len(c) >= 6 and c[0][-6:-2].isdigit():
                fob = num(c[4])
                if atipico(fob, num(c[3]), c[1].decode()):
                    continue
                tot_exp += fob
    return exp, tot_exp, excl


def redondear_tabla(tabla):
    redondear = lambda o: {k: (round(x, 2) if isinstance(x, float) else x) for k, x in o.items()}
    for a in tabla.values():
        for k, v in list(a.items()):
            if isinstance(v, dict):
                a[k] = redondear(v)
            elif isinstance(v, float):
                a[k] = round(v, 2)


def resumir(zip_ruta, mes):
    z = zipfile.ZipFile(zip_ruta)
    exp, tot_exp, excl = resumir_exportaciones(z, mes)
    imp, imp_tipos = resumir_importaciones(z, mes)
    redondear_tabla(imp)
    redondear_tabla(imp_tipos)
    redondear_tabla(exp)
    return {"mes": mes, "imp": imp, "imp_tipos": imp_tipos, "exp": exp, "tot_exp": round(tot_exp, 2), "excluidos": excl}


def resumir_importaciones(z, mes):
    imp, imp_tipos = {}, {}
    # ---- importaciones (una fila por concepto arancelario de cada ítem: se cuenta una sola vez cada ítem)
    # El archivo NO está ordenado por trámite: el mismo ítem aparece en renglones separados, uno por concepto, así que se
    # guarda el identificador de cada ítem ya contado (aduana, destinación, número de ítem).
    vistos = set()
    with z.open(f"impo_{mes}.lst") as f:
        next(f); next(f)
        for linea in f:
            c = linea.split(b"'")
            if len(c) < 15:
                continue
            clave = (c[0], c[1], c[2])
            if clave in vistos:
                continue
            vistos.add(clave)
            adu = c[0].decode()
            destinacion = c[1].decode()
            tipo = destinacion[5:7] if len(destinacion) >= 7 else "??"
            v = num(c[8])
            ta = imp_tipos.setdefault(adu, {}).setdefault(tipo, {"usd": 0.0, "items": 0})
            ta["usd"] += v
            ta["items"] += 1
            if tipo in ("IC", "IG"):
                a = imp.setdefault(adu, {"usd": 0.0, "items": 0, "cap": {}, "pais": {}, "medio": {}})
                a["usd"] += v
                a["items"] += 1
                suma(a["cap"], c[13].decode()[:2], v)
                suma(a["pais"], c[11].decode(), v)
                suma(a["medio"], c[5].decode(), v)
    return imp, imp_tipos


def rehacer_importaciones(mes):
    """Vuelve a calcular sólo las importaciones y conserva exportaciones y sus totales/exclusiones."""
    zp = f"{TMP}/{mes}.zip"
    if not os.path.exists(zp):
        subprocess.run(["curl", "-sS", "-m", "900", "-L", "-A", "Mozilla/5.0", "-o", zp, URL.format(mes)], check=True)
    imp, imp_tipos = resumir_importaciones(zipfile.ZipFile(zp), mes)
    redondear_tabla(imp)
    redondear_tabla(imp_tipos)
    ruta = f"{CARPETA}/{mes}.json"
    r = json.load(open(ruta, encoding="utf-8"))
    r.update({"imp": imp, "imp_tipos": imp_tipos})
    json.dump(r, open(ruta, "w", encoding="utf-8"), separators=(",", ":"))
    os.remove(zp)
    print(mes, "importaciones a consumo (IC + IG) rehechas:", len(imp), "aduanas; tipos:", sorted({t for a in imp_tipos.values() for t in a}), flush=True)


def rehacer_exportaciones(mes):
    """Vuelve a calcular sólo las exportaciones de un mes ya procesado (usa el zip bajado de ARCA) y deja intactas las importaciones."""
    zp = f"{TMP}/{mes}.zip"
    if not os.path.exists(zp):
        subprocess.run(["curl", "-sS", "-m", "900", "-L", "-A", "Mozilla/5.0", "-o", zp, URL.format(mes)], check=True)
    exp, tot_exp, excl = resumir_exportaciones(zipfile.ZipFile(zp), mes)
    redondear_tabla(exp)
    ruta = f"{CARPETA}/{mes}.json"
    r = json.load(open(ruta, encoding="utf-8"))
    r.update({"exp": exp, "tot_exp": round(tot_exp, 2), "excluidos": excl})
    json.dump(r, open(ruta, "w", encoding="utf-8"), separators=(",", ":"))
    os.remove(zp)
    print(mes, "exportaciones rehechas; excluidos:", excl, flush=True)


if __name__ == "__main__":
    if sys.argv[1:2] == ["--solo-exportaciones"]:
        for mes in sys.argv[2:]:
            rehacer_exportaciones(mes)
        sys.exit()
    if sys.argv[1:2] == ["--solo-importaciones"]:
        os.makedirs(TMP, exist_ok=True)
        for mes in sys.argv[2:]:
            rehacer_importaciones(mes)
        sys.exit()
    os.makedirs(CARPETA, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    for mes in sys.argv[1:]:
        salida = f"{CARPETA}/{mes}.json"
        if os.path.exists(salida):
            print(mes, "ya procesado")
            continue
        zp = f"{TMP}/{mes}.zip"
        if not os.path.exists(zp):
            subprocess.run(["curl", "-sS", "-m", "900", "-L", "-A", "Mozilla/5.0", "-o", zp, URL.format(mes)], check=True)
        if os.path.getsize(zp) < 1000:
            print(mes, "no publicado todavía")
            os.remove(zp)
            continue
        r = resumir(zp, mes)
        with open(salida, "w", encoding="utf-8") as f:
            json.dump(r, f, separators=(",", ":"))
        os.remove(zp)
        print(mes, "listo:", len(r["imp"]), "aduanas con importación,", len(r["exp"]), "con exportación", flush=True)
