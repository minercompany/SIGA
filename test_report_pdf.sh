#!/bin/bash

# Config
# Forzamos resolución local porque estamos DENTRO del servidor
API_URL="https://127.0.0.1/api"
HOST_HEADER="asamblea.coopreducto.coop.py"

echo "1. Intentando Login con admin:2261..."

# Login y extraer token
LOGIN_RESPONSE=$(curl -k -s -X POST "$API_URL/auth/login" \
  -H "Host: $HOST_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin", "password":"2261"}')

# Extraer accessToken usando grep/sed simple (asumiendo estructura {"accessToken":"...", ...})
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login FALLÓ. Respuesta:"
  echo $LOGIN_RESPONSE
  exit 1
else
  echo "✅ Login EXITOSO. Token obtenido."
fi

echo "2. Probando descarga de Reporte PDF (Padron)..."

# Intentar descargar PDF de socios
HTTP_CODE=$(curl -k -s -o reporte_prueba.pdf -w "%{http_code}" \
  -H "Host: $HOST_HEADER" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/socios/export/pdf")

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Reporte generado correctamente (HTTP 200)."
  FILE_SIZE=$(ls -lh reporte_prueba.pdf | awk '{print $5}')
  echo "   Tamaño del archivo: $FILE_SIZE"
  
  # Verificar si parece un PDF (header %PDF)
  HEADER=$(head -c 4 reporte_prueba.pdf)
  if [ "$HEADER" == "%PDF" ]; then
     echo "   ✅ El archivo tiene cabecera PDF válida."
  else
     echo "   ⚠️ ALERTA: El archivo no parece un PDF válido (Cabecera: $HEADER)."
     echo "   Contenido inicial:"
     head -n 5 reporte_prueba.pdf
  fi
else
  echo "❌ Error descargando reporte. Código HTTP: $HTTP_CODE"
fi

echo "3. Limpiando..."
rm reporte_prueba.pdf 2>/dev/null
