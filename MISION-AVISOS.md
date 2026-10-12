# Misión: avisos visibles de «datos que faltan» en cada pantalla (12/10/2026)

Trabajás en `docs/` (sitio estático). **No hagas commit ni push. No toques `herramientas/` ni regeneres datos. No lances otros procesos de Codex.** Respondé en español.

## Pedido del usuario
Cuando alguien llega a una sección donde faltan datos, la pantalla tiene que advertirlo de forma **visible** (no escondido en una nota chica al pie). Lo mismo en cada caso de huecos conocidos dentro de los datos que sí están.

## Qué hacer
1. Creá un componente de aviso reutilizable, con un estilo propio y claro (borde o franja de color de la marca NEETI, título corto «Datos que faltan», lista de 1 a 4 puntos; debe leerse bien en 390×844 y en modo con zoom). Los textos van en un solo objeto de constantes al principio (junto a `TEXTOS_PANTALLAS` en `app.js`), no sueltos en el código, porque después se traducen a cinco idiomas. Textos en español rioplatense, sin jerga.
2. Mostrarlo arriba del contenido de cada pestaña afectada (después del mapa en celular; que no empuje el mapa fuera de pantalla), con estos contenidos. Si ya existe una nota equivalente más abajo, dejá el aviso corto y conservá la nota larga; no dupliques párrafos enteros.

### A · Zonas y ciudades
- 188 de 2.314 gobiernos locales no tienen hombres y mujeres propios (se muestran como «sin dato propio»).
- 51 gobiernos locales no tienen población en el cuadro del Censo 2022 (juntas de gobierno y comisiones, sobre todo de Entre Ríos y Formosa); 3 con población no tienen ubicación en el mapa del IGN.
- 186 gobiernos locales muestran edad mediana y población activa de su departamento (rotulado).
- La suma de hombres y mujeres difiere de la población del cuadro (45.618.787 vs. 45.892.285).
### B · Rutas y fronteras
- Los kilómetros de frontera son aproximados, por país vecino; todavía no se puede separar frontera por río y frontera seca, y no hay capa de ríos. Una parte del trazado (≈9.395 km) no tiene país identificado en la fuente y no se suma.
- Los kilómetros de rutas son de trazado del IGN; autopistas y tramos paralelos pueden contarse dos veces.
### C · Red eléctrica
- Falta la **potencia disponible** por subestación (la que sirve para saber si se puede conectar una industria nueva). Sólo hay potencia instalada (MVA, unidad sin confirmar), y de 243 de 323 estaciones. Hay que pedirla a CAMMESA, al ENRE y a las transportistas.
- Distribuidoras: sólo Edenor y Edelap; no hay subestaciones descargables de Edesur ni de las distribuidoras provinciales.
### D · Red de combustibles
- 1.214 puntos vienen del IGN y no figuran en el registro de la Secretaría de Energía (no tienen bandera ni empresa confirmadas).
### E · Red de salud
- Sólo se cruzó con certeza el 8,56 % de los 38.767 establecimientos del REFES (39,92 % de los puntos del IGN); el resto no muestra tipo ni origen. El REFES es del 27/12/2024. No informa nivel de complejidad.
### F · Industrias
- Faltan parques industriales de varias provincias: siete registros de Buenos Aires sin ubicación exacta; Santa Fe publica su capa pero no se pudo descargar; de Entre Ríos, Córdoba y Mendoza no se halló una fuente abierta. No existe el registro POUT (concepto de Paraguay) en Argentina.
### G · Parques industriales y nodos logísticos
- Mismo aviso de parques que F, en versión corta.
### H · Aduanas
- Las exportaciones por aduana son parciales (ARCA reserva parte; ≈45 % del total).
- La comparación con el INDEC llega hasta agosto de 2026; septiembre se agrega cuando el INDEC lo publique (anunciado para el 19/10/2026).
- Las fronteras: mismo aviso corto que B.
### I · Comercio global
- Si ya hay límites conocidos en sus notas, mostrarlos como aviso corto; si no hay nada que advertir, no mostrar el componente.

3. En `fuentes.html`, en la sección de brechas, comprobá que cada punto de arriba figure; agregá los que falten.
4. Si cambiás `app.js`/`widgets.js`/`estilo.css`, subí `?v=` en `index.html`.

## Mobile First (regla permanente)
Probá primero 390×844, luego 768×1024 y 1280×800. Sin desbordes horizontales ni errores en consola. Si el navegador no abre, decilo en el resultado; **no digas que revisaste lo que no viste**.

## Entrega
`RESULTADO-AVISOS.md`: qué avisos quedaron en cada pestaña (en lenguaje de pantalla), qué no pudiste hacer y qué resoluciones verificaste de verdad.
