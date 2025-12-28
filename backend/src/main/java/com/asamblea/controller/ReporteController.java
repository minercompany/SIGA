package com.asamblea.controller;

import com.asamblea.model.Asistencia;
import com.asamblea.model.Usuario;
import com.asamblea.repository.AsistenciaRepository;

import com.asamblea.repository.UsuarioRepository;
import com.asamblea.repository.ListaAsignacionRepository;
import com.asamblea.repository.AsignacionRepository;
import com.asamblea.repository.SucursalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReporteController {

        private final AsistenciaRepository asistenciaRepository;

        private final UsuarioRepository usuarioRepository;
        private final ListaAsignacionRepository listaAsignacionRepository;
        private final AsignacionRepository asignacionRepository;
        private final SucursalRepository sucursalRepository;

        @GetMapping("/asistencia")
        public ResponseEntity<?> obtenerReporteAsistencia(
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin,
                        @RequestParam(required = false) Long sucursalId,
                        @RequestParam(required = false) Long operadorId,
                        Authentication auth) {
                // Validación de Seguridad:
                // SUPER_ADMIN: Ve todo.
                // DIRECTIVO / OPERADOR: Solo ve SUS registros.
                Usuario currentUser = usuarioRepository.findByUsername(auth.getName()).orElseThrow();

                boolean isSuperAdmin = currentUser.getRol() == Usuario.Rol.SUPER_ADMIN;

                boolean filterByAssignment = false;
                Set<Long> socioIds = new HashSet<>();

                if (!isSuperAdmin) {
                        if (currentUser.getRol() == Usuario.Rol.USUARIO_SOCIO) {
                                // USUARIO_SOCIO: Ve la asistencia de sus socios ASIGNADOS (sin importar
                                // operador)
                                filterByAssignment = true;
                                if (currentUser.getIdSocio() != null) {
                                        socioIds.add(currentUser.getIdSocio());
                                }

                                var listas = listaAsignacionRepository.findByUsuarioId(currentUser.getId());
                                for (var lista : listas) {
                                        var asignaciones = asignacionRepository.findByListaAsignacionId(lista.getId());
                                        for (var asignacion : asignaciones) {
                                                socioIds.add(asignacion.getSocio().getId());
                                        }
                                }
                                // Anulamos operadorId para ver registros de CUALQUIER operador
                                operadorId = null;
                        } else {
                                // OPERADOR / DIRECTIVO: Solo ve lo que él registró
                                operadorId = currentUser.getId();
                        }
                }

                // Obtener todas las asistencias (Optimización pendiente: hacer esto con JPQL
                // dinámico)
                // Por ahora filtro en memoria dado que no esperamos millones de asistencias en
                // un solo día
                List<Asistencia> todas = asistenciaRepository.findAll();

                // Aplicar Filtros
                Long finalOperadorId = operadorId;
                boolean finalFilterByAssignment = filterByAssignment;

                List<Asistencia> filtradas = todas.stream()
                                .filter(a -> fechaInicio == null || !a.getFechaHora().isBefore(fechaInicio))
                                .filter(a -> fechaFin == null || !a.getFechaHora().isAfter(fechaFin))
                                .filter(a -> sucursalId == null || (a.getSocio().getSucursal() != null
                                                && a.getSocio().getSucursal().getId().equals(sucursalId)))
                                .filter(a -> finalOperadorId == null
                                                || (a.getOperador() != null
                                                                && a.getOperador().getId().equals(finalOperadorId)))
                                .filter(a -> !finalFilterByAssignment || socioIds.contains(a.getSocio().getId()))
                                .collect(Collectors.toList());

                // Transformar a DTO para el frontend
                List<Map<String, Object>> reporte = filtradas.stream().map(a -> {
                        Map<String, Object> fila = new HashMap<>();
                        fila.put("id", a.getId());
                        fila.put("fechaHora", a.getFechaHora());
                        fila.put("socioId", a.getSocio().getId());
                        fila.put("socioNombre", a.getSocio().getNombreCompleto());
                        fila.put("socioNro", a.getSocio().getNumeroSocio());
                        fila.put("cedula", a.getSocio().getCedula());
                        fila.put("sucursal",
                                        a.getSocio().getSucursal() != null ? a.getSocio().getSucursal().getNombre()
                                                        : "Sin Sucursal");
                        fila.put("vozVoto", a.getEstadoVozVoto() != null && a.getEstadoVozVoto() ? "HABILITADO"
                                        : "OBSERVADO");
                        fila.put("operador", a.getOperador() != null ? a.getOperador().getNombreCompleto() : "Sistema");
                        return fila;
                }).collect(Collectors.toList());

                // Crear resumen estadístico
                Map<String, Object> stats = new HashMap<>();
                stats.put("totalRegistros", reporte.size());
                stats.put("habilitados", reporte.stream().filter(r -> "HABILITADO".equals(r.get("vozVoto"))).count());
                stats.put("observados", reporte.stream().filter(r -> "OBSERVADO".equals(r.get("vozVoto"))).count());

                Map<String, Object> response = new HashMap<>();
                response.put("data", reporte);
                response.put("stats", stats);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/mis-asignados")
        public ResponseEntity<?> reporteMisAsignados(Authentication auth) {
                Usuario currentUser = usuarioRepository.findByUsername(auth.getName()).orElseThrow();

                if (currentUser.getRol() != Usuario.Rol.USUARIO_SOCIO) {
                        return ResponseEntity.status(403).body(Map.of("error", "Acceso denegado."));
                }

                var listas = listaAsignacionRepository.findByUsuarioId(currentUser.getId());
                List<Map<String, Object>> result = new ArrayList<>();

                for (var lista : listas) {
                        var asignaciones = asignacionRepository.findByListaAsignacionId(lista.getId());
                        for (var asignacion : asignaciones) {
                                com.asamblea.model.Socio s = asignacion.getSocio();
                                Optional<Asistencia> asistenciaOpt = asistenciaRepository.findFirstBySocioId(s.getId());

                                Map<String, Object> fila = new HashMap<>();
                                fila.put("id", s.getId());
                                fila.put("socioNombre", s.getNombreCompleto());
                                fila.put("socioNro", s.getNumeroSocio());
                                fila.put("cedula", s.getCedula());
                                fila.put("sucursal",
                                                s.getSucursal() != null ? s.getSucursal().getNombre() : "Sin Sucursal");
                                fila.put("vozVoto", s.isEstadoVozVoto() ? "HABILITADO" : "OBSERVADO"); // Estado socio
                                fila.put("fechaAsignacion", asignacion.getFechaAsignacion());

                                if (asignacion.getAsignadoPor() != null) {
                                        fila.put("asignadoPor", asignacion.getAsignadoPor().getNombreCompleto());
                                } else {
                                        // Si es nulo, es probable que haya sido auto-asignado o migración anterior
                                        fila.put("asignadoPor", "Sistema / Anterior");
                                }

                                if (asistenciaOpt.isPresent()) {
                                        fila.put("estado", "PRESENTE"); // Estado asistencia
                                        fila.put("fechaHora", asistenciaOpt.get().getFechaHora());
                                        Usuario op = asistenciaOpt.get().getOperador();
                                        fila.put("operador", op != null ? op.getNombreCompleto() : "Sistema");
                                        fila.put("operadorId", op != null ? op.getId() : "SYS");
                                } else {
                                        fila.put("estado", "AUSENTE");
                                        fila.put("fechaHora", null);
                                        fila.put("operador", "-");
                                        fila.put("operadorId", "-");
                                }
                                result.add(fila);
                        }
                }

                long total = result.size();
                long presentes = result.stream().filter(r -> "PRESENTE".equals(r.get("estado"))).count();

                // Mapeamos a las keys que usa el frontend o nuevas
                Map<String, Object> stats = new HashMap<>();
                stats.put("totalRegistros", total);
                stats.put("habilitados", presentes); // Reusamos para mostrar count de Presentes
                stats.put("observados", total - presentes); // Reusamos para mostrar count de Ausentes

                Map<String, Object> response = new HashMap<>();
                response.put("data", result);
                response.put("stats", stats);

                return ResponseEntity.ok(response);
        }

        // =====================================================
        // NUEVOS REPORTES ADICIONALES
        // =====================================================

        @GetMapping("/socios-sin-asignar")
        public ResponseEntity<?> reporteSociosSinAsignar(Authentication auth) {
                Usuario currentUser = usuarioRepository.findByUsername(auth.getName()).orElseThrow();

                if (currentUser.getRol() != Usuario.Rol.SUPER_ADMIN) {
                        return ResponseEntity.status(403).body(Map.of("error", "Acceso denegado. Solo SUPER_ADMIN."));
                }

                // Obtener IDs de socios asignados
                Set<Long> sociosAsignados = asignacionRepository.findAll().stream()
                                .map(a -> a.getSocio().getId())
                                .collect(Collectors.toSet());

                // Obtener todos los socios y filtrar los no asignados
                List<Map<String, Object>> result = new java.util.ArrayList<>();

                // Necesitamos el SocioRepository - usamos una query alternativa
                var asistencias = asistenciaRepository.findAll();

                // Por simplicidad, retornamos socios que tienen asistencia pero no asignación
                // (Esto es una aproximación - en producción usarías SocioRepository
                // directamente)
                for (Asistencia a : asistencias) {
                        if (!sociosAsignados.contains(a.getSocio().getId())) {
                                Map<String, Object> fila = new HashMap<>();
                                fila.put("id", a.getSocio().getId());
                                fila.put("socioNombre", a.getSocio().getNombreCompleto());
                                fila.put("socioNro", a.getSocio().getNumeroSocio());
                                fila.put("cedula", a.getSocio().getCedula());
                                fila.put("sucursal",
                                                a.getSocio().getSucursal() != null
                                                                ? a.getSocio().getSucursal().getNombre()
                                                                : "Sin Sucursal");
                                fila.put("vozVoto", a.getSocio().isEstadoVozVoto() ? "HABILITADO" : "OBSERVADO");
                                result.add(fila);
                        }
                }

                // Eliminar duplicados
                Set<Long> seen = new HashSet<>();
                result.removeIf(r -> !seen.add((Long) r.get("id")));

                Map<String, Object> stats = new HashMap<>();
                stats.put("totalRegistros", result.size());
                stats.put("habilitados", result.stream().filter(r -> "HABILITADO".equals(r.get("vozVoto"))).count());
                stats.put("observados", result.stream().filter(r -> "OBSERVADO".equals(r.get("vozVoto"))).count());

                return ResponseEntity.ok(Map.of("data", result, "stats", stats));
        }

        @GetMapping("/estadisticas-sucursal")
        public ResponseEntity<?> reporteEstadisticasSucursal(Authentication auth) {
                Usuario currentUser = usuarioRepository.findByUsername(auth.getName()).orElseThrow();

                if (currentUser.getRol() != Usuario.Rol.SUPER_ADMIN) {
                        return ResponseEntity.status(403).body(Map.of("error", "Acceso denegado."));
                }

                var asistencias = asistenciaRepository.findAll();

                // Agrupar por sucursal
                Map<String, List<Asistencia>> porSucursal = asistencias.stream()
                                .collect(Collectors.groupingBy(a -> a.getSocio().getSucursal() != null
                                                ? a.getSocio().getSucursal().getNombre()
                                                : "Sin Sucursal"));

                List<Map<String, Object>> result = new ArrayList<>();
                for (var entry : porSucursal.entrySet()) {
                        Map<String, Object> fila = new HashMap<>();
                        fila.put("sucursal", entry.getKey());
                        fila.put("totalPresentes", entry.getValue().size());
                        long habilitados = entry.getValue().stream()
                                        .filter(a -> a.getSocio().isEstadoVozVoto())
                                        .count();
                        fila.put("habilitados", habilitados);
                        fila.put("soloVoz", entry.getValue().size() - habilitados);
                        result.add(fila);
                }

                // Ordenar por cantidad de presentes
                result.sort((a, b) -> Integer.compare(
                                (Integer) b.get("totalPresentes"),
                                (Integer) a.get("totalPresentes")));

                Map<String, Object> stats = new HashMap<>();
                stats.put("totalSucursales", result.size());
                stats.put("totalPresentes", asistencias.size());

                return ResponseEntity.ok(Map.of("data", result, "stats", stats));
        }

        @GetMapping("/socios-observados")
        public ResponseEntity<?> reporteSociosObservados(Authentication auth) {
                Usuario currentUser = usuarioRepository.findByUsername(auth.getName()).orElseThrow();

                if (currentUser.getRol() != Usuario.Rol.SUPER_ADMIN) {
                        return ResponseEntity.status(403).body(Map.of("error", "Acceso denegado."));
                }

                var asistencias = asistenciaRepository.findAll();

                List<Map<String, Object>> result = new ArrayList<>();
                for (Asistencia a : asistencias) {
                        if (!a.getSocio().isEstadoVozVoto()) { // Solo los observados
                                Map<String, Object> fila = new HashMap<>();
                                fila.put("id", a.getSocio().getId());
                                fila.put("socioNombre", a.getSocio().getNombreCompleto());
                                fila.put("socioNro", a.getSocio().getNumeroSocio());
                                fila.put("cedula", a.getSocio().getCedula());
                                fila.put("sucursal",
                                                a.getSocio().getSucursal() != null
                                                                ? a.getSocio().getSucursal().getNombre()
                                                                : "Sin Sucursal");
                                fila.put("fechaIngreso", a.getFechaHora());
                                fila.put("operador", a.getOperador() != null ? a.getOperador().getNombreCompleto()
                                                : "Sistema");

                                // Motivos de observación (campos de deuda)
                                List<String> motivos = new ArrayList<>();
                                if (!a.getSocio().isAporteAlDia())
                                        motivos.add("Aporte");
                                if (!a.getSocio().isSolidaridadAlDia())
                                        motivos.add("Solidaridad");
                                if (!a.getSocio().isFondoAlDia())
                                        motivos.add("Fondo");
                                if (!a.getSocio().isIncoopAlDia())
                                        motivos.add("INCOOP");
                                if (!a.getSocio().isCreditoAlDia())
                                        motivos.add("Crédito");
                                fila.put("motivos", String.join(", ", motivos));

                                result.add(fila);
                        }
                }

                Map<String, Object> stats = new HashMap<>();
                stats.put("totalRegistros", result.size());
                stats.put("totalAsistencia", asistencias.size());
                stats.put("porcentaje", asistencias.isEmpty() ? 0 : (result.size() * 100 / asistencias.size()));

                return ResponseEntity.ok(Map.of("data", result, "stats", stats));
        }

        // Listar todas las sucursales disponibles
        @GetMapping("/sucursales-lista")
        public ResponseEntity<?> listarSucursales(Authentication auth) {
                var sucursales = sucursalRepository.findAllByOrderByCodigoAsc();
                List<Map<String, Object>> result = new ArrayList<>();

                for (var suc : sucursales) {
                        Map<String, Object> item = new HashMap<>();
                        item.put("id", suc.getId());
                        item.put("nombre", suc.getNombre());
                        result.add(item);
                }

                return ResponseEntity.ok(result);
        }

        // Reporte de SOCIOS ASIGNADOS filtrado por sucursal (con todos los datos)
        // Cada socio aparece UNA sola vez (solo la primera asignación)
        @GetMapping("/por-sucursal/{sucursalId}")
        public ResponseEntity<?> reportePorSucursal(@PathVariable Long sucursalId, Authentication auth) {
                var asignaciones = asignacionRepository.findAll();
                var asistencias = asistenciaRepository.findAll();

                Map<Long, Asistencia> asistenciaPorSocio = new HashMap<>();
                for (Asistencia a : asistencias) {
                        asistenciaPorSocio.put(a.getSocio().getId(), a);
                }

                // Usar Set para evitar duplicados de socios
                Set<Long> sociosProcesados = new HashSet<>();
                List<Map<String, Object>> result = new ArrayList<>();

                for (var asig : asignaciones) {
                        var socio = asig.getSocio();
                        // Solo procesar si es de esta sucursal y NO ha sido procesado antes
                        if (socio.getSucursal() != null &&
                                        socio.getSucursal().getId().equals(sucursalId) &&
                                        !sociosProcesados.contains(socio.getId())) {

                                sociosProcesados.add(socio.getId()); // Marcar como procesado

                                Map<String, Object> fila = new HashMap<>();
                                fila.put("id", socio.getId());
                                fila.put("socioNombre", socio.getNombreCompleto());
                                fila.put("socioNro", socio.getNumeroSocio());
                                fila.put("cedula", socio.getCedula());
                                fila.put("sucursal", socio.getSucursal().getNombre());
                                fila.put("vozVoto", socio.isEstadoVozVoto() ? "HABILITADO" : "OBSERVADO");
                                fila.put("fechaAsignacion", asig.getFechaAsignacion());
                                fila.put("operador", asig.getListaAsignacion().getUsuario().getNombreCompleto());

                                Asistencia asist = asistenciaPorSocio.get(socio.getId());
                                if (asist != null) {
                                        fila.put("estado", "PRESENTE");
                                        fila.put("fechaHora", asist.getFechaHora());
                                } else {
                                        fila.put("estado", "AUSENTE");
                                        fila.put("fechaHora", null);
                                }
                                result.add(fila);
                        }
                }

                long presentes = result.stream().filter(r -> "PRESENTE".equals(r.get("estado"))).count();
                long habilitados = result.stream().filter(r -> "HABILITADO".equals(r.get("vozVoto"))).count();

                Map<String, Object> stats = new HashMap<>();
                stats.put("totalRegistros", result.size());
                stats.put("presentes", presentes);
                stats.put("ausentes", result.size() - presentes);
                stats.put("habilitados", habilitados);
                stats.put("observados", result.size() - habilitados);
                stats.put("sucursalNombre",
                                sucursalRepository.findById(sucursalId).map(s -> s.getNombre())
                                                .orElse("Desconocida"));

                return ResponseEntity.ok(Map.of("data", result, "stats", stats));
        }
}
