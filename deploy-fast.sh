#!/bin/bash
# Fast Deploy Script - Builds locally and restarts containers
# Usage: ./deploy-fast.sh [frontend|backend|both]

set -e

TARGET=${1:-both}
START_TIME=$(date +%s)

# Force BuildKit for faster, cached builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "🚀 SIGA Ultra-Fast Deploy - Target: $TARGET"
echo "================================"

# Function to deploy frontend
deploy_frontend() {
    echo "📦 Rebuilding and deploying frontend container..."
    cd /home/SIGA
    docker compose up -d --build frontend
    echo "✅ Frontend deployed with latest changes!"
}

# Function to deploy backend
deploy_backend() {
    echo "📦 Rebuilding and deploying backend container..."
    cd /home/SIGA
    docker compose up -d --build backend
    echo "✅ Backend deployed with latest changes!"
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
