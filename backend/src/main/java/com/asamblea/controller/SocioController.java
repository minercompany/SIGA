package com.asamblea.controller;

import com.asamblea.model.ImportacionHistorial;
import com.asamblea.model.Socio;
import com.asamblea.model.Sucursal;
import com.asamblea.repository.AsignacionRepository;
import com.asamblea.repository.AsistenciaRepository;
import com.asamblea.repository.ImportacionHistorialRepository;
import com.asamblea.repository.ListaAsignacionRepository;
import com.asamblea.repository.SocioRepository;
import com.asamblea.repository.SucursalRepository;
import com.asamblea.service.ImportacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;

import java.util.*;

@RestController
@RequestMapping("/api/socios")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SocioController {

    private final ImportacionService importacionService;
    private final SocioRepository socioRepository;
    private final SucursalRepository sucursalRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final ImportacionHistorialRepository importacionHistorialRepository;
    private final AsignacionRepository asignacionRepository;
    private final ListaAsignacionRepository listaAsignacionRepository;
    private final com.asamblea.service.LogAuditoriaService auditService;
    private final com.asamblea.repository.UsuarioRepository usuarioRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @PostMapping("/import")
    public ResponseEntity<?> importExcel(@RequestParam("file") MultipartFile file, Authentication auth) {
        try {
            // Inicia el proceso asincrono y retorna un ID
            String username = auth != null ? auth.getName() : "SISTEMA";
            String processId = importacionService.iniciarImportacion(file, username);
            return ResponseEntity.ok(Map.of("processId", processId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/import-progress/{id}")
    public ResponseEntity<?> checkImportProgress(@PathVariable String id) {
        return ResponseEntity.ok(importacionService.getStatus(id));
    }

    @PostMapping("/import/cancel/{id}")
    public ResponseEntity<?> cancelImport(@PathVariable String id) {
        importacionService.cancelarImportacion(id);
        return ResponseEntity.ok(Map.of("message", "Cancelación solicitada"));
    }

    // -------------------------------------------------------------------------
    // SEARCH ENDPOINT
    // -------------------------------------------------------------------------
    @GetMapping("/buscar")
    public ResponseEntity<List<Map<String, Object>>> buscar(@RequestParam String term) {
        // Limpiar término de búsqueda
        String cleanTerm = term.trim();
        List<Socio> sociosEncontrados;

        // Primero buscar coincidencia exacta
        List<Socio> exactos = socioRepository.buscarExacto(cleanTerm);
        if (!exactos.isEmpty()) {
            sociosEncontrados = exactos;
        } else {
            // Si no hay exacto, buscar parcial (limitado a 50 resultados)
            sociosEncontrados = socioRepository.buscarParcial(cleanTerm);
            if (sociosEncontrados.size() > 50) {
                sociosEncontrados = sociosEncontrados.subList(0, 50);
            }
        }

        // Construir respuesta enriquecida
        List<Map<String, Object>> response = new ArrayList<>();
        for (Socio socio : sociosEncontrados) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", socio.getId());
            dto.put("nombreCompleto", socio.getNombreCompleto());
            dto.put("numeroSocio", socio.getNumeroSocio());
            dto.put("cedula", socio.getCedula());

            // Campos de estado individuales para el frontend
            dto.put("aporteAlDia", socio.isAporteAlDia());
            dto.put("solidaridadAlDia", socio.isSolidaridadAlDia());
            dto.put("fondoAlDia", socio.isFondoAlDia());
            dto.put("incoopAlDia", socio.isIncoopAlDia());
            dto.put("creditoAlDia", socio.isCreditoAlDia());
            dto.put("vozYVoto", socio.isEstadoVozVoto());

            dto.put("yaAsignado", false); // Simplificado para evitar más errores

            response.add(dto);
        }

        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------------------------
    // UPDATE STATUS ENDPOINT
    // -------------------------------------------------------------------------
    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Long id, @RequestBody Map<String, Boolean> updates) {
        return socioRepository.findById(id).map(s -> {
            if (updates.containsKey("aporteAlDia"))
                s.setAporteAlDia(updates.get("aporteAlDia"));
            if (updates.containsKey("solidaridadAlDia"))
                s.setSolidaridadAlDia(updates.get("solidaridadAlDia"));
            if (updates.containsKey("fondoAlDia"))
                s.setFondoAlDia(updates.get("fondoAlDia"));
            if (updates.containsKey("incoopAlDia"))
                s.setIncoopAlDia(updates.get("incoopAlDia"));
            if (updates.containsKey("creditoAlDia"))
                s.setCreditoAlDia(updates.get("creditoAlDia"));
            socioRepository.save(s);
            return ResponseEntity.ok(s);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Reset completo del padrón - Elimina todos los datos
     * CUIDADO: Esta acción es irreversible
     */
    @Transactional
    @PostMapping("/reset-padron")
    public ResponseEntity<?> resetPadron(@RequestBody Map<String, Boolean> options, Authentication auth,
            HttpServletRequest request) {
        System.out.println("========================================");
        System.out.println("🎛️ GRANULAR RESET (STRICT MODE) CALLED");
        System.out.println("Options: " + options);
        System.out.println("========================================");

        try {
            boolean borrarAsistencias = options.getOrDefault("asistencias", false);
            boolean borrarAsignaciones = options.getOrDefault("asignaciones", false);
            boolean borrarListas = options.getOrDefault("listas", false);
            boolean borrarSocios = options.getOrDefault("socios", false);
            boolean borrarUsuarios = options.getOrDefault("usuarios", false);
            boolean borrarImportaciones = options.getOrDefault("importaciones", false);

            Map<String, Long> deletedCounts = new HashMap<>();

            // =================================================================================
            // PASO 0: DESVINCULACIÓN TOTAL (Prepara el terreno - "Clean Users First")
            // =================================================================================
            // El usuario pidió: "elimina primero los usuarios registrados o socios
            // registrados por el admin"
            // Esto significa ROMPER VINCULOS.

            // 0.1 Limpiar referencias de TODOS los usuarios (incluido Admin)
            List<com.asamblea.model.Usuario> allUsuarios = usuarioRepository.findAll();
            for (com.asamblea.model.Usuario u : allUsuarios) {
                boolean changed = false;
                if (u.getIdSocio() != null) {
                    u.setIdSocio(null);
                    changed = true;
                }
                if (u.getSucursal() != null) {
                    u.setSucursal(null);
                    changed = true;
                }
                if (changed)
                    usuarioRepository.save(u);
            }
            usuarioRepository.flush(); // Commit inmediato de desvinculación

            // =================================================================================
            // PASO 1: ELIMINACIÓN EN CASCADA MANUAL (Strict Order)
            // =================================================================================

            // 1.1 Asistencias (No dependen de nadie, borrar primero para limpiar referencia
            // a socio)
            if (borrarAsistencias) {
                jdbcTemplate.execute("DELETE FROM asistencias"); // Más rápido que JPA delete all
                deletedCounts.put("asistencias", -1L);
            }

            // 1.2 Listas y Asignaciones (Interdependientes)
            if (borrarListas || borrarAsignaciones) {
                // Primero el detalle (Asignaciones)
                jdbcTemplate.execute("DELETE FROM asignaciones_socios");
                deletedCounts.put("asignaciones", -1L);

                // Luego la cabecera (Listas)
                if (borrarListas) {
                    jdbcTemplate.execute("DELETE FROM listas_asignacion");
                    deletedCounts.put("listas", -1L);
                }
            }

            // 1.3 Historial (Aislado)
            if (borrarImportaciones) {
                jdbcTemplate.execute("DELETE FROM importaciones_historial");
                deletedCounts.put("importaciones", -1L);
            }

            // 1.4 Socios (Ahora que no hay asistencias, asignaciones, ni usuarios
            // apuntándoles)
            if (borrarSocios) {
                jdbcTemplate.execute("DELETE FROM socios");
                deletedCounts.put("socios", -1L);
            }

            // 1.5 Usuarios (Operadores)
            if (borrarUsuarios) {
                // Borrar todos MENOS los Super Admin
                jdbcTemplate.update("DELETE FROM usuarios WHERE rol != 'SUPER_ADMIN'");
                deletedCounts.put("usuarios", -1L);
            }

            System.out.println("✅ Strict Reset Completed!");

            auditService.registrar(
                    "SOCIOS",
                    "RESET_GRANULAR",
                    "Reinicio granular (STRICT_PROCESS). Options: " + options.toString(),
                    auth != null ? auth.getName() : "SYSTEM",
                    request.getRemoteAddr());

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Limpieza completada exitosamente.");
            result.put("eliminados", deletedCounts);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("❌ Error en reset: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Server Error: " + e.getMessage()));
        }
    }
}
