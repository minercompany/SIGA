---
description: Cómo iniciar el Sistema de Gestión de Asambleas
---

Sigue estos pasos para iniciar tanto el Backend como el Frontend:

### Requisitos Previos
1. Asegúrate de que **XAMPP** (Apache y MySQL) esté iniciado.
2. La base de datos `asamblea_db` se creará automáticamente en la primera ejecución.

### 1. Iniciar el Backend (Spring Boot)
Abre una terminal en `C:\SISTEMA_ASAMBLEA\backend` y ejecuta:
// turbo
```powershell
./mvnw spring-boot:run
```

### 2. Iniciar el Frontend (Next.js)
Abre otra terminal en `C:\SISTEMA_ASAMBLEA\frontend` y ejecuta:
// turbo
```powershell
npm run dev
```

### 3. Acceder al Sistema
Una vez iniciados, abre tu navegador en:
[http://localhost:3000](http://localhost:3000)

---
**Nota**: El usuario administrador por defecto es:
- **Usuario**: `admin`
- **Contraseña**: `admin123` (Puedes cambiarla después)
