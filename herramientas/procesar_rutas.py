# Descarga y simplifica la red vial provincial del IGN; calcula km por departamento
# y detecta rutas cercanas a pasos internacionales. Usa límites departamentales del IGN.
# Uso: python3 -I herramientas/procesar_rutas.py
import json,subprocess,os,math
import numpy as np
from shapely.geometry import shape,LineString,MultiLineString
from shapely import make_valid
from shapely.strtree import STRtree
URL='https://wms.ign.gob.ar/geoserver/ows'; OUT='docs/datos'; OR='datos-origen'
def descargar():
 if not os.path.exists(OR+'/capa_rutas_provinciales.json'):
  subprocess.run(['curl','-G','-fL','-sS','--max-time','600','-o',OR+'/capa_rutas_provinciales.json',URL,'--data-urlencode','service=WFS','--data-urlencode','version=1.0.0','--data-urlencode','request=GetFeature','--data-urlencode','typeName=vial_provincial','--data-urlencode','outputFormat=application/json'],check=True)
def cargar(n):
 x=json.load(open(OR+'/'+n)); return json.loads(x) if isinstance(x,str) else x
def dist(a,b):
 # Distancia local aproximada en metros para testeos de cercanía (rango 3 km).
 return math.hypot((a.x-b.x)*111320*math.cos(math.radians((a.y+b.y)/2)),(a.y-b.y)*111320)
def km_line(g):
 total=0
 lines=list(g.geoms) if g.geom_type=='MultiLineString' else [g]
 for l in lines:
  xy=list(l.coords)
  if len(xy)>1:
   for a,b in zip(xy,xy[1:]):
    la1,lo1=map(math.radians,(a[1],a[0]));la2,lo2=map(math.radians,(b[1],b[0]))
    h=math.sin((la2-la1)/2)**2+math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    total+=6371*2*math.asin(min(1,math.sqrt(h)))
 return total
def dp(points,tol):
 a=np.asarray(points,float); n=len(a)
 if n<3:return a
 keep=np.zeros(n,bool);keep[[0,-1]]=1; stack=[(0,n-1)]
 while stack:
  i,j=stack.pop()
  if j<=i+1:continue
  p,q=a[i],a[j];v=q-p; v2=v@v; s=a[i+1:j]
  if v2==0:d=np.linalg.norm(s-p,axis=1)
  else:t=np.clip(((s-p)@v)/v2,0,1);d=np.linalg.norm(s-(p+t[:,None]*v),axis=1)
  k=int(np.argmax(d))
  if d[k]>tol:
   k+=i+1;keep[k]=1;stack.extend([(i,k),(k,j)])
 return a[keep]
def main():
 descargar(); rutas=cargar('capa_rutas_nacionales.json')['features']; prov=cargar('capa_rutas_provinciales.json')['features']; dept=json.load(open(OUT+'/capa_departamentos.json')); censo={x['c']:x for x in json.load(open(OUT+'/departamentos_censo.json'))}
 # Límites simplificados del D2 para asignar km.
 polygons=[]; meta=[]
 from shapely.geometry import Polygon,MultiPolygon
 for f in dept:
  code=f['c']; parts=[Polygon(r) for r in f['r'] if len(r)>=4]; g=MultiPolygon(parts) if len(parts)>1 else parts[0]
  polygons.append(make_valid(g));meta.append((code,f['n'],f['p']))
 tree=STRtree(polygons); km={c:[0.,0.] for c,_,_ in meta}
 prov_features=cargar('capa_provincias.json')['features']; prov_names={str(f['properties']['in1']).zfill(2):f['properties']['nam'] for f in prov_features}
 prov_polys=[]; prov_codes=[]
 for f in prov_features:
  code=str(f['properties']['in1']).zfill(2)
  for poly in f['geometry']['coordinates'] if f['geometry']['type']=='MultiPolygon' else [f['geometry']['coordinates']]:
   prov_polys.append(make_valid(Polygon(poly[0])));prov_codes.append(code)
 prov_tree=STRtree(prov_polys)
 def route_provinces(g):
  pt=g.interpolate(0.5,normalized=True); hit=None
  for ix in prov_tree.query(pt):
   ix=int(ix)
   if prov_polys[ix].covers(pt):hit=prov_codes[ix];break
  if hit is None and len(prov_polys):hit=prov_codes[int(prov_tree.nearest(pt))]
  return ({hit} if hit else set()),hit
 route_cache=[]
 for cat,feats,slot in [('nacional',rutas,0),('provincial',prov,1)]:
  for f in feats:
   g=shape(f['geometry']); props=f['properties']; key=str(props.get('rtn') or props.get('nam') or 'Sin número')
   codes,primary=route_provinces(g)
   route_cache.append((cat,key,g,km_line(g),props,codes,primary))
   for idx in tree.query(g):
    i=int(idx); inter=g.intersection(polygons[i]); length=km_line(inter) if not inter.is_empty else 0
    if length:km[meta[i][0]][slot]+=length
 # Forma liviana de líneas nacionales + provinciales, igual que capa_rutas.json.
 out=[]
 for cat,feats in [('nacional',rutas),('provincial',prov)]:
  for f in feats:
   g=shape(f['geometry']); parts=list(g.geoms) if g.geom_type=='MultiLineString' else [g]
   for line in parts:
    a=dp(line.coords,.004)
    if len(a)>1:out.append([[round(float(x),3),round(float(y),3)] for x,y in a])
 json.dump(out,open(OUT+'/capa_rutas_provinciales.json','w'),separators=(',',':'))
 rows=[]
 for c,n,p in meta:
  if c in censo:rows.append({'codigo':c,'nombre':censo[c]['n'],'provincia':prov_names.get(p,p),'km_nacionales':round(km[c][0],2),'km_provinciales':round(km[c][1],2)})
 json.dump(rows,open(OUT+'/rutas_por_departamento.json','w'),ensure_ascii=False,separators=(',',':'))
 # Paso: a menos de 3 km de una geometría vial. Los pasos conservan país y provincia del IGN.
 pasos=json.load(open(OUT+'/capa_pasos.json')); points=[]
 from shapely.geometry import Point
 for x in pasos:
  if len(x)>=6:points.append((Point(x[1],x[0]),x[2],x[4],x[5]))
 from shapely.geometry import box
 paso_boxes=[box(pt.x-0.04,pt.y-0.027,pt.x+0.04,pt.y+0.027) for pt,_,_,_ in points]
 ptree=STRtree(paso_boxes)
 route_lengths={}; route_provinces={}
 for cat,key,g,total,props,route_codes,primary in route_cache:
  if cat=='nacional':
   k=(cat,key);route_lengths[k]=route_lengths.get(k,0.)+total
   route_provinces.setdefault(k,set()).update(route_codes)
  else:
   if primary:
    k=(cat,key,primary);route_lengths[k]=route_lengths.get(k,0.)+total;route_provinces.setdefault(k,set()).update(route_codes)
 province_code={v.strip().upper():k for k,v in prov_names.items()}
 intl={}
 for cat,key,g,total,props,route_codes,primary in route_cache:
  found=[]
  for ix in ptree.query(g):
   pt,nombre,prov,vecino=points[int(ix)]
   if dist(g.interpolate(g.project(pt)),pt)<3:found.append((nombre,prov,vecino))
  if not found:continue
  step_codes={province_code.get(pv.strip().upper()) for _,pv,_ in found if pv}
  step_codes.discard(None)
  codes=(step_codes & route_codes) or route_codes
  if cat=='provincial':
   if not codes:continue
   code=primary if primary in codes else next(iter(codes))
   k=(cat,key,code)
  else:k=(cat,key)
  if k not in intl:intl[k]={'ruta':key,'categoria':cat,'km':route_lengths[k],'provincias':{prov_names[c] for c in route_provinces.get(k,set())},'pasos':set(),'paises':set()}
  d=intl[k]
  for nombre,pv,country in found:
   if nombre:d['pasos'].add(nombre)
   if country:d['paises'].add(country)
 result=[]
 for d in intl.values():result.append({'ruta':d['ruta'],'categoria':d['categoria'],'km':round(d['km'],2),'provincias':sorted(d['provincias']),'pasos':sorted(d['pasos']),'paises':sorted(d['paises'])})
 json.dump(result,open(OUT+'/rutas_internacionales.json','w'),ensure_ascii=False,separators=(',',':'))
 resumen=json.load(open(OUT+'/resumen_rutas.json')); actual=sum(x['km_nacionales'] for x in rows); esperado=resumen.get('rutas_total_km')
 print('Tramos provinciales descargados:',len(cargar('capa_rutas_provinciales.json')['features']),'formato liviano bytes:',os.path.getsize(OUT+'/capa_rutas_provinciales.json'))
 print('Dptos con cruce:',len(rows),'km nacionales por cruce:',round(actual,2),'resumen existente:',esperado,'diferencia:',None if esperado is None else round(actual-esperado,2),'rutas internacionales:',len(result))
if __name__=='__main__':main()
