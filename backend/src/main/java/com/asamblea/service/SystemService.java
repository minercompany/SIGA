package com.asamblea.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Transactional
    public void resetAllData() {
        // Desactivar restricciones de llaves foráneas para poder truncar
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");

        // Truncar tablas de datos (No truncamos usuarios ni sucursales para no perder
        // acceso ni estructura base)
        jdbcTemplate.execute("TRUNCATE TABLE asistencias");
        jdbcTemplate.execute("TRUNCATE TABLE asignaciones_socios");
        jdbcTemplate.execute("TRUNCATE TABLE socios");
        jdbcTemplate.execute("TRUNCATE TABLE auditoria");

        // También podemos resetear asambleas si se desea un reinicio total
        // jdbcTemplate.execute("TRUNCATE TABLE asambleas");

        // Reactivar restricciones
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
    }

    @Transactional
    public void resetFullSystem() {
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");

        // Reinicio total incluyendo usuarios y sucursales
        jdbcTemplate.execute("TRUNCATE TABLE asistencias");
        jdbcTemplate.execute("TRUNCATE TABLE asignaciones_socios");
        jdbcTemplate.execute("TRUNCATE TABLE socios");
        jdbcTemplate.execute("TRUNCATE TABLE auditoria");
        jdbcTemplate.execute("TRUNCATE TABLE usuarios");
        jdbcTemplate.execute("TRUNCATE TABLE sucursales");
        jdbcTemplate.execute("TRUNCATE TABLE asambleas");
        jdbcTemplate.execute("TRUNCATE TABLE configuracion");

        // Insertar datos base mínimos para que el sistema sea usable
        jdbcTemplate.execute(
                "INSERT INTO sucursales (codigo, nombre, ciudad) VALUES ('CC', 'Casa Central', 'Ciudad del Este')");
        jdbcTemplate.execute("INSERT INTO usuarios (username, password_hash, nombre_completo, rol, activo) " +
                "VALUES ('admin', '$2a$12$R9h/lIPzHZ.3PzWz.f2OAu3/i9dY6jYyW.yqQzq9v5o8n.T.y7y.W', 'Super Administrador', 'SUPER_ADMIN', TRUE)");

        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
    }
}
