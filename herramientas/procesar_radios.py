# Calcula edad mediana y población económicamente activa (PEA) por GOBIERNO LOCAL a partir del Censo 2022 por radio censal del INDEC.
# Fuente: https://infra.datos.gob.ar/catalog/indec/dataset/48 (un zip por provincia: persona / hogar / vivienda, formato largo).
# Método:
#   1) De cada radio se toma la distribución de PERSONA_EDAD (edad simple) y PERSONA_CONDACT (1 ocupado, 2 desocupado, 3 inactivo; 14+).
#   2) VIVIENDA_CODGL da, por radio, la cantidad de viviendas de cada gobierno local. Si un radio cae en más de un gobierno local,
#      sus personas se reparten en proporción a las viviendas (supuesto; se informa qué parte del municipio sale de radios compartidos).
#   3) Se suman las distribuciones y se calcula la mediana. También se calcula por departamento para validar contra el INDEC.
# Uso:  python3 -I herramientas/procesar_radios.py [codigo_provincia ...]    (sin argumentos: las 24)
import io, json, os, subprocess, sys, zipfile
import numpy as np
import pandas as pd

ORIGEN = "datos-origen"
TMP = f"{ORIGEN}/radios_tmp"
SALIDA = f"{ORIGEN}/radios_gl"
URLS = json.load(open("herramientas/referencias/urls_radios_por_provincia.json"))
EDADES = 121  # 0..120


def mediana(h):
    """Edad mediana: menor edad cuya frecuencia acumulada alcanza la mitad (h = personas por edad simple)."""
    n = h.sum()
    if n <= 0:
        return None
    return int(np.searchsorted(np.cumsum(h), n / 2.0))


def mediana_interp(h):
    n = h.sum()
    if n <= 0:
        return None
    c = np.cumsum(h)
    i = int(np.searchsorted(c, n / 2.0))
    previo = c[i - 1] if i else 0
    return float(i + (n / 2.0 - previo) / h[i])


def leer_filtrado(zf, nombre, variables):
    partes = []
    with zf.open(nombre) as f:
        for ch in pd.read_csv(f, encoding="utf-8-sig", dtype=str, chunksize=2_000_000,
                              usecols=["codigo", "cod_variable", "cod_categoria", "cantidad"]):
            ch = ch[ch["cod_variable"].isin(variables)]
            if len(ch):
                partes.append(ch)
    d = pd.concat(partes, ignore_index=True)
    d["cantidad"] = d["cantidad"].astype(np.int64)
    return d


def procesar(nombre, url):
    pc = nombre.split(" - ")[0].strip()
    destino = f"{SALIDA}/{pc}.json"
    if os.path.exists(destino):
        print(pc, "ya procesada")
        return
    zp = f"{TMP}/{pc}.zip"
    if not os.path.exists(zp):
        subprocess.run(["curl", "-sS", "-m", "900", "-L", "-A", "Mozilla/5.0", "-o", zp, url], check=True)
    zf = zipfile.ZipFile(zp)
    nom = {k: n for n in zf.namelist() for k in ("persona", "vivienda") if n.endswith(f"-{k}.csv")}
    per = leer_filtrado(zf, nom["persona"], {"PERSONA_EDAD", "PERSONA_CONDACT"})
    viv = leer_filtrado(zf, nom["vivienda"], {"VIVIENDA_CODGL"})
    # --- distribuciones por radio
    e = per[per["cod_variable"] == "PERSONA_EDAD"].copy()
    e["edad"] = e["cod_categoria"].astype(int).clip(0, EDADES - 1)
    radios = sorted(set(per["codigo"]) | set(viv["codigo"]))
    ridx = {r: i for i, r in enumerate(radios)}
    H = np.zeros((len(radios), EDADES))
    np.add.at(H, (e["codigo"].map(ridx).values, e["edad"].values), e["cantidad"].values)
    c = per[per["cod_variable"] == "PERSONA_CONDACT"].copy()
    C = np.zeros((len(radios), 4))
    np.add.at(C, (c["codigo"].map(ridx).values, c["cod_categoria"].astype(int).values), c["cantidad"].values)
    # --- pesos radio -> gobierno local
    gls = sorted(set(viv["cod_categoria"]))
    gidx = {g: i for i, g in enumerate(gls)}
    W = np.zeros((len(radios), len(gls)))
    np.add.at(W, (viv["codigo"].map(ridx).values, viv["cod_categoria"].map(gidx).values), viv["cantidad"].values)
    tot = W.sum(1)
    sin_gl = tot == 0
    Wn = np.divide(W, tot[:, None], out=np.zeros_like(W), where=tot[:, None] > 0)
    compartido = (Wn > 0).sum(1) > 1
    # --- por gobierno local
    GH = Wn.T @ H
    GC = Wn.T @ C
    pers_comp = Wn.T @ (H.sum(1) * compartido)
    salida_gl = {}
    for g, i in gidx.items():
        h = GH[i]
        n = h.sum()
        pea = GC[i][1] + GC[i][2]
        p14 = pea + GC[i][3]
        salida_gl[g] = {
            "pob": round(n), "em": mediana(h), "em_i": round(mediana_interp(h), 1) if n else None,
            "ocu": round(GC[i][1]), "des": round(GC[i][2]), "ina": round(GC[i][3]), "pea": round(pea),
            "pea_t": round(100 * pea / p14, 1) if p14 else None, "des_t": round(100 * GC[i][2] / pea, 1) if pea else None,
            "comp": round(100 * pers_comp[i] / n, 1) if n else 0,
        }
    # --- por departamento (validación)
    deps = np.array([r[2:5] for r in radios])
    salida_dp = {}
    for d in sorted(set(deps)):
        m = deps == d
        h = H[m].sum(0)
        cc = C[m].sum(0)
        salida_dp[pc + d] = {"pob": round(h.sum()), "em": mediana(h), "em_i": round(mediana_interp(h), 1), "pea": round(cc[1] + cc[2]),
                             "p14": round(cc[1] + cc[2] + cc[3]), "des": round(cc[2])}
    out = {"prov": pc, "gl": salida_gl, "dp": salida_dp,
           "radios": len(radios), "radios_sin_gl": int(sin_gl.sum()), "personas_sin_gl": round(float(H[sin_gl].sum())),
           "personas": round(float(H.sum()))}
    os.makedirs(SALIDA, exist_ok=True)
    json.dump(out, open(destino, "w"), separators=(",", ":"))
    os.remove(zp)
    print(pc, "listo:", len(salida_gl), "gobiernos locales,", len(salida_dp), "departamentos,", out["radios_sin_gl"], "radios sin GL,", out["personas_sin_gl"], "personas sin GL", flush=True)


if __name__ == "__main__":
    os.makedirs(TMP, exist_ok=True)
    quiero = set(sys.argv[1:])
    for nombre, url in URLS:
        if not url.endswith("-2022.zip"):
            continue
        if quiero and nombre.split(" - ")[0].strip() not in quiero:
            continue
        procesar(nombre, url)
