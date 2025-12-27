package com.asamblea.controller;

import com.asamblea.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/public/reset")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PublicController {

    private final SocioRepository socioRepository;

    private final AsistenciaRepository asistenciaRepository;
    private final AsignacionRepository asignacionRepository;
    private final ListaAsignacionRepository listaAsignacionRepository;
    private final ImportacionHistorialRepository importacionHistorialRepository;
    private final LogAuditoriaRepository logAuditoriaRepository;
    private final JdbcTemplate jdbcTemplate;

    @RequestMapping(value = "/fix-audit", method = { RequestMethod.GET, RequestMethod.POST })
    @Transactional
    public ResponseEntity<?> fixAuditTable(@RequestParam(required = false) String code) {
        if (!"226118".equals(code)) {
            return ResponseEntity.status(403).body(Map.of("error", "Código inválido"));
        }

        try {
            System.out.println(">>> FORZANDO DROP DE TABLA AUDITORIA");
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
            jdbcTemplate.execute("DROP TABLE IF EXISTS auditoria");
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
            System.out.println(">>> TABLA AUDITORIA ELIMINADA - REINICIA EL BACKEND");
            return ResponseEntity
                    .ok(Map.of("success", true, "message", "Tabla auditoria eliminada. Reinicia el backend."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @RequestMapping(value = "/all", method = { RequestMethod.GET, RequestMethod.POST })
    @Transactional
    public ResponseEntity<?> resetAll(@RequestParam(required = false) String code) {

        System.out.println(">>> EJECUTANDO RESET COMPLETO");

        if (!"226118".equals(code)) {
            return ResponseEntity.status(403).body(Map.of("error", "Código inválido"));
        }

        try {
            // ORDEN CRÍTICO PARA EVITAR CONSTRAINT ERRORS
            System.out.println("Eliminando Asistencias...");
            asistenciaRepository.deleteAllInBatch();

            System.out.println("Eliminando Asignaciones...");
            asignacionRepository.deleteAllInBatch();

            System.out.println("Eliminando Listas...");
            listaAsignacionRepository.deleteAllInBatch();

            System.out.println("Eliminando Historial...");
            importacionHistorialRepository.deleteAllInBatch();

            System.out.println("Eliminando Socios...");
            socioRepository.deleteAllInBatch();

            System.out.println("Eliminando Auditoría...");
            logAuditoriaRepository.deleteAllInBatch();

            // NO eliminamos sucursales ya que son base
            // System.out.println("Eliminando Sucursales...");
            // sucursalRepository.deleteAllInBatch();

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Sistema reiniciado correctamente (incluyendo auditoría)");

            System.out.println(">>> RESET COMPLETADO");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("ERROR EN RESET: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error en BD: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/clean-override-audit", method = { RequestMethod.GET, RequestMethod.POST })
    @Transactional
    public ResponseEntity<?> cleanOverrideAudit(@RequestParam(required = false) String code) {
        if (!"226118".equals(code)) {
            return ResponseEntity.status(403).body(Map.of("error", "Código inválido"));
        }

        try {
            System.out.println(">>> LIMPIANDO REGISTROS DE OVERRIDE_ESTADO");
            int deleted = jdbcTemplate.update("DELETE FROM auditoria WHERE accion = 'OVERRIDE_ESTADO'");
            System.out.println(">>> " + deleted + " REGISTROS ELIMINADOS");
            return ResponseEntity.ok(Map.of("success", true, "message", "Registros eliminados: " + deleted));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
