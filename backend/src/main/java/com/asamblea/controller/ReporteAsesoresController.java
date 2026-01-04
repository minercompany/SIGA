package com.asamblea.controller;

import com.asamblea.model.Usuario;
import com.asamblea.repository.UsuarioRepository;
import com.asamblea.service.ReporteExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Controlador para Reporte de Asesores de Crédito
 * Muestra cumplimiento de meta mínima (20) y meta general (50)
 */
@RestController
@RequestMapping("/api/reportes/asesores")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReporteAsesoresController {

    private final UsuarioRepository usuarioRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ReporteExportService exportService;

    // Constantes de metas
    private static final int META_MINIMA = 20;
    private static final int META_GENERAL = 50;

    /**
     * Obtener datos de asesores con su progreso hacia las metas
     */
    @GetMapping
    public ResponseEntity<?> getReporteAsesores(Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();

        // Obtener solo asesores activos
        List<Usuario> asesores = usuarioRepository.findAll().stream()
                .filter(Usuario::isActivo)
                .filter(u -> u.getRol() == Usuario.Rol.ASESOR_DE_CREDITO)
                .collect(Collectors.toList());

        // Obtener conteo de registros (asignaciones con voz y voto) por usuario
        String sql = """
                SELECT la.user_id, COUNT(*) as total
                FROM asignaciones_socios asig
                JOIN listas_asignacion la ON asig.lista_id = la.id
                GROUP BY la.user_id
                """;

        Map<Long, Long> registrosPorUsuario = jdbcTemplate.queryForList(sql).stream()
                .filter(m -> m.get("user_id") != null)
                .collect(Collectors.toMap(
                        m -> ((Number) m.get("user_id")).longValue(),
                        m -> ((Number) m.get("total")).longValue()));

        // Construir respuesta
        List<Map<String, Object>> resultado = new ArrayList<>();
        int cumplieronMeta = 0;
        int cumplieronMinimo = 0;
        int sinMinimo = 0;

        for (Usuario asesor : asesores) {
            long registrados = registrosPorUsuario.getOrDefault(asesor.getId(), 0L);
            int faltaMinimo = Math.max(0, META_MINIMA - (int) registrados);
            int faltaMeta = Math.max(0, META_GENERAL - (int) registrados);

            String estado;
            String estadoColor;
            if (registrados >= META_GENERAL) {
                estado = "✅ Cumplió Meta";
                estadoColor = "success";
                cumplieronMeta++;
            } else if (registrados >= META_MINIMA) {
                estado = "⚠️ Cumplió Mínimo";
                estadoColor = "warning";
                cumplieronMinimo++;
            } else {
                estado = "❌ Sin Mínimo";
                estadoColor = "danger";
                sinMinimo++;
            }

            // Obtener sucursal
            String sucursal = "N/A";
            if (asesor.getSucursal() != null) {
                sucursal = asesor.getSucursal().getNombre();
            } else if (asesor.getSocio() != null && asesor.getSocio().getSucursal() != null) {
                sucursal = asesor.getSocio().getSucursal().getNombre();
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", asesor.getId());
            item.put("nombreCompleto", asesor.getNombreCompleto());
            item.put("sucursal", sucursal);
            item.put("registrados", registrados);
            item.put("faltaMinimo", faltaMinimo);
            item.put("faltaMeta", faltaMeta);
            item.put("estado", estado);
            item.put("estadoColor", estadoColor);
            item.put("porcentaje", Math.min(100, (registrados * 100) / META_GENERAL));

            resultado.add(item);
        }

        // Ordenar: primero los que menos tienen (más urgentes)
        resultado.sort((a, b) -> {
            long regA = (Long) a.get("registrados");
            long regB = (Long) b.get("registrados");
            return Long.compare(regA, regB);
        });

        return ResponseEntity.ok(Map.of(
                "asesores", resultado,
                "resumen", Map.of(
                        "total", asesores.size(),
                        "cumplieronMeta", cumplieronMeta,
                        "cumplieronMinimo", cumplieronMinimo,
                        "sinMinimo", sinMinimo,
                        "metaMinima", META_MINIMA,
                        "metaGeneral", META_GENERAL)));
    }

    /**
     * Generar PDF del reporte de asesores
     */
    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportarPdf(Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();

        // Reutilizar la lógica del endpoint principal
        ResponseEntity<?> response = getReporteAsesores(auth);
        if (response.getStatusCode().isError()) {
            return ResponseEntity.status(response.getStatusCode()).build();
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getBody();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> asesores = (List<Map<String, Object>>) data.get("asesores");
        @SuppressWarnings("unchecked")
        Map<String, Object> resumen = (Map<String, Object>) data.get("resumen");

        byte[] pdf = exportService.generarPdfAsesores(asesores, resumen);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=reporte_asesores.pdf")
                .body(pdf);
    }
}
