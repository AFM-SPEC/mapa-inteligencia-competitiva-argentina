#!/usr/bin/env python3
"""Prepara puntos publicados de subestaciones de Edenor y Edelap."""
import csv,json
from pathlib import Path
from shapely.geometry import Point, Polygon
ROOT=Path(__file__).resolve().parents[1]
DEPTS=[]
for d in json.load(open(ROOT/'docs/datos/capa_departamentos.json')):
 for ring in d['r']:
  poly=Polygon(ring); DEPTS.append((d['p'],poly.bounds,poly))
def province_at(lat,lon):
 pt=Point(lon,lat)
 for code,(x0,y0,x1,y1),poly in DEPTS:
  if x0<=lon<=x1 and y0<=lat<=y1 and poly.covers(pt): return code
 return None
def point(r):
 g=json.loads(r['geojson']); lon,lat=g['coordinates']; return float(lat),float(lon)
def save(src,dst,company,kind):
 with open(ROOT/'datos-origen'/src,encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
 out=[]
 for r in rows:
  lat,lon=point(r)
  if not (-55.2<=lat<=-21.7 and -73.6<=lon<=-53.5): raise ValueError('Coordenada fuera de Argentina')
  if kind=='edenor':
   jurisdiction=r.get('jurisdiccion','').strip().upper(); prov=province_at(lat,lon)
   if prov not in ('02','06'): prov=None
   ident=r.get('descripcion') or r.get('id','Sin dato')
   detail='; '.join(f'{k}: {r[k]}' for k in ('tipo','clasificacion','tipo_red','jurisdiccion') if r.get(k))
  else:
   prov=province_at(lat,lon)
   if prov!='06': prov=None
   ident=r.get('matricula','Sin dato'); detail='; '.join(f'{k}: {r[k]}' for k in ('clientes','potinstala','acceso') if r.get(k))
  if not prov: raise ValueError(f'No se pudo validar provincia en {src}: {r}')
  out.append([lat,lon,ident,company,detail,prov])
 json.dump(out,open(ROOT/'docs/datos'/dst,'w'),ensure_ascii=False,separators=(',',':'))
 return len(out)
def main():
 print(json.dumps({'edenor':save('edenor_subestaciones.csv','capa_distribucion_edenor.json','Edenor','edenor'),'edelap':save('edelap_subestaciones.csv','capa_distribucion_edelap.json','Edelap','edelap')}))
if __name__=='__main__':main()
