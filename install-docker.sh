#!/bin/bash

# Script de instalación de Docker para asamblea.cloud
# Ejecutar como root o con sudo

echo "=== Instalando Docker para asamblea.cloud ==="

# Actualizar paquetes
apt-get update

# Instalar dependencias
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Agregar clave GPG oficial de Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Agregar repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar Docker
systemctl start docker
systemctl enable docker

echo "=== Docker instalado correctamente ==="
echo ""
echo "Para iniciar asamblea.cloud ejecuta:"
echo "  cd /home/SIGA && docker compose up -d --build"
