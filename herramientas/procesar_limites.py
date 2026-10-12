# Calcula longitudes aproximadas de los límites internacionales del IGN.
# Uso: python3 -I herramientas/procesar_limites.py
import json, math
from shapely.geometry import shape
from shapely.ops import unary_union
OR='datos-origen/capa_limites_internacionales.json'; OUT='docs/datos/limites_km.json'

def length(g):
    lines=list(g.geoms) if g.geom_type=='MultiLineString' else [g]; total=0
    for line in lines:
        pts=list(line.coords)
        for a,b in zip(pts,pts[1:]):
            y1,x1=map(math.radians,(a[1],a[0])); y2,x2=map(math.radians,(b[1],b[0]))
            h=math.sin((y2-y1)/2)**2+math.cos(y1)*math.cos(y2)*math.sin((x2-x1)/2)**2
            total+=6371*2*math.asin(min(1,math.sqrt(h)))
    return total

def main():
    data=json.load(open(OR)); data=json.loads(data) if isinstance(data,str) else data
    groups={}; sin_asignar=[]
    for f in data['features']:
        p=f['properties']
        if p.get('objeto')!='Límite internacional': continue
        name=str(p.get('gna','')).strip()
        if name.startswith('Argentina - '): groups.setdefault(name.split(' - ',1)[1],[]).append(shape(f['geometry']))
        else: sin_asignar.append(shape(f['geometry']))
    # Une trazados coincidentes dentro de cada país para no sumar dos veces.
    rows=[]
    for country,geoms in sorted(groups.items()):
        km=length(unary_union(geoms))
        rows.append({'pais':country,'km_total':round(km,1),'km_rio':None,'km_seco':None,'km_sin_clasificar':round(km,1),'porcentaje_rio':None})
    unknown=length(unary_union(sin_asignar)) if sin_asignar else 0
    out={'version':2,'paises':rows,'km_total_nacional':round(sum(r['km_total'] for r in rows),1),
         'km_sin_pais_identificado':round(unknown,1),'confiable_separacion':False,
         'nota':'Longitudes aproximadas sobre las líneas del IGN. El servicio de hidrografía no respondió durante esta revisión, así que no se pudo comprobar qué tramos siguen ríos ni separar río y tierra. Los kilómetros quedan sin clasificar; la geometría que el IGN etiqueta «-2» se conserva sin país porque no se pudo asignar con seguridad.'}
    json.dump(out,open(OUT,'w'),ensure_ascii=False,separators=(',',':')); print(json.dumps(out,ensure_ascii=False))
if __name__=='__main__': main()
