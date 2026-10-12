# Lee la planilla del Censo 2022 (población y viviendas por gobierno local), guardada en base64.
import json, base64, zipfile, io
import xml.etree.ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def _filas(ruta):
    txt = open(ruta, encoding="utf-8").read().strip()
    try:
        txt = json.loads(txt)
    except Exception:
        pass
    z = zipfile.ZipFile(io.BytesIO(base64.b64decode(txt)))
    comp = []
    for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
        comp.append("".join(t.text or "" for t in si.iter("{%s}t" % NS["m"])))
    for fila in ET.fromstring(z.read("xl/worksheets/sheet2.xml")).iter("{%s}row" % NS["m"]):
        vals = []
        for c in fila.findall("m:c", NS):
            v = c.find("m:v", NS)
            val = v.text if v is not None else ""
            if c.get("t") == "s":
                val = comp[int(val)]
            vals.append(val)
        yield vals


def _num(x):
    try:
        return int(x)
    except Exception:
        return 0


def leer_censo(ruta):
    censo = {}
    for f in _filas(ruta):
        if len(f) >= 7 and f[2].isdigit() and len(f[2]) == 6:
            censo[f[2]] = {
                "prov": f[1], "cat": f[3], "nombre_censo": f[4],
                "viv": _num(f[5]), "pob": _num(f[6]),
            }
    return censo
