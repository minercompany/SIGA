# Guía de Instalación del Sistema SIGA

## Requisitos Previos
1.  **Java JDK 17 o superior**.
2.  **Node.js 18 o superior**.
3.  **MySQL Server** (XAMPP o instalación nativa).

## Configuración de Base de Datos

El sistema incluye un archivo SQL con la estructura y datos iniciales necesarios.

1.  Crear una base de datos vacía llamada `asamblea_db`.
    ```sql
    CREATE DATABASE asamblea_db;
    ```
2.  Importar el archivo `database_structure.sql` proporcionado en la raíz del proyecto.
    *   **Desde línea de comandos**:
        ```bash
        mysql -u root -p asamblea_db < database_structure.sql
        ```
    *   **Desde Workbench / HeidiSQL**: Abrir el archivo y ejecutar el script.

## Configuración del Backend

1.  Navegar a la carpeta `backend/`.
2.  Verificar `src/main/resources/application.properties` si necesitas cambiar usuario/contraseña de la BD.
3.  Ejecutar:
    ```bash
    ./mvnw spring-boot:run
    ```

## Configuración del Frontend

1.  Navegar a la carpeta `frontend/`.
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Iniciar servidor de desarrollo:
    ```bash
    npm run dev
    ```

## Acceso Inicial
- **URL**: `http://localhost:6001`
- **Usuario Maestro**: `admin`
- **Contraseña**: (Definida en el seed o `admin`)
