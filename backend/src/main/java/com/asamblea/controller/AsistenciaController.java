package com.asamblea.controller;

import com.asamblea.model.Asistencia;
import com.asamblea.model.Socio;
import com.asamblea.model.Usuario;
import com.asamblea.repository.AsistenciaRepository;
import com.asamblea.repository.AsignacionRepository;
import com.asamblea.model.Asignacion;
import com.asamblea.repository.SocioRepository;
import com.asamblea.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

@RestController
@RequestMapping("/api/asistencia")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:6001")
@SuppressWarnings("null")
public class AsistenciaController {

    private final AsistenciaRepository asistenciaRepository;
    private final AsignacionRepository asignacionRepository;
    private final SocioRepository socioRepository;
    private final UsuarioRepository usuarioRepository;
    private final com.asamblea.repository.AsambleaRepository asambleaRepository;
    private final com.asamblea.service.LogAuditoriaService auditService;

    @GetMapping("/hoy")
    public ResponseEntity<?> asistenciasHoy() {
        List<Asistencia> asistencias = asistenciaRepository.findAll();

        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Asistencia a : asistencias) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", a.getId());
            item.put("socioNombre", a.getSocio().getNombreCompleto());
            item.put("socioNumero", a.getSocio().getNumeroSocio());
            item.put("vozVoto", a.getEstadoVozVoto() != null ? a.getEstadoVozVoto() : false);
            item.put("fechaHora", a.getFechaHora());
            // Añadir sucursal del socio para estadísticas por sucursal
            item.put("sucursal",
                    a.getSocio().getSucursal() != null ? a.getSocio().getSucursal().getNombre() : "Sin Sucursal");
            resultado.add(item);
        }

        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/marcar")
    public ResponseEntity<?> marcarAsistencia(@RequestBody Map<String, Object> body, Authentication auth,
            HttpServletRequest request) {
        try {
            Long socioId = Long.valueOf(body.get("socioId").toString());

            // Obtener el operador actual
            Usuario operador = usuarioRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Operador no encontrado: " + auth.getName()));

            // Obtener socio
            Socio socio = socioRepository.findById(socioId)
                    .orElseThrow(() -> new RuntimeException("Socio no encontrado con ID: " + socioId));

            // Obtener ASAMBLEA ACTIVA (Fix: id_asamblea cannot be null)
            com.asamblea.model.Asamblea asamblea = asambleaRepository.findTopByActivoTrueOrderByFechaDesc()
                    .orElseThrow(() -> new RuntimeException(
                            "NO_ASAMBLEA_ACTIVA: No hay ninguna asamblea activa configurada en el sistema."));

            // VALIDACIÓN: Verificar si el socio ya tiene asistencia registrada para ESTA
            // asamblea
            // (Nota: idealmente findFirstBySocioId debería filtrar por asambleaId también,
            // pero por ahora usamos el existente)
            Optional<Asistencia> asistenciaExistente = asistenciaRepository.findFirstBySocioId(socioId);
            if (asistenciaExistente.isPresent()) {
                // Verificar si es de la misma asamblea (si la lógica de negocio lo requiere)
                // Por ahora asumimos que si ya marcó, ya marcó.
                Asistencia yaRegistrada = asistenciaExistente.get();
                // Verificar si ya tiene asistencia registrada (independiente de la asamblea)
                // Política actual: Bloquear registro duplicado.

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "SOCIO_YA_INGRESO");
                errorResponse.put("message", "Este socio ya se encuentra en la asamblea");
                errorResponse.put("socioNombre", socio.getNombreCompleto());
                errorResponse.put("socioNumero", socio.getNumeroSocio());
                errorResponse.put("horaIngreso", yaRegistrada.getFechaHora());
                errorResponse.put("operadorRegistro", yaRegistrada.getOperador() != null
                        ? yaRegistrada.getOperador().getNombreCompleto()
                        : "Sistema");
                return ResponseEntity.status(409).body(errorResponse);
            }

            // Calcular estado voz y voto
            boolean vozVoto = socio.isAporteAlDia() && socio.isSolidaridadAlDia() &&
                    socio.isFondoAlDia() && socio.isIncoopAlDia() && socio.isCreditoAlDia();

            // Crear asistencia
            Asistencia asistencia = new Asistencia();
            asistencia.setSocio(socio);
            asistencia.setOperador(operador);
            asistencia.setAsamblea(asamblea); // <--- ASIGNACIÓN FALTANTE
            asistencia.setEstadoVozVoto(vozVoto);
            asistencia.setFechaHora(LocalDateTime.now());

            Asistencia guardada = asistenciaRepository.save(asistencia);

            auditService.registrar(
                    "ASISTENCIA",
                    "MARCAR_ASISTENCIA",
                    String.format("Marcó asistencia del socio #%s (%s). Voto: %s", socio.getNumeroSocio(),
                            socio.getNombreCompleto(), vozVoto ? "SÍ" : "NO"),
                    auth.getName(),
                    request.getRemoteAddr());

            Map<String, Object> response = new HashMap<>();
            response.put("id", guardada.getId());
            response.put("mensaje", "Asistencia registrada exitosamente");
            response.put("socioNombre", socio.getNombreCompleto());
            response.put("vozVoto", vozVoto);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Ranking de operadores por cantidad de registros
    @GetMapping("/ranking-operadores")
    public ResponseEntity<?> rankingOperadores() {
        List<Asistencia> asistencias = asistenciaRepository.findAll();

        // Agrupar por operador
        Map<Long, Map<String, Object>> operadoresMap = new HashMap<>();

        for (Asistencia a : asistencias) {
            if (a.getOperador() != null) {
                Long operadorId = a.getOperador().getId();

                if (!operadoresMap.containsKey(operadorId)) {
                    Map<String, Object> operadorData = new HashMap<>();
                    operadorData.put("id", operadorId);
                    String nombreOp = a.getOperador().getNombreCompleto();
                    operadorData.put("nombre", nombreOp != null ? nombreOp : "Sin Nombre");
                    operadorData.put("username", a.getOperador().getUsername());
                    operadorData.put("rol", a.getOperador().getRol());
                    operadorData.put("totalRegistros", 0);
                    operadorData.put("vozYVoto", 0);
                    operadorData.put("soloVoz", 0);
                    operadoresMap.put(operadorId, operadorData);
                }

                Map<String, Object> data = operadoresMap.get(operadorId);
                data.put("totalRegistros", (int) data.get("totalRegistros") + 1);

                if (Boolean.TRUE.equals(a.getEstadoVozVoto())) {
                    data.put("vozYVoto", (int) data.get("vozYVoto") + 1);
                } else {
                    data.put("soloVoz", (int) data.get("soloVoz") + 1);
                }
            }
        }

        // Convertir a lista y ordenar por totalRegistros descendente
        List<Map<String, Object>> ranking = new ArrayList<>(operadoresMap.values());
        ranking.sort((a, b) -> (int) b.get("totalRegistros") - (int) a.get("totalRegistros"));

        return ResponseEntity.ok(ranking);
    }

    // ===== REPORTE ADMIN: Asistencias registradas por un operador específico =====
    @GetMapping("/admin/por-operador/{operadorId}")
    public ResponseEntity<?> asistenciasPorOperador(@PathVariable Long operadorId, Authentication auth) {
        // Verificar permisos (SUPER_ADMIN o DIRECTIVO)
        Usuario currentUser = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        if (currentUser == null ||
                (!currentUser.getRol().equals("SUPER_ADMIN") && !currentUser.getRol().equals("DIRECTIVO"))) {
            return ResponseEntity.status(403).body(Map.of("error", "No tiene permisos para ver este reporte"));
        }

        // Obtener operador
        Optional<Usuario> operadorOpt = usuarioRepository.findById(operadorId);
        if (operadorOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Operador no encontrado"));
        }
        Usuario operador = operadorOpt.get();

        // Obtener asistencias registradas por este operador
        List<Asistencia> asistencias = asistenciaRepository.findByOperadorId(operadorId);

        List<Map<String, Object>> sociosAsistencia = new ArrayList<>();
        int totalVyV = 0;
        int totalSoloVoz = 0;

        for (Asistencia a : asistencias) {
            Socio socio = a.getSocio();
            if (socio != null) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", a.getId());
                item.put("cedula", socio.getCedula() != null ? socio.getCedula() : "-");
                item.put("nombreCompleto",
                        socio.getNombreCompleto() != null ? socio.getNombreCompleto() : "Sin Nombre");
                item.put("numeroSocio", socio.getNumeroSocio() != null ? socio.getNumeroSocio() : "-");

                // Fecha/Hora Ingreso Asamblea
                item.put("fechaHoraIngreso", a.getFechaHora());
                item.put("horaIngreso", a.getFechaHora() != null ? a.getFechaHora().toLocalTime().toString() : "-");

                // Buscar fecha de asignación a lista
                java.util.Optional<Asignacion> asignacionOpt = asignacionRepository.findBySocioId(socio.getId());
                LocalDateTime fechaAsignacion = null;
                String asignadoPor = "-";
                if (asignacionOpt.isPresent()) {
                    Asignacion asig = asignacionOpt.get();
                    fechaAsignacion = asig.getFechaAsignacion();
                    if (asig.getAsignadoPor() != null) {
                        asignadoPor = asig.getAsignadoPor().getNombreCompleto();
                    }
                }
                item.put("fechaHoraLista", fechaAsignacion);
                item.put("asignadoPor", asignadoPor);

                // Registrado por (quien marcó asistencia)
                item.put("registradoPor", a.getOperador() != null ? a.getOperador().getNombreCompleto() : "Sistema");

                boolean esVyV = Boolean.TRUE.equals(a.getEstadoVozVoto());
                item.put("condicion", esVyV ? "VOZ Y VOTO" : "SOLO VOZ");
                item.put("esVyV", esVyV);
                sociosAsistencia.add(item);

                if (esVyV)
                    totalVyV++;
                else
                    totalSoloVoz++;
            }
        }

        // Ordenar por hora de registro
        sociosAsistencia.sort((a, b) -> {
            LocalDateTime fa = (LocalDateTime) a.get("fechaHoraIngreso");
            LocalDateTime fb = (LocalDateTime) b.get("fechaHoraIngreso");
            if (fa == null)
                return 1;
            if (fb == null)
                return -1;
            return fa.compareTo(fb);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("operador", Map.of(
                "id", operador.getId(),
                "nombre", operador.getNombreCompleto() != null ? operador.getNombreCompleto() : "Sin Nombre",
                "username", operador.getUsername(),
                "rol", operador.getRol()));
        response.put("asistencias", sociosAsistencia);
        response.put("stats", Map.of(
                "total", sociosAsistencia.size(),
                "vyv", totalVyV,
                "soloVoz", totalSoloVoz));

        return ResponseEntity.ok(response);
    }

    // ===== MI REPORTE: Asistencias registradas por el usuario autenticado =====
    @GetMapping("/mi-reporte")
    public ResponseEntity<?> miReporte(Authentication auth) {
        // Obtener usuario autenticado
        Usuario operador = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        if (operador == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Usuario no autenticado"));
        }

        // Obtener asistencias registradas por este usuario
        List<Asistencia> asistencias = asistenciaRepository.findByOperadorId(operador.getId());

        List<Map<String, Object>> misRegistros = new ArrayList<>();
        int totalVyV = 0;
        int totalSoloVoz = 0;

        for (Asistencia a : asistencias) {
            Socio socio = a.getSocio();
            if (socio != null) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", a.getId());
                item.put("cedula", socio.getCedula() != null ? socio.getCedula() : "-");
                item.put("nombreCompleto",
                        socio.getNombreCompleto() != null ? socio.getNombreCompleto() : "Sin Nombre");
                item.put("numeroSocio", socio.getNumeroSocio() != null ? socio.getNumeroSocio() : "-");

                // Fecha/Hora Ingreso Asamblea
                item.put("fechaHoraIngreso", a.getFechaHora());
                item.put("horaIngreso", a.getFechaHora() != null ? a.getFechaHora().toLocalTime().toString() : "-");

                // Buscar fecha de asignación a lista
                java.util.Optional<Asignacion> asignacionOpt2 = asignacionRepository.findBySocioId(socio.getId());
                LocalDateTime fechaAsignacion = null;
                String asignadoPor = "-";
                if (asignacionOpt2.isPresent()) {
                    Asignacion asig = asignacionOpt2.get();
                    fechaAsignacion = asig.getFechaAsignacion();
                    if (asig.getAsignadoPor() != null) {
                        asignadoPor = asig.getAsignadoPor().getNombreCompleto();
                    }
                }
                item.put("fechaHoraLista", fechaAsignacion);
                item.put("asignadoPor", asignadoPor);

                // Registrado por (quien marcó asistencia)
                item.put("registradoPor", a.getOperador() != null ? a.getOperador().getNombreCompleto() : "Sistema");

                boolean esVyV = Boolean.TRUE.equals(a.getEstadoVozVoto());
                item.put("condicion", esVyV ? "VOZ Y VOTO" : "SOLO VOZ");
                item.put("esVyV", esVyV);
                misRegistros.add(item);

                if (esVyV)
                    totalVyV++;
                else
                    totalSoloVoz++;
            }
        }

        // Ordenar por hora de registro
        misRegistros.sort((a, b) -> {
            LocalDateTime fa = (LocalDateTime) a.get("fechaHoraIngreso");
            LocalDateTime fb = (LocalDateTime) b.get("fechaHoraIngreso");
            if (fa == null)
                return 1;
            if (fb == null)
                return -1;
            return fa.compareTo(fb);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("usuario", Map.of(
                "id", operador.getId(),
                "nombre", operador.getNombreCompleto() != null ? operador.getNombreCompleto() : "Sin Nombre",
                "username", operador.getUsername(),
                "rol", operador.getRol()));
        response.put("registros", misRegistros);
        response.put("stats", Map.of(
                "total", misRegistros.size(),
                "vyv", totalVyV,
                "soloVoz", totalSoloVoz));

        return ResponseEntity.ok(response);
    }
}
