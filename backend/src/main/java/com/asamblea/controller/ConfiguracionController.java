package com.asamblea.controller;

import com.asamblea.service.ConfiguracionService;
import com.asamblea.service.TestModeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;

import java.util.Map;

@RestController
@RequestMapping("/api/configuracion")
public class ConfiguracionController {

    @Autowired
    private ConfiguracionService configuracionService;

    @Autowired
    private TestModeService testModeService;

    @Autowired
    private com.asamblea.service.LogAuditoriaService auditService;

    @GetMapping
    public ResponseEntity<Map<String, String>> obtenerConfiguracion() {
        return ResponseEntity.ok(configuracionService.obtenerTodas());
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> guardarConfiguracion(@RequestBody Map<String, String> configuraciones,
            Authentication auth, HttpServletRequest request) {
        configuraciones.forEach((k, v) -> {
            configuracionService.guardar(k, v);
            auditService.registrar(
                    "CONFIGURACION",
                    "CAMBIAR_PARAMETRO",
                    String.format("Cambió parámetro '%s' a '%s'", k, v),
                    auth != null ? auth.getName() : "SISTEMA",
                    request.getRemoteAddr());
        });
        return ResponseEntity.ok(configuracionService.obtenerTodas());
    }

    // ========== ENDPOINTS PARA MODO DE PRUEBA ==========

    @GetMapping("/test-mode/status")
    public ResponseEntity<Map<String, Object>> getTestModeStatus() {
        return ResponseEntity.ok(testModeService.getTestModeInfo());
    }

    @PostMapping("/test-mode/activate")
    public ResponseEntity<Map<String, Object>> activateTestMode(
            Authentication auth, HttpServletRequest request) {

        // Verificar que sea SUPER_ADMIN
        String username = auth != null ? auth.getName() : null;
        if (username == null || !isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "error", "Solo el Super Administrador puede activar el Modo de Prueba"));
        }

        Map<String, Object> result = testModeService.activarModoPrueba(username, request.getRemoteAddr());

        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping("/test-mode/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateTestMode(
            Authentication auth, HttpServletRequest request) {

        // Verificar que sea SUPER_ADMIN
        String username = auth != null ? auth.getName() : null;
        if (username == null || !isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "error", "Solo el Super Administrador puede desactivar el Modo de Prueba"));
        }

        Map<String, Object> result = testModeService.desactivarModoPrueba(username, request.getRemoteAddr());

        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    private boolean isSuperAdmin(Authentication auth) {
        if (auth == null)
            return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                        a.getAuthority().equals("SUPER_ADMIN"));
    }
}
