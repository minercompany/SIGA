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
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
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
        Document document = new Document(PageSize.A4, 30, 30, 30, 30);
        PdfWriter.getInstance(document, out);
        document.open();

        // Fuentes
        Font fontTitle = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(16, 185, 129)); // Emerald 500
        Font fontSubtitle = new Font(Font.HELVETICA, 12, Font.BOLD, Color.GRAY);
        Font fontHeader = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
        Font fontBody = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);

        // Header
        Paragraph pTitle = new Paragraph("COOPERATIVA REDUCTO LTDA.", fontTitle);
        pTitle.setAlignment(Element.ALIGN_CENTER);
        document.add(pTitle);

        Paragraph pSub = new Paragraph(titulo, fontSubtitle);
        pSub.setAlignment(Element.ALIGN_CENTER);
        pSub.setSpacingAfter(20);
        document.add(pSub);

        Paragraph pFecha = new Paragraph(
                "Fecha de Reporte: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                fontBody);
        pFecha.setAlignment(Element.ALIGN_RIGHT);
        pFecha.setSpacingAfter(10);
        document.add(pFecha);

        // Tabla
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 2.5f, 1.5f, 1.5f, 2f, 1.5f, 1.5f });

        String[] headers = { "Nombre Completo", "Rol", "Sucursal", "Última Conexión", "Tiempo Online", "Registros" };
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, fontHeader));
            cell.setBackgroundColor(new Color(16, 185, 129));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);
        }

        for (UsuarioActivityDto user : data) {
            table.addCell(new PdfPCell(new Phrase(user.getNombreCompleto(), fontBody)));
            table.addCell(new PdfPCell(new Phrase(user.getRol(), fontBody)));
            table.addCell(new PdfPCell(new Phrase(user.getSucursal(), fontBody)));
            table.addCell(new PdfPCell(new Phrase(user.getLastSeenRelative(), fontBody)));
            table.addCell(new PdfPCell(new Phrase(user.getTimeOnlineFormatted(), fontBody)));
            table.addCell(new PdfPCell(
                    new Phrase(String.valueOf(user.getTotalRegistros() + user.getTotalAsignaciones()), fontBody)));
        }

        document.add(table);
        document.close();
        return out.toByteArray();
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
