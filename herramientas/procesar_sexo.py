# Agrega hombres y mujeres por gobierno local y departamento desde el Censo 2022 del INDEC.
# Detecta categorías usando el texto publicado por INDEC; los radios compartidos se
# reparten según VIVIENDA_CODGL, como en procesar_radios.py. Borra cada ZIP al terminar.
# Uso: python3 -I herramientas/procesar_sexo.py [códigos de provincia]
import io,json,os,subprocess,zipfile
import numpy as np, pandas as pd
URLS=json.load(open('herramientas/referencias/urls_radios_por_provincia.json'))
TMP='datos-origen/radios_tmp';
def leer(z,n,var):
 out=[]
 with z.open(n) as f:
  for d in pd.read_csv(f,encoding='utf-8-sig',dtype=str,chunksize=800000,usecols=['codigo','cod_variable','cod_categoria','categoria','cantidad']):
   d=d[d.cod_variable.isin(var)]
   if len(d):out.append(d)
 return pd.concat(out,ignore_index=True) if out else pd.DataFrame(columns=['codigo','cod_variable','cod_categoria','categoria','cantidad'])
def main():
 os.makedirs(TMP,exist_ok=True); want=set(__import__('sys').argv[1:]); muni=json.load(open('docs/datos/municipios.json')); bygl={x['c']:x for x in muni}
 deps=json.load(open('docs/datos/departamentos_censo.json')); bydp={x['c']:x for x in deps}; names={}
 for label,url in URLS:
  if not url.endswith('-2022.zip'):continue
  pc=label.split(' - ')[0]
  if want and pc not in want:continue
  zp=f'{TMP}/{pc}.zip'
  subprocess.run(['curl','-fsSL','--max-time','900','-o',zp,url],check=True)
  try:
   z=zipfile.ZipFile(zp); persona=next(x for x in z.namelist() if x.endswith('-persona.csv')); vivienda=next(x for x in z.namelist() if x.endswith('-vivienda.csv'))
   p=leer(z,persona,{'PERSONA_P02'}); v=leer(z,vivienda,{'VIVIENDA_CODGL'})
   if p.empty: raise RuntimeError(f'{pc}: no aparece PERSONA_P02')
   cats=p[['cod_categoria','categoria']].drop_duplicates(); print(pc,'categorías sexo:',cats.to_dict('records'),flush=True)
   for _,r in cats.iterrows(): names[str(r.cod_categoria)]=str(r.categoria).strip().lower()
   sex={}
   for _,r in cats.iterrows():
    s=str(r.categoria).strip().lower(); code=str(r.cod_categoria)
    if 'varón' in s or 'varon' in s or 'hombre' in s: sex[code]='hom'
    elif 'mujer' in s: sex[code]='muj'
   if len(sex)!=2: raise RuntimeError(f'{pc}: categorías no identificables con seguridad: {cats.to_dict("records")}')
   p=p[p.cod_categoria.isin(sex)].copy(); p['cantidad']=p.cantidad.astype('int64')
   radios=sorted(set(p.codigo)|set(v.codigo)); ri={x:i for i,x in enumerate(radios)}
   H=np.zeros((len(radios),2),dtype=float); si={code:i for i,code in enumerate(sex)}
   np.add.at(H,(p.codigo.map(ri).values,p.cod_categoria.map(si).values),p.cantidad.values)
   v['cantidad']=v.cantidad.astype('int64'); gls=sorted(set(v.cod_categoria)); gi={x:i for i,x in enumerate(gls)}
   W=np.zeros((len(radios),len(gls)),dtype=float); np.add.at(W,(v.codigo.map(ri).values,v.cod_categoria.map(gi).values),v.cantidad.values)
   sums=W.sum(1); W=np.divide(W,sums[:,None],out=np.zeros_like(W),where=sums[:,None]>0); GH=W.T@H
   for g,i in gi.items():
    if g in bygl: bygl[g]['hom']=int(round(GH[i,si[next(k for k,vv in sex.items() if vv=='hom')]])); bygl[g]['muj']=int(round(GH[i,si[next(k for k,vv in sex.items() if vv=='muj')]]))
   # Por departamento se suman radios directamente, sin repartir.
   p['dpto']=pc+p.codigo.str.slice(2,5)
   agg=p.groupby(['dpto','cod_categoria']).cantidad.sum()
   for (c,cat),value in agg.items():
    if c in bydp: bydp[c][sex[cat]]=bydp[c].get(sex[cat],0)+int(value)
  finally:
   z.close(); os.remove(zp)
 json.dump(muni,open('docs/datos/municipios.json','w'),ensure_ascii=False,separators=(',',':'))
 json.dump(deps,open('docs/datos/departamentos_censo.json','w'),ensure_ascii=False,separators=(',',':'))
 print('Listo. Categorías reconocidas:',names,'gobiernos locales con sexo:',sum('hom' in x for x in muni),'departamentos con sexo:',sum('hom' in x for x in deps))
if __name__=='__main__':main()
