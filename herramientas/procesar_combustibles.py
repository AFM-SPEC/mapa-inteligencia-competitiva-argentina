#!/usr/bin/env python3
"""Procesa precios en surtidor y conserva los puntos IGN sin boca cercana."""
import csv,json,math,unicodedata
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def norm(s):
 s=unicodedata.normalize('NFKD',str(s or '')).encode('ascii','ignore').decode().upper()
 return ''.join(c for c in s if c.isalnum() or c.isspace()).strip()
def dist(a,b):
 p1,p2=map(math.radians,[a[0],b[0]]);dl=math.radians(b[1]-a[1]);dp=p2-p1
 h=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
 return 12742000*math.asin(min(1,math.sqrt(h)))
def main():
 src=ROOT/'datos-origen/precios_en_surtidor.csv'; ign_features=json.loads(json.load(open(ROOT/'datos-origen/capa_estaciones_servicio.json')))['features']
 dep_codes=json.load(open(ROOT/'docs/datos/puntos_departamento.json'))['estaciones_servicio']
 if len(dep_codes)!=len(ign_features): raise ValueError('No coincide el orden/cantidad de departamentos asignados a la capa IGN original')
 ign=[]
 for i,f in enumerate(ign_features):
  lon,lat=f['geometry']['coordinates'][:2]; dep=dep_codes[i]
  if dep: prov=str(dep)[:2]
  else: prov='00'
  ign.append([float(lat),float(lon),f['properties'].get('fna') or 'Sin dato',prov])
 provinces={'BUENOS AIRES':'06','CATAMARCA':'10','CHACO':'22','CHUBUT':'26','CIUDAD AUTONOMA DE BUENOS AIRES':'02','CAPITAL FEDERAL':'02','CABA':'02','CORDOBA':'14','CORRIENTES':'18','ENTRE RIOS':'30','FORMOSA':'34','JUJUY':'38','LA PAMPA':'42','LA RIOJA':'46','MENDOZA':'50','MISIONES':'54','NEUQUEN':'58','RIO NEGRO':'62','SALTA':'66','SAN JUAN':'70','SAN LUIS':'74','SANTA CRUZ':'78','SANTA FE':'82','SANTIAGO DEL ESTERO':'86','TIERRA DEL FUEGO':'94','TUCUMAN':'90'}
 rows={}
 with src.open(encoding='utf-8-sig',newline='') as f:
  for r in csv.DictReader(f):
   k=r.get('idempresa','').strip();
   if not k: continue
   rows[k]=r
 energy=[]
 for r in rows.values():
  try: lat,lon=float(r['latitud']),float(r['longitud'])
  except: continue
  prov=provinces.get(norm(r['provincia']))
  if not (-55.2<=lat<=-21.7 and -73.6<=lon<=-53.5) or not prov: continue
  energy.append([lat,lon,r['empresa'].strip(),r.get('empresabandera','').strip() or 'Sin dato','Energía',prov])
 bins={}
 for e in energy: bins.setdefault((round(e[0]*300),round(e[1]*300)),[]).append(e)
 kept=[]
 for p in ign:
  cell=(round(p[0]*300),round(p[1]*300))
  nearby=(e for dy in (-1,0,1) for dx in (-1,0,1) for e in bins.get((cell[0]+dy,cell[1]+dx),[]))
  if not any(dist(p[:2],e[:2])<300 for e in nearby): kept.append([p[0],p[1],p[2],'Sin dato','IGN',str(p[3]).zfill(2)])
 out=energy+kept
 json.dump(out,open(ROOT/'docs/datos/capa_estaciones_servicio.json','w'),ensure_ascii=False,separators=(',',':'))
 # recalcula sólo est10
 mun=json.load(open(ROOT/'docs/datos/municipios.json'))
 allbins={}
 for p in out: allbins.setdefault((round(p[0]*300),round(p[1]*300)),[]).append(p)
 for m in mun:
  cell=(round(m['la']*300),round(m['lo']*300))
  cand=(p for dy in range(-9,10) for dx in range(-12,13) for p in allbins.get((cell[0]+dy,cell[1]+dx),[]))
  m['est10']=sum(dist([m['la'],m['lo']],p[:2])<=10000 for p in cand)
 json.dump(mun,open(ROOT/'docs/datos/municipios.json','w'),ensure_ascii=False,separators=(',',':'))
 print(json.dumps({'bocas':len(energy),'ign_conservadas':len(kept),'total':len(out),'banderas':Counter(x[3] for x in energy).most_common(10)},ensure_ascii=False))
if __name__=='__main__':main()
