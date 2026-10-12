import os
import subprocess
import time
from playwright.sync_api import sync_playwright
import imageio_ffmpeg

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
PUBLIC_URL = "https://afm-spec.github.io/mapa-inteligencia-competitiva-argentina/"
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
TMP_DIR = os.path.join(BASE_DIR, "tmp")
ASSETS_DIR = os.path.join(PROJECT_ROOT, "docs", "assets")

os.makedirs(TMP_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

def record_scene_1(browser):
    print("--- Grabando Escena 1 (Apertura) ---")
    ctx = browser.new_context(
        record_video_dir=TMP_DIR,
        record_video_size={"width": 390, "height": 844},
        viewport={"width": 390, "height": 844},
    )
    page = ctx.new_page()
    html_file = os.path.join(BASE_DIR, "escenas_web", "escena1.html")
    page.goto(f"file://{html_file}")
    page.wait_for_timeout(10500)
    video_path = page.video.path()
    ctx.close()
    return video_path

def record_scene_2(browser):
    print("--- Grabando Escena 2 (Pestañas A a I) ---")
    ctx = browser.new_context(
        record_video_dir=TMP_DIR,
        record_video_size={"width": 390, "height": 844},
        viewport={"width": 390, "height": 844},
    )
    page = ctx.new_page()
    page.goto(PUBLIC_URL, wait_until="networkidle")
    
    # 0s - 2s: vista inicial en A
    page.wait_for_timeout(2000)
    
    # 2s - 4.5s: cambiar a B (Rutas y fronteras)
    btn_b = page.locator("#pestanas button", has_text="B · Rutas y fronteras")
    btn_b.click()
    page.wait_for_timeout(2500)
    
    # 4.5s - 7.5s: cambiar a C (Red eléctrica)
    btn_c = page.locator("#pestanas button", has_text="C · Red eléctrica")
    btn_c.click()
    page.wait_for_timeout(3000)
    
    # 7.5s - 10.5s: cambiar a F (Industrias)
    btn_f = page.locator("#pestanas button", has_text="F · Industrias")
    btn_f.click()
    page.wait_for_timeout(3000)
    
    video_path = page.video.path()
    ctx.close()
    return video_path

def record_scene_3(browser):
    print("--- Grabando Escena 3 (Filtros) ---")
    ctx = browser.new_context(
        record_video_dir=TMP_DIR,
        record_video_size={"width": 390, "height": 844},
        viewport={"width": 390, "height": 844},
    )
    page = ctx.new_page()
    page.goto(PUBLIC_URL, wait_until="networkidle")
    
    # 0s - 2s: ver mapa y panel de filtros
    page.locator("#filtros").scroll_into_view_if_needed()
    page.wait_for_timeout(1500)
    
    # 2s - 4s: abrir filtros y seleccionar Córdoba
    page.locator("#btnFiltros").click()
    page.wait_for_timeout(1000)
    page.select_option("#fProvincia", "Córdoba")
    page.wait_for_timeout(1500)
    
    # 4s - 6.5s: filtrar por escala intermedia (50.000 a 200.000)
    page.select_option("#fPob", "p4")
    page.wait_for_timeout(1500)
    
    # 6.5s - 10.5s: cerrar filtros y mostrar mapa y ranking filtrados
    page.locator("#btnFiltros").click()
    page.locator("#mapa").scroll_into_view_if_needed()
    page.wait_for_timeout(4000)
    
    video_path = page.video.path()
    ctx.close()
    return video_path

def record_scene_4(browser):
    print("--- Grabando Escena 4 (Ficha de Municipio) ---")
    ctx = browser.new_context(
        record_video_dir=TMP_DIR,
        record_video_size={"width": 390, "height": 844},
        viewport={"width": 390, "height": 844},
    )
    page = ctx.new_page()
    page.goto(PUBLIC_URL, wait_until="networkidle")
    
    # 0s - 2s: vista inicial y ranking
    page.locator("#mapa").scroll_into_view_if_needed()
    page.wait_for_timeout(2000)
    
    # 2s - 4.5s: click en el primer municipio del ranking (CABA) para abrir popup en mapa
    item = page.locator("#ranking [data-ir]").first
    item.click()
    page.wait_for_timeout(2500)
    
    # 4.5s - 7s: click en "Ver ficha" dentro del popup de Leaflet
    page.locator(".leaflet-popup button[data-ficha]").click()
    page.wait_for_timeout(2500)
    
    # 7s - 10.5s: scroll suave dentro del diálogo para ver datos de empleo y distancias
    dialog = page.locator("#ficha")
    dialog.evaluate("d => d.scrollTo({ top: 320, behavior: 'smooth' })")
    page.wait_for_timeout(3500)
    
    video_path = page.video.path()
    ctx.close()
    return video_path

def record_scene_5(browser):
    print("--- Grabando Escena 5 (Aduanas H y Red Eléctrica C) ---")
    ctx = browser.new_context(
        record_video_dir=TMP_DIR,
        record_video_size={"width": 390, "height": 844},
        viewport={"width": 390, "height": 844},
    )
    page = ctx.new_page()
    page.goto(PUBLIC_URL, wait_until="networkidle")
    
    # 0s - 3s: pestaña H (Aduanas)
    page.locator("#pestanas button", has_text="H · Aduanas").click()
    page.locator("#mapa").scroll_into_view_if_needed()
    page.wait_for_timeout(2500)
    
    # 3s - 6s: abrir detalle de aduana (Buenos Aires Capital)
    page.evaluate("() => { if (typeof abrirFichaAduana === 'function' && est.adu && est.adu.aduanas[0]) abrirFichaAduana(est.adu.aduanas[0].c); }")
    page.wait_for_timeout(2500)
    
    # Cerrar modal
    page.locator("#ficha .cerrar").click()
    page.wait_for_timeout(500)
        
    # 6s - 10.5s: pasar a pestaña C (Red eléctrica)
    page.locator("#pestanas button", has_text="C · Red eléctrica").click()
    page.locator("#mapa").scroll_into_view_if_needed()
    page.wait_for_timeout(4500)
    
    video_path = page.video.path()
    ctx.close()
    return video_path

def record_scene_6(browser):
    print("--- Grabando Escena 6 (Fuentes y método) ---")
    ctx = browser.new_context(
        record_video_dir=TMP_DIR,
        record_video_size={"width": 390, "height": 844},
        viewport={"width": 390, "height": 844},
    )
    page = ctx.new_page()
    page.goto(PUBLIC_URL, wait_until="networkidle")
    
    # 0s - 4.5s: scroll al pie a "Fuentes de esta pantalla"
    page.locator("#fuentesPantalla").scroll_into_view_if_needed()
    page.wait_for_timeout(4500)
    
    # 4.5s - 10.5s: navegar a Fuentes y método (fuentes.html)
    page.locator("nav.menu a[href='fuentes.html']").click()
    page.wait_for_timeout(2000)
    page.evaluate("window.scrollTo({ top: 180, behavior: 'smooth' })")
    page.wait_for_timeout(4000)
    
    video_path = page.video.path()
    ctx.close()
    return video_path

def record_scene_7(browser):
    print("--- Grabando Escena 7 (Cierre y Alcance) ---")
    ctx = browser.new_context(
        record_video_dir=TMP_DIR,
        record_video_size={"width": 390, "height": 844},
        viewport={"width": 390, "height": 844},
    )
    page = ctx.new_page()
    html_file = os.path.join(BASE_DIR, "escenas_web", "escena7.html")
    page.goto(f"file://{html_file}")
    page.wait_for_timeout(10500)
    video_path = page.video.path()
    ctx.close()
    return video_path

def process_scene_clip(raw_webm, scene_num):
    out_mp4 = os.path.join(TMP_DIR, f"escena_{scene_num}_vertical.mp4")
    sub_png = os.path.join(TMP_DIR, f"sub_vertical_{scene_num}.png")
    
    cmd = [
        ffmpeg_exe, "-y",
        "-i", raw_webm,
        "-i", sub_png,
        "-filter_complex", "[0:v][1:v]overlay=0:0[outv]",
        "-map", "[outv]",
        "-t", "10.0",
        "-r", "30",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "23",
        out_mp4
    ]
    subprocess.run(cmd, check=True)
    print(f"Escena {scene_num} procesada con subtítulo: {out_mp4} ({os.path.getsize(out_mp4)} bytes)")
    return out_mp4

def concat_scenes(clip_paths, output_path):
    concat_list = os.path.join(TMP_DIR, "concat_vertical.txt")
    with open(concat_list, "w") as f:
        for p in clip_paths:
            f.write(f"file '{os.path.abspath(p)}'\n")
            
    cmd = [
        ffmpeg_exe, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list,
        "-c", "copy",
        "-movflags", "+faststart",
        output_path
    ]
    subprocess.run(cmd, check=True)
    print(f"Video final ensamblado en: {output_path} ({os.path.getsize(output_path)} bytes)")

def main():
    print("Iniciando grabación completa vertical (390x844)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        raw_1 = record_scene_1(browser)
        raw_2 = record_scene_2(browser)
        raw_3 = record_scene_3(browser)
        raw_4 = record_scene_4(browser)
        raw_5 = record_scene_5(browser)
        raw_6 = record_scene_6(browser)
        raw_7 = record_scene_7(browser)
        
        browser.close()
        
    print("\nProcesando clips con subtítulos...")
    clips = []
    raws = [raw_1, raw_2, raw_3, raw_4, raw_5, raw_6, raw_7]
    for i, raw in enumerate(raws, 1):
        processed = process_scene_clip(raw, i)
        clips.append(processed)
        
    final_output = os.path.join(ASSETS_DIR, "video-guia-vertical.mp4")
    concat_scenes(clips, final_output)
    
    # También asegurar docs/assets/video-guia.mp4
    horizontal_main = os.path.join(ASSETS_DIR, "video-guia.mp4")
    if not os.path.exists(horizontal_main):
        import shutil
        shutil.copyfile(final_output, horizontal_main)

if __name__ == "__main__":
    main()
