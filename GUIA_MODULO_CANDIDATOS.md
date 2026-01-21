# Guía de Funcionamiento - Módulo de Candidatos (SIGA)

Este documento detalla la implementación técnica y funcional del módulo de candidatos, diseñado para ofrecer una experiencia premium tanto a administradores como a socios.

## 🚀 Resumen de lo Implementado

Se ha desarrollado un sistema integral que abarca desde la gestión administrativa hasta la visualización pública:

1.  **Backend (Java)**: Entidad `Candidato` y controladores REST para operaciones CRUD.
2.  **Admin (Frontend)**: Interfaz de gestión con un asistente (wizard) de 3 pasos.
3.  **Visualización Pública**: Pantalla de candidatos con diseño de tarjetas premium y modales de detalle.
4.  **Spotlight (Flyer)**: Sistema de publicidad dinámica de candidatos en el Dashboard.

---

## 🛠 Cómo Funciona (Manual de Uso)

### 1. Registro de un Nuevo Candidato (Wizard de 3 Pasos)
Para garantizar la integridad de los datos y una estética uniforme, la creación de candidatos se divide en:

*   **Paso 1: Identificación del Socio**: El sistema busca en la base de datos de socios en tiempo real. Puedes buscar por **Cédula** o **Número de Socio**. Una vez encontrado, se selecciona para vincular los datos básicos.
*   **Paso 2: Imagen de Perfil (Recorte Inteligente)**: Se debe subir una foto. El sistema abrirá automáticamente una herramienta de recorte (`react-easy-crop`) para asegurar que la cara esté centrada y la imagen sea cuadrada (1:1), manteniendo la armonía visual de la web.
*   **Paso 3: Configuración y Propuesta**: Se define el órgano (Consejo, Junta Vigilancia, etc.), el tipo (Titular/Suplente) y se redacta una breve biografía o propuestas principales.

### 2. Candidato Destacado (Spotlight)
Al iniciar sesión, los usuarios verán un "Flyer" emergente:
*   **Rotación**: El sistema utiliza `sessionStorage` para mostrar un candidato diferente cada vez que el usuario navega al dashboard, asegurando visibilidad equitativa para todos.
*   **Temporizador**: El flyer desaparece automáticamente tras **3 segundos** para no interferir con la navegación del usuario.

### 3. Página Pública de Candidatos
Ubicada en `/candidatos`, esta página organiza a los postulantes por sus respectivos órganos:
*   **Diseño**: Tarjetas con bordes suavizados, sombras profundas y badges de identificación.
*   **Detalle**: Al hacer clic en una tarjeta, se abre un modal premium con la foto en grande y la biografía completa del candidato.

---

## 💻 Detalles Técnicos

### Tecnologías Utilizadas:
*   **Frontend**: Next.js 14, Tailwind CSS, Framer Motion (animaciones).
*   **Iconografía**: Lucide React.
*   **Gestión de Imagen**: React Easy Crop.
*   **Alertas**: SweetAlert2.
*   **Backend**: Spring Boot, JPA/Hibernate, MySQL.

### Lógica de Rotación:
El componente `CandidateSpotlight.tsx` gestiona el índice del último candidato mostrado en el navegador del usuario. Si hay 5 candidatos, los mostrará en orden 1, 2, 3, 4, 5 y reiniciará, garantizando que todos sean vistos.

---
**Nota:** El sistema está optimizado para dispositivos móviles y escritorio, siguiendo los más altos estándares de accesibilidad y diseño moderno.

*Implementado por Antigravity AI.*
