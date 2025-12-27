# Configuración de Base de Datos - Sistema de Gestión de Asambleas

Este proyecto utiliza **MySQL** como motor de base de datos y **Spring Data JPA (Hibernate)** para la gestión automática del esquema (tablas y relaciones).

## 1. Requisitos Previos
- MySQL Server (o XAMPP/WAMP) corriendo en el puerto `3306`.
- Java JDK 21 instalado.
- Maven (incluido con `./mvnw`).

## 2. Creación de la Base de Datos
El sistema está configurado para crear las tablas automáticamente, pero debes crear la base de datos vacía manualmente primero.

Ejecuta el siguiente script SQL en tu cliente de base de datos (phpMyAdmin, MySQL Workbench, DBeaver):

```sql
CREATE DATABASE IF NOT EXISTS asamblea_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. Credenciales
La configuración por defecto en `backend/src/main/resources/application.properties` es:
- **URL**: `jdbc:mysql://127.0.0.1:3306/asamblea_db`
- **Usuario**: `root`
- **Contraseña**: (vacía)

Si tu configuración de MySQL es diferente, edita ese archivo.

## 4. Inicialización Automática
Al ejecutar el backend por primera vez con el comando:
```bash
cd backend
./mvnw spring-boot:run
```

El sistema realizará automáticamente:
1.  **Creación de Tablas**: Creará todas las tablas (`usuarios`, `socios`, `asistencias`, `asignaciones`, etc.) basándose en las entidades Java.
2.  **Usuario Administrador**: Creará un usuario por defecto si no existe.
    -   **Usuario**: `admin`
    -   **Contraseña**: `admin`
3.  **Configuración Inicial**: Creará un registro de asamblea por defecto.

## 5. Migración o Respaldo Manual
Si deseas exportar la estructura generada para conservarla como referencia SQL pura:
1.  Inicia la aplicación una vez.
2.  Usa tu herramienta de base de datos para exportar ("Dump") solo la estructura (sin datos) a un archivo `.sql`.

---
**Nota:** No es necesario ejecutar scripts `CREATE TABLE` manualmente, ya que Hibernate se encarga de mantener el esquema sincronizado con el código Java.
