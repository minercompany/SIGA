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

    // Índices dinámicos (se detectan en tiempo de ejecución)
    private static final String HDR_SOCIO_NRO = "NRO SOCIO";
    private static final String HDR_DOC_NUM = "DOC NUM";
    private static final String HDR_NOMBRE = "SOCIO NOMBRE";
    private static final String HDR_TELEFONO = "TELEFONO";
    private static final String HDR_SUCURSAL = "SUCURSAL";
    private static final String HDR_APORTE = "APORTE";
    private static final String HDR_SOLIDARIDAD = "SOLIDARIDAD";
    private static final String HDR_FONDO = "FONDO";
    private static final String HDR_INCOOP = "INCOOP";
    private static final String HDR_CREDITO = "CREDITO";

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
            
            // SEGURIDAD CRÍTICA: Respaldar asignaciones antes de cualquier cambio en el padrón
            try {
                String backupTableName = "z_respaldo_asignaciones_" + LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
                jdbcTemplate.execute("CREATE TABLE " + backupTableName + " SELECT * FROM asignaciones_socios");
                log.info("🛡️ BACKUP CRÍTICO: Se ha creado el respaldo '{}' de las asignaciones existentes.", backupTableName);
            } catch (Exception e) {
                log.warn("⚠️ No se pudo crear el respaldo de seguridad de asignaciones: {}", e.getMessage());
            }

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
            
            // Lista para almacenar detalles de duplicados
            List<DuplicateDetail> duplicadosDetalle = new ArrayList<>();
            
            // Contador de filas vacías
            int filasVacias = 0;

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

                // MAPA DE COLUMNAS DETECTADAS
                Map<String, Integer> colMap = new HashMap<>();
                
                for (Row row : sheet) {
                    rowIndex++;
                    
                    // 1. PROCESAR ENCABEZADO (Fila 1)
                    if (rowIndex == 1) {
                        for (Cell cell : row) {
                            String value = getRawValueFromCell(cell);
                            if (value != null) {
                                // Detección inteligente por palabras clave (Priorizando exactitud y evitando duplicados)
                                String h = value.trim().toUpperCase();
                                
                                if (h.equals("DOC AGR")) continue; // IGNORAR EXPLÍCITAMENTE
                                
                                if (h.equals("DOC NUM") || h.equals("DOC. NUM.") || h.equals("CEDULA") || h.equals("CI")) {
                                    colMap.put("DOC NUM", cell.getColumnIndex());
                                } else if (h.equals("SOCIO NOMBRE") || h.equals("SOCIO NOM") || h.equals("NOMBRE") || h.equals("SOCIO NON")) {
                                    colMap.put("SOCIO NOMBRE", cell.getColumnIndex());
                                } else if (h.equals("SOCIO NRO") || h.equals("NRO SOCIO") || h.equals("NUMERO SOCIO")) {
                                    colMap.put("NRO SOCIO", cell.getColumnIndex());
                                } else if (h.equalsIgnoreCase("TELEFONO") || h.equalsIgnoreCase("TEL")) {
                                    colMap.put("TELEFONO", cell.getColumnIndex());
                                } else if (h.equalsIgnoreCase("SUCURSAL") || h.equals("SUC")) {
                                    colMap.put("SUCURSAL", cell.getColumnIndex());
                                } else if (h.contains("APOR")) {
                                    colMap.putIfAbsent("APORTE", cell.getColumnIndex());
                                } else if (h.contains("SOLID")) {
                                    colMap.putIfAbsent("SOLIDARIDAD", cell.getColumnIndex());
                                } else if (h.contains("FOND")) {
                                    colMap.putIfAbsent("FONDO", cell.getColumnIndex());
                                } else if (h.contains("INCO")) {
                                    colMap.putIfAbsent("INCOOP", cell.getColumnIndex());
                                } else if (h.contains("CRED")) {
                                    colMap.putIfAbsent("CREDITO", cell.getColumnIndex());
                                }
                            }
                        }
                        log.info("Columnas detectadas: {}", colMap);
                        
                        // Validación mínima (Cédula y Nombre son obligatorios)
                        if (!colMap.containsKey("DOC NUM") || !colMap.containsKey("SOCIO NOMBRE")) {
                            throw new Exception("No se encontraron las columnas críticas 'DOC NUM' o 'SOCIO NOMBRE' en el archivo.");
                        }
                        continue; 
                    }

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
                        // Extracción USANDO EL MAPA DINÁMICO
                        Integer idxSocio = colMap.getOrDefault("NRO SOCIO", colMap.get("DOC NUM"));
                        Integer idxCedula = colMap.get("DOC NUM");
                        Integer idxNombre = colMap.get("SOCIO NOMBRE");
                        Integer idxTel = colMap.get("TELEFONO");
                        Integer idxSuc = colMap.get("SUCURSAL");
                        Integer idxAporte = colMap.get("APORTE");
                        Integer idxSolid = colMap.get("SOLIDARIDAD");
                        Integer idxFondo = colMap.get("FONDO");
                        Integer idxIncoop = colMap.get("INCOOP");
                        Integer idxCred = colMap.get("CREDITO");

                        String nroSocio = idxSocio != null ? getRawValue(row, idxSocio) : null;
                        String cedula = idxCedula != null ? getRawValue(row, idxCedula) : null;
                        if (cedula != null)
                            cedula = cedula.replace(".", "").replace(",", "").trim();

                        String nombre = idxNombre != null ? getRawValue(row, idxNombre) : null;

                        // Validación mínima crítica
                        // Si AMBOS están vacíos, es una fila fantasma de Excel - ignorar
                        // silenciosamente
                        boolean cedulaVacia = (cedula == null || cedula.isEmpty());
                        boolean nombreVacio = (nombre == null || nombre.trim().isEmpty());

                        if (cedulaVacia && nombreVacio) {
                            // Fila completamente vacía, contar y continuar
                            filasVacias++;
                            continue;
                        }

                        if (cedulaVacia) {
                            sinCedula++;
                            status.addErrorDetail(rowIndex, "N/A", "Cédula vacía o no válida");
                            continue;
                        }
                        if (nombreVacio) {
                            sinNombre++;
                            status.addErrorDetail(rowIndex, cedula, "Nombre del socio vacío");
                            continue;
                        }

                        if (nroSocio == null || nroSocio.isEmpty())
                            nroSocio = cedula;

                        // Deduplicación en memoria (rápida para 100k registros)
                        if (cedulasProcesadas.contains(cedula)) {
                            // Si ya existe en el archivo, lo saltamos y guardamos el detalle
                            duplicados++;
                            if (duplicadosDetalle.size() < 500) { // Limitar a 500 para no consumir mucha memoria
                                duplicadosDetalle.add(new DuplicateDetail(rowIndex, cedula, nombre != null ? nombre.trim() : "Sin nombre"));
                            }
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
                        String rawTel = idxTel != null ? getRawValue(row, idxTel) : null;
                        String tel = procesarTelefonoParaguayo(rawTel);

                        // G: Sucursal
                        String sucCod = idxSuc != null ? getRawValue(row, idxSuc) : null;
                        Long sucId = null;
                        // Debug: Loguear primeros valores de sucursal encontrados
                        if (rowIndex <= 5) {
                            log.info("DEBUG Fila {}: Columna Sucursal (G) = '{}'", rowIndex, sucCod);
                        }
                        if (sucCod != null && !sucCod.trim().isEmpty()) {
                            String code = sucCod.trim().toUpperCase();
                            sucId = sucursalMap.get(code);
                            if (sucId == null && code.length() < 10 && !code.equals("SI") && !code.equals("NO")) {
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

                        // Booleanos H-L con fallback (si no existe la columna en el Excel, se asume true o false según criterio histórico)
                        boolean aporte = idxAporte != null ? parseBoolean(getRawValue(row, idxAporte)) : true;
                        boolean solidaridad = idxSolid != null ? parseBoolean(getRawValue(row, idxSolid)) : true;
                        boolean fondo = idxFondo != null ? parseBoolean(getRawValue(row, idxFondo)) : true;
                        boolean incoop = idxIncoop != null ? parseBoolean(getRawValue(row, idxIncoop)) : true;
                        boolean credito = idxCred != null ? parseBoolean(getRawValue(row, idxCred)) : true;

                        ps.setString(1, nroSocio);
                        ps.setString(2, cedula);
                        // nombre ya fue validado como no-null en línea 247-251, pero usamos
                        // Objects.requireNonNull para satisfacer el análisis estático
                        ps.setString(3, Objects.requireNonNull(nombre).trim().toUpperCase());

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

                // ===== MANEJO DE SOCIOS QUE YA NO ESTÁN EN EL PADRÓN =====
                // IMPORTANTE: NUNCA eliminamos asignaciones - son datos críticos
                // Los socios que salen del padrón pero tienen asignaciones se PRESERVAN como inactivos
                int sociosInactivados = 0;
                int sociosEliminados = 0;
                try {
                    // 1. Contar socios fuera del padrón actual
                    Integer totalFueraPadron = jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM socios WHERE en_padron_actual = false", Integer.class);
                    totalFueraPadron = totalFueraPadron != null ? totalFueraPadron : 0;
                    
                    if (totalFueraPadron > 0) {
                        log.info("📊 {} socios no están en el nuevo padrón, procesando...", totalFueraPadron);
                        
                        // 2. Contar cuántos tienen asignaciones (estos NUNCA se eliminan)
                        Integer conAsignaciones = jdbcTemplate.queryForObject(
                                "SELECT COUNT(DISTINCT s.id) FROM socios s " +
                                "INNER JOIN asignaciones_socios a ON s.id = a.socio_id " +
                                "WHERE s.en_padron_actual = false", Integer.class);
                        conAsignaciones = conAsignaciones != null ? conAsignaciones : 0;
                        
                        // 3. Contar cuántos tienen asistencias (estos tampoco se eliminan)
                        Integer conAsistencias = jdbcTemplate.queryForObject(
                                "SELECT COUNT(DISTINCT s.id) FROM socios s " +
                                "INNER JOIN asistencias ast ON s.id = ast.id_socio " +
                                "WHERE s.en_padron_actual = false " +
                                "AND s.id NOT IN (SELECT DISTINCT socio_id FROM asignaciones_socios)", Integer.class);
                        conAsistencias = conAsistencias != null ? conAsistencias : 0;
                        
                        sociosInactivados = conAsignaciones + conAsistencias;
                        
                        if (sociosInactivados > 0) {
                            log.info("🔒 {} socios se mantienen INACTIVOS (tienen asignaciones/asistencias)", sociosInactivados);
                        }
                        
                        // 4. Solo eliminar socios SIN asignaciones y SIN asistencias
                        // Estos son socios "limpios" que pueden eliminarse sin perder datos
                        int eliminables = totalFueraPadron - sociosInactivados;
                        if (eliminables > 0) {
                            log.info("🗑️ Eliminando {} socios sin asignaciones ni asistencias...", eliminables);
                            
                            // Eliminar solo los que no tienen ninguna relación
                            sociosEliminados = jdbcTemplate.update(
                                    "DELETE FROM socios WHERE en_padron_actual = false " +
                                    "AND id NOT IN (SELECT DISTINCT socio_id FROM asignaciones_socios) " +
                                    "AND id NOT IN (SELECT DISTINCT id_socio FROM asistencias)");
                            
                            log.info("✓ {} socios eliminados del sistema (sin datos relacionados)", sociosEliminados);
                        }
                    }
                } catch (Exception deleteEx) {
                    log.error("Error procesando socios fuera de padrón: {}", deleteEx.getMessage());
                }
                // ===== FIN MANEJO SOCIOS =====
                
                // ===== BLINDAJE FINAL: RE-ACTIVAR SOCIOS CON ASIGNACIONES =====
                try {
                    int reactivados = jdbcTemplate.update(
                        "UPDATE socios SET en_padron_actual = true " +
                        "WHERE id IN (SELECT DISTINCT socio_id FROM asignaciones_socios)"
                    );
                    log.info("🛡️ BLINDAJE: Se han asegurado {} socios con asignaciones como activos.", reactivados);
                } catch (Exception reEx) {
                    log.error("Error en blindaje de asignaciones: {}", reEx.getMessage());
                }

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
                stats.put("duplicadosDetalle", duplicadosDetalle); // Lista detallada de duplicados
                stats.put("sinCedula", sinCedula);
                stats.put("sinNombre", sinNombre);
                stats.put("filasVacias", filasVacias); // Filas completamente vacías
                stats.put("sociosEliminados", sociosEliminados); // Socios eliminados (sin asignaciones)
                stats.put("sociosInactivados", sociosInactivados); // Socios preservados como inactivos (tienen asignaciones)
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
        if (index < 0) return null;
        Cell cell = row.getCell(index);
        return getRawValueFromCell(cell);
    }

    private String getRawValueFromCell(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                // Forzar formato sin decimales para cédulas y códigos
                double val = cell.getNumericCellValue();
                if (val == (long) val) {
                    return String.format("%d", (long) val);
                } else {
                    return String.valueOf(val);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    try {
                        double valFormula = cell.getNumericCellValue();
                        if (valFormula == (long) valFormula) {
                            return String.format("%d", (long) valFormula);
                        }
                        return String.valueOf(valFormula);
                    } catch (Exception ex) {
                        return "";
                    }
                }
            case BLANK:
                return "";
            default:
                return cell.toString().trim();
        }
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
    
    public static record DuplicateDetail(int row, String cedula, String nombre) {
    }
}
