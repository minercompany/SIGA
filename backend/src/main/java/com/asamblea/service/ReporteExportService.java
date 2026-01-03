package com.asamblea.service;

import com.asamblea.dto.UsuarioActivityDto;
import com.lowagie.text.Document;
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

    public byte[] generarPdfActividad(List<UsuarioActivityDto> data, String titulo) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // A4 Horizontal (Landscape) para mayor amplitud
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 30);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            // Evento para pie de página (páginas)
            writer.setPageEvent(new com.lowagie.text.pdf.PdfPageEventHelper() {
                public void onEndPage(PdfWriter writer, Document document) {
                    PdfPCell cell = new PdfPCell(new Phrase("Página " + document.getPageNumber(),
                            new Font(Font.HELVETICA, 8, Font.NORMAL, Color.GRAY)));
                    cell.setBorder(0);
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    PdfPTable table = new PdfPTable(1);
                    table.setTotalWidth(527);
                    table.addCell(cell);
                    table.writeSelectedRows(0, -1, 34, 30, writer.getDirectContent());
                }
            });

            document.open();

            // Colores Premium
            Color colorPrimary = new Color(16, 185, 129); // Emerald 500
            Color colorSecondary = new Color(6, 78, 59); // Emerald 900
            Color colorLight = new Color(236, 253, 245); // Emerald 50
            Color colorHeaderTable = new Color(241, 245, 249); // Slate 100

            // Fuentes
            Font fontTitle = new Font(Font.HELVETICA, 22, Font.BOLD, colorSecondary);
            Font fontSubtitle = new Font(Font.HELVETICA, 14, Font.NORMAL, Color.DARK_GRAY);
            Font fontHeader = new Font(Font.HELVETICA, 10, Font.BOLD, colorSecondary);
            Font fontBody = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);
            Font fontBodyBold = new Font(Font.HELVETICA, 9, Font.BOLD, Color.DARK_GRAY);

            // LOGO Y ENCABEZADO
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 1f, 4f });

            // Simulación de Logo (Círculo con Texto)
            PdfPCell logoCell = new PdfPCell(new Phrase("CR", new Font(Font.HELVETICA, 24, Font.BOLD, Color.WHITE)));
            logoCell.setBackgroundColor(colorPrimary);
            logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoCell.setFixedHeight(50);
            logoCell.setBorder(0);
            headerTable.addCell(logoCell);

            PdfPCell titleCell = new PdfPCell();
            titleCell.setBorder(0);
            titleCell.addElement(new Paragraph("COOPERATIVA REDUCTO LTDA.", fontTitle));
            titleCell.addElement(new Paragraph("Sistema Integrado de Gestión de Asambleas",
                    new Font(Font.HELVETICA, 10, Font.ITALIC, Color.GRAY)));
            titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            titleCell.setPaddingLeft(15);
            headerTable.addCell(titleCell);

            document.add(headerTable);

            // Espacio
            Paragraph space = new Paragraph(" ");
            space.setSpacingAfter(10);
            document.add(space);

            // Título del Reporte
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[] { 7f, 3f });

            PdfPCell reportTitle = new PdfPCell(new Phrase(titulo.toUpperCase(), fontSubtitle));
            reportTitle.setBorder(0);
            reportTitle.setPaddingBottom(10);
            metaTable.addCell(reportTitle);

            PdfPCell reportDate = new PdfPCell(new Phrase(
                    "Generado: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                    new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY)));
            reportDate.setBorder(0);
            reportDate.setHorizontalAlignment(Element.ALIGN_RIGHT);
            metaTable.addCell(reportDate);

            document.add(metaTable);
            document.add(space);

            // TABLA DE DATOS
            // Columnas: #, Nombre, Rol, Sucursal, Último Ingreso, Conteo, Tiempo, Registros
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 0.5f, 3f, 1.5f, 1.5f, 2f, 1f, 1.5f, 1f });
            table.setHeaderRows(1);

            String[] headers = { "#", "Nombre Completo", "Rol", "Sucursal", "Último Ingreso", "Acc.", "Tiempo Online",
                    "Reg." };
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, fontHeader));
                cell.setBackgroundColor(colorLight);
                cell.setBorderColor(colorPrimary);
                cell.setBorderWidthBottom(1.5f);
                cell.setBorderWidthTop(0);
                cell.setBorderWidthLeft(0);
                cell.setBorderWidthRight(0);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(8);
                table.addCell(cell);
            }

            int i = 1;
            boolean alternate = false;
            for (UsuarioActivityDto user : data) {
                Color bgColor = alternate ? colorHeaderTable : Color.WHITE;

                addCell(table, String.valueOf(i++), fontBody, bgColor, Element.ALIGN_CENTER);
                addCell(table, user.getNombreCompleto(), fontBodyBold, bgColor, Element.ALIGN_LEFT);
                addCell(table, user.getRol(), fontBody, bgColor, Element.ALIGN_CENTER);
                addCell(table, user.getSucursal(), fontBody, bgColor, Element.ALIGN_CENTER);
                addCell(table, user.getLastSeenRelative(), fontBody, bgColor, Element.ALIGN_CENTER);
                addCell(table, String.valueOf(user.getLoginCount()), fontBody, bgColor, Element.ALIGN_CENTER);
                addCell(table, user.getTimeOnlineFormatted(), fontBody, bgColor, Element.ALIGN_CENTER);
                addCell(table, String.valueOf(user.getTotalRegistros() + user.getTotalAsignaciones()), fontBodyBold,
                        bgColor, Element.ALIGN_CENTER);

                alternate = !alternate;
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }

    public byte[] generarPdfAsignacionesDiarias(List<Map<String, Object>> data, int dias) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // A4 Horizontal para mejor visualización de gráficos
            Document document = new Document(PageSize.A4.rotate(), 30, 30, 25, 25);
            PdfWriter writer = PdfWriter.getInstance(document, out);

            // Footer con número de página
            writer.setPageEvent(new com.lowagie.text.pdf.PdfPageEventHelper() {
                public void onEndPage(PdfWriter writer, Document document) {
                    PdfPCell cell = new PdfPCell(new Phrase(
                            "Página " + document.getPageNumber() + " - Generado por Sistema SIGA • Cooperativa Reducto",
                            new Font(Font.HELVETICA, 8, Font.NORMAL, Color.GRAY)));
                    cell.setBorder(0);
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    PdfPTable table = new PdfPTable(1);
                    table.setTotalWidth(750);
                    table.addCell(cell);
                    table.writeSelectedRows(0, -1, 45, 20, writer.getDirectContent());
                }
            });

            document.open();

            // Colores Premium - Paleta extendida
            Color colorPrimary = new Color(16, 185, 129); // Emerald 500
            Color colorSecondary = new Color(6, 78, 59); // Emerald 900
            Color colorLight = new Color(236, 253, 245); // Emerald 50
            Color colorBlue = new Color(59, 130, 246); // Blue 500
            Color colorAmber = new Color(245, 158, 11); // Amber 500
            Color colorIndigo = new Color(99, 102, 241); // Indigo 500
            Color colorRose = new Color(244, 63, 94); // Rose 500
            Color colorTeal = new Color(20, 184, 166); // Teal 500
            Color colorPurple = new Color(168, 85, 247); // Purple 500
            Color colorOrange = new Color(249, 115, 22); // Orange 500

            // Fuentes
            Font fontTitle = new Font(Font.HELVETICA, 22, Font.BOLD, colorSecondary);
            Font fontSubtitle = new Font(Font.HELVETICA, 11, Font.NORMAL, Color.GRAY);
            Font fontSectionTitle = new Font(Font.HELVETICA, 13, Font.BOLD, colorSecondary);
            Font fontHeader = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
            Font fontData = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
            Font fontDataBold = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);
            Font fontBigNumber = new Font(Font.HELVETICA, 32, Font.BOLD, colorSecondary);
            Font fontSmallLabel = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY);

            // ══════════════════════════════════════════════════════════════
            // HEADER CON LOGO REAL
            // ══════════════════════════════════════════════════════════════
            PdfPTable headerTable = new PdfPTable(3);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 1.2f, 4.5f, 2f });

            // Cargar Logo Real
            PdfPCell logoCell;
            try {
                java.io.InputStream logoStream = getClass().getResourceAsStream("/images/logo_cooperativa.png");
                if (logoStream != null) {
                    byte[] logoBytes = logoStream.readAllBytes();
                    com.lowagie.text.Image logo = com.lowagie.text.Image.getInstance(logoBytes);
                    logo.scaleToFit(70, 70);
                    logoCell = new PdfPCell(logo);
                    logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    logoStream.close();
                } else {
                    // Fallback: texto CR si no encuentra el logo
                    logoCell = new PdfPCell(new Phrase("CR", new Font(Font.HELVETICA, 28, Font.BOLD, Color.WHITE)));
                    logoCell.setBackgroundColor(colorPrimary);
                    logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                }
            } catch (Exception e) {
                // Fallback en caso de error
                logoCell = new PdfPCell(new Phrase("CR", new Font(Font.HELVETICA, 28, Font.BOLD, Color.WHITE)));
                logoCell.setBackgroundColor(colorPrimary);
                logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            }
            logoCell.setFixedHeight(75);
            logoCell.setBorder(0);
            logoCell.setPadding(5);
            headerTable.addCell(logoCell);

            // Título de la cooperativa
            PdfPCell titleCell = new PdfPCell();
            titleCell.setBorder(0);
            titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            titleCell.setPaddingLeft(10);

            Paragraph coopName = new Paragraph("COOPERATIVA REDUCTO LTDA.", fontTitle);
            titleCell.addElement(coopName);

            Paragraph microfinanza = new Paragraph("de Microfinanza",
                    new Font(Font.HELVETICA, 11, Font.ITALIC, colorPrimary));
            titleCell.addElement(microfinanza);

            Paragraph systemName = new Paragraph("Sistema Integrado de Gestión de Asambleas",
                    new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY));
            titleCell.addElement(systemName);
            headerTable.addCell(titleCell);

            // Fecha de generación con estilo
            PdfPCell dateCell = new PdfPCell();
            dateCell.setBorder(0);
            dateCell.setBackgroundColor(new Color(248, 250, 252)); // Slate 50
            dateCell.setPadding(10);
            dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            dateCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

            Paragraph dateLabel = new Paragraph("FECHA DE GENERACIÓN",
                    new Font(Font.HELVETICA, 7, Font.BOLD, colorPrimary));
            dateLabel.setAlignment(Element.ALIGN_RIGHT);
            dateCell.addElement(dateLabel);

            Paragraph dateP = new Paragraph(
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    new Font(Font.HELVETICA, 14, Font.BOLD, colorSecondary));
            dateP.setAlignment(Element.ALIGN_RIGHT);
            dateCell.addElement(dateP);

            Paragraph timeP = new Paragraph(
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm")) + " hrs",
                    new Font(Font.HELVETICA, 10, Font.NORMAL, Color.GRAY));
            timeP.setAlignment(Element.ALIGN_RIGHT);
            dateCell.addElement(timeP);
            headerTable.addCell(dateCell);

            document.add(headerTable);

            // Línea separadora con gradiente simulado
            PdfPTable lineTable = new PdfPTable(4);
            lineTable.setWidthPercentage(100);
            lineTable.setSpacingBefore(10);
            lineTable.setSpacingAfter(15);

            PdfPCell line1 = new PdfPCell();
            line1.setBackgroundColor(colorPrimary);
            line1.setFixedHeight(4);
            line1.setBorder(0);
            lineTable.addCell(line1);

            PdfPCell line2 = new PdfPCell();
            line2.setBackgroundColor(colorTeal);
            line2.setFixedHeight(4);
            line2.setBorder(0);
            lineTable.addCell(line2);

            PdfPCell line3 = new PdfPCell();
            line3.setBackgroundColor(colorBlue);
            line3.setFixedHeight(4);
            line3.setBorder(0);
            lineTable.addCell(line3);

            PdfPCell line4 = new PdfPCell();
            line4.setBackgroundColor(colorIndigo);
            line4.setFixedHeight(4);
            line4.setBorder(0);
            lineTable.addCell(line4);

            document.add(lineTable);

            // ══════════════════════════════════════════════════════════════
            // TÍTULO DEL REPORTE
            // ══════════════════════════════════════════════════════════════
            Paragraph reportTitle = new Paragraph("📊 REPORTE DE ASIGNACIONES DIARIAS", fontSectionTitle);
            reportTitle.setSpacingAfter(5);
            document.add(reportTitle);

            Paragraph reportPeriod = new Paragraph("Período de análisis: Últimos " + dias + " días", fontSubtitle);
            reportPeriod.setSpacingAfter(15);
            document.add(reportPeriod);

            // ══════════════════════════════════════════════════════════════
            // ESTADÍSTICAS RESUMIDAS (3 Cards)
            // ══════════════════════════════════════════════════════════════

            // Calcular estadísticas
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

            // Card 1: Total
            PdfPCell card1 = createStatCard("📈 TOTAL ASIGNACIONES", String.valueOf(total),
                    "En " + dias + " días", colorBlue, fontBigNumber, fontSmallLabel);
            statsTable.addCell(card1);

            // Card 2: Promedio
            PdfPCell card2 = createStatCard("📊 PROMEDIO DIARIO", String.valueOf(promedio),
                    "Asignaciones por día", colorPrimary, fontBigNumber, fontSmallLabel);
            statsTable.addCell(card2);

            // Card 3: Día Top
            PdfPCell card3 = createStatCard("🏆 DÍA CON MÁS", String.valueOf(maxTotal),
                    fechaMax, colorAmber, fontBigNumber, fontSmallLabel);
            statsTable.addCell(card3);

            document.add(statsTable);

            // ══════════════════════════════════════════════════════════════
            // GRÁFICO DE BARRAS VISUAL
            // ══════════════════════════════════════════════════════════════
            Paragraph chartTitle = new Paragraph("📊 TENDENCIA DE ASIGNACIONES", fontSectionTitle);
            chartTitle.setSpacingAfter(10);
            document.add(chartTitle);

            // Gráfico de barras simulado con tabla
            PdfPTable chartTable = new PdfPTable(data.size() > 0 ? Math.min(data.size(), 15) : 1);
            chartTable.setWidthPercentage(100);
            chartTable.setSpacingAfter(15);

            // Encontrar el máximo para escalar
            int chartMax = maxTotal > 0 ? maxTotal : 1;

            // Limitar a los últimos 15 días para el gráfico
            java.util.List<Map<String, Object>> chartData = data.size() > 15
                    ? data.subList(data.size() - 15, data.size())
                    : data;

            // Barras (filas de celdas simulando altura)
            // Altura máxima de las barras: 80px
            int maxBarHeight = 80;

            for (int i = 0; i < chartData.size(); i++) {
                Map<String, Object> row = chartData.get(i);
                int val = Integer.parseInt(row.get("total").toString());
                int barHeight = (int) ((val * 1.0 / chartMax) * maxBarHeight);
                barHeight = Math.max(barHeight, 8); // Mínimo 8px

                PdfPCell barCell = new PdfPCell();
                barCell.setFixedHeight(maxBarHeight + 15);
                barCell.setBorder(0);
                barCell.setVerticalAlignment(Element.ALIGN_BOTTOM);

                // Crear barra interna
                PdfPTable innerBar = new PdfPTable(1);
                innerBar.setWidthPercentage(85);

                // Celda de valor
                PdfPCell valCell = new PdfPCell(new Phrase(String.valueOf(val),
                        new Font(Font.HELVETICA, 8, Font.BOLD, colorSecondary)));
                valCell.setBorder(0);
                valCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                valCell.setPaddingBottom(3);
                innerBar.addCell(valCell);

                // Color dinámico basado en el porcentaje del máximo
                double percentage = (val * 1.0 / chartMax);
                Color barColor;
                if (val == maxTotal && val > 0) {
                    barColor = colorAmber; // El máximo en dorado
                } else if (percentage >= 0.7) {
                    barColor = colorPrimary; // Alto: verde
                } else if (percentage >= 0.4) {
                    barColor = colorTeal; // Medio-alto: teal
                } else if (percentage >= 0.2) {
                    barColor = colorBlue; // Medio: azul
                } else {
                    barColor = colorIndigo; // Bajo: indigo
                }

                // Celda de barra coloreada con borde redondeado simulado
                PdfPCell colorBar = new PdfPCell();
                colorBar.setBackgroundColor(barColor);
                colorBar.setFixedHeight(barHeight);
                colorBar.setBorder(0);
                innerBar.addCell(colorBar);

                barCell.addElement(innerBar);
                chartTable.addCell(barCell);
            }

            document.add(chartTable);

            // Etiquetas del gráfico (fechas)
            PdfPTable labelsTable = new PdfPTable(chartData.size());
            labelsTable.setWidthPercentage(100);
            labelsTable.setSpacingAfter(25);

            for (Map<String, Object> row : chartData) {
                String fecha = row.get("fecha").toString();
                // Formatear fecha: extraer solo día/mes
                String shortDate = fecha.length() >= 10 ? fecha.substring(5) : fecha; // MM-DD
                PdfPCell labelCell = new PdfPCell(new Phrase(shortDate,
                        new Font(Font.HELVETICA, 6, Font.NORMAL, Color.GRAY)));
                labelCell.setBorder(0);
                labelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                labelsTable.addCell(labelCell);
            }
            document.add(labelsTable);

            // ══════════════════════════════════════════════════════════════
            // TABLA DETALLADA
            // ══════════════════════════════════════════════════════════════
            Paragraph tableTitle = new Paragraph("📋 DETALLE POR DÍA", fontSectionTitle);
            tableTitle.setSpacingAfter(10);
            document.add(tableTitle);

            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(60);
            table.setHorizontalAlignment(Element.ALIGN_LEFT);
            table.setWidths(new float[] { 0.5f, 1.5f, 1f });

            // Headers
            addCellAsignaciones(table, "#", fontHeader, colorPrimary, Element.ALIGN_CENTER);
            addCellAsignaciones(table, "Fecha", fontHeader, colorPrimary, Element.ALIGN_CENTER);
            addCellAsignaciones(table, "Total Asignaciones", fontHeader, colorPrimary, Element.ALIGN_CENTER);

            // Data
            Color altColor = new Color(240, 253, 244);
            boolean alternate = false;
            int idx = 1;

            for (Map<String, Object> row : data) {
                Color bg = alternate ? altColor : Color.WHITE;
                String fecha = row.get("fecha").toString();
                String totalRow = row.get("total").toString();

                // Resaltar día con más asignaciones
                Font rowFont = totalRow.equals(String.valueOf(maxTotal)) && Integer.parseInt(totalRow) > 0
                        ? fontDataBold
                        : fontData;
                Color rowBg = totalRow.equals(String.valueOf(maxTotal)) && Integer.parseInt(totalRow) > 0
                        ? new Color(254, 243, 199)
                        : bg; // Amber light para el top

                addCellAsignaciones(table, String.valueOf(idx++), fontData, rowBg, Element.ALIGN_CENTER);
                addCellAsignaciones(table, fecha, rowFont, rowBg, Element.ALIGN_CENTER);
                addCellAsignaciones(table, totalRow, rowFont, rowBg, Element.ALIGN_CENTER);
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

    // Helper para crear tarjetas de estadísticas
    private PdfPCell createStatCard(String title, String value, String subtitle, Color accentColor, Font valueFont,
            Font labelFont) {
        PdfPCell card = new PdfPCell();
        card.setBorder(0);
        card.setPadding(10);
        card.setBackgroundColor(new Color(248, 250, 252)); // Slate 50
        card.setHorizontalAlignment(Element.ALIGN_CENTER);

        // Título
        Paragraph titleP = new Paragraph(title, new Font(Font.HELVETICA, 9, Font.BOLD, accentColor));
        titleP.setAlignment(Element.ALIGN_CENTER);
        card.addElement(titleP);

        // Valor grande
        Paragraph valueP = new Paragraph(value, valueFont);
        valueP.setAlignment(Element.ALIGN_CENTER);
        valueP.setSpacingBefore(5);
        card.addElement(valueP);

        // Subtítulo
        Paragraph subP = new Paragraph(subtitle, labelFont);
        subP.setAlignment(Element.ALIGN_CENTER);
        card.addElement(subP);

        return card;
    }

    // Helper para celdas de asignaciones
    private void addCellAsignaciones(PdfPTable table, String text, Font font, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setHorizontalAlignment(align);
        cell.setPadding(8);
        cell.setBorderColor(new Color(226, 232, 240));
        table.addCell(cell);
    }

    public byte[] generarExcelAsignacionesDiarias(List<Map<String, Object>> data, int dias) {
        // TODO: Implementar Excel real con Apache POI si se requiere, por ahora
        // simulación o CSV simple
        // Dado que el usuario pidió específicamente PDF, priorizamos eso.
        // Para Excel rápido: CSV
        StringBuilder csv = new StringBuilder();
        csv.append("Fecha,Total Asignaciones\n");
        for (Map<String, Object> row : data) {
            csv.append(row.get("fecha")).append(",").append(row.get("total")).append("\n");
        }
        return csv.toString().getBytes();
    }

    private void addCell(PdfPTable table, String text, Font font, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "-", font));
        cell.setBackgroundColor(bg);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(6);
        cell.setBorderColor(Color.LIGHT_GRAY);
        cell.setBorderWidth(0.5f);
        table.addCell(cell);
    }

    public byte[] generarExcelActividad(List<UsuarioActivityDto> data, String titulo) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Actividad de Usuarios");

            // Estilos
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.TEAL.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont font = workbook.createFont();
            font.setColor(IndexedColors.WHITE.getIndex());
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Titulo
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("COOPERATIVA REDUCTO - " + titulo.toUpperCase());
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            CellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);

            // Encabezados
            Row row = sheet.createRow(2);
            String[] headers = { "Nombre Completo", "Rol", "Sucursal", "Última Conexión", "Tiempo Online",
                    "Registros Totales" };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = row.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos
            int rowIdx = 3;
            for (UsuarioActivityDto user : data) {
                Row dataRow = sheet.createRow(rowIdx++);
                dataRow.createCell(0).setCellValue(user.getNombreCompleto());
                dataRow.createCell(1).setCellValue(user.getRol());
                dataRow.createCell(2).setCellValue(user.getSucursal());
                dataRow.createCell(3).setCellValue(user.getLastSeenRelative());
                dataRow.createCell(4).setCellValue(user.getTimeOnlineFormatted());
                dataRow.createCell(5).setCellValue(user.getTotalRegistros() + user.getTotalAsignaciones());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar Excel", e);
        }
    }
}
