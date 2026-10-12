# Resultado · conexión de datos nuevos a las pantallas

Fecha: 12/10/2026

## Cambios por pantalla

- **A · Zonas y ciudades:** la coropleta y los bordes destacados se explican y dibujan por provincia. La ficha y la tabla incorporan hombres y mujeres; cuando falta el valor local indican «Sin dato propio». Se agregó un gráfico nacional de ambos datos y la nota sobre la diferencia entre la suma por sexo (45.618.787) y la población del cuadro (45.892.285). Las tasas de actividad se distinguen por sus denominadores: población de 14 años y más y población total.
- **B · Rutas y fronteras:** se sumó la capa independiente de rutas provinciales. La pantalla agrega una tabla de kilómetros nacionales y provinciales por departamento, otra de rutas cercanas a pasos internacionales y kilómetros aproximados de límite por país vecino. Se aclara que no se pudo separar frontera por río y seca.
- **C · Red eléctrica:** Edenor (363 puntos) y Edelap (6) aparecen como capas propias, apagadas al inicio, junto con la aclaración de que sus inventarios no reemplazan la capa nacional y de que no hay subestaciones descargables de Edesur. La potencia está rotulada «potencia instalada (MVA, unidad sin confirmar)».
- **D · Red de combustibles:** se usa la capa nueva de 5.821 puntos. Las fichas muestran empresa y bandera cuando están disponibles; se agregó el gráfico de banderas frecuentes limitado a puntos de Energía y la nota sobre los 1.214 puntos IGN retenidos por no tener una boca de Energía a menos de 300 m. El total mostrado se actualizó a 5.821.
- **E · Red de salud:** al detalle de los puntos IGN se agrega tipología y origen de financiamiento solo para los cruces seguros con REFES. Se incorporó un gráfico nacional de tipología y origen, con el corte del 27/12/2024 y las tasas de cruce (8,56 % de REFES; 39,92 % de puntos IGN). Los cruces dudosos siguen vacíos.
- **F · Industrias:** conserva los parques industriales, zonas francas y fuentes existentes; no se cambió su contenido de pantalla.
- **G · Parques industriales y nodos logísticos:** el rótulo dejó de hablar de «polos» y ahora menciona parques industriales. Se incorporaron las rutas nacionales y provinciales y la capa de parques industriales.
- **H · Aduanas:** rótulos de importación actualizados a IC + IG, importación a consumo y valor FOB. Las tablas nuevas muestran rutas que llegan a pasos de frontera y kilómetros de límite por país. Se incorporó la comparación breve con INDEC: IC + IG quedó 5,2 % por debajo en los 11 meses comparables; ARCA informa FOB e INDEC CIF.
- **I · Comercio global:** sin cambios en la visualización; conserva sus fuentes de exportaciones provinciales.

En todas las pantallas se actualizaron los bloques de fuentes pertinentes. `fuentes.html` suma las nuevas entradas de INDEC, IGN, Energía, Ministerio de Salud, ARCA e INDEC y sus enlaces.

## Formulario

Se quitó la opción «Registrar mi negocio para el mapa». El envío quedó configurado al endpoint AJAX de FormSubmit para `info@neetipol.com`, con JSON, `_subject`, campo trampa `_honey`, estados «Enviado» y error, y respaldo por `mailto:`. No se envió ninguna prueba, según la instrucción.

## Límites de la revisión

La sintaxis de `app.js`, `widgets.js` y `comun.js` pasó `node --check`. Se comprobó que las capas nuevas contienen las cantidades esperadas (5.821 estaciones, 8.311 puntos de salud y REFES paralelos, 15.667 geometrías lineales provinciales, 363 puntos Edenor y 6 Edelap), que hay 3.318 cruces REFES seguros y que 2.126 de 2.314 gobiernos locales tienen ambos campos de sexo. No se probaron envíos de formulario.

No se pudo hacer la revisión visual solicitada: Chromium de Playwright abortó al iniciar y Chrome instalado también se cerró antes de abrir la página. Por eso no se pudo comprobar visualmente el desborde horizontal ni los errores de consola.

| Resolución | Resultado real |
|---|---|
| 390 × 844 | No revisada visualmente: Chromium no inició. |
| 768 × 1024 | No revisada visualmente: Chromium no inició. |
| 1280 × 800 | No revisada visualmente: Chromium no inició. |
