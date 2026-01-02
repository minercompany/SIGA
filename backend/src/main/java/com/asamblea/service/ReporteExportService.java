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
