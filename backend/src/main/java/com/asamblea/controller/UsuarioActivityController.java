package com.asamblea.controller;

import com.asamblea.dto.UsuarioActivityDto;
import com.asamblea.model.Usuario;
import com.asamblea.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UsuarioActivityController {

    private final UsuarioRepository usuarioRepository;
    private final JdbcTemplate jdbcTemplate;
    private final com.asamblea.service.ReporteExportService exportService;
    private final com.asamblea.service.PresenciaService presenciaService;

    @PostMapping("/heartbeat")
    public ResponseEntity<?> heartbeat(Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();

        Usuario usuario = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        if (usuario == null)
            return ResponseEntity.status(401).build();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastHb = usuario.getLastHeartbeat();

        if (lastHb != null) {
            long secondsSinceLast = Duration.between(lastHb, now).getSeconds();
            // Si el último pulso fue hace menos de 90 segundos (considerando el intervalo
            // de 60s + margen), sumamos el tiempo REAL.
            // Si fue hace más, probablemente cerró la pestaña y volvió, no sumamos ese gap.
            if (secondsSinceLast > 0 && secondsSinceLast < 90) {
                Long total = usuario.getTotalOnlineSeconds();
                if (total == null)
                    total = 0L;
                usuario.setTotalOnlineSeconds(total + secondsSinceLast);
            }
        }

        usuario.setLastHeartbeat(now);
        usuarioRepository.save(usuario);

        // Notificar al servicio de presencia para el conteo en tiempo real
        presenciaService.heartbeat(usuario.getId());

        return ResponseEntity.ok().build();
    }

    /**
     * Endpoint para el gráfico de actividad por hora (Dashboard).
     */
    @GetMapping("/stats-actividad")
    public ResponseEntity<?> getStatsActividad(Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();

        // Inicializar array de 24 horas
        int[] actividadPorHora = new int[24];

        // Usar zona horaria -03:00 (latam)
        java.time.ZoneId zone = java.time.ZoneId.of("-03:00");
        java.time.ZonedDateTime now = java.time.ZonedDateTime.now(zone);
        java.time.LocalDate hoy = now.toLocalDate();

        List<Usuario> users = usuarioRepository.findAll();

        for (Usuario u : users) {
            if (u.getLastLogin() != null) {
                java.time.ZonedDateTime zdt = u.getLastLogin().atZone(java.time.ZoneOffset.UTC)
                        .withZoneSameInstant(zone);

                if (zdt.toLocalDate().equals(hoy)) {
                    int hora = zdt.getHour();
                    if (hora >= 0 && hora < 24) {
                        actividadPorHora[hora]++;
                    }
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "labels",
                List.of("00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15",
                        "16", "17", "18", "19", "20", "21", "22", "23"),
                "data", actividadPorHora));
    }

    /**
     * Endpoint para el reporte detallado (Modal de Auditoría).
     */
    @GetMapping("/reporte-actividad")
    public ResponseEntity<?> getReporteActividad(Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();

        // Solo Super Admin y Directivo ven stats globales
        Usuario currentUser = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
        if (currentUser.getRol() != Usuario.Rol.SUPER_ADMIN && currentUser.getRol() != Usuario.Rol.DIRECTIVO) {
            return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos"));
        }

        List<Usuario> usuarios = usuarioRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        // Obtener conteos de registros y asignaciones por usuario vía JDBC para
        // eficiencia
        String sqlRegistros = "SELECT id_operador, COUNT(*) as total FROM asistencias GROUP BY id_operador";
        Map<Long, Long> registrosMap = jdbcTemplate.queryForList(sqlRegistros).stream()
                .filter(m -> m.get("id_operador") != null)
                .collect(Collectors.toMap(
                        m -> ((Number) m.get("id_operador")).longValue(),
                        m -> ((Number) m.get("total")).longValue()));

        String sqlAsignaciones = "SELECT la.user_id, COUNT(*) as total FROM asignaciones_socios asig " +
                "JOIN listas_asignacion la ON asig.lista_id = la.id GROUP BY la.user_id";
        Map<Long, Long> asignacionesMap = jdbcTemplate.queryForList(sqlAsignaciones).stream()
                .filter(m -> m.get("user_id") != null)
                .collect(Collectors.toMap(
                        m -> ((Number) m.get("user_id")).longValue(),
                        m -> ((Number) m.get("total")).longValue()));

        List<UsuarioActivityDto> dtos = usuarios.stream().map(u -> {
            boolean isOnline = u.getLastHeartbeat() != null &&
                    Duration.between(u.getLastHeartbeat(), now).getSeconds() < 120;

            long reg = registrosMap.getOrDefault(u.getId(), 0L);
            long asig = asignacionesMap.getOrDefault(u.getId(), 0L);

            return UsuarioActivityDto.builder()
                    .id(u.getId())
                    .username(u.getUsername())
                    .nombreCompleto(u.getNombreCompleto())
                    .rol(u.getRol().name())
                    .sucursal(u.getSucursal() != null ? u.getSucursal().getNombre() : "N/A")
                    .lastLogin(u.getLastLogin())
                    .loginCount(u.getLoginCount() != null ? u.getLoginCount() : 0)
                    .totalOnlineSeconds(u.getTotalOnlineSeconds() != null ? u.getTotalOnlineSeconds() : 0L)
                    .isOnline(isOnline)
                    .totalRegistros(reg)
                    .totalAsignaciones(asig)
                    .timeOnlineFormatted(formatTime(u.getTotalOnlineSeconds()))
                    .lastSeenRelative(formatLastSeen(u.getLastLogin(), isOnline))
                    .build();

        }).sorted((a, b) -> {
            // Ordenar: Online primero, luego por lastLogin desc
            if (a.isOnline() && !b.isOnline())
                return -1;
            if (!a.isOnline() && b.isOnline())
                return 1;
            if (a.getLastLogin() == null && b.getLastLogin() == null)
                return 0;
            if (a.getLastLogin() == null)
                return 1;
            if (b.getLastLogin() == null)
                return -1;
            return b.getLastLogin().compareTo(a.getLastLogin());
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/exportar-pdf")
    public ResponseEntity<byte[]> exportarPdf(@RequestParam(defaultValue = "todos") String filtro,
            Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();

        ResponseEntity<?> response = getReporteActividad(auth);
        if (response.getStatusCode().isError())
            return ResponseEntity.status(response.getStatusCode()).build();

        @SuppressWarnings("unchecked")
        List<UsuarioActivityDto> data = (List<UsuarioActivityDto>) response.getBody();
        if (data == null)
            data = new java.util.ArrayList<>();

        if (filtro.equals("habituales")) {
            data = data.stream().filter(u -> u.getLastLogin() != null).collect(Collectors.toList());
        } else if (filtro.equals("no-entraron")) {
            data = data.stream().filter(u -> u.getLastLogin() == null).collect(Collectors.toList());
        }

        String titulo = filtro.equals("habituales") ? "Usuarios Habituales" : "Reporte General de Usuarios";
        byte[] pdf = exportService.generarPdfActividad(data, titulo);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=reporte_usuarios.pdf")
                .body(pdf);
    }

    @GetMapping("/exportar-excel")
    public ResponseEntity<byte[]> exportarExcel(@RequestParam(defaultValue = "todos") String filtro,
            Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();

        ResponseEntity<?> response = getReporteActividad(auth);
        if (response.getStatusCode().isError())
            return ResponseEntity.status(response.getStatusCode()).build();

        @SuppressWarnings("unchecked")
        List<UsuarioActivityDto> data = (List<UsuarioActivityDto>) response.getBody();
        if (data == null)
            data = new java.util.ArrayList<>();

        if (filtro.equals("habituales")) {
            data = data.stream().filter(u -> u.getLastLogin() != null).collect(Collectors.toList());
        } else if (filtro.equals("no-entraron")) {
            data = data.stream().filter(u -> u.getLastLogin() == null).collect(Collectors.toList());
        }

        String titulo = filtro.equals("habituales") ? "Usuarios Habituales" : "Reporte General de Usuarios";
        byte[] excel = exportService.generarExcelActividad(data, titulo);

        return ResponseEntity.ok()
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", "attachment; filename=reporte_usuarios.xlsx")
                .body(excel);
    }

    private String formatTime(Long seconds) {
        if (seconds == null || seconds == 0)
            return "0s";
        long h = seconds / 3600;
        long m = (seconds % 3600) / 60;
        long s = seconds % 60;
        if (h > 0)
            return String.format("%dh %dm", h, m);
        if (m > 0)
            return String.format("%dm %ds", m, s);
        return s + "s";
    }

    private String formatLastSeen(LocalDateTime lastLogin, boolean isOnline) {
        if (isOnline)
            return "Usando el sistema";
        if (lastLogin == null)
            return "Nunca entró";

        Duration d = Duration.between(lastLogin, LocalDateTime.now());
        long min = d.toMinutes();
        if (min < 1)
            return "Recién";
        if (min < 60)
            return "hace " + min + " min";
        long hours = d.toHours();
        if (hours < 24)
            return "hace " + hours + " h";
        return "hace " + d.toDays() + " días";
    }
}
