#!/usr/bin/env python3
"""Cruza REFES con puntos IGN sólo cuando nombre y departamento son claros."""
import json, re, unicodedata, random
from collections import defaultdict,Counter
from difflib import SequenceMatcher
from pathlib import Path
from openpyxl import load_workbook
ROOT=Path(__file__).resolve().parents[1]
GENERIC={'HOSPITAL','CENTRO','SALUD','PUESTO','SANITARIO','UNIDAD','MEDICO','MEDICA','CAPS','UAP','N','NUMERO','DR','DOCTOR','DRA','DOCTORA','MUNICIPAL','PROVINCIAL','NACIONAL','ZONA','AREA'}
def normalize(x):
 s=unicodedata.normalize('NFKD',str(x or '')).encode('ascii','ignore').decode().upper()
 words=re.findall(r'[A-Z0-9]+',s)
 return ' '.join(w for w in words if w not in GENERIC and len(w)>1)
def score(a,b):
 if not a or not b:return 0
 
 aa=set(a.split()); bb=set(b.split())
 return (2*len(aa&bb)/(len(aa)+len(bb))) if aa and bb else 0
def main():
 ign=json.load(open(ROOT/'docs/datos/capa_salud.json')); deptp=json.load(open(ROOT/'docs/datos/puntos_departamento.json'))['salud']; assert len(ign)==len(deptp)
 bydep=defaultdict(list)
 for i,p in enumerate(ign):
  if deptp[i]:bydep[str(deptp[i]).zfill(5)].append((i,normalize(p[2])))
 deptrows=json.load(open(ROOT/'docs/datos/departamentos_censo.json')); depts={str(x['c']).zfill(5) for x in deptrows}
 dept_names={(normalize(x['n']),x['c'][:2]):str(x['c']).zfill(5) for x in deptrows}
 wb=load_workbook(ROOT/'datos-origen/refes_20241227.xlsx',read_only=True,data_only=True); sh=wb['Export Worksheet']; it=sh.iter_rows(values_only=True); headers=next(it); ix={h:i for i,h in enumerate(headers)}
 assert {'ESTABLECIMIENTO_ID','ESTABLECIMIENTO_NOMBRE','PROVINCIA_ID','DEPARTAMENTO_ID','ORIGEN_FINANCIAMIENTO','TIPOLOGIA_NOMBRE'}<=ix.keys()
 records=[]
 for row in it:
  prov=str(row[ix['PROVINCIA_ID']]).zfill(2); dpt=str(row[ix['DEPARTAMENTO_ID']]).zfill(3); dep=prov+dpt
  if dep not in depts:
   # En CABA, REFES usa códigos administrativos distintos para algunas comunas; se admite sólo nombre exacto.
   dep=dept_names.get((normalize(row[ix['DEPARTAMENTO_NOMBRE']]),prov),dep)
  if dep not in depts: raise ValueError(f'Código/nombre REFES no coincide con departamentos_censo.json: {prov}, {row[ix["DEPARTAMENTO_ID"]]}, {row[ix["DEPARTAMENTO_NOMBRE"]]}')
  records.append({'id':str(row[ix['ESTABLECIMIENTO_ID']]),'nombre':str(row[ix['ESTABLECIMIENTO_NOMBRE']] or ''),'dep':dep,'tipo':str(row[ix['TIPOLOGIA_NOMBRE']] or 'Sin dato'),'origen':str(row[ix['ORIGEN_FINANCIAMIENTO']] or 'Sin dato')})
 # Exigir una sola mejor candidata con score muy alto y margen suficiente.
 ignextra=[None]*len(ign); matched=[]; seen=set()
 for r in records:
  q=normalize(r['nombre']); ranked=sorted(((score(q,n),i) for i,n in bydep.get(r['dep'],[]) if n),reverse=True)
  if ranked and ranked[0][0]>=0.90 and (len(ranked)==1 or ranked[0][0]-ranked[1][0]>=0.10) and ranked[0][1] not in seen:
   i=ranked[0][1];seen.add(i);ignextra[i]=[r['tipo'],r['origen'],r['id']]; matched.append((r,ign[i][2],ranked[0][0]))
 # resumen total y por departamento; cada fila REFES se cuenta una vez
 summaries={}; matched_ids={r['id'] for r,_,_ in matched}
 for key, subset in [('total',records)]+[(d,[r for r in records if r['dep']==d]) for d in sorted(depts)]:
  summaries[key]={'establecimientos':len(subset),'por_tipologia':dict(sorted(Counter(r['tipo'] for r in subset).items())),'por_origen':dict(sorted(Counter(r['origen'] for r in subset).items())),'cruzados_con_ign':sum(1 for r in subset if r['id'] in matched_ids)}
 json.dump(ignextra,open(ROOT/'docs/datos/capa_salud_refes.json','w'),ensure_ascii=False,separators=(',',':'))
 json.dump(summaries,open(ROOT/'docs/datos/salud_refes_resumen.json','w'),ensure_ascii=False,separators=(',',':'))
 random.Random(314).shuffle(matched); sample=[{'refes':r['nombre'],'ign':n,'departamento':r['dep'],'similitud':round(s,3),'evaluacion':'clara: nombre muy parecido, una sola candidata en el departamento'} for r,n,s in matched[:10]]
 print(json.dumps({'refes':len(records),'ign':len(ign),'cruces':len(matched),'pct_refes':round(100*len(matched)/len(records),2),'pct_ign':round(100*len(matched)/len(ign),2),'muestra':sample},ensure_ascii=False))
if __name__=='__main__':main()
