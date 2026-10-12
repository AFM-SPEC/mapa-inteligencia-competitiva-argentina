from playwright.sync_api import sync_playwright

SUBTITULOS = [
    {
        "num": 1,
        "texto": "Información pública de 2.314 gobiernos locales en un solo lugar.",
    },
    {
        "num": 2,
        "texto": "Elegí una sección de la A a la I para ver cómo cambian las capas y datos.",
    },
    {
        "num": 3,
        "texto": "Filtrá por provincia, región, cantidad de habitantes o distancia.",
    },
    {
        "num": 4,
        "texto": "Tocá cualquier municipio para ver su población, edad, empleo y distancias.",
    },
    {
        "num": 5,
        "texto": "Consultá el comercio exterior por aduana y las estaciones de alta tensión.",
    },
    {
        "num": 6,
        "texto": "Al pie tenés enlaces para corroborar los datos y la sección de fuentes y método.",
    },
    {
        "num": 7,
        "texto": "Herramienta de análisis preliminar. No reemplaza estudios técnicos ni legales.",
    },
]

def render_vertical():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Render overlays as 390x844 transparent PNGs
        page = browser.new_page(viewport={"width": 390, "height": 844})
        
        for sub in SUBTITULOS:
            html = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@600;700&display=swap" rel="stylesheet">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 390px;
    height: 844px;
    background: transparent;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding-bottom: 24px;
    font-family: 'Libre Franklin', sans-serif;
  }}
  .sub-caja {{
    width: 362px;
    background: rgba(11, 29, 58, 0.95);
    border: 1.5px solid rgba(255, 248, 220, 0.55);
    border-radius: 14px;
    padding: 10px 14px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.65);
    text-align: center;
  }}
  .sub-tag {{
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #ffd875;
    margin-bottom: 3px;
  }}
  .sub-txt {{
    font-size: 14px;
    font-weight: 600;
    line-height: 1.35;
    color: #fff8dc;
  }}
</style>
</head>
<body>
  <div class="sub-caja">
    <div class="sub-tag">Sobre el mapa</div>
    <div class="sub-txt">{sub['texto']}</div>
  </div>
</body>
</html>"""
            page.set_content(html)
            page.wait_for_timeout(300)
            page.screenshot(path=f"herramientas/video/tmp/sub_vertical_{sub['num']}.png", omit_background=True)
            print(f"Generado sub_vertical_{sub['num']}.png")
        browser.close()

if __name__ == "__main__":
    render_vertical()
