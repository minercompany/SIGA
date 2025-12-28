package com.asamblea.controller;

import com.asamblea.model.Asistencia;
import com.asamblea.model.Socio;
import com.asamblea.model.Usuario;
import com.asamblea.repository.AsistenciaRepository;
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
    private final SocioRepository socioRepository;
    private final UsuarioRepository usuarioRepository;
    private final com.asamblea.repository.AsambleaRepository asambleaRepository; // Inyectado
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
                // Si es de otra asamblea vieja, permitir marcar de nuevo? -> TODO
                // Por simplicidad del fix actual: Bloquear si ya existe.

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
}
