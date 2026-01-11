#!/bin/bash
# Switch to PRODUCTION MODE - Full optimized build
# Usage: ./prod-mode.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Switching to PRODUCTION MODE...${NC}"
echo "================================"

cd /home/SIGA

# Stop dev server if running
echo "Stopping development server..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

# Build production version
echo -e "${CYAN}Building production version (esto toma ~70s)...${NC}"
cd /home/SIGA/frontend
NEXT_PUBLIC_API_URL=https://asamblea.coopreducto.coop.py npm run build 2>&1 | tail -5

# Update Nginx back to production port (6002)  
echo -e "${CYAN}Updating Nginx to use production port (6002)...${NC}"
sudo sed -i 's/proxy_pass http:\/\/localhost:3000/proxy_pass http:\/\/localhost:6002/g' /etc/nginx/sites-available/asamblea
sudo nginx -t && sudo systemctl reload nginx

# Restart frontend container with bind mounts
echo -e "${CYAN}Starting production container...${NC}"
cd /home/SIGA
docker compose up -d frontend

# Wait for container to be healthy
echo "Waiting for container to start..."
sleep 3

# Show status
docker compose ps frontend

echo ""
echo -e "${GREEN}✅ PRODUCTION MODE ACTIVE${NC}"
echo ""
echo "El sistema está corriendo en modo producción optimizado."
echo "Para hacer cambios rápidos: ./dev-mode.sh"
