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
    public ResponseEntity<Page<Socio>> listarTodos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // El ordenamiento numérico ya está definido en la query con CAST
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(socioRepository.findAllWithSucursal(pageable));
    }

    // Buscar socios - ahora incluye estado de asignación
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
            dto.put("vozYVoto", socio.isEstadoVozVoto());

            try {
                // Verificar si ya está asignado (Usando consulta optimizada con JOIN FETCH)
                var asignacionOpt = asignacionRepository.findBySocioIdWithDetails(socio.getId());
                if (asignacionOpt.isPresent()) {
                    var asignacion = asignacionOpt.get();
                    dto.put("yaAsignado", true);

                    // Protección contra NullPointerException
                    var lista = asignacion.getListaAsignacion();
                    if (lista != null) {
                        dto.put("asignadoA", lista.getNombre() != null ? lista.getNombre() : "Sin nombre");

                        if (lista.getUsuario() != null) {
                            dto.put("asignadoAUsuario", lista.getUsuario().getNombreCompleto());
                        } else {
                            dto.put("asignadoAUsuario", "Usuario eliminado");
                        }
                    } else {
                        dto.put("asignadoA", "Lista desconocida");
                        dto.put("asignadoAUsuario", "N/A");
                    }

                    dto.put("fechaAsignacion", asignacion.getFechaAsignacion());
                } else {
                    dto.put("yaAsignado", false);
                }
            } catch (Exception e) {
                System.err.println("ERROR BUSCANDO ASIGNACION PARA SOCIO ID " + socio.getId());
                e.printStackTrace();
                // En caso de error, asumimos no asignado para no romper la UI
                dto.put("yaAsignado", false);
                dto.put("errorCarga", true);
            }

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

    // Actualizar manualmente el estado de un socio (Master Override)
    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Long id, @RequestBody Map<String, Boolean> updates,
            Authentication auth, HttpServletRequest request) {
        return socioRepository.findById(id).map(socio -> {
            StringBuilder sb = new StringBuilder();
            sb.append("Override manual de estado: ");
            if (updates.containsKey("aporteAlDia")) {
                socio.setAporteAlDia(updates.get("aporteAlDia"));
                sb.append("Aportes=").append(updates.get("aporteAlDia")).append(", ");
            }
            if (updates.containsKey("solidaridadAlDia")) {
                socio.setSolidaridadAlDia(updates.get("solidaridadAlDia"));
                sb.append("Solidaridad=").append(updates.get("solidaridadAlDia")).append(", ");
            }
            if (updates.containsKey("fondoAlDia")) {
                socio.setFondoAlDia(updates.get("fondoAlDia"));
                sb.append("Fondo=").append(updates.get("fondoAlDia")).append(", ");
            }
            if (updates.containsKey("incoopAlDia")) {
                socio.setIncoopAlDia(updates.get("incoopAlDia"));
                sb.append("Incoop=").append(updates.get("incoopAlDia")).append(", ");
            }
            if (updates.containsKey("creditoAlDia")) {
                socio.setCreditoAlDia(updates.get("creditoAlDia"));
                sb.append("Crédito=").append(updates.get("creditoAlDia")).append(", ");
            }

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

        // Contar presentes del día
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

    // Estadísticas por sucursal (para la tabla "Desempeño Regional")
    @GetMapping("/estadisticas/por-sucursal")
    public ResponseEntity<List<Map<String, Object>>> estadisticasPorSucursal() {
        List<Sucursal> sucursales = sucursalRepository.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Sucursal suc : sucursales) {
            Map<String, Object> item = new HashMap<>();
            long padron = socioRepository.countBySucursalId(suc.getId());
            long conVozYVoto = socioRepository.countConVozYVotoBySucursalId(suc.getId());
            long presentes = asistenciaRepository.countBySucursalId(suc.getId());
            double ratio = padron > 0 ? ((double) presentes / padron) * 100 : 0;

            item.put("sucursalId", suc.getId());
            item.put("sucursal", suc.getNombre().toUpperCase());
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
        // Total de socios habilitados (con voz y voto)
        long totalHabilitados = socioRepository.countConVozYVoto();
        // Total de presentes con voz y voto
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

        // Crear respuesta con datos del socio + estado de asistencia
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
    public ResponseEntity<?> resetPadron(Authentication auth, HttpServletRequest request) {
        System.out.println("========================================");
        System.out.println("🔴 RESET-PADRON ENDPOINT CALLED!");
        System.out.println("========================================");
        try {
            System.out.println("🗑️ Iniciando reset completo del padrón...");

            // 1. LIMPIEZA DE AUDITORÍA Y REGISTROS
            // Borramos auditoría vieja primero para evitar problemas raros

            // logAuditoriaRepository.deleteAll(); // Opcional: Descomentar si se quiere
            // borrar auditoría histórica

            // 2. DEPENDENCIAS DE NEGOCIO (Hijos)
            long asistenciasCount = asistenciaRepository.count();
            asistenciaRepository.deleteAll();

            asignacionRepository.deleteAll();

            listaAsignacionRepository.deleteAll();

            importacionHistorialRepository.deleteAll();

            // 3. USUARIOS (Para liberar Sucursales) - NOTA: Funcionarios se preservan
            // funcionarioDirectivoRepository.deleteAll(); // SE CONSERVAN PARA FUTURAS
            // IMPORTACIONES

            List<com.asamblea.model.Usuario> usuarios = usuarioRepository.findAll();
            long usuariosEliminados = 0;
            for (com.asamblea.model.Usuario u : usuarios) {
                if (u.getRol() == com.asamblea.model.Usuario.Rol.SUPER_ADMIN) {
                    // AL ADMIN: Desvincular de sucursal para poder borrarla
                    if (u.getSucursal() != null) {
                        u.setSucursal(null);
                        usuarioRepository.save(u);
                    }
                    continue;
                }
                usuarioRepository.delete(u);
                usuariosEliminados++;
            }
            // Forzar flush para que la BD libere las FK de usuarios hacia sucursales
            usuarioRepository.flush();

            // 4. SOCIOS (Para liberar Sucursales)
            long sociosCount = socioRepository.count();
            socioRepository.deleteAll();

            // 5. SUCURSALES (Padres finales)
            long sucursalesCount = sucursalRepository.count();
            sucursalRepository.deleteAll();

            System.out.println("✅ Reset completado exitosamente!");

            // Registramos este evento (en la tabla que acabamos de limpiar o preservar)
            auditService.registrar(
                    "SOCIOS",
                    "RESET_PADRON",
                    "Realizó un reinicio TOTAL del sistema (Usuarios, Socios, Datos). Funcionarios preservados.",
                    auth != null ? auth.getName() : "SYSTEM",
                    request.getRemoteAddr());

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Sistema reiniciado a CERO (Funcionarios preservados).");
            result.put("eliminados", Map.of(
                    "asistencias", asistenciasCount,
                    "socios", sociosCount,
                    "usuarios", usuariosEliminados,
                    "sucursales", sucursalesCount));

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("❌ Error en reset: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }
}
