# Misión: conectar a las pantallas los datos nuevos (12/10/2026)

Trabajás en `docs/` (sitio estático: `index.html`, `app.js`, `widgets.js`, `comun.js`, `config.js`, `estilo.css`, `fuentes.html`). Los datos ya están procesados en `docs/datos/` (ver `DATOS-D-RESULTADO.md`, `DATOS-D6-RESULTADO.md`, `DATOS-F-RESULTADO.md`, `ADUANAS-E-RESULTADO.md`). **No hagas commit ni push.** **No toques los scripts de `herramientas/` ni regeneres datos.** No tradujiste nada: la traducción a cinco idiomas se hace después, pero escribí todos los textos nuevos en español rioplatense claro, en un solo lugar fácil de extraer (constantes al principio del archivo, no textos sueltos metidos en el código).

## Regla permanente: Mobile First
Probá y ajustá primero en 390×844 (vertical), después 768×1024 y 1280×800. Lo que existe en escritorio tiene que existir en celular y tablet (se reacomoda, no se esconde). Sin desbordes horizontales, sin errores en consola. Si Chromium falla, avisalo en el resultado; no lo des por revisado.

## Decisiones ya tomadas por el usuario (no las discutas)
1. **Colorear por PROVINCIA**: Argentina es federal; el mapa de colores (coropleta) de la pestaña A se pinta por provincia, no por departamento. Podés usar `capa_departamentos.json` (campo `p` = código de provincia) para dibujar los contornos, pero el relleno y los bordes marcados son por provincia.
2. **Sacar «Registrar mi negocio para el mapa»** del formulario (`index.html`).
3. **Tasa de actividad**: mostrar las dos, la de 14 años y más y la sobre población total, con rótulo claro de cuál es cuál.
4. **Hombres y mujeres**: usar los campos `hom` y `muj` (gobierno local) y los de departamento. Mostrarlos en la ficha del gobierno local y en un gráfico/indicador de la pestaña A. Para los 188 gobiernos locales sin dato propio, mostrar «sin dato propio» (no inventar). Aclarar en la nota que la suma difiere de la población del cuadro (45.618.787 vs. 45.892.285) y por qué (reparto de radios censales).
5. **Rutas**: nacionales y provinciales. Sumar la capa `capa_rutas_provinciales.json` (lista de líneas, coordenadas [lon, lat]) como capa aparte de «Rutas nacionales» en B y G. Usar `rutas_por_departamento.json` (km nacionales y provinciales por departamento) en la tabla/ranking de B y `rutas_internacionales.json` (rutas que llegan a pasos de frontera) como tabla en B y H.
6. **Ríos y frontera seca**: `limites_km.json` v2 trae `confiable_separacion: false`. Mostrar los kilómetros de límite por país vecino, SIN separar río/seco, con la aclaración honesta de que esa separación todavía no se pudo calcular. No presentes un porcentaje río/seco.
7. **Parques**: en la pestaña G se habla de «parques industriales» (en F ya está). Revisá que el rótulo diga eso y no «polos» donde corresponda a parques.
8. **Potencia**: el rótulo debe decir «potencia instalada (MVA, unidad sin confirmar)». No la llames «disponible».
9. **Combustibles (D)**: reemplazar `capa_estaciones_servicio.json` por la nueva versión (5.821 puntos: cada fila es `[lat, lon, empresa, bandera, fuente("Energía"|"IGN"), cód. provincia]`). Cambiar el rótulo `info` de la capa (nombre de empresa, bandera, fuente). Mostrar un gráfico de banderas más frecuentes (YPF, Shell, etc., sólo entre los puntos de fuente «Energía») y aclarar que los 1.214 puntos «IGN» se conservaron porque no tenían una boca de Energía a menos de 300 m. Cuidado: `est10` ya fue recalculado en `municipios.json`.
10. **Salud (E)**: **sumar** (no reemplazar) `capa_salud_refes.json` (8.311 posiciones paralelas a `capa_salud.json`; `null` donde no hubo cruce seguro) y `salud_refes_resumen.json` (totales y cantidades por departamento, por tipología y por origen de financiamiento). En la ficha de cada establecimiento mostrar tipo y origen cuando exista cruce; un gráfico con la tipología y el origen (nacional) y la aclaración: REFES corte 27/12/2024, cruce seguro del 8,56 % de los 38.767 establecimientos (39,92 % de los puntos IGN); los dudosos quedaron sin completar.
11. **Distribuidoras (C)**: `capa_distribucion_edenor.json` (363) y `capa_distribucion_edelap.json` (6) como capas **aparte**, apagadas por defecto, con aclaración de que son inventarios de esas empresas y zonas, no reemplazan la capa nacional; Edesur no tiene subestaciones descargables.
12. **Aduanas (H)**: `aduanas_comercio.json` ahora usa importación IC+IG; actualizá los rótulos de la pantalla y la nota (el método ya está en `fuentes.html`). Mostrá la comparación contra el INDEC (de `ADUANAS-E-RESULTADO.md`: ARCA IC+IG suma 5,2 % por debajo del INDEC en 11 meses; FOB vs. CIF) como nota breve.
13. **Formulario**: reenviar con FormSubmit a info@neetipol.com. En `config.js` poner `envio: "https://formsubmit.co/ajax/info@neetipol.com"` y comprobar que `comun.js`/`app.js` lo envía por `fetch` con JSON, muestra «Enviado»/error en `#estadoForm`, y tiene el campo trampa (`_honey`) y `_subject`. **No lo pruebes enviando** (yo activo el correo de confirmación). Dejá el envío por `mailto:` de respaldo si falla.
14. **Fuentes por pantalla**: cada pestaña tiene el bloque «Fuentes de esta pantalla». Agregá ahí (y en `fuentes.html`, inventario) todas las fuentes nuevas con enlace: Secretaría de Energía (precios en surtidor, Edenor, Edelap), Ministerio de Salud (REFES), IGN (rutas provinciales, límites), INDEC (sexo del Censo, radios), ARCA e INDEC (aduanas). Las URLs están en los archivos `DATOS-*-RESULTADO.md`.

## Qué NO hacer
- No inventar valores faltantes. Si no hay dato, decirlo.
- No subir de versión sin necesidad; si cambiás `app.js`/`widgets.js`/`estilo.css`, subí el `?v=` en `index.html`.
- No agregar librerías externas.

## Entrega
Al terminar, escribí `RESULTADO-PANTALLAS.md` con: qué cambió en cada pestaña (en lenguaje de pantalla, no de código), qué NO pudiste hacer y por qué, y qué resoluciones revisaste (390×844, 768×1024, 1280×800) y con qué resultado real.
