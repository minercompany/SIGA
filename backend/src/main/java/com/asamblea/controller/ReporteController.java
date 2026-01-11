package com.asamblea.controller;

import com.asamblea.model.Socio;
import com.asamblea.model.Asistencia;
import com.asamblea.model.Usuario;
import com.asamblea.repository.AsistenciaRepository;
import com.asamblea.repository.UsuarioRepository;
import com.asamblea.repository.ListaAsignacionRepository;
import com.asamblea.repository.AsignacionRepository;
import com.asamblea.repository.SucursalRepository;
import com.asamblea.repository.SocioRepository;
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
        private final SocioRepository socioRepository;

        @GetMapping("/asistencia")
        public ResponseEntity<?> obtenerReporteAsistencia(
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin,
                        @RequestParam(required = false) Long sucursalId,
                        @RequestParam(required = false) Long operadorId,
                        Authentication auth) {
                // Validación de Seguridad
                Usuario currentUser = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
                boolean isSuperAdmin = currentUser.getRol() == Usuario.Rol.SUPER_ADMIN;

                boolean filterByAssignment = false;
                Set<Long> socioIds = new HashSet<>();

                if (!isSuperAdmin) {
                        if (currentUser.getRol() == Usuario.Rol.USUARIO_SOCIO) {
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
                                operadorId = null; // Ver registros de CUALQUIER operador para MIS socios
                        } else {
                                operadorId = currentUser.getId(); // Solo MIS registros
                        }
                }

                // Optimización: Si filterByAssignment es true y no hay socios, retornamos vacío directamente
                if (filterByAssignment && socioIds.isEmpty()) {
                     Map<String, Object> emptyStats = new HashMap<>();
                     emptyStats.put("totalRegistros", 0);
                     emptyStats.put("habilitados", 0L);
                     emptyStats.put("observados", 0L);
                     return ResponseEntity.ok(Map.of("data", java.util.Collections.emptyList(), "stats", emptyStats));
                }

                List<Asistencia> filtradas = asistenciaRepository.findAsistenciasReporte(
                                fechaInicio, fechaFin, sucursalId, operadorId, filterByAssignment,
                                socioIds.isEmpty() ? java.util.Collections.singletonList(-1L) : socioIds);

                // Transformar a DTO
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

                boolean isSuperAdmin = currentUser.getRol() == Usuario.Rol.SUPER_ADMIN;
                if (currentUser.getRol() != Usuario.Rol.USUARIO_SOCIO && !isSuperAdmin) {
                        return ResponseEntity.status(403).body(Map.of("error", "Acceso denegado."));
                }

                // Optimización: Fetch assignments por usuario (u Operador)
                var asignaciones = asignacionRepository.findAsignacionesReporte(currentUser.getId());
                
                // Collect socio IDs to fetch attendances efficiently
                Set<Long> socioIds = asignaciones.stream()
                    .map(a -> a.getSocio().getId())
                    .collect(Collectors.toSet());
                
                // Fetch only relevant attendances
                List<Asistencia> asistencias = socioIds.isEmpty() ? Collections.emptyList() :
                    asistenciaRepository.findAsistenciasReporte(null, null, null, null, true, socioIds);
                
                Map<Long, Asistencia> asistenciaMap = asistencias.stream()
                    .collect(Collectors.toMap(a -> a.getSocio().getId(), a -> a, (a1, a2) -> a1)); // Duplicate handler just in case

                List<Map<String, Object>> result = new ArrayList<>();

                for (var asignacion : asignaciones) {
                        com.asamblea.model.Socio s = asignacion.getSocio();

                        Map<String, Object> fila = new HashMap<>();
                        fila.put("id", s.getId());
                        fila.put("socioNombre", s.getNombreCompleto());
                        fila.put("socioNro", s.getNumeroSocio());
                        fila.put("cedula", s.getCedula());
                        fila.put("sucursal",
                                        s.getSucursal() != null ? s.getSucursal().getNombre() : "Sin Sucursal");
                        fila.put("vozVoto", s.isEstadoVozVoto() ? "HABILITADO" : "OBSERVADO");
                        fila.put("fechaAsignacion", asignacion.getFechaAsignacion());

                        if (asignacion.getAsignadoPor() != null) {
                                fila.put("asignadoPor", asignacion.getAsignadoPor().getNombreCompleto());
                        } else {
                                fila.put("asignadoPor", "Sistema / Anterior");
                        }

                        Asistencia asistenciaOpt = asistenciaMap.get(s.getId());
                        if (asistenciaOpt != null) {
                                fila.put("estado", "PRESENTE");
                                fila.put("fechaHora", asistenciaOpt.getFechaHora());
                                Usuario op = asistenciaOpt.getOperador();
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

                long total = result.size();
                long presentes = result.stream().filter(r -> "PRESENTE".equals(r.get("estado"))).count();

                Map<String, Object> stats = new HashMap<>();
                stats.put("totalRegistros", total);
                stats.put("habilitados", presentes);
                stats.put("observados", total - presentes);

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

                if (currentUser.getRol() != Usuario.Rol.SUPER_ADMIN && currentUser.getRol() != Usuario.Rol.DIRECTIVO) {
                        return ResponseEntity.status(403).body(Map.of("error", "Acceso denegado."));
                }

                // Obtener socios que no están en ninguna asignación usando la nueva query
                List<Socio> sinAsignar = socioRepository.findSociosSinAsignar();

                List<Map<String, Object>> result = sinAsignar.stream().map(s -> {
                        Map<String, Object> fila = new HashMap<>();
                        fila.put("id", s.getId());
                        fila.put("socioNombre", s.getNombreCompleto());
                        fila.put("socioNro", s.getNumeroSocio());
                        fila.put("cedula", s.getCedula());
                        fila.put("sucursal", s.getSucursal() != null ? s.getSucursal().getNombre() : "Sin Sucursal");
                        fila.put("vozVoto", s.isEstadoVozVoto() ? "HABILITADO" : "OBSERVADO");
                        fila.put("estado", "SIN ASIGNAR"); // Para coherencia visual en el frontend
                        return fila;
                }).collect(Collectors.toList());

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
        public ResponseEntity<?> reportePorSucursal(
                        @PathVariable Long sucursalId,
                        @RequestParam(required = false) Long operadorId,
                        Authentication auth) {
                
                // Optimización: Cargar asignaciones filtradas desde DB con FETCH joins
                var asignaciones = asignacionRepository.findAsignacionesPorSucursal(sucursalId, operadorId);
                
                // Cargar todas las asistencias de la sucursal (mucho menos data que findAll global)
                // Usamos el mismo findAsistenciasReporte
                List<Asistencia> asistenciasSucursal = asistenciaRepository.findAsistenciasReporte(
                    null, null, sucursalId, null, false, java.util.Collections.singletonList(-1L)
                );
                
                Map<Long, Asistencia> asistenciaPorSocio = new HashMap<>();
                for (Asistencia a : asistenciasSucursal) {
                        asistenciaPorSocio.put(a.getSocio().getId(), a);
                }

                Set<Long> sociosProcesados = new HashSet<>();
                List<Map<String, Object>> result = new ArrayList<>();

                for (var asig : asignaciones) {
                        // El filtrado por operador y sucursal ya lo hizo la DB
                        var socio = asig.getSocio();

                        if (!sociosProcesados.contains(socio.getId())) {
                                sociosProcesados.add(socio.getId());

                                Map<String, Object> fila = new HashMap<>();
                                fila.put("id", socio.getId());
                                fila.put("socioNombre", socio.getNombreCompleto());
                                fila.put("socioNro", socio.getNumeroSocio());
                                fila.put("cedula", socio.getCedula());
                                fila.put("sucursal", socio.getSucursal() != null ? socio.getSucursal().getNombre() : "N/A"); // Should act non-null due to query
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
                stats.put("sucursalNombre", sucursalRepository.findById(sucursalId).map(s -> s.getNombre()).orElse("Desconocida"));

                return ResponseEntity.ok(Map.of("data", result, "stats", stats));
        }

        // Reporte de TODAS las asignaciones del padrón
        @GetMapping("/asignaciones-general")
        public ResponseEntity<?> reporteAsignacionesGenerales(
                        @RequestParam(required = false) Long operadorId,
                        Authentication auth) {
                Usuario currentUser = usuarioRepository.findByUsername(auth.getName()).orElseThrow();

                if (currentUser.getRol() != Usuario.Rol.SUPER_ADMIN && currentUser.getRol() != Usuario.Rol.DIRECTIVO) {
                        return ResponseEntity.status(403).body(Map.of("error", "Acceso denegado."));
                }

                // Optimización: Fetch ya filtrado por operador si aplica
                var asignaciones = asignacionRepository.findAsignacionesReporte(operadorId);
                
                // Mapear asistencias. Como es reporte general, traemos todas o podríamos intentar optimizar.
                // Si son muchas asignaciones, es mejor traer todas las asistencias de una vez que N+1
                var asistencias = asistenciaRepository.findAll();

                Map<Long, Asistencia> asistenciaPorSocio = new HashMap<>();
                for (Asistencia a : asistencias) {
                        asistenciaPorSocio.put(a.getSocio().getId(), a);
                }

                List<Map<String, Object>> result = new ArrayList<>();
                for (var asig : asignaciones) {
                        var socio = asig.getSocio();
                        Map<String, Object> fila = new HashMap<>();
                        fila.put("id", socio.getId());
                        fila.put("socioNombre", socio.getNombreCompleto());
                        fila.put("socioNro", socio.getNumeroSocio());
                        fila.put("cedula", socio.getCedula());
                        fila.put("sucursal", socio.getSucursal() != null ? socio.getSucursal().getNombre() : "Sin Sucursal");
                        fila.put("vozVoto", socio.isEstadoVozVoto() ? "HABILITADO" : "OBSERVADO");
                        fila.put("operador", asig.getListaAsignacion().getUsuario().getNombreCompleto());
                        fila.put("fechaAsignacion", asig.getFechaAsignacion());

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

                Map<String, Object> stats = new HashMap<>();
                stats.put("totalRegistros", result.size());
                stats.put("totalAsignados", result.size());

                return ResponseEntity.ok(Map.of("data", result, "stats", stats));
        }

        // Reporte de Ranking Premium (con nombre completo y sucursal)
        @GetMapping("/ranking-global")
        public ResponseEntity<List<Map<String, Object>>> reporteRankingGlobal(Authentication auth) {
                List<Object[]> ranking = usuarioRepository.findRankingByAsignaciones();
                List<Map<String, Object>> result = new ArrayList<>();

                for (Object[] row : ranking) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("username", row[0]);
                        map.put("cargo", row[1]);
                        map.put("meta", row[2]);
                        map.put("registrados", row[3]);
                        map.put("porcentaje", row[4]);
                        map.put("nombreCompleto", row[5] != null ? row[5] : row[0]); // Fallback to username
                        map.put("sucursal", row[6] != null ? row[6] : "N/A");
                        result.add(map);
                }
                return ResponseEntity.ok(result);
        }
}
