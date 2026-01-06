-- ================================================================
-- OPTIMIZACIONES DE RENDIMIENTO - SISTEMA DE ASAMBLEAS
-- Fecha: 2026-01-06
-- Descripción: Índices para mejorar velocidad del Super Admin
-- ================================================================

-- Dashboard: Índice compuesto para consulta de Voz y Voto
CREATE INDEX IF NOT EXISTS idx_dashboard_vyv ON socios(
    aporte_al_dia, 
    solidaridad_al_dia, 
    fondo_al_dia, 
    incoop_al_dia, 
    credito_al_dia
);

-- Reportes: Índices para cruces entre tablas
CREATE INDEX IF NOT EXISTS idx_asig_socio ON asignaciones_socios(socio_id);
CREATE INDEX IF NOT EXISTS idx_asig_lista ON asignaciones_socios(lista_id);
CREATE INDEX IF NOT EXISTS idx_listas_user ON listas_asignacion(user_id);

-- Auditoría: Búsqueda rápida por fecha
CREATE INDEX IF NOT EXISTS idx_audit_created ON auditoria(created_at);

-- Asistencias: Filtros por fecha y asamblea
CREATE INDEX IF NOT EXISTS idx_asist_llegada ON asistencias(fecha_hora_llegada);
CREATE INDEX IF NOT EXISTS idx_asig_asamblea_id ON asignaciones(id_asamblea);

-- Comunicación: Avisos ordenados cronológicamente
CREATE INDEX IF NOT EXISTS idx_avisos_created ON avisos(created_at);

-- Gestión Operativa: Filtros de asambleas
CREATE INDEX IF NOT EXISTS idx_asambleas_fecha ON asambleas(fecha);
CREATE INDEX IF NOT EXISTS idx_asambleas_activo ON asambleas(activo);
