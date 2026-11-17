#!/usr/bin/env bash
# Hace los 5 commits de la Persona 2 en orden y los sube a GitHub.
# Uso (desde Git Bash, dentro de la carpeta PaginaDise-o):
#   bash commits-persona2.sh "/c/Users/TU_USUARIO/Downloads/Persona2"
set -e

ORIGEN="${1:-}"
if [ -z "$ORIGEN" ] || [ ! -d "$ORIGEN/commit-1" ]; then
  echo "ERROR: pasa la ruta de la carpeta Persona2 descomprimida (la que tiene commit-1 ... commit-5)."
  echo "Ejemplo: bash commits-persona2.sh \"/c/Users/TU_USUARIO/Downloads/Persona2\""
  exit 1
fi

if [ ! -f "README.md" ] || [ ! -d ".git" ]; then
  echo "ERROR: ejecuta el script dentro de la carpeta raíz PaginaDise-o (donde está README.md)."
  exit 1
fi

echo "Commits a nombre de: $(git config user.name) <$(git config user.email)>"
read -r -p "¿Es la cuenta correcta? (s/n) " RESP
[ "$RESP" = "s" ] || { echo "Cancelado. Cambia git config user.name / user.email y vuelve a correrlo."; exit 1; }

git checkout main
git pull origin main

MENSAJES=(
  "feat(dominio): patrón State para el ciclo de vida de la cotización"
  "feat(dominio): patrón Strategy para descuentos (tope 15%) e IVA"
  "feat(dominio): patrón Observer para historial y aviso por correo"
  "feat(api): patrón Builder del documento y Facade de cotizaciones"
  "feat(api): rutas del comprador y del asesor, vencimientos (RN-03) y pruebas del flujo"
)

for N in 1 2 3 4 5; do
  echo "== commit-$N =="
  cp -R "$ORIGEN/commit-$N/." .
  git add -A
  git commit -m "${MENSAJES[$((N-1))]}"
done

git push origin main
echo "Listo: 5 commits subidos."
