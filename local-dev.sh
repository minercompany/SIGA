#!/bin/bash
# LOCAL DEVELOPMENT MODE - Sin afectar producción
# Los usuarios siguen usando asamblea.cloud normalmente
# Tú trabajas en localhost:3000 con hot reload
# Usage: ./local-dev.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     🔧 MODO DESARROLLO LOCAL - SIN AFECTAR PRODUCCIÓN    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

cd /home/SIGA/frontend

# Verificar estado de producción
echo -e "${YELLOW}📊 Estado actual de producción:${NC}"
docker compose -f /home/SIGA/docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || echo "No se pudo verificar Docker"
echo ""

# Verificar si hay un servidor de dev corriendo
if pgrep -f "next dev" > /dev/null || pgrep -f "npm run dev" > /dev/null; then
    echo -e "${YELLOW}⚠️  Ya hay un servidor de desarrollo corriendo.${NC}"
    echo -e "   Usa ${CYAN}pkill -f 'next dev'${NC} para detenerlo si es necesario."
    echo ""
fi

echo -e "${GREEN}✅ PRODUCCIÓN SIGUE CORRIENDO EN:${NC}"
echo -e "   🌐 https://asamblea.cloud (para los usuarios)"
echo ""

echo -e "${CYAN}📝 Para iniciar desarrollo local:${NC}"
echo ""
echo "   1. Abre OTRA terminal (esta solo muestra instrucciones)"
echo ""
echo "   2. Ejecuta el servidor de desarrollo:"
echo -e "      ${YELLOW}cd /home/SIGA/frontend && npm run dev -- -p 5050${NC}"
echo ""
echo "   3. Abre en tu navegador:"
echo -e "      ${GREEN}http://localhost:5050${NC} o ${GREEN}http://TU_IP:5050${NC}"
echo ""
echo "   4. ¡Cualquier cambio en el código se reflejará INSTANTÁNEAMENTE!"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "🔄 Cuando termines de trabajar y quieras aplicar cambios a producción:"
echo -e "   ${YELLOW}./deploy.sh${NC}  (esto hace build y reinicia el contenedor)"
echo ""
