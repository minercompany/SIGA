#!/bin/bash
# Fast Deploy Script - Builds locally and restarts containers
# Usage: ./deploy-fast.sh [frontend|backend|both]

set -e

TARGET=${1:-both}
START_TIME=$(date +%s)

echo "🚀 Fast Deploy - Target: $TARGET"
echo "================================"

# Function to deploy frontend
deploy_frontend() {
    echo "📦 Building frontend locally..."
    cd /home/SIGA/frontend
    
    # Build locally (faster than in Docker)
    npm run build
    
    echo "🔄 Restarting frontend container..."
    cd /home/SIGA
    docker compose restart frontend
    
    echo "✅ Frontend deployed!"
}

# Function to deploy backend
deploy_backend() {
    echo "📦 Building backend locally..."
    cd /home/SIGA/backend
    
    # Build locally
    ./mvnw package -DskipTests -B -q
    
    echo "🔄 Restarting backend container..."
    cd /home/SIGA
    docker compose restart backend
    
    echo "✅ Backend deployed!"
}

case $TARGET in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    both)
        deploy_frontend
        deploy_backend
        ;;
    *)
        echo "Usage: ./deploy-fast.sh [frontend|backend|both]"
        exit 1
        ;;
esac

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo ""
echo "⏱️  Deploy completed in ${DURATION} seconds"
