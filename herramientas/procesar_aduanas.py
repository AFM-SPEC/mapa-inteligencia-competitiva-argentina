# Resume por aduana los archivos mensuales de «Información de comercio exterior» de ARCA (importaciones y exportaciones).
# Cada mes pesa ~160 MB comprimido y ~5,7 GB descomprimido: se lee directo del .zip, sin descomprimir en disco.
# Uso:  python3 -I herramientas/procesar_aduanas.py AAAAMM [AAAAMM ...]
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


def resumir(zip_ruta, mes):
    imp, exp = {}, {}
    z = zipfile.ZipFile(zip_ruta)
    # ---- exportaciones (archivo ya agregado por aduana, NCM y país)
    with z.open(f"expo_agregado_{mes}.lst") as f:
        for linea in f:
            c = linea.split(b"'")
            if len(c) < 10 or c[0] != b"E":
                continue
            adu = c[2].decode()
            ncm = c[3].decode()[:2]
            a = exp.setdefault(adu, {"usd": 0.0, "kg": 0.0, "decl": 0, "cap": {}, "pais": {}, "medio": {}})
            fob = num(c[8])
            a["usd"] += fob
            a["kg"] += num(c[7])
            a["decl"] += int(num(c[9]))
            suma(a["cap"], ncm, fob)
            suma(a["pais"], c[4].decode(), fob)
            suma(a["medio"], c[5].decode(), fob)
    # ---- importaciones (una fila por concepto arancelario de cada ítem: se cuenta una sola vez cada ítem)
    previo = None
    with z.open(f"impo_{mes}.lst") as f:
        next(f); next(f)
        for linea in f:
            c = linea.split(b"'")
            if len(c) < 15:
                continue
            clave = (c[0], c[1], c[2])
            if clave == previo:
                continue
            previo = clave
            adu = c[0].decode()
            a = imp.setdefault(adu, {"usd": 0.0, "items": 0, "cap": {}, "pais": {}, "medio": {}})
            v = num(c[8])
            a["usd"] += v
            a["items"] += 1
            suma(a["cap"], c[13].decode()[:2], v)
            suma(a["pais"], c[11].decode(), v)
            suma(a["medio"], c[5].decode(), v)
    redondear = lambda o: {k: (round(x, 2) if isinstance(x, float) else x) for k, x in o.items()}
    for tabla in (imp, exp):
        for a in tabla.values():
            for k, v in list(a.items()):
                if isinstance(v, dict):
                    a[k] = redondear(v)
                elif isinstance(v, float):
                    a[k] = round(v, 2)
    return {"mes": mes, "imp": imp, "exp": exp}


if __name__ == "__main__":
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
