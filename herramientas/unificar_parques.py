#!/usr/bin/env python3
"""Cruza el mapa del Senado con RENPI y el registro abierto de Buenos Aires.

Las fuentes provinciales sin coordenadas sólo enriquecen coincidencias existentes.
Los registros que no pueden ubicarse quedan detallados en el informe del proceso,
sin asignarles una coordenada aproximada.
"""
import csv, io, json, re, unicodedata, urllib.request, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from difflib import SequenceMatcher

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/datos'
KML = ROOT / 'datos-origen/parques.kml'
RENPI_URL = 'https://cdn.produccion.gob.ar/cdn-secind/rempi-datos-abiertos/base-rempi-para-publicar.ods'
BA_URL = 'https://catalogo.datos.gba.gob.ar/dataset/348dddc1-9578-4fad-9349-6b8bb72630dc/resource/0945236f-6aea-4ff3-8899-41c347c2b0f9/download/agrupamientos-industriales-aprobados-por-decreto-2026.csv'
SENADO_URL = 'https://www.senado.gob.ar/'
NS = {'k':'http://www.opengis.net/kml/2.2'}
ODS = {'t':'urn:oasis:names:tc:opendocument:xmlns:table:1.0','x':'urn:oasis:names:tc:opendocument:xmlns:text:1.0'}

def norm(s):
    s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+',' ',s).strip()

def get(url):
    req=urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r: return r.read()

def ods_rows(blob):
    root=ET.fromstring(zipfile.ZipFile(io.BytesIO(blob)).read('content.xml'))
    for row in root.findall('.//t:table-row',ODS):
        yield [' '.join(p.text or '' for p in c.findall('.//x:p',ODS)).strip() for c in row.findall('t:table-cell',ODS)]

def near(a,b):
    # La distancia se usa al comparar ubicaciones provinciales cuando estén disponibles.
    from math import radians,sin,cos,asin,sqrt
    la1,lo1=a;la2,lo2=b
    d1,d2=radians(la2-la1),radians(lo2-lo1)
    q=sin(d1/2)**2+cos(radians(la1))*cos(radians(la2))*sin(d2/2)**2
    return 6371*2*asin(sqrt(q))

def main():
    parques=json.loads((DATA/'capa_parques.json').read_text())
    # Permite repetir el proceso sin acumular metadatos de ejecuciones anteriores.
    # Formato de salida: ... gestión (8), fuente, figura en Senado, figura en RENPI, fuentes provinciales, CÓDIGO DE PROVINCIA (siempre al final).
    # Formato original (de procesar.py): ... gestión (8), CÓDIGO DE PROVINCIA (9). Se vuelve al original antes de recalcular.
    for p in parques:
        if len(p) > 10:
            p[:] = p[:9] + [p[-1]]
    municipios=json.loads((DATA/'municipios.json').read_text())
    # KML confirma que las filas de la capa vienen de la carpeta de parques del Senado.
    senado=set()
    root=ET.fromstring(KML.read_bytes())
    for f in root.findall('.//k:Folder',NS):
        if (f.findtext('k:name',default='',namespaces=NS)) != 'LISTADO DE PARQUES': continue
        for p in f.findall('k:Placemark',NS): senado.add(norm(p.findtext('k:name',default='',namespaces=NS)))
    ods=get(RENPI_URL); rows=list(ods_rows(ods)); headers=rows[0]
    hi={norm(x):i for i,x in enumerate(headers)}
    def col(*names):
        for n in names:
            if norm(n) in hi:return hi[norm(n)]
        return None
    ni=col('NOMBRE DEL AGRUPAMIENTO','Nombre del agrupamiento'); pi=col('PROVINCIA','Provincia')
    renpi=[]
    for row in rows[1:]:
        if ni is not None and pi is not None and len(row)>max(ni,pi) and row[ni]: renpi.append((norm(row[ni]),norm(row[pi])))
    ba=list(csv.DictReader(io.StringIO(get(BA_URL).decode('utf-8-sig'))))
    # índice de parques actuales: nombre, provincia y coordenada
    idx=[]
    for i,p in enumerate(parques): idx.append((i,norm(p[2]),norm(p[5]),(float(p[0]),float(p[1]))))
    province_alias={'buenos aires':'buenos aires','cordoba':'cordoba','santa fe':'santa fe','entre rios':'entre rios','mendoza':'mendoza'}
    def renpi_match(name,prov):
        return any(prov in rp and (name==rn or SequenceMatcher(None,name,rn).ratio()>=.88) for rn,rp in renpi)
    gba_matches=set(); gba_unplaced=[]; renpi_count=0
    # Índice de municipios bonaerenses para asignación por partido en registro sin coordenadas.
    ba_gl={norm(m['n']):m for m in municipios if norm(m.get('pv'))=='buenos aires'}
    for r in ba:
        name=norm(r.get('denominacion_decreto')); prov='buenos aires'
        candidates=[]
        for i,n,p,xy in idx:
            if p==prov:
                score=SequenceMatcher(None,name,n).ratio()
                if score>=.72: candidates.append((score,i))
        if candidates:
            score,i=max(candidates);gba_matches.add(i)
        else: gba_unplaced.append({'nombre':r.get('denominacion_decreto',''),'municipio':r.get('municipio_nombre',''),'motivo':'el registro no publica coordenadas ni dirección exacta'})
    for i,p in enumerate(parques):
        n,prov=norm(p[2]),norm(p[5]); isren=renpi_match(n,prov)
        if isren: renpi_count+=1
        # Campos nuevos al final: fuente, figura en Senado, figura en RENPI, fuentes provinciales.
        cod=p[9]; del p[9:]  # el código de provincia tiene que quedar SIEMPRE al final (los gráficos por provincia lo leen así); también permite volver a correr el script
        p.extend(['Senado 2024'+('; RENPI 2023' if isren else '')+('; Buenos Aires' if i in gba_matches else ''),True,isren,(['Buenos Aires'] if i in gba_matches else []),cod])
    out=DATA/'capa_parques.json'; out.write_text(json.dumps(parques,ensure_ascii=False,separators=(',',':'))+'\n')
    # Métricas conservadas, actualizadas desde la capa unificada (las ubicaciones no cambian).
    for m in municipios:
        dists=[near((m['la'],m['lo']),(p[0],p[1])) for p in parques]
        k=min(range(len(dists)),key=dists.__getitem__)
        m['d_parque']=round(dists[k]);m['parque']=parques[k][2];m['parq30']=sum(d<=30 for d in dists)
    (DATA/'municipios.json').write_text(json.dumps(municipios,ensure_ascii=False,separators=(',',':'))+'\n')
    print(json.dumps({'senado':len(parques),'renpi_descargados':len(renpi),'renpi_coincidencias':renpi_count,'buenos_aires_descargados':len(ba),'buenos_aires_coincidencias':len(gba_matches),'buenos_aires_sin_ubicacion':len(gba_unplaced),'unlocated_sample':gba_unplaced[:8]},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
