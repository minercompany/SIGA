#!/bin/bash
# Switch to DEVELOPMENT MODE - Hot reload for instant changes
# Usage: ./dev-mode.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Switching to DEVELOPMENT MODE...${NC}"
echo "================================"

cd /home/SIGA

# Stop Frontend container
echo "Stopping production frontend container..."
docker compose stop frontend 2>/dev/null || true

# Kill any existing dev server
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 1

# Update Nginx to proxy to port 3000 (dev server)
echo -e "${CYAN}Updating Nginx to use development port (3000)...${NC}"
sudo sed -i 's/proxy_pass http:\/\/localhost:6002/proxy_pass http:\/\/localhost:3000/g' /etc/nginx/sites-available/asamblea
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo -e "${GREEN}✅ DEVELOPMENT MODE CONFIGURED${NC}"
echo ""
echo "📝 Instrucciones:"
echo "   1. En OTRA terminal, ejecuta:"
echo "      ${CYAN}cd /home/SIGA/frontend && NEXT_PUBLIC_API_URL=https://asamblea.cloud npm run dev${NC}"
echo ""
echo "   2. Los cambios en código son INSTANTÁNEOS (hot reload)"
echo "   3. El sitio sigue accesible en https://asamblea.cloud"
echo "   4. Para volver a producción: ${YELLOW}./prod-mode.sh${NC}"
echo ""
