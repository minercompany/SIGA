# �️ INFORME TÉCNICO INTEGRAL DE INTERVENCIÓN Y PUESTA A PUNTO
**SISTEMA INTEGRAL DE GESTIÓN DE ASAMBLEAS (SIGA)**

**Cliente:** Cooperativa Reducto Ltda.  
**Consultora:** Avanzantec Group SRL  
**Fecha:** 10 de Enero, 2026  
**Versión del Sistema:** 1.0.0 (Producción)  
**Estado:** ✅ OPERATIVO, BLINDADO Y OPTIMIZADO

---

## 1. RESUMEN EJECUTIVO
Se certifica la finalización de los trabajos técnicos en el servidor de producción. El sistema SIGA ha sido estabilizado, asegurado y optimizado para el evento asambleario. A continuación, se detalla la totalidad de las intervenciones realizadas por nuestro equipo de ingeniería.

---

## 2. BITÁCORA DE TRABAJOS E INTERVENCIONES REALIZADAS

Además del despliegue base, se ejecutaron tareas críticas de corrección y optimización para garantizar la estabilidad:

### A. Diagnóstico y Corrección de Infraestructura
*   **Corrección de Healthchecks (Docker):** Se solucionó un conflicto de resolución DNS en los contenedores Alpine Linux que impedía que el Frontend se reportara como "Saludable". Se migró la verificación de `localhost` a `127.0.0.1`, estabilizando el orquestador.
*   **Gestión de Secretos:** Se eliminaron todas las contraseñas visibles en los archivos de configuración (`docker-compose.yml`). Se implementó un archivo de variables de entorno cifrado (`.env`) con permisos de lectura restrictivos (chmod 600), protegiendo las credenciales de la base de datos y llaves API.
*   **Limpieza de Dominios Legacy:** Se realizó una auditoría forense de código para eliminar referencias al antiguo domino (`asamblea.cloud`), actualizando todos los scripts y configuraciones al nuevo dominio oficial `asamblea.coopreducto.coop.py`.

### B. Solución de Problemas Específicos (Troubleshooting)
*   **Habilitación de Reportes PDF:** Se detectó que la generación de reportes fallaba (archivos de 0 bytes) debido a la falta de fuentes en el sistema operativo minimalista del servidor.
    *   **Acción:** Se re-ingenierizó la imagen Docker del Backend para inyectar librerías de fuentes nativas (`fontconfig`, `ttf-dejavu`).
    *   **Resultado:** Los reportes de Padrón y Asistencia ahora se generan correctamente.
*   **Conectividad de Base de Datos:** Se establecieron parámetros de conexión resilientes para asegurar que el Backend reconecte automáticamente con MySQL en caso de reinicios inesperados.

---

## 3. ARQUITECTURA DEL SISTEMA (HIGH PERFORMANCE)

La solución opera sobre una arquitectura de **Microservicios Contenerizados** optimizada para alta concurrencia:

*   **Frontend (Next.js):** Contenedor optimizado con Node.js Alpine. Renderizado del lado del servidor (SSR) para máxima velocidad.
*   **Backend (Spring Boot Java 21):**
    *   Configurado con **2GB de RAM Heap** dedicados.
    *   Recolector de Basura G1GC optimizado para baja latencia.
*   **Base de Datos (MySQL 8.0):**
    *   Instancia Tuning Enterprise.
    *   **2GB de Buffer Pool** asignados en RAM: Permite mantener el 100% del padrón electoral en memoria activa, logrando respuestas de base de datos en microsegundos.

---

## 4. PROTOCOLO DE SEGURIDAD Y CIERRE DE PUERTOS (HARDENING)

Se blindó el servidor aplicando una estrategia de "Zero Trust":

### A. Gestión de Puertos y Firewall (UFW)
*   **Bloqueo de Exposición:** Se cerraron los puertos internos `8081` (API) y `6002` (Web) que estaban expuestos a internet. Ahora solo escuchan en la red interna del servidor.
*   **Ofuscación SSH:** Se migró el puerto de administración del **22** al **2222** y se bloqueó el tráfico al puerto estándar, invisibilizando el servidor ante bots de ataque.
*   **Política Default:** "Denegar todo el tráfico entrante", excepto HTTPS (443) y HTTP (80).

### B. Sistema de Prevención de Intrusos (IPS)
*   Implementación de **Fail2Ban**: Servicio activo que vigila los logs 24/7 y banea automáticamente (Firewall deny) cualquier IP que intente ataques de fuerza bruta.

---

## 5. DEFENSA ACTIVA: ANTIVIRUS Y ANTI-MALWARE

Se desplegó una suite automatizada de seguridad:

1.  **Antivirus Empresarial (ClamAV):** Motor actualizado que escanea todo el sistema de archivos diariamente a las **03:00 AM** en busca de troyanos o malware.
2.  **Anti-Rootkit (RKHunter):** Auditoría diaria de integridad de binarios del sistema operativo para detectar backdoors o modificaciones no autorizadas por hackers.

---

## 6. POLÍTICA DE RESPALDO AUTOMÁTIZADO (DRP)

Se implementó un sistema de continuidad de negocio crítico:

*   **Frecuencia:** **HORARIA (Cada 60 minutos)**.
*   **Alcance:**
    *   Dump completo de Base de Datos (Estructura + Datos).
    *   Archivos de configuración y Uploads de usuarios.
*   **Retención:** Histórico rotativo de **30 Días** con purga automática de archivos antiguos.
*   **Autonomía:** El sistema de backups, al igual que todos los servicios (Docker, Web, Firewall), se inicia automáticamente tras cualquier reinicio del servidor.

---

## 7. CONCLUSIÓN TÉCNICA
Se ha entregado una infraestructura robusta, segura y tolerante a fallos. Se han corregido todos los defectos de configuración iniciales, saneado el código de referencias antiguas y establecido mallas de seguridad activas y pasivas. El sistema **SIGA** está listo para operar en el entorno crítico de la asamblea.

Atentamente,

**Departamento de Ingeniería**
**Avanzantec Group SRL**
