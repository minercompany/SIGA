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

    // Historial de importaciones
    @GetMapping("/import-history")
    public ResponseEntity<List<ImportacionHistorial>> getImportHistory() {
        return ResponseEntity.ok(importacionHistorialRepository.findTop10ByOrderByFechaImportacionDesc());
    }

    // Listar todos los socios con paginación
    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<com.asamblea.dto.SocioDTO>> listarTodos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        org.springframework.data.domain.Page<Socio> sociosPage = socioRepository.findAllWithSucursal(pageable);

        // Convertir a DTOs para GARANTIZAR que sucursal.nombre se serialice
        org.springframework.data.domain.Page<com.asamblea.dto.SocioDTO> dtoPage = sociosPage
                .map(com.asamblea.dto.SocioDTO::fromEntity);

        return ResponseEntity.ok(dtoPage);
    }

    // -------------------------------------------------------------------------
    // SEARCH ENDPOINT
    // -------------------------------------------------------------------------
    @GetMapping("/buscar")
    public ResponseEntity<List<Map<String, Object>>> buscar(@RequestParam String term) {
        String cleanTerm = term.trim();
        List<Socio> sociosEncontrados;

        List<Socio> exactos = socioRepository.buscarExacto(cleanTerm);
        if (!exactos.isEmpty()) {
            sociosEncontrados = exactos;
        } else {
            sociosEncontrados = socioRepository.buscarParcial(cleanTerm);
            if (sociosEncontrados.size() > 50) {
                sociosEncontrados = sociosEncontrados.subList(0, 50);
            }
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (Socio socio : sociosEncontrados) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", socio.getId());
            dto.put("nombreCompleto", socio.getNombreCompleto());
            dto.put("numeroSocio", socio.getNumeroSocio());
            dto.put("cedula", socio.getCedula());
            dto.put("aporteAlDia", socio.isAporteAlDia());
            dto.put("solidaridadAlDia", socio.isSolidaridadAlDia());
            dto.put("fondoAlDia", socio.isFondoAlDia());
            dto.put("incoopAlDia", socio.isIncoopAlDia());
            dto.put("creditoAlDia", socio.isCreditoAlDia());
            dto.put("vozYVoto", socio.isEstadoVozVoto());
            dto.put("yaAsignado", false);
            response.add(dto);
        }
        return ResponseEntity.ok(response);
    }

    // Obtener un socio por ID
    @GetMapping("/{id}")
    public ResponseEntity<Socio> obtenerPorId(@PathVariable Long id) {
        return socioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------------------------------------------------------------
    // UPDATE STATUS ENDPOINT
    // -------------------------------------------------------------------------
    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Long id, @RequestBody Map<String, Boolean> updates,
            Authentication auth, HttpServletRequest request) {
        return socioRepository.findById(id).map(socio -> {
            if (updates.containsKey("aporteAlDia"))
                socio.setAporteAlDia(updates.get("aporteAlDia"));
            if (updates.containsKey("solidaridadAlDia"))
                socio.setSolidaridadAlDia(updates.get("solidaridadAlDia"));
            if (updates.containsKey("fondoAlDia"))
                socio.setFondoAlDia(updates.get("fondoAlDia"));
            if (updates.containsKey("incoopAlDia"))
                socio.setIncoopAlDia(updates.get("incoopAlDia"));
            if (updates.containsKey("creditoAlDia"))
                socio.setCreditoAlDia(updates.get("creditoAlDia"));
            socioRepository.save(socio);
            return ResponseEntity.ok(Map.of("message", "Estado actualizado correctamente", "socio", socio));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Estadísticas generales del padrón
    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> estadisticas() {
        long total = socioRepository.count();
        long conVozYVoto = socioRepository.countConVozYVoto();
        long soloVoz = socioRepository.countSoloVoz();
        long presentes = asistenciaRepository.count();
        long presentesVyV = asistenciaRepository.countByEstadoVozVoto(true);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPadron", total);
        stats.put("conVozYVoto", conVozYVoto);
        stats.put("soloVoz", soloVoz);
        stats.put("presentes", presentes);
        stats.put("presentesVyV", presentesVyV);
        return ResponseEntity.ok(stats);
    }

    // Estadísticas por sucursal
    @GetMapping("/estadisticas/por-sucursal")
    public ResponseEntity<List<Map<String, Object>>> estadisticasPorSucursal() {
        List<Sucursal> sucursales = sucursalRepository.findAllByOrderByCodigoAsc();
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Sucursal suc : sucursales) {
            Map<String, Object> item = new HashMap<>();
            long padron = socioRepository.countBySucursalId(suc.getId());
            long conVozYVoto = socioRepository.countConVozYVotoBySucursalId(suc.getId());
            long presentes = asistenciaRepository.countBySucursalId(suc.getId());
            double ratio = padron > 0 ? ((double) presentes / padron) * 100 : 0;

            item.put("sucursalId", suc.getId());
            item.put("sucursal",
                    suc.getNombre() != null ? suc.getNombre().toUpperCase() : "SIN NOMBRE (" + suc.getId() + ")");
            item.put("padron", padron);
            item.put("presentes", presentes);
            item.put("vozVoto", conVozYVoto);
            item.put("ratio", Math.round(ratio * 10.0) / 10.0);
            resultado.add(item);
        }
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/stats-globales")
    public ResponseEntity<Map<String, Object>> statsGlobales() {
        long totalHabilitados = socioRepository.countConVozYVoto();
        long presentesGlobal = asistenciaRepository.countByEstadoVozVoto(true);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalHabilitados", totalHabilitados);
        stats.put("presentesGlobal", presentesGlobal);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/buscar-exacto")
    public ResponseEntity<?> buscarSocio(@RequestParam String term) {
        Optional<Socio> socioOpt = socioRepository.findByNumeroSocio(term);
        if (socioOpt.isEmpty()) {
            socioOpt = socioRepository.findByCedula(term);
        }

        if (socioOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Socio no encontrado"));
        }

        Socio socio = socioOpt.get();
        boolean asistenciaConfirmada = asistenciaRepository.existsBySocioId(socio.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("id", socio.getId());
        response.put("numeroSocio", socio.getNumeroSocio());
        response.put("cedula", socio.getCedula());
        response.put("nombreCompleto", socio.getNombreCompleto());
        response.put("telefono", socio.getTelefono());
        response.put("sucursal", socio.getSucursal());
        response.put("aporteAlDia", socio.isAporteAlDia());
        response.put("solidaridadAlDia", socio.isSolidaridadAlDia());
        response.put("fondoAlDia", socio.isFondoAlDia());
        response.put("incoopAlDia", socio.isIncoopAlDia());
        response.put("creditoAlDia", socio.isCreditoAlDia());
        response.put("asistenciaConfirmada", asistenciaConfirmada);

        boolean conVozYVoto = socio.isAporteAlDia() && socio.isSolidaridadAlDia() &&
                socio.isFondoAlDia() && socio.isIncoopAlDia() && socio.isCreditoAlDia();
        response.put("conVozYVoto", conVozYVoto);
        return ResponseEntity.ok(response);
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
