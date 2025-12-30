package com.asamblea.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para manejar el Modo de Prueba del sistema.
 * Permite crear snapshots de las tablas críticas y restaurarlas al desactivar
 * el modo.
 */
@Service
public class TestModeService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ConfiguracionService configuracionService;

    @Autowired
    private LogAuditoriaService logAuditoriaService;

    // Tablas que se van a respaldar (en orden de dependencia para FK)
    private static final String[] BACKUP_TABLES = {
            "asistencias",
            "asignaciones",
            "socios",
            "listas",
            "usuarios",
            "importacion_historial",
            "auditoria"
    };

    // Orden inverso para restaurar (primero las dependientes)
    private static final String[] RESTORE_ORDER = {
            "auditoria",
            "importacion_historial",
            "usuarios",
            "listas",
            "socios",
            "asignaciones",
            "asistencias"
    };

    /**
     * Verifica si el Modo de Prueba está activo.
     */
    public boolean isTestModeActive() {
        String value = configuracionService.obtener("MODO_PRUEBA", "false");
        return "true".equalsIgnoreCase(value);
    }

    /**
     * Obtiene información del snapshot activo.
     */
    public Map<String, Object> getTestModeInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("active", isTestModeActive());

        if (isTestModeActive()) {
            String activatedAt = configuracionService.obtener("MODO_PRUEBA_ACTIVADO_EN", null);
            String activatedBy = configuracionService.obtener("MODO_PRUEBA_ACTIVADO_POR", "Desconocido");
            info.put("activatedAt", activatedAt);
            info.put("activatedBy", activatedBy);

            // Contar registros en backup para mostrar tamaño
            try {
                Long backupSocios = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM _backup_socios", Long.class);
                info.put("backupSocios", backupSocios);
            } catch (Exception e) {
                info.put("backupSocios", 0);
            }
        }

        return info;
    }

    /**
     * Activa el Modo de Prueba creando snapshots de las tablas críticas.
     */
    @Transactional
    public Map<String, Object> activarModoPrueba(String usuarioActivador, String ip) {
        Map<String, Object> result = new HashMap<>();

        // Verificar que no esté ya activo
        if (isTestModeActive()) {
            result.put("success", false);
            result.put("error", "El Modo de Prueba ya está activo");
            return result;
        }

        try {
            // Deshabilitar verificación de claves foráneas temporalmente
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");

            // Crear tablas de backup y copiar datos
            for (String table : BACKUP_TABLES) {
                String backupTable = "_backup_" + table;

                // Eliminar tabla de backup si existe
                jdbcTemplate.execute("DROP TABLE IF EXISTS " + backupTable);

                // Crear tabla de backup con la misma estructura y copiar datos
                jdbcTemplate.execute("CREATE TABLE " + backupTable + " LIKE " + table);
                jdbcTemplate.execute("INSERT INTO " + backupTable + " SELECT * FROM " + table);
            }

            // Reactivar verificación de claves foráneas
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");

            // Guardar configuración
            configuracionService.guardar("MODO_PRUEBA", "true");
            configuracionService.guardar("MODO_PRUEBA_ACTIVADO_EN", LocalDateTime.now().toString());
            configuracionService.guardar("MODO_PRUEBA_ACTIVADO_POR", usuarioActivador);

            // Registrar en auditoría
            logAuditoriaService.registrar(
                    "SISTEMA",
                    "MODO_PRUEBA_ACTIVADO",
                    "Se activó el Modo de Prueba. Snapshot creado de " + BACKUP_TABLES.length + " tablas.",
                    usuarioActivador,
                    ip);

            result.put("success", true);
            result.put("message",
                    "Modo de Prueba activado. Se creó un snapshot de " + BACKUP_TABLES.length + " tablas.");
            result.put("tablesBackedUp", BACKUP_TABLES.length);

        } catch (Exception e) {
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
            result.put("success", false);
            result.put("error", "Error al crear snapshot: " + e.getMessage());
        }

        return result;
    }

    /**
     * Desactiva el Modo de Prueba restaurando los datos originales desde el
     * snapshot.
     */
    @Transactional
    public Map<String, Object> desactivarModoPrueba(String usuarioDesactivador, String ip) {
        Map<String, Object> result = new HashMap<>();

        // Verificar que esté activo
        if (!isTestModeActive()) {
            result.put("success", false);
            result.put("error", "El Modo de Prueba no está activo");
            return result;
        }

        try {
            // Deshabilitar verificación de claves foráneas temporalmente
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");

            // Restaurar cada tabla desde el backup
            for (String table : RESTORE_ORDER) {
                String backupTable = "_backup_" + table;

                // Verificar que exista el backup
                try {
                    jdbcTemplate.queryForObject("SELECT 1 FROM " + backupTable + " LIMIT 1", Integer.class);
                } catch (Exception e) {
                    // Si no existe la tabla de backup, continuar con la siguiente
                    continue;
                }

                // Vaciar tabla actual
                jdbcTemplate.execute("TRUNCATE TABLE " + table);

                // Restaurar desde backup
                jdbcTemplate.execute("INSERT INTO " + table + " SELECT * FROM " + backupTable);

                // Eliminar tabla de backup
                jdbcTemplate.execute("DROP TABLE IF EXISTS " + backupTable);
            }

            // Reactivar verificación de claves foráneas
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");

            // Guardar configuración
            configuracionService.guardar("MODO_PRUEBA", "false");
            configuracionService.guardar("MODO_PRUEBA_ACTIVADO_EN", null);
            configuracionService.guardar("MODO_PRUEBA_ACTIVADO_POR", null);

            // Registrar en auditoría (esto se hará en la tabla restaurada)
            logAuditoriaService.registrar(
                    "SISTEMA",
                    "MODO_PRUEBA_DESACTIVADO",
                    "Se desactivó el Modo de Prueba. Datos originales restaurados.",
                    usuarioDesactivador,
                    ip);

            result.put("success", true);
            result.put("message", "Modo de Prueba desactivado. Datos originales restaurados exitosamente.");

        } catch (Exception e) {
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
            result.put("success", false);
            result.put("error", "Error al restaurar datos: " + e.getMessage());
        }

        return result;
    }

    /**
     * Limpia las tablas de backup sin restaurar (para casos de emergencia).
     */
    @Transactional
    public void limpiarBackups() {
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        for (String table : BACKUP_TABLES) {
            jdbcTemplate.execute("DROP TABLE IF EXISTS _backup_" + table);
        }
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");

        configuracionService.guardar("MODO_PRUEBA", "false");
        configuracionService.guardar("MODO_PRUEBA_ACTIVADO_EN", null);
        configuracionService.guardar("MODO_PRUEBA_ACTIVADO_POR", null);
    }
}
