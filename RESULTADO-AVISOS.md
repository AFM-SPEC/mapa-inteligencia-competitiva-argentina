# Resultado: avisos de datos faltantes

Se incorporó un aviso reutilizable con franja bordó y fondo crema de la identidad NEETI. El título «Datos que faltan» y todos los textos por pestaña están agrupados en `TEXTOS_AVISOS` al principio de `docs/app.js`. El aviso se ubica después del mapa y su nota, para que en celular el mapa siga apareciendo antes que el aviso. La lista admite de uno a cuatro puntos y se adapta al ancho disponible.

## Avisos por pestaña

- **A · Zonas y ciudades:** 188 gobiernos locales sin datos propios de hombres y mujeres; 51 sin población en el cuadro censal y 3 sin ubicación del IGN; 186 con edad mediana y población activa tomadas del departamento; diferencia entre la suma por sexo y la población del cuadro.
- **B · Rutas y fronteras:** límites de frontera aproximados, sin separar ríos y tramos terrestres ni capa de ríos; unos 9.395 km sin país identificado excluidos de la suma; posible doble conteo de autopistas y tramos paralelos.
- **C · Red eléctrica:** falta la potencia disponible, alcance de la potencia instalada y organismos a consultar; faltan capas de Edesur y distribuidoras provinciales.
- **D · Red de combustibles:** 1.214 puntos IGN sin empresa ni bandera confirmadas por el registro de Energía.
- **E · Red de salud:** alcance de los cruces seguros con REFES, fecha de corte, datos que quedan vacíos y falta del nivel de complejidad.
- **F · Industrias:** registros bonaerenses sin ubicación exacta, capa de Santa Fe no descargada, fuentes abiertas no encontradas para Entre Ríos, Córdoba y Mendoza; ausencia de registro argentino de POUT.
- **G · Parques industriales y nodos logísticos:** versión corta del aviso sobre la cobertura parcial de parques.
- **H · Aduanas:** exportaciones parciales por reserva de ARCA; comparación con INDEC hasta agosto de 2026 y fecha anunciada para septiembre; límites de los datos de fronteras.
- **I · Comercio global:** las exportaciones se publican por provincia de origen, sin desglose por gobierno local.

En `docs/fuentes.html`, la sección «Lo que falta y a quién pedirlo» ahora enumera también los huecos censales y de ubicación, el posible doble conteo vial, los kilómetros de frontera excluidos, las limitaciones de redes eléctrica, de combustibles y salud, el alcance de parques, el período de comparación aduanera y el nivel provincial del comercio global.

## Verificación

- `node --check docs/app.js`: correcto.
- Intenté abrir el sitio con Playwright para recorrer las nueve pestañas a 390×844, 768×1024 y 1280×800, revisar desbordes y consola, y capturar la vista con zoom. Chromium se cerró al iniciar con señal 6; no pude ver la página ni completar esas comprobaciones. Por lo tanto, no doy ninguna de esas resoluciones por verificada visualmente.
- No se hicieron cambios en `herramientas/` ni se regeneraron datos. No se hizo commit ni push.
