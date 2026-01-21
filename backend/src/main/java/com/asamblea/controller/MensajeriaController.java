package com.asamblea.controller;

import com.asamblea.service.MensajeriaExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Controlador para exportación de datos de mensajería.
 */
@RestController
@RequestMapping("/api/mensajeria")
@RequiredArgsConstructor
public class MensajeriaController {

    private final MensajeriaExportService exportService;
    private final com.asamblea.service.LogAuditoriaService auditService;

    /**
     * Obtiene estadísticas de socios VyV para la UI.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(exportService.obtenerEstadisticas());
    }

    /**
     * Exporta socios VyV a CSV.
     */
    @GetMapping("/exportar/csv")
    public ResponseEntity<byte[]> exportarCSV(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        String csv = exportService.exportarVyVtoCSV();
        String filename = "socios_vyv_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";

        // Auditoría
        auditService.registrar(
            "MENSAJERIA",
            "EXPORTAR_CSV",
            "Exportó lista de socios VyV en CSV",
            auth.getName(),
            "API"
        );

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .body(csv.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    /**
     * Exporta socios VyV a Excel.
     */
    @GetMapping("/exportar/excel")
    public ResponseEntity<byte[]> exportarExcel(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            byte[] excel = exportService.exportarVyVtoExcel();
            String filename = "socios_vyv_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";

            // Auditoría
            auditService.registrar(
                "MENSAJERIA",
                "EXPORTAR_EXCEL",
                "Exportó lista de socios VyV en Excel",
                auth.getName(),
                "API"
            );

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(("Error: " + e.getMessage()).getBytes());
        }
    }
}
