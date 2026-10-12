# Asigna cada punto de las capas del mapa a un departamento del IGN.
# Busca primero el punto dentro del polígono; si queda fuera, usa el más cercano a menos de 20 km.
# Uso: python3 -I herramientas/procesar_puntos_departamento.py (requiere capa_departamentos.json ya procesada).
import json,glob,math,os
from shapely.geometry import shape,Point
from shapely.strtree import STRtree
OUT='docs/datos';
def main():
 deps=json.load(open(OUT+'/capa_departamentos.json')); poly=[]; codes=[]
 for d in deps:
  # r contiene anillos exteriores; convertir cada anillo y mantener el código.
  for ring in d['r']:
   from shapely.geometry import Polygon
   poly.append(Polygon(ring));codes.append(d['c'])
 tree=STRtree(poly); byfile={}
 for path in glob.glob(OUT+'/capa_*.json'):
  if os.path.basename(path) in ('capa_departamentos.json','capa_provincias.json'):continue
  try: data=json.load(open(path))
  except:continue
  if not isinstance(data,list) or not data or not isinstance(data[0],list) or len(data[0])<2 or not all(isinstance(v,(int,float)) for v in data[0][:2]):continue
  vals=[]
  for row in data:
   lat,lon=row[:2];pt=Point(lon,lat); hits=tree.query(pt); code=None
   for idx in hits:
    i=int(idx)
    if poly[i].covers(pt):code=codes[i];break
   if code is None:
    best=(20.0001,None)
    i=int(tree.nearest(pt));p=poly[i]
    # Distancia local en km al borde del polígono más cercano.
    q=p.boundary.interpolate(p.boundary.project(pt))
    km=math.hypot((q.x-lon)*111.32*math.cos(math.radians(lat)),(q.y-lat)*111.32)
    if km<best[0]:best=(km,codes[i])
    code=best[1]
   vals.append(code)
  byfile[os.path.basename(path)[5:-5]]=vals
 json.dump(byfile,open(OUT+'/puntos_departamento.json','w'),ensure_ascii=False,separators=(',',':'));print('Capas de puntos:',len(byfile),'puntos:',sum(map(len,byfile.values())))
if __name__=='__main__':main()
