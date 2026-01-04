package com.asamblea.service;

import com.asamblea.dto.UsuarioActivityDto;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.awt.Color;

@Service
@RequiredArgsConstructor
public class ReporteExportService {

    // COLORES CORPORATIVOS & PREMIUM
    private static final Color COLOR_PRIMARY = new Color(16, 185, 129); // Emerald 500
    private static final Color COLOR_SECONDARY = new Color(6, 78, 59); // Emerald 900
    private static final Color COLOR_LIGHT = new Color(236, 253, 245); // Emerald 50
    private static final Color COLOR_BLUE = new Color(59, 130, 246);
    private static final Color COLOR_AMBER = new Color(245, 158, 11);
    private static final Color COLOR_INDIGO = new Color(99, 102, 241);
    private static final Color COLOR_TEAL = new Color(20, 184, 166);
    private static final Color COLOR_GRAY_TEXT = Color.DARK_GRAY;

    // FUENTES ESTANDARIZADAS
    private static final Font FONT_TITLE_COOP = new Font(Font.HELVETICA, 22, Font.BOLD, COLOR_SECONDARY);
    private static final Font FONT_SUBTITLE_COOP = new Font(Font.HELVETICA, 11, Font.ITALIC, COLOR_PRIMARY);
    private static final Font FONT_SYSTEM = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY);
    private static final Font FONT_REPORT_TITLE = new Font(Font.HELVETICA, 16, Font.BOLD, COLOR_SECONDARY);
    private static final Font FONT_REPORT_DESC = new Font(Font.HELVETICA, 11, Font.NORMAL, Color.GRAY);
    private static final Font FONT_HEADER_TABLE = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
    private static final Font FONT_BODY = new Font(Font.HELVETICA, 9, Font.NORMAL, COLOR_GRAY_TEXT);
    private static final Font FONT_BODY_BOLD = new Font(Font.HELVETICA, 9, Font.BOLD, COLOR_GRAY_TEXT);
    private static final Font FONT_BIG_NUMBER = new Font(Font.HELVETICA, 32, Font.BOLD, COLOR_SECONDARY);
    private static final Font FONT_SMALL_LABEL = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY);

    /**
     * MÉTODO GLOBAL PARA AGREGAR EL ENCABEZADO ESTÁNDAR
     * Cumple con: Logo, Nombre Coop, Título Reporte, Explicación.
     */
    private void addStandardHeader(Document document, String reportTitle, String reportDescription)
            throws DocumentException {
        // 1. Tabla Principal del Encabezado (Logo | Info Coop | Fecha)
        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[] { 1.2f, 4.5f, 2f });

        // --- A. LOGO ---
        PdfPCell logoCell;
        try {
            // Usar Spring ClassPathResource que funciona mejor en Docker/JAR
            // Prioridad: JPG (sin transparencia) funciona mejor con OpenPDF
            String[] paths = {
                    "images/logo_reducto_flat.jpg",
                    "images/logo_reducto_oficial.png",
                    "images/logo_cooperativa.png"
            };

            byte[] logoBytes = null;

            for (String path : paths) {
                try {
                    org.springframework.core.io.Resource resource = new org.springframework.core.io.ClassPathResource(
                            path);
                    if (resource.exists()) {
                        logoBytes = resource.getInputStream().readAllBytes();
                        System.out.println("✅ Logo cargado desde: " + path);
                        break;
                    }
                } catch (Exception e) {
                    System.out.println("⚠️ No se pudo cargar: " + path + " - " + e.getMessage());
                }
            }

            if (logoBytes != null && logoBytes.length > 0) {
                com.lowagie.text.Image logo = com.lowagie.text.Image.getInstance(logoBytes);
                logo.scaleToFit(80, 80);
                logo.setAlignment(Element.ALIGN_CENTER);

                logoCell = new PdfPCell();
                logoCell.addElement(logo);
                logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            } else {
                System.out.println("❌ No se encontró ningún logo, usando fallback");
                logoCell = new PdfPCell(new Phrase("CR", new Font(Font.HELVETICA, 28, Font.BOLD, Color.WHITE)));
                logoCell.setBackgroundColor(COLOR_PRIMARY);
            }
        } catch (Exception e) {
            e.printStackTrace();
            logoCell = new PdfPCell(new Phrase("ERR", new Font(Font.HELVETICA, 12, Font.BOLD, Color.RED)));
            logoCell.setBackgroundColor(Color.LIGHT_GRAY);
        }
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        logoCell.setFixedHeight(90);
        logoCell.setBorder(0);
        logoCell.setPadding(5);
        headerTable.addCell(logoCell);

        // --- B. INFORMACIÓN COOPERATIVA ---
        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(0);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        titleCell.setPaddingLeft(12);

        titleCell.addElement(new Paragraph("COOPERATIVA REDUCTO LTDA.", FONT_TITLE_COOP));
        titleCell.addElement(new Paragraph("de Microfinanza", FONT_SUBTITLE_COOP));
        titleCell.addElement(new Paragraph("Sistema Integrado de Gestión de Asambleas", FONT_SYSTEM));
        headerTable.addCell(titleCell);

        // --- C. FECHA DE GENERACIÓN ---
        PdfPCell dateCell = new PdfPCell();
        dateCell.setBorder(0);
        dateCell.setBackgroundColor(new Color(248, 250, 252)); // Slate 50
        dateCell.setPadding(10);
        dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        dateCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph dateLabel = new Paragraph("FECHA DE GENERACIÓN",
                new Font(Font.HELVETICA, 7, Font.BOLD, COLOR_PRIMARY));
        dateLabel.setAlignment(Element.ALIGN_RIGHT);
        dateCell.addElement(dateLabel);

        Paragraph dateP = new Paragraph(
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                new Font(Font.HELVETICA, 14, Font.BOLD, COLOR_SECONDARY));
        dateP.setAlignment(Element.ALIGN_RIGHT);
        dateCell.addElement(dateP);

        Paragraph timeP = new Paragraph(
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm")) + " hrs",
                new Font(Font.HELVETICA, 10, Font.NORMAL, Color.GRAY));
        timeP.setAlignment(Element.ALIGN_RIGHT);
        dateCell.addElement(timeP);
        headerTable.addCell(dateCell);

        document.add(headerTable);

        // 2. Línea Separadora Institucional (Colores de la marca)
        PdfPTable lineTable = new PdfPTable(4);
        lineTable.setWidthPercentage(100);
        lineTable.setSpacingBefore(10);
        lineTable.setSpacingAfter(15);

        // Segmentos de color
        addLineSegment(lineTable, COLOR_PRIMARY);
        addLineSegment(lineTable, COLOR_TEAL);
        addLineSegment(lineTable, COLOR_BLUE);
        addLineSegment(lineTable, COLOR_INDIGO);

        document.add(lineTable);

        // 3. TÍTULO Y DESCRIPCIÓN DEL REPORTE
        Paragraph pTitle = new Paragraph(reportTitle.toUpperCase(), FONT_REPORT_TITLE);
        pTitle.setSpacingAfter(4);
        document.add(pTitle);

        if (reportDescription != null && !reportDescription.isEmpty()) {
            Paragraph pDesc = new Paragraph(reportDescription, FONT_REPORT_DESC);
            pDesc.setSpacingAfter(20);
            document.add(pDesc);
        } else {
            document.add(new Paragraph(" ", FONT_REPORT_DESC)); // Espaciador si no hay descripción
        }
    }

    private void addLineSegment(PdfPTable table, Color color) {
        PdfPCell line = new PdfPCell();
        line.setBackgroundColor(color);
        line.setFixedHeight(4);
        line.setBorder(0);
        table.addCell(line);
    }

    private void addFooter(PdfWriter writer, Document document) {
        writer.setPageEvent(new com.lowagie.text.pdf.PdfPageEventHelper() {
            public void onEndPage(PdfWriter writer, Document document) {
                PdfPCell cell = new PdfPCell(new Phrase(
                        "Página " + document.getPageNumber() + " - Generado por Sistema SIGA • Cooperativa Reducto",
                        new Font(Font.HELVETICA, 8, Font.NORMAL, Color.GRAY)));
                cell.setBorder(0);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                PdfPTable table = new PdfPTable(1);
                table.setTotalWidth(document.getPageSize().getWidth() - 60); // Ancho dinámico
                table.addCell(cell);
                table.writeSelectedRows(0, -1, 30, 25, writer.getDirectContent());
            }
        });
    }

    // ==========================================
    // MÉTODO 1: REPORTE DE ACTIVIDAD
    // ==========================================
    public byte[] generarPdfActividad(List<UsuarioActivityDto> data, String titulo) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 30, 30, 30, 35);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            addFooter(writer, document); // Footer Paginado automatico

            document.open();

            // USAMOS EL HEADER GLOBAL
            addStandardHeader(document,
                    titulo != null ? titulo : "REPORTE DE ACTIVIDAD",
                    "Detalle completo de usuarios, tiempos de conexión, roles y estadísticas de actividad.");

            // TABLA DE DATOS
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 0.5f, 3f, 1.5f, 1.5f, 2f, 1f, 1.5f, 1f });
            table.setHeaderRows(1);

            String[] headers = { "#", "Nombre Completo", "Rol", "Sucursal", "Último Ingreso", "Acc.", "Tiempo",
                    "Reg." };
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, FONT_HEADER_TABLE));
                cell.setBackgroundColor(COLOR_PRIMARY);
                cell.setBorderColor(Color.WHITE);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(8);
                table.addCell(cell);
            }

            int i = 1;
            boolean alternate = false;
            Color colorAlt = new Color(241, 245, 249);

            for (UsuarioActivityDto user : data) {
                Color bgColor = alternate ? colorAlt : Color.WHITE;
                addCell(table, String.valueOf(i++), FONT_BODY, bgColor, Element.ALIGN_CENTER);
                addCell(table, user.getNombreCompleto(), FONT_BODY_BOLD, bgColor, Element.ALIGN_LEFT);
                addCell(table, user.getRol(), FONT_BODY, bgColor, Element.ALIGN_CENTER);
                addCell(table, user.getSucursal(), FONT_BODY, bgColor, Element.ALIGN_CENTER);
                addCell(table, user.getLastSeenRelative(), FONT_BODY, bgColor, Element.ALIGN_CENTER);
                addCell(table, String.valueOf(user.getLoginCount()), FONT_BODY, bgColor, Element.ALIGN_CENTER);
                addCell(table, user.getTimeOnlineFormatted(), FONT_BODY, bgColor, Element.ALIGN_CENTER);
                addCell(table, String.valueOf(user.getTotalRegistros() + user.getTotalAsignaciones()), FONT_BODY_BOLD,
                        bgColor, Element.ALIGN_CENTER);
                alternate = !alternate;
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
        return out.toByteArray();
    }

    // ==========================================
    // MÉTODO 2: REPORTE DE ASIGNACIONES DIARIAS
    // ==========================================
    public byte[] generarPdfAsignacionesDiarias(List<Map<String, Object>> data, int dias) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 30, 30, 25, 35);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            addFooter(writer, document);

            document.open();

            // USAMOS EL HEADER GLOBAL
            addStandardHeader(document,
                    "REPORTE DE ASIGNACIONES DIARIAS",
                    "Análisis detallado de tendencias de asignación en los últimos " + dias + " días.");

            // 1. STAT CARDS
            int total = 0;
            int maxTotal = 0;
            String fechaMax = "";
            for (Map<String, Object> row : data) {
                int val = Integer.parseInt(row.get("total").toString());
                total += val;
                if (val > maxTotal) {
                    maxTotal = val;
                    fechaMax = row.get("fecha").toString();
                }
            }
            int promedio = data.size() > 0 ? total / data.size() : 0;

            PdfPTable statsTable = new PdfPTable(3);
            statsTable.setWidthPercentage(100);
            statsTable.setSpacingAfter(20);

            statsTable.addCell(
                    createStatCard("📈 TOTAL ASIGNACIONES", String.valueOf(total), "En " + dias + " días", COLOR_BLUE));
            statsTable.addCell(createStatCard("📊 PROMEDIO DIARIO", String.valueOf(promedio), "Asignaciones por día",
                    COLOR_PRIMARY));
            statsTable.addCell(createStatCard("🏆 DÍA CON MÁS", String.valueOf(maxTotal), fechaMax, COLOR_AMBER));

            document.add(statsTable);

            // 2. GRÁFICO DE BARRAS (Simulado)
            Paragraph chartTitle = new Paragraph("TENDENCIA VISUAL",
                    new Font(Font.HELVETICA, 12, Font.BOLD, COLOR_SECONDARY));
            chartTitle.setSpacingAfter(10);
            document.add(chartTitle);

            renderBarChart(document, data, maxTotal);

            // 3. TABLA DETALLADA
            Paragraph tableTitle = new Paragraph("DETALLE POR DÍA",
                    new Font(Font.HELVETICA, 12, Font.BOLD, COLOR_SECONDARY));
            tableTitle.setSpacingBefore(15);
            tableTitle.setSpacingAfter(10);
            document.add(tableTitle);

            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(60);
            table.setHorizontalAlignment(Element.ALIGN_LEFT);
            table.setWidths(new float[] { 0.5f, 1.5f, 1f });

            addCellAsignaciones(table, "#", FONT_HEADER_TABLE, COLOR_PRIMARY, Element.ALIGN_CENTER);
            addCellAsignaciones(table, "Fecha", FONT_HEADER_TABLE, COLOR_PRIMARY, Element.ALIGN_CENTER);
            addCellAsignaciones(table, "Total Asignaciones", FONT_HEADER_TABLE, COLOR_PRIMARY, Element.ALIGN_CENTER);

            int idx = 1;
            boolean alternate = false;
            Color altColor = new Color(240, 253, 244);

            for (Map<String, Object> row : data) {
                Color bg = alternate ? altColor : Color.WHITE;
                addCellAsignaciones(table, String.valueOf(idx++), FONT_BODY, bg, Element.ALIGN_CENTER);
                addCellAsignaciones(table, row.get("fecha").toString(), FONT_BODY, bg, Element.ALIGN_CENTER);
                addCellAsignaciones(table, row.get("total").toString(), FONT_BODY_BOLD, bg, Element.ALIGN_CENTER);
                alternate = !alternate;
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }

    // --- HELPERS PRIVADOS ---

    private void renderBarChart(Document document, List<Map<String, Object>> data, int maxTotal)
            throws DocumentException {
        PdfPTable chartTable = new PdfPTable(data.size() > 0 ? Math.min(data.size(), 15) : 1);
        chartTable.setWidthPercentage(100);
        chartTable.setSpacingAfter(15);
        int chartMax = maxTotal > 0 ? maxTotal : 1;
        List<Map<String, Object>> chartData = data.size() > 15 ? data.subList(data.size() - 15, data.size()) : data;

        for (Map<String, Object> row : chartData) {
            int val = Integer.parseInt(row.get("total").toString());
            int barHeight = (int) ((val * 1.0 / chartMax) * 80); // Max height 80
            barHeight = Math.max(barHeight, 5);

            PdfPCell barContainer = new PdfPCell();
            barContainer.setFixedHeight(95);
            barContainer.setBorder(0);
            barContainer.setVerticalAlignment(Element.ALIGN_BOTTOM);

            PdfPTable innerBar = new PdfPTable(1);
            innerBar.setWidthPercentage(80);

            // Valor number
            PdfPCell valCell = new PdfPCell(
                    new Phrase(String.valueOf(val), new Font(Font.HELVETICA, 7, Font.BOLD, COLOR_SECONDARY)));
            valCell.setBorder(0);
            valCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            innerBar.addCell(valCell);

            // Barra color
            PdfPCell colorBar = new PdfPCell();
            colorBar.setBackgroundColor((val == maxTotal) ? COLOR_AMBER : COLOR_BLUE);
            colorBar.setFixedHeight(barHeight);
            colorBar.setBorder(0);
            innerBar.addCell(colorBar);

            barContainer.addElement(innerBar);

            // Fecha Label abajo
            String dateStr = row.get("fecha").toString();
            String shortDate = dateStr.length() >= 10 ? dateStr.substring(5) : dateStr;
            Paragraph dateP = new Paragraph(shortDate, new Font(Font.HELVETICA, 6, Font.NORMAL, Color.GRAY));
            dateP.setAlignment(Element.ALIGN_CENTER);
            barContainer.addElement(dateP);

            chartTable.addCell(barContainer);
        }
        document.add(chartTable);
    }

    private PdfPCell createStatCard(String title, String value, String subtitle, Color accentColor) {
        PdfPCell card = new PdfPCell();
        card.setBorder(0);
        card.setPadding(10);
        card.setBackgroundColor(new Color(248, 250, 252));
        card.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph titleP = new Paragraph(title, new Font(Font.HELVETICA, 9, Font.BOLD, accentColor));
        titleP.setAlignment(Element.ALIGN_CENTER);
        card.addElement(titleP);

        Paragraph valueP = new Paragraph(value, FONT_BIG_NUMBER);
        valueP.setAlignment(Element.ALIGN_CENTER);
        valueP.setSpacingBefore(5);
        card.addElement(valueP);

        Paragraph subP = new Paragraph(subtitle, FONT_SMALL_LABEL);
        subP.setAlignment(Element.ALIGN_CENTER);
        card.addElement(subP);
        return card;
    }

    private void addCell(PdfPTable table, String text, Font font, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "-", font));
        cell.setBackgroundColor(bg);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(6);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setBorderWidth(0.5f);
        table.addCell(cell);
    }

    private void addCellAsignaciones(PdfPTable table, String text, Font font, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setHorizontalAlignment(align);
        cell.setPadding(8);
        cell.setBorderColor(new Color(226, 232, 240));
        table.addCell(cell);
    }

    public byte[] generarExcelRankings(List<Map<String, Object>> asesores, List<Map<String, Object>> usuarios,
            List<Map<String, Object>> sucursales) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            // Estilos
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.SEA_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont font = workbook.createFont();
            font.setColor(IndexedColors.WHITE.getIndex());
            font.setBold(true);
            headerStyle.setFont(font);

            // 1. Pestaña Asesores
            Sheet sheet1 = workbook.createSheet("Top Asesores VyV");
            Row row1 = sheet1.createRow(0);
            String[] headers1 = { "Puesto", "Asesor", "Sucursal", "Total VyV" };
            for (int i = 0; i < headers1.length; i++) {
                Cell cell = row1.createCell(i);
                cell.setCellValue(headers1[i]);
                cell.setCellStyle(headerStyle);
            }
            int rowIdx1 = 1;
            for (Map<String, Object> item : asesores) {
                Row row = sheet1.createRow(rowIdx1++);
                row.createCell(0).setCellValue(rowIdx1 - 1);
                row.createCell(1).setCellValue(String.valueOf(item.get("nombre")));
                row.createCell(2).setCellValue(String.valueOf(item.get("sucursal")));
                row.createCell(3).setCellValue(((Number) item.get("total_vyv")).intValue());
            }
            for (int i = 0; i < headers1.length; i++)
                sheet1.autoSizeColumn(i);

            // 2. Pestaña Usuarios Generales
            Sheet sheet2 = workbook.createSheet("Top General Usuarios VyV");
            Row row2 = sheet2.createRow(0);
            String[] headers2 = { "Puesto", "Usuario", "Rol", "Sucursal", "Total VyV" };
            for (int i = 0; i < headers2.length; i++) {
                Cell cell = row2.createCell(i);
                cell.setCellValue(headers2[i]);
                cell.setCellStyle(headerStyle);
            }
            int rowIdx2 = 1;
            for (Map<String, Object> item : usuarios) {
                Row row = sheet2.createRow(rowIdx2++);
                row.createCell(0).setCellValue(rowIdx2 - 1);
                row.createCell(1).setCellValue(String.valueOf(item.get("nombre")));
                row.createCell(2).setCellValue(String.valueOf(item.get("rol")).replace("_", " "));
                row.createCell(3).setCellValue(String.valueOf(item.get("sucursal")));
                row.createCell(4).setCellValue(((Number) item.get("total_vyv")).intValue());
            }
            for (int i = 0; i < headers2.length; i++)
                sheet2.autoSizeColumn(i);

            // 3. Pestaña Sucursales
            Sheet sheet3 = workbook.createSheet("Top Sucursales VyV");
            Row row3 = sheet3.createRow(0);
            String[] headers3 = { "Puesto", "Sucursal", "Total VyV" };
            for (int i = 0; i < headers3.length; i++) {
                Cell cell = row3.createCell(i);
                cell.setCellValue(headers3[i]);
                cell.setCellStyle(headerStyle);
            }
            int rowIdx3 = 1;
            for (Map<String, Object> item : sucursales) {
                Row row = sheet3.createRow(rowIdx3++);
                row.createCell(0).setCellValue(rowIdx3 - 1);
                row.createCell(1).setCellValue(String.valueOf(item.get("sucursal")));
                row.createCell(2).setCellValue(((Number) item.get("total_vyv")).intValue());
            }
            for (int i = 0; i < headers3.length; i++)
                sheet3.autoSizeColumn(i);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }

    public byte[] generarExcelActividad(List<UsuarioActivityDto> data, String titulo) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Datos");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Usuario");
            header.createCell(1).setCellValue("Eventos");
            header.createCell(2).setCellValue("Última Conexión");

            int rowIdx = 1;
            for (UsuarioActivityDto item : data) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(item.getNombreCompleto());
                row.createCell(1).setCellValue(item.getLoginCount());
                row.createCell(2).setCellValue(item.getLastLogin() != null ? item.getLastLogin().toString() : "-");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            return new byte[0];
        }
    }

    public byte[] generarExcelAsignacionesDiarias(List<Map<String, Object>> data, int dias) {
        StringBuilder csv = new StringBuilder();
        csv.append("Fecha,Total Asignaciones\n");
        for (Map<String, Object> row : data) {
            csv.append(row.get("fecha")).append(",").append(row.get("total")).append("\n");
        }
        return csv.toString().getBytes();
    }

    // ==========================================
    // MÉTODO 3: REPORTE DE ASESORES
    // ==========================================
    public byte[] generarPdfAsesores(List<Map<String, Object>> asesores, Map<String, Object> resumen) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 30, 30, 30, 35);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            addFooter(writer, document);

            document.open();

            // HEADER ESTÁNDAR
            addStandardHeader(document,
                    "REPORTE DE CUMPLIMIENTO DE ASESORES",
                    "Estado de avance de asesores hacia meta mínima (20) y meta general (50).");

            // TARJETAS DE RESUMEN
            int total = ((Number) resumen.get("total")).intValue();
            int cumplieronMeta = ((Number) resumen.get("cumplieronMeta")).intValue();
            int cumplieronMinimo = ((Number) resumen.get("cumplieronMinimo")).intValue();
            int sinMinimo = ((Number) resumen.get("sinMinimo")).intValue();

            PdfPTable statsTable = new PdfPTable(4);
            statsTable.setWidthPercentage(100);
            statsTable.setSpacingAfter(20);

            statsTable.addCell(createStatCard("📊 TOTAL ASESORES", String.valueOf(total), "Activos", COLOR_BLUE));
            statsTable.addCell(createStatCard("✅ CUMPLIERON META", String.valueOf(cumplieronMeta), "≥50 registros",
                    COLOR_PRIMARY));
            statsTable.addCell(createStatCard("⚠️ CUMPLIERON MÍNIMO", String.valueOf(cumplieronMinimo),
                    "20-49 registros", COLOR_AMBER));
            statsTable.addCell(
                    createStatCard("❌ SIN MÍNIMO", String.valueOf(sinMinimo), "<20 registros", new Color(239, 68, 68)));

            document.add(statsTable);

            // TABLA DE DATOS
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 0.5f, 2.5f, 1.5f, 1f, 1f, 1f, 1.5f });
            table.setHeaderRows(1);

            String[] headers = { "#", "Nombre Completo", "Sucursal", "Registrados", "Falta Mín.", "Falta Meta",
                    "Estado" };
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, FONT_HEADER_TABLE));
                cell.setBackgroundColor(COLOR_PRIMARY);
                cell.setBorderColor(Color.WHITE);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(8);
                table.addCell(cell);
            }

            int i = 1;
            boolean alternate = false;
            Color colorAlt = new Color(241, 245, 249);

            for (Map<String, Object> asesor : asesores) {
                Color bgColor = alternate ? colorAlt : Color.WHITE;

                addCell(table, String.valueOf(i++), FONT_BODY, bgColor, Element.ALIGN_CENTER);
                addCell(table, (String) asesor.get("nombreCompleto"), FONT_BODY_BOLD, bgColor, Element.ALIGN_LEFT);
                addCell(table, (String) asesor.get("sucursal"), FONT_BODY, bgColor, Element.ALIGN_CENTER);

                long registrados = ((Number) asesor.get("registrados")).longValue();
                int faltaMinimo = ((Number) asesor.get("faltaMinimo")).intValue();
                int faltaMeta = ((Number) asesor.get("faltaMeta")).intValue();
                String estado = (String) asesor.get("estado");

                // Color de registrados según nivel
                Font fontReg = new Font(Font.HELVETICA, 9, Font.BOLD);
                if (registrados >= 50) {
                    fontReg.setColor(COLOR_PRIMARY);
                } else if (registrados >= 20) {
                    fontReg.setColor(COLOR_AMBER);
                } else {
                    fontReg.setColor(new Color(239, 68, 68));
                }
                addCell(table, String.valueOf(registrados), fontReg, bgColor, Element.ALIGN_CENTER);

                // Falta mínimo (solo si > 0)
                String faltaMinStr = faltaMinimo > 0 ? String.valueOf(faltaMinimo) : "-";
                addCell(table, faltaMinStr, FONT_BODY, bgColor, Element.ALIGN_CENTER);

                // Falta meta (solo si > 0)
                String faltaMetaStr = faltaMeta > 0 ? String.valueOf(faltaMeta) : "-";
                addCell(table, faltaMetaStr, FONT_BODY, bgColor, Element.ALIGN_CENTER);

                // Estado con color
                Font fontEstado = new Font(Font.HELVETICA, 9, Font.BOLD);
                if (estado.contains("✅")) {
                    fontEstado.setColor(COLOR_PRIMARY);
                } else if (estado.contains("⚠️")) {
                    fontEstado.setColor(COLOR_AMBER);
                } else {
                    fontEstado.setColor(new Color(239, 68, 68));
                }
                addCell(table, estado, fontEstado, bgColor, Element.ALIGN_CENTER);

                alternate = !alternate;
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
        return out.toByteArray();
    }

    public byte[] generarPdfRankings(String type, List<Map<String, Object>> asesores,
            List<Map<String, Object>> usuarios, List<Map<String, Object>> sucursales) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 30, 30, 30, 35);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            addFooter(writer, document);
            document.open();

            if ("all".equals(type) || "asesores".equals(type)) {
                addStandardHeader(document, "RANKING TOP 10 - ASESORES (VyV)",
                        "Asesores de crédito con mayor vinculación de socios habilitados.");
                renderRankingSection(document, asesores, "Asesor", "sucursal", COLOR_PRIMARY);
                if ("all".equals(type))
                    document.newPage();
            }

            if ("all".equals(type) || "usuarios".equals(type)) {
                addStandardHeader(document, "RANKING TOP 10 - USUARIOS GENERAL (VyV)",
                        "Ranking general de vinculación por usuario (todos los roles).");
                renderRankingSection(document, usuarios, "Usuario", "rol", COLOR_BLUE);
                if ("all".equals(type))
                    document.newPage();
            }

            if ("all".equals(type) || "sucursales".equals(type)) {
                addStandardHeader(document, "RANKING TOP 10 - SUCURSALES (VyV)",
                        "Productividad total de socios habilitados acumulada por sucursal.");
                renderRankingSection(document, sucursales, "Sucursal", null, COLOR_AMBER);
            }

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }

    private void renderRankingSection(Document document, List<Map<String, Object>> data, String labelName,
            String subLabelKey, Color color) throws DocumentException {
        if (data == null || data.isEmpty()) {
            document.add(new Paragraph("No hay datos disponibles para este ranking.", FONT_BODY));
            return;
        }

        // 1. Chart
        Paragraph chartTitle = new Paragraph("VISUALIZACIÓN DE RENDIMIENTO",
                new Font(Font.HELVETICA, 12, Font.BOLD, COLOR_SECONDARY));
        chartTitle.setSpacingAfter(10);
        chartTitle.setSpacingBefore(10);
        document.add(chartTitle);

        int maxVal = data.stream().mapToInt(m -> ((Number) m.get("total_vyv")).intValue()).max().orElse(1);

        PdfPTable chartTable = new PdfPTable(2);
        chartTable.setWidthPercentage(100);
        chartTable.setWidths(new float[] { 3f, 7f });

        for (int i = 0; i < Math.min(data.size(), 10); i++) {
            Map<String, Object> item = data.get(i);
            String name = String.valueOf(item.get(labelName != null ? labelName.toLowerCase() : "sucursal"));
            int val = ((Number) item.get("total_vyv")).intValue();
            float pct = (float) val / maxVal;

            // Label
            PdfPCell labelCell = new PdfPCell(
                    new Phrase(name, new Font(Font.HELVETICA, 8, Font.NORMAL, COLOR_GRAY_TEXT)));
            labelCell.setBorder(0);
            labelCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            labelCell.setPaddingBottom(5);
            chartTable.addCell(labelCell);

            // Bar
            PdfPCell barCell = new PdfPCell();
            barCell.setBorder(0);
            barCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            barCell.setPaddingBottom(5);

            PdfPTable barContainer = new PdfPTable(2);
            barContainer.setWidthPercentage(100);
            barContainer.setWidths(new float[] { pct, 1 - pct });

            PdfPCell activeBar = new PdfPCell(
                    new Phrase(String.valueOf(val), new Font(Font.HELVETICA, 7, Font.BOLD, Color.WHITE)));
            activeBar.setBackgroundColor(color);
            activeBar.setBorder(0);
            activeBar.setPaddingLeft(5);
            activeBar.setFixedHeight(14f);
            activeBar.setVerticalAlignment(Element.ALIGN_MIDDLE);
            barContainer.addCell(activeBar);

            PdfPCell emptyBar = new PdfPCell();
            emptyBar.setBorder(0);
            barContainer.addCell(emptyBar);

            barCell.addElement(barContainer);
            chartTable.addCell(barCell);
        }
        document.add(chartTable);

        // 2. Table
        Paragraph tableTitle = new Paragraph("TABLA DETALLADA",
                new Font(Font.HELVETICA, 12, Font.BOLD, COLOR_SECONDARY));
        tableTitle.setSpacingBefore(15);
        tableTitle.setSpacingAfter(10);
        document.add(tableTitle);

        boolean hasSub = subLabelKey != null;
        PdfPTable table = new PdfPTable(hasSub ? 4 : 3);
        table.setWidthPercentage(100);
        if (hasSub)
            table.setWidths(new float[] { 0.5f, 4f, 2f, 1f });
        else
            table.setWidths(new float[] { 0.5f, 6f, 1f });

        addCell(table, "#", FONT_HEADER_TABLE, COLOR_SECONDARY, Element.ALIGN_CENTER);
        addCell(table, labelName, FONT_HEADER_TABLE, COLOR_SECONDARY, Element.ALIGN_CENTER);
        if (hasSub)
            addCell(table, subLabelKey.toUpperCase(), FONT_HEADER_TABLE, COLOR_SECONDARY, Element.ALIGN_CENTER);
        addCell(table, "TOTAL VyV", FONT_HEADER_TABLE, COLOR_SECONDARY, Element.ALIGN_CENTER);

        int rank = 1;
        for (Map<String, Object> item : data) {
            Color rowBg = (rank % 2 == 0) ? new Color(248, 250, 252) : Color.WHITE;
            addCell(table, String.valueOf(rank++), FONT_BODY, rowBg, Element.ALIGN_CENTER);
            addCell(table, String.valueOf(item.get(labelName.toLowerCase())), FONT_BODY_BOLD, rowBg,
                    Element.ALIGN_LEFT);
            if (hasSub) {
                String subVal = String.valueOf(item.get(subLabelKey));
                if ("rol".equals(subLabelKey))
                    subVal = subVal.replace("_", " ");
                addCell(table, subVal, FONT_BODY, rowBg, Element.ALIGN_CENTER);
            }
            addCell(table, String.valueOf(item.get("total_vyv")), FONT_BODY_BOLD, rowBg, Element.ALIGN_CENTER);
        }
        document.add(table);
    }
}
