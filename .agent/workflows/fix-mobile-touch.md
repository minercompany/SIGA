---
description: Plan de corrección de eventos táctiles para móvil web
---

# 📱 Plan de Implementación: Fix Mobile Touch Events

## Objetivo
Corregir las funcionalidades que no responden en la versión web móvil (navegador móvil) pero funcionan correctamente en PC.

## Problema Raíz
Los eventos `onClick` en componentes Framer Motion y elementos con estilos `hover` no funcionan correctamente en dispositivos táctiles.

---

## 🎯 Archivos a Modificar

### Fase 1: Dashboard Admin (Prioridad Alta)
**Archivo:** `frontend/src/components/dashboard/AdminDashboard.tsx`

| Componente | Problema | Solución |
|------------|----------|----------|
| Card "Online" (línea ~373-415) | `onClick` no responde en móvil | Cambiar a `onTap` + agregar `role="button"` |
| Card "Usuales" (línea ~418-454) | `onClick` no responde | Cambiar a `onTap` + agregar `role="button"` |
| Card "Total" (línea ~457-493) | `onClick` no responde | Cambiar a `onTap` + agregar `role="button"` |
| Card "0 Registros" (línea ~496-533) | `onClick` no responde | Cambiar a `onTap` + agregar `role="button"` |
| Botón Auto-Sync | Ya usa `onTap` ✅ | Sin cambios |

### Fase 2: Gestión de Usuarios (Prioridad Alta)
**Archivo:** `frontend/src/app/(private)/usuarios/page.tsx`

| Componente | Problema | Solución |
|------------|----------|----------|
| UserCard botones (línea ~560-600) | Botones pequeños, difícil tap | Aumentar área táctil mínima a 44px |
| Cards de roles (línea ~720-745) | `onClick` en `<button>` con animaciones | Añadir `touch-action: manipulation` |
| Botones Editar/Eliminar tabla | `opacity-60` confunde en móvil | Cambiar a `opacity-80` mínimo |

### Fase 3: CSS Global (Mejora General)
**Archivo:** `frontend/src/app/globals.css`

| Mejora | Descripción |
|--------|-------------|
| Touch targets | Clase utilitaria para áreas táctiles mínimas |
| Touch feedback | Mejorar feedback visual en tap |

---

## 📋 Checklist de Implementación

// turbo-all

1. Modificar AdminDashboard.tsx - Cards estadísticas con onTap
2. Modificar AdminDashboard.tsx - Agregar role="button" y tabIndex
3. Modificar usuarios/page.tsx - UserCard con mejores touch targets
4. Modificar usuarios/page.tsx - Botones con opacity mejorada
5. Agregar CSS global para touch improvements
6. Reiniciar frontend para aplicar cambios
7. Probar en navegador móvil

---

## 🔧 Cambios Técnicos Detallados

### Patrón de Corrección para Framer Motion:

**Antes (no funciona en móvil):**
```tsx
<motion.div
    whileHover={{ scale: 1.03 }}
    onClick={() => doSomething()}
    className="..."
>
```

**Después (funciona en móvil):**
```tsx
<motion.div
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.98 }}
    onTap={() => doSomething()}
    role="button"
    tabIndex={0}
    className="... cursor-pointer select-none touch-manipulation"
>
```

### CSS a agregar:
```css
.touch-manipulation {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}

.min-touch-target {
    min-height: 44px;
    min-width: 44px;
}
```

---

## ⏱️ Tiempo Estimado
- Fase 1 (Dashboard): 10 minutos
- Fase 2 (Usuarios): 10 minutos  
- Fase 3 (CSS): 5 minutos
- Testing: 5 minutos

**Total: ~30 minutos**
