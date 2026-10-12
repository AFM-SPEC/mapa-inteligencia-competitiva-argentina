#!/bin/bash
# Doble clic: enciende el mapa en esta computadora y lo abre en el navegador.
cd "$(dirname "$0")/docs" || exit 1
if ! curl -s -o /dev/null http://127.0.0.1:8766/index.html; then
  python3 -m http.server 8766 --bind 127.0.0.1 >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:8766/index.html"
echo "El mapa está abierto en http://localhost:8766  (cerrá esta ventana para apagarlo)"
wait
