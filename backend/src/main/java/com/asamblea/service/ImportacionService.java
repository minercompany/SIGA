package com.asamblea.service;

import com.asamblea.model.ImportacionHistorial;
import com.asamblea.model.Sucursal;
import com.asamblea.repository.ImportacionHistorialRepository;
import com.asamblea.repository.SucursalRepository;
import com.github.pjfanning.xlsx.StreamingReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;

/**
 * Servicio de importación de Excel de alto rendimiento.
 * Optimizaciones:
 * - Streaming estricto sin DataFormatter
 * - Buffer de lectura de 512KB
 * - Inserción batch JDBC pura
 * - Mínima creación de objetos
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImportacionService {

    private final JdbcTemplate jdbcTemplate;
    private final SucursalRepository sucursalRepository;
    private final ImportacionHistorialRepository historialRepository;
    private final LogAuditoriaService auditService;
    private final FuncionarioDirectivoService funcionarioService;

    // Buffer optimizado para SSDs modernos y streaming
    private static final int BUFFER_SIZE = 1024 * 1024; // 1 MB para lectura más rápida
    private static final int BATCH_SIZE = 5000; // Lotes más grandes para UPSERTs
    private static final int ROW_CACHE_SIZE = 2000; // Más cache = menos I/O

    // Indices absolutos (0-based en POI)
    // COL_SOCIO_NRO = 1 (B)
    // COL_DOC_NUM = 2 (C)
    // COL_NOMBRE = 4 (E)
    // COL_TELEFONO = 5 (F)
    // COL_SUCURSAL = 6 (G)
    // COL_APORTE = 7 (H) ...
    private static final int COL_SOCIO_NRO = 1;
    private static final int COL_DOC_NUM = 2;
    private static final int COL_NOMBRE = 4;
    private static final int COL_TELEFONO = 5;
    private static final int COL_SUCURSAL = 6;
    private static final int COL_APORTE = 7;
    private static final int COL_SOLIDARIDAD = 8;
    private static final int COL_FONDO = 9;
    private static final int COL_INCOOP = 10;
    private static final int COL_CREDITO = 11;

    private final Map<String, ImportStatus> progressMap = new ConcurrentHashMap<>();

    public String iniciarImportacion(MultipartFile file, String usuario) throws Exception {
        String processId = UUID.randomUUID().toString();

        // Copia rápida a disco usando NIO
        Path tempDir = Files.createTempDirectory("import_fast");
        File tempFile = tempDir.resolve(processId + ".xlsx").toFile();
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }

        progressMap.put(processId, new ImportStatus(0, false, null, null));
        progressMap.put(processId, new ImportStatus(0, false, null, null));

        // Ejecutar en hilo separado manual (evitando problemas de proxy @Async
        // self-invocation)
        CompletableFuture.runAsync(() -> procesarAsync(processId, tempFile, usuario));

        return processId;
    }

    public ImportStatus getStatus(String processId) {
        return progressMap.getOrDefault(processId, new ImportStatus(0, false, "No encontrado", null));
    }

    public void cancelarImportacion(String processId) {
        ImportStatus s = progressMap.get(processId);
        if (s != null) {
            s.setCancelled(true);
        }
    }

    protected void procesarAsync(String processId, File tempFile, String usuario) {
        log.info("[{}] Iniciando importación optimizada", processId);
        long start = System.currentTimeMillis();

        try {
            // 1. Pre-cargar sucursales en memoria (Map<Codigo, ID> y Map<Nombre, ID>)
            // Esto evita miles de consultas a DB
            Map<String, Long> sucursalMap = new HashMap<>();
            sucursalRepository.findAll().forEach(s -> {
                // Mapear por código
                if (s.getCodigo() != null)
                    sucursalMap.put(s.getCodigo().trim().toUpperCase(), s.getId());
                // También mapear por nombre para mayor flexibilidad
                if (s.getNombre() != null)
                    sucursalMap.put(s.getNombre().trim().toUpperCase(), s.getId());
            });
            log.info("Sucursales cargadas en memoria: {} claves", sucursalMap.size());

            // Set para control de duplicados dentro del mismo archivo
            Set<String> cedulasProcesadas = new HashSet<>();

            // 2. Limpiar tabla - SE ELIMINA PARA SOPORTAR UPSERT (No borrar datos
            // existentes)
            // jdbcTemplate.execute("DELETE FROM socios");

            // 3. Preparar inserción Batch con UPSERT (ON DUPLICATE KEY UPDATE)
            // Esto permite actualizar datos de socios existentes sin perder sus IDs ni
            // asignaciones
            String sql = "INSERT INTO socios (numero_socio, cedula, nombre_completo, telefono, id_sucursal, " +
                    "aporte_al_dia, solidaridad_al_dia, fondo_al_dia, incoop_al_dia, credito_al_dia, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE " +
                    "nombre_completo = VALUES(nombre_completo), " +
                    "telefono = VALUES(telefono), " +
                    "id_sucursal = VALUES(id_sucursal), " +
                    "aporte_al_dia = VALUES(aporte_al_dia), " +
                    "solidaridad_al_dia = VALUES(solidaridad_al_dia), " +
                    "fondo_al_dia = VALUES(fondo_al_dia), " +
                    "incoop_al_dia = VALUES(incoop_al_dia), " +
                    "credito_al_dia = VALUES(credito_al_dia)";

            int imported = 0;
            int errors = 0;
            int duplicados = 0;
            int sinCedula = 0;
            int sinNombre = 0;

            // OPTIMIZACIÓN: Estimar filas desde tamaño de archivo
            // Excel XLSX tiene mucho overhead por celda (~500-800 bytes por fila típica)
            long fileSize = tempFile.length();
            int totalEstimated = Math.max(100, (int) (fileSize / 600)); // Estimación más conservadora
            log.info("Filas estimadas desde tamaño ({}KB): ~{}", fileSize / 1024, totalEstimated);

            updateProgress(processId, 5); // Mostrar 5% inmediatamente para feedback rápido

            try (
                    Connection conn = Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection();
                    PreparedStatement ps = conn.prepareStatement(sql);
                    InputStream is = new FileInputStream(tempFile);
                    BufferedInputStream bis = new BufferedInputStream(is, BUFFER_SIZE);
                    Workbook workbook = StreamingReader.builder()
                            .rowCacheSize(ROW_CACHE_SIZE)
                            .bufferSize(BUFFER_SIZE)
                            .open(bis)) {
                conn.setAutoCommit(false); // Importante para velocidad

                Sheet sheet = workbook.getSheetAt(0);
                int rowIndex = 0;
                Timestamp now = Timestamp.valueOf(LocalDateTime.now());

                for (Row row : sheet) {
                    rowIndex++;
                    if (rowIndex == 1)
                        continue; // Skip header

                    // Verificar cancelación
                    if (progressMap.get(processId).isCancelled()) {
                        log.warn("Proceso {} cancelado por usuario", processId);
                        conn.rollback();
                        ImportStatus s = progressMap.get(processId);
                        s.setError("Cancelado por el usuario");
                        s.setCompleted(true);
                        return;
                    }

                    // Reporte de progreso ligero cada 1000 filas (menos overhead)
                    if (rowIndex % 1000 == 0) {
                        int p = (int) Math.min(95, (rowIndex * 100.0) / totalEstimated);
                        updateProgress(processId, p);
                    }

                    try {
                        // Extracción DIRECTA por índice para velocidad (sin iterar celdas)
                        // B: Nro Socio
                        String nroSocio = getRawValue(row, COL_SOCIO_NRO);
                        // C: Cedula
                        String cedula = getRawValue(row, COL_DOC_NUM);
                        if (cedula != null)
                            cedula = cedula.replace(".", "").replace(",", "").trim();

                        // E: Nombre
                        String nombre = getRawValue(row, COL_NOMBRE);

                        // Validación mínima crítica
                        if (cedula == null || cedula.isEmpty()) {
                            sinCedula++;
                            continue;
                        }
                        if (nombre == null || nombre.trim().isEmpty()) {
                            sinNombre++;
                            continue;
                        }
                        if (nroSocio == null || nroSocio.isEmpty())
                            nroSocio = cedula;

                        // Deduplicación en memoria (rápida para 100k registros)
                        if (cedulasProcesadas.contains(cedula)) {
                            // Si ya existe en el archivo, lo saltamos
                            duplicados++;
                            continue;
                        }
                        cedulasProcesadas.add(cedula);

                        // F: Teléfono
                        String rawTel = getRawValue(row, COL_TELEFONO);
                        String tel = procesarTelefonoParaguayo(rawTel); // Nueva lógica avanzada

                        // G: Sucursal
                        String sucCod = getRawValue(row, COL_SUCURSAL);
                        Long sucId = null;
                        // Debug: Loguear primeros valores de sucursal encontrados
                        if (rowIndex <= 5) {
                            log.info("DEBUG Fila {}: Columna Sucursal (G) = '{}'", rowIndex, sucCod);
                        }
                        if (sucCod != null && !sucCod.trim().isEmpty()) {
                            String code = sucCod.trim().toUpperCase();
                            sucId = sucursalMap.get(code);
                            if (sucId == null) {
                                // AUTO-CREAR SUCURSAL SI NO EXISTE con nombre correcto
                                try {
                                    Sucursal newSuc = new Sucursal();
                                    newSuc.setCodigo(code);

                                    // Mapear códigos a nombres reales
                                    String sucNombre;
                                    String ciudad = null;
                                    switch (code) {
                                        case "1":
                                        case "CC":
                                            sucNombre = "Casa Central";
                                            ciudad = "Asunción";
                                            break;
                                        case "2":
                                            sucNombre = "Ciudad del Este";
                                            ciudad = "Ciudad del Este";
                                            break;
                                        case "3":
                                            sucNombre = "Villarrica";
                                            ciudad = "Villarrica";
                                            break;
                                        case "5":
                                            sucNombre = "Sucursal 5";
                                            ciudad = null;
                                            break;
                                        case "6":
                                            sucNombre = "Hernandarias";
                                            ciudad = "Hernandarias";
                                            break;
                                        case "7":
                                            sucNombre = "San Lorenzo";
                                            ciudad = "San Lorenzo";
                                            break;
                                        default:
                                            sucNombre = "Sucursal " + code;
                                            break;
                                    }

                                    newSuc.setNombre(sucNombre);
                                    newSuc.setCiudad(ciudad);
                                    newSuc = sucursalRepository.save(newSuc);
                                    sucursalMap.put(code, newSuc.getId());
                                    sucId = newSuc.getId();
                                } catch (Exception e) {
                                    log.warn("Error auto-creando sucursal {}: {}", code, e.getMessage());
                                }
                            }
                        }

                        // Booleanos H-L
                        boolean aporte = parseBoolean(getRawValue(row, COL_APORTE));
                        boolean solidaridad = parseBoolean(getRawValue(row, COL_SOLIDARIDAD));
                        boolean fondo = parseBoolean(getRawValue(row, COL_FONDO));
                        boolean incoop = parseBoolean(getRawValue(row, COL_INCOOP));
                        boolean credito = parseBoolean(getRawValue(row, COL_CREDITO));

                        ps.setString(1, nroSocio);
                        ps.setString(2, cedula);
                        ps.setString(3, nombre.toUpperCase());
                        ps.setString(4, tel);
                        if (sucId != null)
                            ps.setLong(5, sucId);
                        else
                            ps.setNull(5, java.sql.Types.BIGINT);
                        ps.setBoolean(6, aporte);
                        ps.setBoolean(7, solidaridad);
                        ps.setBoolean(8, fondo);
                        ps.setBoolean(9, incoop);
                        ps.setBoolean(10, credito);
                        ps.setTimestamp(11, now);

                        ps.addBatch();
                        imported++;

                        if (imported % BATCH_SIZE == 0) {
                            ps.executeBatch();
                            conn.commit();
                            ps.clearBatch();
                        }

                    } catch (Exception ex) {
                        // log.trace("Error row {}: {}", rowIndex, ex.getMessage());
                        errors++;
                    }
                }

                // Flush final
                ps.executeBatch();
                conn.commit();

                long ms = System.currentTimeMillis() - start;
                double speed = (imported * 1000.0) / ms;

                // ===== AUTO-CREACIÓN DE USUARIOS PARA FUNCIONARIOS/DIRECTIVOS =====
                int usuariosCreados = 0;
                try {
                    log.info("Iniciando auto-creación de usuarios optimizada...");

                    // OPTIMIZACIÓN: Solo traemos los socios que COINCIDEN con funcionarios
                    String queryFuncionariosEncontrados = "SELECT s.numero_socio, s.cedula, s.nombre_completo " +
                            "FROM socios s " +
                            "INNER JOIN funcionarios_directivos fd ON s.numero_socio = fd.numero_socio";

                    List<Map<String, Object>> funcionariosEncontrados = jdbcTemplate
                            .queryForList(queryFuncionariosEncontrados);

                    log.info("Procesando {} funcionarios encontrados en el padrón...", funcionariosEncontrados.size());

                    for (Map<String, Object> fila : funcionariosEncontrados) {
                        String nroSocio = (String) fila.get("numero_socio");
                        String cedula = (String) fila.get("cedula");
                        String nombreCompleto = (String) fila.get("nombre_completo");

                        // Crear usuario directamente
                        boolean creado = funcionarioService.crearUsuarioSiFuncionario(nroSocio, cedula, nombreCompleto);
                        if (creado) {
                            usuariosCreados++;
                        }
                    }

                    if (usuariosCreados > 0) {
                        log.info("✓ Se crearon/actualizaron {} usuarios automáticamente.", usuariosCreados);
                    }
                } catch (Exception e) {
                    log.warn("Error al crear usuarios automáticos: {}", e.getMessage());
                }
                // ===== FIN AUTO-CREACIÓN =====

                Map<String, Object> stats = new HashMap<>();
                stats.put("totalRows", rowIndex);
                stats.put("imported", imported); // Total processed (Inserted + Updated)
                stats.put("mode", "UPSERT"); // Informative flag
                stats.put("errors", errors);
                stats.put("duplicados", duplicados);
                stats.put("sinCedula", sinCedula);
                stats.put("sinNombre", sinNombre);
                stats.put("timeMs", ms);
                stats.put("rowsPerSecond", (int) speed);
                stats.put("usuariosCreados", usuariosCreados);

                ImportStatus s = progressMap.get(processId);
                s.progress = 100;
                s.completed = true;
                s.result = stats;

                // Guardar en historial
                try {
                    ImportacionHistorial historial = new ImportacionHistorial();
                    historial.setTotalRegistros(imported);
                    historial.setUsuarioImportador(usuario);
                    historial.setArchivoNombre("padron.xlsx");
                    historialRepository.save(historial);
                    log.info("Historial de importación guardado");

                    // Registrar en Auditoría Total
                    auditService.registrar(
                            "SOCIOS",
                            "IMPORTAR_PADRON",
                            String.format(
                                    "Importó exitosamente %d socios desde el archivo excel en %dms. Se crearon %d usuarios automáticamente.",
                                    imported,
                                    ms, usuariosCreados),
                            usuario,
                            "IP_INTERNA");
                } catch (Exception he) {
                    log.warn("No se pudo guardar historial: {}", he.getMessage());
                }

                log.info("Importación finalizada. {} filas en {}ms ({} filas/s)", imported, ms, (int) speed);

            }

        } catch (Exception e) {
            log.error("Error fatal en importación", e);
            ImportStatus s = progressMap.get(processId);
            s.error = "Error interno: " + e.getMessage();
            s.completed = true;
        } finally {
            // Limpieza temp
            try {
                Files.deleteIfExists(tempFile.toPath());
            } catch (Exception ignored) {
            }
        }
    }

    private void updateProgress(String id, int p) {
        ImportStatus s = progressMap.get(id);
        if (s != null)
            s.progress = p;
    }

    // Extracción raw optimizada
    private String getRawValue(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null)
            return null;

        // Switch rápido, sin DataFormatter
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                // Try cached value if formula
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    try {
                        double val = cell.getNumericCellValue();
                        yield String.valueOf(val);
                    } catch (Exception e2) {
                        yield null;
                    }
                }
            }
            default -> null;
        };
    }

    private boolean parseBoolean(String val) {
        if (val == null)
            return false;
        char c = val.isEmpty() ? ' ' : Character.toUpperCase(val.charAt(0));
        return c == 'S' || c == '1' || c == 'T'; // S(I), S(I), 1, T(RUE)
    }

    // === LÓGICA DE PARSEO DE CELULARES ===
    private String procesarTelefonoParaguayo(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return "";
        }

        // 1. Normalización de texto
        String text = raw.replace("\n", " ")
                .replace("-", " ")
                .replace(".", " ")
                .replace(",", " ")
                .replace(";", " ")
                .replace("/", " ")
                .replace("*", " ")
                .replace("(", " ")
                .replace(")", " ")
                .replaceAll("\\s+", " ");

        // 2. Limpieza de dígitos
        String digits = text.replaceAll("[^0-9]", "");

        // 3. Intento Por Tokens (PRIORIDAD ALTA: Para encontrar "0981..." escondido
        // entre otros textos)
        // Esto soluciona casos como "021 570024 0972..." donde el celular está al final
        String[] tokens = text.split(" ");
        for (String token : tokens) {
            String tokenDigits = token.replaceAll("[^0-9]", "");
            String candidate = checkMobileCandidate(tokenDigits);
            if (candidate != null) {
                return candidate;
            }
        }

        // 4. Intento Validación Móvil Estricta (Global)
        String candidateGlobal = checkMobileCandidate(digits);
        if (candidateGlobal != null) {
            return candidateGlobal;
        }

        // 5. Fallback: Si no se encontró ningún celular válido
        // Si empieza con 021 (línea baja) o es cualquier otro número no móvil ->
        // "Actualizar Nro"
        if (digits.startsWith("021") || digits.startsWith("21") || digits.length() >= 6) {
            return "Actualizar Nro";
        }

        return ""; // Si es muy corto o vacío
    }

    private String checkMobileCandidate(String digits) {
        if (digits == null)
            return null;

        // Limpiar prefijo país 595 (Paraguay)
        String cleaned = digits;
        if (cleaned.startsWith("595")) {
            cleaned = cleaned.substring(3);
        } else if (cleaned.startsWith("00595")) {
            cleaned = cleaned.substring(5);
        }

        // Longitud típica: 9 dígitos (981...) o 10 dígitos (0981...)
        if (cleaned.length() < 9 || cleaned.length() > 10)
            return null;

        // Validar que empiece con 9 o 09
        boolean startWith09 = cleaned.startsWith("09");
        boolean startWith9 = cleaned.startsWith("9");

        if (startWith09 || startWith9) {
            String number = cleaned;
            if (startWith09)
                number = cleaned.substring(1); // Quitar el 0 para normalizar a 9 digit

            if (number.length() == 9) {
                return String.format("+595 %s %s %s",
                        number.substring(0, 3),
                        number.substring(3, 6),
                        number.substring(6, 9));
            }
        }

        return null;
    }

    // Clase interna para el estado (DTO)
    public static class ImportStatus {
        private int progress;
        private boolean completed;
        private boolean cancelled;
        private String error;
        private Map<String, Object> result;

        public ImportStatus() {
        }

        public ImportStatus(int progress, boolean completed, String error, Map<String, Object> result) {
            this.progress = progress;
            this.completed = completed;
            this.error = error;
            this.result = result;
            this.cancelled = false;
        }

        public int getProgress() {
            return progress;
        }

        public void setProgress(int progress) {
            this.progress = progress;
        }

        public boolean isCompleted() {
            return completed;
        }

        public void setCompleted(boolean completed) {
            this.completed = completed;
        }

        public boolean isCancelled() {
            return cancelled;
        }

        public void setCancelled(boolean cancelled) {
            this.cancelled = cancelled;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public Map<String, Object> getResult() {
            return result;
        }

        public void setResult(Map<String, Object> result) {
            this.result = result;
        }
    }
}
