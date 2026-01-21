# Análisis del Módulo de Candidatos - SIGA

Este documento detalla la estructura, funcionalidades y diseño del módulo de candidatos para el Sistema de Gestión de Asambleas (SIGA).

## 1. Objetivos del Módulo
El módulo de candidatos tiene como propósito permitir la visualización y gestión de los socios que se postulan para los diferentes órganos de la cooperativa durante la asamblea.

## 2. Entidades y Estructura de Datos (Backend)
Se ha implementado la entidad `Candidato` con los siguientes campos:
- **Socio**: Relación con la entidad `Socio` (ID, Nombre, Cédula).
- **Órgano**: (CONSEJO_ADMINISTRACION, JUNTA_VIGILANCIA, JUNTA_ELECTORAL).
- **Tipo**: (TITULAR, SUPLENTE).
- **Foto**: Almacenado como Base64 (o path) para visualización inmediata.
- **Biografía**: Texto descriptivo del perfil y propuestas del candidato.
- **Orden**: Prioridad de aparición en las listas.
- **Activo**: Estado lógico para habilitar/deshabilitar candidatos.

## 3. Funcionalidades del Administrador (Configuración)
Ubicación: `/configuracion/candidatos`
- **Buscador de Socios**: Búsqueda por nombre o cédula para cargar datos automáticamente.
- **Carga de Fotografía**: Interfaz premium para subir y **recortar** la imagen del candidato (asegurando un formato uniforme).
- **Asignación de Cargo**: Selección de órgano y tipo (titular/suplente).
- **Gestión ABM**: Lista de candidatos registrados con opción de editar o eliminar.

## 4. Visualización Pública (Módulo de Candidatos)
Ubicación: `/candidatos`
- **Diseño de Tarjetas**: Visualización agrupada por órgano.
- **Modal de Detalle**: Al hacer clic en un candidato, se abre un modal con la foto ampliada, perfil completo, cargo y biografía detallada.
- **Aesthetics**: Uso de degradados, animaciones con Framer Motion y tipografía premium.

## 5. Spotlight (Flyer Dinámico)
- **Activación**: Al ingresar al sistema (Dashboard), aparece un modal tipo flyer.
- **Duración**: Se muestra durante 3 segundos y desaparece automáticamente.
- **Rotación**: En cada acceso, el sistema selecciona un candidato diferente de forma aleatoria o secuencial para asegurar visibilidad equitativa.

## 6. Tecnologías Utilizadas
- **Frontend**: Next.js (React), Tailwind CSS, Framer Motion, Lucide React, React Easy Crop.
- **Backend**: Spring Boot, JPA/Hibernate, MySQL.

---
*Documento generado por Antigravity AI - 2024*
