package com.asamblea.controller;

import com.asamblea.service.SystemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
@CrossOrigin(origins = "*") // Ajustar según sea necesario
public class SystemController {

    @Autowired
    private SystemService systemService;

    @PostMapping("/reset-data")
    public ResponseEntity<?> resetData(@RequestBody Map<String, String> request) {
        // En una implementación real, aquí validaríamos una contraseña maestra de Super
        // Admin
        String confirm = request.get("confirm");
        if (!"REINICIAR_TODO_EL_PADRON".equals(confirm)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Confirmación incorrecta"));
        }

        systemService.resetAllData();
        return ResponseEntity.ok(Map.of("message",
                "Todos los datos de socios, asignaciones y asistencias han sido borrados. Sistema listo para padrón final."));
    }

    @PostMapping("/factory-reset")
    public ResponseEntity<?> factoryReset(@RequestBody Map<String, String> request) {
        String confirm = request.get("confirm");
        if (!"RESETEO_TOTAL_DE_FABRICA".equals(confirm)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Confirmación incorrecta"));
        }

        systemService.resetFullSystem();
        return ResponseEntity.ok(Map.of("message", "El sistema ha sido reseteado a su estado inicial de fábrica."));
    }
}
