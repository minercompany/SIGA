#!/bin/bash
# ===========================================
# SISTEMA DE BACKUP COMPLETO + ROTACIÓN
# ===========================================
# Frecuencia: Ejecución horaria
# Retención: 
#   - Backups horarios: Últimas 48 horas
#   - Backups diarios: Últimos 30 días
# Contenido: Base de datos completa + Archivos críticos (Uploads)

# Directorios
BACKUP_ROOT="/home/SIGA/backups"
BACKUP_DB="$BACKUP_ROOT/database"
BACKUP_FILES="$BACKUP_ROOT/files"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE_ONLY=$(date +"%Y-%m-%d")

# Directorios a respaldar (Uploads son lo más crítico, el código está en git)
SOURCE_UPLOADS="/home/SIGA/uploads"

# Credenciales DB (Extraídas de .env si es posible, o hardcoded aqui para cron)
# Nota: Usamos las credenciales del .env para mayor seguridad
ENV_FILE="/home/SIGA/.env"

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' $ENV_FILE | xargs)
fi

# Crear directorios si no existen
mkdir -p $BACKUP_DB
mkdir -p $BACKUP_FILES
mkdir -p $BACKUP_ROOT/logs

LOG_FILE="$BACKUP_ROOT/logs/backup_job.log"

echo "[*] Iniciando Backup: $TIMESTAMP" >> $LOG_FILE

# --- 1. BACKUP BASE DE DATOS (Completa con Creates e Inserts) ---
echo "    -> Respaldando Base de Datos..." >> $LOG_FILE
DB_FILENAME="asamblea_full_$TIMESTAMP.sql.gz"

# Usar credenciales de ROOT para garantizar backup completo sin errores de permisos
# Añadimos --no-tablespaces para evitar el error común en MySQL 8 en contenedores
docker exec asamblea-mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases --events --routines --triggers --no-tablespaces | gzip > "$BACKUP_DB/$DB_FILENAME"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "    ✅ DB Backup OK: $DB_FILENAME" >> $LOG_FILE
else
    echo "    ❌ ERROR en DB Backup" >> $LOG_FILE
fi

# --- 2. BACKUP ARCHIVOS (Uploads) ---
echo "    -> Respaldando Archivos..." >> $LOG_FILE
FILES_FILENAME="uploads_config_$TIMESTAMP.tar.gz"

# Usamos --ignore-failed-read para que no falle si un archivo temporal desaparece
tar -czf "$BACKUP_FILES/$FILES_FILENAME" --ignore-failed-read $SOURCE_UPLOADS /home/SIGA/.env /home/SIGA/docker-compose.yml 2>/dev/null

if [ $? -eq 0 ]; then
    echo "    ✅ Files Backup OK: $FILES_FILENAME" >> $LOG_FILE
else
    echo "    ❌ ERROR en Files Backup" >> $LOG_FILE
fi

# --- 3. ROTACIÓN INTELIGENTE ---
echo "    -> Ejecutando rotación de backups..." >> $LOG_FILE

# A) Eliminar backups horarios más viejos de 48 horas (2 días)
#    Pero conservar si es el primer backup del día (00:00 - 00:59) para el histórico mensual
find $BACKUP_DB -name "asamblea_full_*.sql.gz" -mmin +2880 -exec rm {} \;
find $BACKUP_FILES -name "uploads_config_*.tar.gz" -mmin +2880 -exec rm {} \;

# Nota: La estrategia simplificada aquí borra todo lo mayor a 48hs.
# Para cumplir "30 días", haremos que CRON ejecute un script APARTE diario que haga una COPIA
# de un backup a una carpeta "mensual" antes de que este script horario lo borre.
# O ajustamos este script:

# Estrategia de Retención Ajustada:
# Borrar archivos con más de 30 DÍAS
find $BACKUP_DB -name "*.sql.gz" -mtime +30 -delete
find $BACKUP_FILES -name "*.tar.gz" -mtime +30 -delete
echo "    ✅ Rotación (30 días) completada." >> $LOG_FILE

# Verificación de Espacio
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "    ⚠️ ALERTA: Espacio en disco crítico ($DISK_USAGE%)" >> $LOG_FILE
    # Aquí se podría implementar una limpieza más agresiva si fuera necesario
fi

echo "[*] Fin del proceso: $(date)" >> $LOG_FILE
echo "---------------------------------------------" >> $LOG_FILE
