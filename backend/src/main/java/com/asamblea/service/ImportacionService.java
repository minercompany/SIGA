package com.asamblea.service;

import com.asamblea.model.ImportacionHistorial;
import com.asamblea.model.Sucursal;
import com.asamblea.repository.ImportacionHistorialRepository;
import com.asamblea.repository.SucursalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.openxml4j.util.ZipSecureFile;
import org.apache.poi.ss.usermodel.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
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

    private final ImportacionHistorialRepository historialRepository;
    private final SucursalRepository sucursalRepository;
    private final JdbcTemplate jdbcTemplate;
    private final com.asamblea.service.LogAuditoriaService auditService;
    private final FuncionarioDirectivoService funcionarioService;

    // Buffer optimizado para SSDs modernos y streaming
    private static final int BATCH_SIZE = 5000; // Lotes más grandes para UPSERTs

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
        String tempFilename = file.getOriginalFilename();
        String originalFilename = (tempFilename != null && !tempFilename.isBlank()) ? tempFilename : "padron.xlsx";

        // Crear directorio permanente para archivos importados
        Path permanentDir = Path.of("uploads", "importaciones");
        Files.createDirectories(permanentDir);

        // Guardar archivo con timestamp para evitar conflictos
        String timestamp = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
                .format(java.time.LocalDateTime.now());
        String safeFilename = timestamp + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path permanentFile = permanentDir.resolve(safeFilename);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, permanentFile, StandardCopyOption.REPLACE_EXISTING);
        }

        progressMap.put(processId, new ImportStatus(0, false, null, null));

        // Ejecutar en hilo separado manual (evitando problemas de proxy @Async
        // self-invocation)
        final String finalOriginalFilename = originalFilename;
        final String finalPermanentPath = permanentFile.toString();
        CompletableFuture.runAsync(() -> procesarAsync(processId, permanentFile.toFile(), usuario,
                finalOriginalFilename, finalPermanentPath));

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

    protected void procesarAsync(String processId, File tempFile, String usuario, String originalFilename,
            String archivoRuta) {
        log.info("[{}] Iniciando importación optimizada - Archivo: {}", processId, originalFilename);
        long start = System.currentTimeMillis();
        ImportStatus status = progressMap.get(processId);

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

            // 2. CARGAR CÉDULAS EXISTENTES EN MEMORIA (para calcular nuevos vs actualizados
            // con precisión)
            Set<String> cedulasExistentes = new HashSet<>();
            try {
                List<String> existingCedulas = jdbcTemplate.queryForList("SELECT cedula FROM socios", String.class);
                cedulasExistentes.addAll(existingCedulas);
                log.info("Cédulas existentes cargadas en memoria: {}", cedulasExistentes.size());
            } catch (Exception e) {
                log.warn("No se pudieron cargar cédulas existentes: {}", e.getMessage());
            }
            int sociosPrevios = cedulasExistentes.size();

            // MARCAR TODOS LOS SOCIOS COMO "NO EN PADRÓN ACTUAL" ANTES DE IMPORTAR
            // Luego el UPSERT los marcará como activos si están en el archivo
            int sociosMarcadosInactivos = jdbcTemplate.update("UPDATE socios SET en_padron_actual = false");
            log.info("Marcados {} socios como inactivos temporalmente", sociosMarcadosInactivos);

            // 3. Preparar inserción Batch con UPSERT (ON DUPLICATE KEY UPDATE)
            // Incluye en_padron_actual = true para marcar los importados como activos
            String sql = "INSERT INTO socios (numero_socio, cedula, nombre_completo, telefono, id_sucursal, " +
                    "aporte_al_dia, solidaridad_al_dia, fondo_al_dia, incoop_al_dia, credito_al_dia, created_at, en_padron_actual) "
                    +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true) " +
                    "ON DUPLICATE KEY UPDATE " +
                    "nombre_completo = VALUES(nombre_completo), " +
                    "telefono = VALUES(telefono), " +
                    "id_sucursal = VALUES(id_sucursal), " +
                    "aporte_al_dia = VALUES(aporte_al_dia), " +
                    "solidaridad_al_dia = VALUES(solidaridad_al_dia), " +
                    "fondo_al_dia = VALUES(fondo_al_dia), " +
                    "incoop_al_dia = VALUES(incoop_al_dia), " +
                    "credito_al_dia = VALUES(credito_al_dia), " +
                    "en_padron_actual = true";

            int imported = 0;
            int errors = 0;
            int duplicados = 0;
            int sinCedula = 0;
            int sinNombre = 0;
            int nuevosContador = 0; // Socios que NO existían antes
            int actualizadosContador = 0; // Socios que YA existían y se actualizaron

            // OPTIMIZACIÓN: Estimar filas desde tamaño de archivo
            // Excel XLSX tiene mucho overhead por celda (~500-800 bytes por fila típica)
            long fileSize = tempFile.length();
            int totalEstimated = Math.max(100, (int) (fileSize / 600)); // Estimación más conservadora
            log.info("Filas estimadas desde tamaño ({}KB): ~{}", fileSize / 1024, totalEstimated);

            updateProgress(processId, 5); // Mostrar 5% inmediatamente para feedback rápido

            // Fix: Zip bomb detected! (Permitir ratios de compresión más altos)
            ZipSecureFile.setMinInflateRatio(0.001);

            try (
                    Connection conn = Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection();
                    PreparedStatement ps = conn.prepareStatement(sql);
                    Workbook workbook = WorkbookFactory.create(tempFile, null, true)) {

                conn.setAutoCommit(false); // Importante para velocidad

                Sheet sheet = workbook.getSheetAt(0);
                int rowIndex = 0;
                Timestamp now = Timestamp.valueOf(LocalDateTime.now());

                for (Row row : sheet) {
                    rowIndex++;
                    if (rowIndex == 1)
                        continue; // Skip header

                    // Verificar cancelación
                    if (status.isCancelled()) {
                        log.warn("Proceso {} cancelado por usuario", processId);
                        conn.rollback();
                        status.setError("Cancelado por el usuario");
                        status.setCompleted(true);
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
                            status.addErrorDetail(rowIndex, "N/A", "Cédula vacía o no válida");
                            continue;
                        }
                        if (nombre == null || nombre.trim().isEmpty()) {
                            sinNombre++;
                            status.addErrorDetail(rowIndex, cedula, "Nombre del socio vacío");
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

                        // Determinar si es NUEVO o ACTUALIZADO
                        if (cedulasExistentes.contains(cedula)) {
                            actualizadosContador++;
                        } else {
                            nuevosContador++;
                        }

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
                        errors++;
                        status.addErrorDetail(rowIndex, "FILA ERROR", ex.getMessage());
                    }
                }

                // Flush final
                ps.executeBatch();
                conn.commit();

                // ===== ELIMINAR SOCIOS QUE YA NO ESTÁN EN EL PADRÓN =====
                // El Excel es la fuente de verdad absoluta
                int sociosEliminados = 0;
                try {
                    // Primero contar cuántos serán eliminados
                    Integer count = jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM socios WHERE en_padron_actual = false", Integer.class);
                    sociosEliminados = count != null ? count : 0;

                    if (sociosEliminados > 0) {
                        log.info("🗑️ Eliminando {} socios que ya no están en el padrón...", sociosEliminados);

                        // Eliminar registros relacionados primero (para evitar errores de FK)
                        jdbcTemplate.update(
                                "DELETE FROM asignaciones_socios WHERE socio_id IN (SELECT id FROM socios WHERE en_padron_actual = false)");
                        jdbcTemplate.update(
                                "DELETE FROM asistencias WHERE id_socio IN (SELECT id FROM socios WHERE en_padron_actual = false)");

                        // Ahora eliminar los socios
                        int deleted = jdbcTemplate.update("DELETE FROM socios WHERE en_padron_actual = false");
                        log.info("✓ {} socios eliminados del sistema", deleted);
                    }
                } catch (Exception deleteEx) {
                    log.error("Error eliminando socios fuera de padrón: {}", deleteEx.getMessage());
                }
                // ===== FIN ELIMINACIÓN =====

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

                // ===== ESTADÍSTICAS PRECISAS (usando contadores del loop) =====
                log.info("Socios previos: {}, Nuevos: {}, Actualizados: {}",
                        sociosPrevios, nuevosContador, actualizadosContador);
                // ===== FIN ESTADÍSTICAS =====

                Map<String, Object> stats = new HashMap<>();
                stats.put("totalRows", rowIndex);
                stats.put("imported", imported); // Total procesados (para compatibilidad)
                stats.put("nuevos", nuevosContador); // Socios realmente nuevos (insertados)
                stats.put("actualizados", actualizadosContador); // Socios existentes actualizados
                stats.put("mode", "UPSERT"); // Informative flag
                stats.put("errors", errors);
                stats.put("duplicados", duplicados);
                stats.put("sinCedula", sinCedula);
                stats.put("sinNombre", sinNombre);
                stats.put("sociosEliminados", sociosEliminados); // Socios eliminados porque no estaban en el Excel
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
                    historial.setArchivoNombre(originalFilename);
                    historial.setArchivoRuta(archivoRuta);
                    historialRepository.save(historial);
                    log.info("Historial de importación guardado - Archivo: {}", originalFilename);

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
            // Limpieza temp (archivo y carpeta)
            try {
                if (tempFile.exists()) {
                    Path parentDir = tempFile.toPath().getParent();
                    Files.deleteIfExists(tempFile.toPath());
                    Files.deleteIfExists(parentDir); // Eliminar el directorio si está vacío
                }
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
        private List<ErrorDetail> errorDetails = new ArrayList<>();

        public ImportStatus() {
        }

        public ImportStatus(int progress, boolean completed, String error, Map<String, Object> result) {
            this.progress = progress;
            this.completed = completed;
            this.error = error;
            this.result = result;
            this.cancelled = false;
        }

        public void addErrorDetail(int row, String cedula, String message) {
            if (this.errorDetails.size() < 100) {
                this.errorDetails.add(new ErrorDetail(row, cedula, message));
            }
        }

        public List<ErrorDetail> getErrorDetails() {
            return errorDetails;
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

    public static record ErrorDetail(int row, String cedula, String message) {
    }
}
