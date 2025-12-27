package com.asamblea.controller;

import com.asamblea.service.ConfiguracionService;
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
}
