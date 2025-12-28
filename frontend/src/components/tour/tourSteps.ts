// Definición de los pasos del tour para cada página/rol

export interface TourStep {
    id: string;
    target: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

// Tour COMPLETO para el Dashboard - Usuario Socio
export const dashboardSocioTour: TourStep[] = [
    {
        id: 'welcome',
        target: '[data-tour="header"]',
        title: '¡Bienvenido al Sistema! 🎉',
        content: 'Este es tu panel de control personal. Comencemos con un recorrido rápido por la navegación.',
        position: 'auto'
    },
    // --- SECCIÓN 1: BARRA LATERAL ---
    {
        id: 'sidebar',
        target: '[data-tour="sidebar-panel"], [data-tour="sidebar-trigger"]', // Ahora apunta a ambos
        title: '📌 Menú de Navegación',
        content: 'Esta barra lateral te acompañará siempre. Es tu centro de comando para moverte por el sistema.',
        position: 'bottom'
    },
    {
        id: 'mis-listas-nav',
        target: '[data-tour="nav-mis-listas"]',
        title: '👥 Módulo: Mis Listas',
        content: 'Este es el núcleo de tu gestión. Usa este botón para buscar socios y agregarlos a tu lista de trabajo.',
        position: 'auto'
    },
    {
        id: 'config-nav',
        target: '[data-tour="nav-config"]',
        title: '⚙️ Configuración',
        content: 'Aquí podrás personalizar tu perfil, cambiar tu contraseña y ver opciones de tu cuenta.',
        position: 'auto'
    },
    // --- SECCIÓN 2: CONTENIDO DEL DASHBOARD ---
    {
        id: 'stats',
        target: '[data-tour="stats-cards"]',
        title: '📊 Resumen en Tiempo Real',
        content: 'Ya en el Dashboard: Aquí ves tus números clave. Cuántos socios tienes, cuántos votan y cuántos llegaron.',
        position: 'auto'
    },
    {
        id: 'ratio',
        target: '[data-tour="ratio-card"]',
        title: '📈 Tu Meta de Asistencia',
        content: 'Este gráfico anillo se llenará a medida que tus socios asignados marquen su asistencia.',
        position: 'left'
    },
    {
        id: 'listas',
        target: '[data-tour="mis-listas"]',
        title: '📋 Vista Rápida',
        content: 'Finalmente, aquí abajo tienes un acceso directo a los detalles de tu lista de trabajo.',
        position: 'top'
    }
];

// Tour para el Dashboard - Super Admin
export const dashboardAdminTour: TourStep[] = [
    {
        id: 'welcome',
        target: '[data-tour="header"]',
        title: '¡Bienvenido Administrador! 👑',
        content: 'Este es el Centro de Control donde verás todas las métricas globales de la asamblea en tiempo real.',
        position: 'bottom'
    },
    {
        id: 'sidebar',
        target: '[data-tour="sidebar-panel"], [data-tour="sidebar-trigger"]',
        title: '📌 Panel de Navegación',
        content: 'Desde aquí accedes a todas las secciones: Dashboard, Socios, Usuarios, Importar padrón y más.',
        position: 'bottom'
    },
    {
        id: 'kpis',
        target: '[data-tour="kpis"]',
        title: '📊 Indicadores Clave',
        content: 'Aquí ves el total del padrón, habilitados con voz y voto, presentes y observados. Todo actualizado en vivo.',
        position: 'bottom'
    },
    {
        id: 'quorum',
        target: '[data-tour="quorum"]',
        title: '🎯 Progreso del Quórum',
        content: 'Esta barra te muestra cuánto falta para alcanzar el quórum legal (50%+1 del padrón).',
        position: 'bottom'
    },
    {
        id: 'ranking',
        target: '[data-tour="ranking"]',
        title: '🏆 Ranking Regional',
        content: 'Aquí ves el desempeño de cada sucursal ordenado. Monitorea cuáles tienen más participación.',
        position: 'left'
    }
];

// Tour para la página de Asignaciones / Mis Listas
export const asignacionesTour: TourStep[] = [
    {
        id: 'welcome',
        target: '[data-tour="asignaciones-header"]',
        title: '📋 Gestión de Socios',
        content: 'Aquí gestionarás tu lista de socios asignados. Podrás agregar, ver y administrar los socios que te corresponden.',
        position: 'bottom'
    },
    {
        id: 'search',
        target: '[data-tour="search-socio"]',
        title: '🔍 Buscador de Socios',
        content: 'Ingresa la cédula o número de socio para buscarlo. El sistema te mostrará la información antes de agregarlo a tu lista.',
        position: 'bottom'
    },
    {
        id: 'meta',
        target: '[data-tour="meta-indicator"]',
        title: '🎯 Tu Meta: 10 Socios',
        content: 'Te recomendamos agregar al menos 10 socios para una distribución efectiva del trabajo en equipo.',
        position: 'bottom'
    },
    {
        id: 'lista-socios',
        target: '[data-tour="socios-list"]',
        title: '👥 Tus Socios Asignados',
        content: 'Aquí aparecen los socios que vas agregando. Puedes ver si están presentes (verde) o ausentes (gris).',
        position: 'top'
    }
];

// Tour para la página de Importación (Solo Admin)
export const importarTour: TourStep[] = [
    {
        id: 'welcome',
        target: '[data-tour="importar-header"]',
        title: '📥 Importar Padrón',
        content: 'Aquí podrás cargar el archivo Excel con el padrón oficial de socios para la asamblea.',
        position: 'bottom'
    },
    {
        id: 'upload',
        target: '[data-tour="upload-zone"]',
        title: '📁 Zona de Carga',
        content: 'Arrastra tu archivo Excel aquí o haz clic para seleccionarlo. El sistema validará automáticamente el formato.',
        position: 'bottom'
    },
    {
        id: 'progress',
        target: '[data-tour="import-progress"]',
        title: '⏳ Progreso de Importación',
        content: 'Una vez iniciada la importación, verás el progreso en tiempo real con estadísticas detalladas.',
        position: 'top'
    }
];

// Tour para Configuración - Universal
export const configuracionTour: TourStep[] = [
    {
        id: 'welcome',
        target: '[data-tour="config-header"]',
        title: '⚙️ Tu Panel de Control',
        content: 'Aquí tienes el control total sobre tu cuenta personal. Mantén tus datos siempre actualizados.',
        position: 'bottom'
    },
    {
        id: 'profile',
        target: '[data-tour="config-profile"]',
        title: '� Perfil y Seguridad',
        content: 'En esta sección puedes actualizar tu foto, correo y contraseña. ¡La seguridad de tu cuenta es prioridad!',
        position: 'top'
    },
    {
        id: 'guide',
        target: '[data-tour="config-guide"]',
        title: '🎓 Centro de Ayuda',
        content: '¿Necesitas repasar algo? Si alguna vez te pierdes, usa este botón para Reiniciar la Guía Interactiva.',
        position: 'top'
    }
];
