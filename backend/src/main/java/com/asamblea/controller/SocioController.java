package com.asamblea.controller;

import com.asamblea.model.ImportacionHistorial;
import com.asamblea.model.Socio;
import com.asamblea.model.Sucursal;
import com.asamblea.repository.AsistenciaRepository;
import com.asamblea.repository.ImportacionHistorialRepository;
import com.asamblea.repository.SocioRepository;
import com.asamblea.repository.SucursalRepository;
import com.asamblea.service.ImportacionService;
import lombok.RequiredArgsConstructor;

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

    // =========================================================================
    // EXPORT ENDPOINTS (Excel & PDF)
    // =========================================================================

    @GetMapping("/export/excel")
    public void exportToExcel(jakarta.servlet.http.HttpServletResponse response) throws Exception {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=padron_socios.xlsx");

        List<Socio> socios = socioRepository.findAll();

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.xssf.usermodel.XSSFSheet sheet = workbook.createSheet("Padrón de Socios");

            // Header style
            org.apache.poi.xssf.usermodel.XSSFCellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.xssf.usermodel.XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.LIGHT_GREEN.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);

            // Create header row
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] columns = { "N° Socio", "Nombre Completo", "Cédula", "Teléfono", "Sucursal", "Aporte",
                    "Solidaridad", "Fondo", "INCOOP", "Crédito", "Voz y Voto" };
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (Socio socio : socios) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(socio.getNumeroSocio());
                row.createCell(1).setCellValue(socio.getNombreCompleto());
                row.createCell(2).setCellValue(socio.getCedula());
                row.createCell(3).setCellValue(socio.getTelefono() != null ? socio.getTelefono() : "");
                row.createCell(4).setCellValue(socio.getSucursal() != null ? socio.getSucursal().getNombre() : "");
                row.createCell(5).setCellValue(socio.isAporteAlDia() ? "SI" : "NO");
                row.createCell(6).setCellValue(socio.isSolidaridadAlDia() ? "SI" : "NO");
                row.createCell(7).setCellValue(socio.isFondoAlDia() ? "SI" : "NO");
                row.createCell(8).setCellValue(socio.isIncoopAlDia() ? "SI" : "NO");
                row.createCell(9).setCellValue(socio.isCreditoAlDia() ? "SI" : "NO");
                row.createCell(10).setCellValue(socio.isEstadoVozVoto() ? "SI" : "NO");
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
        }
    }

    @GetMapping("/export/pdf")
    public void exportToPdf(jakarta.servlet.http.HttpServletResponse response) throws Exception {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=padron_socios.pdf");

        List<Socio> socios = socioRepository.findAll();

        com.lowagie.text.Document document = new com.lowagie.text.Document(com.lowagie.text.PageSize.A4.rotate());
        com.lowagie.text.pdf.PdfWriter.getInstance(document, response.getOutputStream());
        document.open();

        // Title
        com.lowagie.text.Font titleFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 18,
                com.lowagie.text.Font.BOLD);
        com.lowagie.text.Paragraph title = new com.lowagie.text.Paragraph("Padrón de Socios - Cooperativa Reducto",
                titleFont);
        title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        // Table
        com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(8);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);

        // Header style
        com.lowagie.text.Font headerFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 9,
                com.lowagie.text.Font.BOLD, java.awt.Color.WHITE);
        java.awt.Color headerBg = new java.awt.Color(16, 185, 129); // Emerald-500

        String[] headers = { "N° Socio", "Nombre", "Cédula", "Teléfono", "Sucursal", "Aporte", "Crédito", "V&V" };
        for (String header : headers) {
            com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(
                    new com.lowagie.text.Phrase(header, headerFont));
            cell.setBackgroundColor(headerBg);
            cell.setPadding(8);
            cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        // Data rows
        com.lowagie.text.Font dataFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 8);
        for (Socio socio : socios) {
            table.addCell(new com.lowagie.text.Phrase(socio.getNumeroSocio(), dataFont));
            table.addCell(new com.lowagie.text.Phrase(socio.getNombreCompleto(), dataFont));
            table.addCell(new com.lowagie.text.Phrase(socio.getCedula(), dataFont));
            table.addCell(
                    new com.lowagie.text.Phrase(socio.getTelefono() != null ? socio.getTelefono() : "-", dataFont));
            table.addCell(new com.lowagie.text.Phrase(
                    socio.getSucursal() != null ? socio.getSucursal().getNombre() : "-", dataFont));
            table.addCell(new com.lowagie.text.Phrase(socio.isAporteAlDia() ? "SI" : "NO", dataFont));
            table.addCell(new com.lowagie.text.Phrase(socio.isCreditoAlDia() ? "SI" : "NO", dataFont));
            table.addCell(new com.lowagie.text.Phrase(socio.isEstadoVozVoto() ? "SI" : "NO", dataFont));
        }

        document.add(table);

        // Footer
        com.lowagie.text.Paragraph footer = new com.lowagie.text.Paragraph(
                "Total: " + socios.size() + " socios | Generado: "
                        + java.time.LocalDateTime.now()
                                .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 10, com.lowagie.text.Font.ITALIC));
        footer.setSpacingBefore(20);
        footer.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
        document.add(footer);

        document.close();
    }

    // =========================================================================
    // ABM ENDPOINTS (Solo SUPER_ADMIN)
    // =========================================================================

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping
    public ResponseEntity<?> crearSocio(@RequestBody Socio socio, Authentication auth, HttpServletRequest request) {
        try {
            // Validar campos obligatorios
            if (socio.getNumeroSocio() == null || socio.getNombreCompleto() == null || socio.getCedula() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Número de socio, nombre y cédula son obligatorios"));
            }

            // Verificar duplicados
            if (socioRepository.findByNumeroSocio(socio.getNumeroSocio()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ya existe un socio con ese número"));
            }
            if (socioRepository.findByCedula(socio.getCedula()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ya existe un socio con esa cédula"));
            }

            Socio saved = socioRepository.save(socio);

            auditService.registrar("SOCIOS", "CREAR",
                    "Socio creado: " + saved.getNumeroSocio() + " - " + saved.getNombreCompleto(),
                    auth != null ? auth.getName() : "SYSTEM", request.getRemoteAddr());

            return ResponseEntity.ok(Map.of("message", "Socio creado exitosamente", "socio", saved));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarSocio(@PathVariable Long id, @RequestBody Socio socioData,
            Authentication auth, HttpServletRequest request) {
        return socioRepository.findById(id).map(socio -> {
            // Actualizar campos
            if (socioData.getNumeroSocio() != null)
                socio.setNumeroSocio(socioData.getNumeroSocio());
            if (socioData.getNombreCompleto() != null)
                socio.setNombreCompleto(socioData.getNombreCompleto());
            if (socioData.getCedula() != null)
                socio.setCedula(socioData.getCedula());
            if (socioData.getTelefono() != null)
                socio.setTelefono(socioData.getTelefono());

            socio.setAporteAlDia(socioData.isAporteAlDia());
            socio.setSolidaridadAlDia(socioData.isSolidaridadAlDia());
            socio.setFondoAlDia(socioData.isFondoAlDia());
            socio.setIncoopAlDia(socioData.isIncoopAlDia());
            socio.setCreditoAlDia(socioData.isCreditoAlDia());

            Socio updated = socioRepository.save(socio);

            auditService.registrar("SOCIOS", "MODIFICAR", "Socio modificado: " + updated.getNumeroSocio(),
                    auth != null ? auth.getName() : "SYSTEM", request.getRemoteAddr());

            return ResponseEntity.ok(Map.of("message", "Socio actualizado exitosamente", "socio", updated));
        }).orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> eliminarSocio(@PathVariable Long id, Authentication auth, HttpServletRequest request) {
        return socioRepository.findById(id).map(socio -> {
            String numeroSocio = socio.getNumeroSocio();
            String nombre = socio.getNombreCompleto();

            // Eliminar asistencias relacionadas
            asistenciaRepository.deleteBySocioId(id);

            // Eliminar de asignaciones
            jdbcTemplate.update("DELETE FROM asignaciones_socios WHERE socio_id = ?", id);

            socioRepository.delete(socio);

            auditService.registrar("SOCIOS", "ELIMINAR", "Socio eliminado: " + numeroSocio + " - " + nombre,
                    auth != null ? auth.getName() : "SYSTEM", request.getRemoteAddr());

            return ResponseEntity.ok(Map.of("message", "Socio eliminado exitosamente"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
