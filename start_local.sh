#!/bin/bash
# Script para iniciar el entorno de desarrollo local (localhost:3000)
# Sin afectar la producción (asamblea.cloud)

echo "Iniciando entorno local..."

# 1. Asegurar que la base de datos local existe
mysql -u root -e "CREATE DATABASE IF NOT EXISTS asamblea_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Iniciar el Backend en el puerto 8081 (default local)
echo "Levantando Backend (puerto 8081)..."
cd /home/SIGA/backend
nohup ./mvnw spring-boot:run > /home/SIGA/backend_local.log 2>&1 &
BACKEND_PID=$!
echo "Backend iniciado con PID: $BACKEND_PID"

# Esperar un poco para que el backend empiece a levantar
sleep 8

# 3. Iniciar el Frontend en el puerto 3000
echo "Levantando Frontend (puerto 3000)..."
cd /home/SIGA/frontend
export API_URL=http://localhost:8081
nohup npm run dev -- -p 3000 > /home/SIGA/frontend_local.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend iniciado con PID: $FRONTEND_PID"

echo ""
echo "✅ El entorno local se está levantando en segundo plano."
echo "🔗 Abrir en el navegador: http://localhost:3000"
echo "📂 Logs disponibles en: /home/SIGA/backend_local.log y /home/SIGA/frontend_local.log"
echo ""
echo "Recuerda que la producción NO ha sido afectada y sigue corriendo en Docker."
