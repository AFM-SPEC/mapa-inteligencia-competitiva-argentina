# Simplifica los límites departamentales del IGN y crea la capa liviana del mapa.
# Conserva códigos y nombres que coinciden con departamentos_censo.json.
# Uso: python3 -I herramientas/procesar_departamentos.py
import json, os
import numpy as np
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely import simplify

SRC='datos-origen/capa_departamentos.json'; CENSO='docs/datos/departamentos_censo.json'; OUT='docs/datos/capa_departamentos.json'
def main():
    src=json.load(open(SRC)); src=json.loads(src) if isinstance(src,str) else src
    deps={x['c']:x for x in json.load(open(CENSO))}; out=[]
    for f in src['features']:
        p=f['properties']; c=str(p['in1']).zfill(5); g=shape(f['geometry'])
        # Simplificación topológica en grados; al final sólo anillos exteriores,
        # como la capa provincial existente. Huecos insulares pequeños no se dibujan.
        g=g.simplify(0.004, preserve_topology=True)
        polys=list(g.geoms) if isinstance(g,MultiPolygon) else [g]
        rings=[]
        for q in polys:
            if q.area < 0.000002: continue
            a=[[round(float(x),4),round(float(y),4)] for x,y in q.exterior.coords]
            if len(a)>=4: rings.append(a)
        d=deps.get(c)
        out.append({'c':c,'n':(d or {}).get('n',p.get('nam','')),'p':c[:2],'r':rings})
    json.dump(out,open(OUT,'w'),ensure_ascii=False,separators=(',',':'))
    print('Departamentos:',len(out),'coinciden:',sum(x['c'] in deps for x in out),'sin correspondencia:',[x['c'] for x in out if x['c'] not in deps],'bytes:',os.path.getsize(OUT))
if __name__=='__main__': main()
