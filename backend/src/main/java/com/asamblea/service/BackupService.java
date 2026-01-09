package com.asamblea.service;

import com.asamblea.dto.BackupHistorialDTO;
import com.asamblea.dto.ConfiguracionBackupDTO;
import com.asamblea.model.BackupHistorial;
import com.asamblea.model.BackupHistorial.TipoBackup;
import com.asamblea.model.ConfiguracionBackup;
import com.asamblea.repository.BackupHistorialRepository;
import com.asamblea.repository.ConfiguracionBackupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);
    private static final DateTimeFormatter BACKUP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    
    @Autowired
    private BackupHistorialRepository backupHistorialRepository;
    
    @Autowired
    private ConfiguracionBackupRepository configRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Value("${spring.datasource.url}")
    private String datasourceUrl;
    
    @Value("${spring.datasource.username}")
    private String dbUsername;
    
    @Value("${spring.datasource.password}")
    private String dbPassword;
    
    @Value("${backup.directory:/backups}")
    private String backupDirectory;
    
    private static final String CODIGO_POR_DEFECTO = "226118";
    
    // Lista de tablas a incluir en el backup
    private static final List<String> TABLAS_BACKUP = Arrays.asList(
        "usuarios", "socios", "asambleas", "asignaciones", "asignaciones_socios",
        "asistencias", "sucursales", "funcionarios_directivos", "configuracion",
        "avisos", "avisos_destinatarios", "chat_mensajes", "conversaciones",
        "listas_asignacion", "auditoria", "notificaciones_log", "push_subscriptions",
        "importaciones_historial"
    );

    /**
     * Obtiene la configuración actual de backups
     */
    public ConfiguracionBackupDTO getConfiguracion() {
        ConfiguracionBackup config = configRepository.getConfiguracion();
        
        ConfiguracionBackupDTO dto = new ConfiguracionBackupDTO();
        dto.setBackupAutomaticoActivo(config.getBackupAutomaticoActivo());
        dto.setFrecuenciaMinutos(config.getFrecuenciaMinutos());
        dto.setRetencionMaxima(config.getRetencionMaxima());
        dto.setUltimoBackup(config.getUltimoBackup());
        dto.setDirectorioBackups(config.getDirectorioBackups());
        
        return dto;
    }

    /**
     * Actualiza la configuración de backups
     */
    @Transactional
    public ConfiguracionBackupDTO actualizarConfiguracion(ConfiguracionBackupDTO dto) {
        ConfiguracionBackup config = configRepository.getConfiguracion();
        
        if (dto.getBackupAutomaticoActivo() != null) {
            config.setBackupAutomaticoActivo(dto.getBackupAutomaticoActivo());
        }
        if (dto.getFrecuenciaMinutos() != null) {
            config.setFrecuenciaMinutos(dto.getFrecuenciaMinutos());
        }
        if (dto.getRetencionMaxima() != null) {
            config.setRetencionMaxima(dto.getRetencionMaxima());
        }
        if (dto.getNuevoCodigoAcceso() != null && !dto.getNuevoCodigoAcceso().isEmpty()) {
            config.setCodigoAccesoHash(passwordEncoder.encode(dto.getNuevoCodigoAcceso()));
        }
        
        configRepository.save(config);
        logger.info("Configuración de backup actualizada");
        
        return getConfiguracion();
    }

    /**
     * Verifica si el código de acceso es correcto
     */
    public boolean verificarCodigoAcceso(String codigo) {
        ConfiguracionBackup config = configRepository.getConfiguracion();
        
        // Si no hay código configurado, usar el código por defecto
        if (config.getCodigoAccesoHash() == null || config.getCodigoAccesoHash().isEmpty()) {
            return CODIGO_POR_DEFECTO.equals(codigo);
        }
        
        return passwordEncoder.matches(codigo, config.getCodigoAccesoHash());
    }

    /**
     * Crea un backup manual de la base de datos
     */
    @Transactional
    public BackupHistorialDTO crearBackup(String usuario, TipoBackup tipo) {
        logger.info("Iniciando backup {} por usuario: {}", tipo, usuario);
        
        try {
            // Crear directorio si no existe
            Path backupPath = Paths.get(backupDirectory);
            if (!Files.exists(backupPath)) {
                Files.createDirectories(backupPath);
            }
            
            // Generar nombre del archivo
            String timestamp = LocalDateTime.now().format(BACKUP_DATE_FORMAT);
            String nombreArchivo = String.format("backup_%s_%s.sql", tipo.name().toLowerCase(), timestamp);
            String rutaCompleta = backupPath.resolve(nombreArchivo).toString();
            
            // Extraer host y database del datasource URL
            String[] dbInfo = extraerInfoDB();
            String host = dbInfo[0];
            String database = dbInfo[1];
            
            // Ejecutar mysqldump
            ProcessBuilder pb = new ProcessBuilder(
                "mysqldump",
                "-h", host,
                "-u", dbUsername,
                "-p" + dbPassword,
                "--single-transaction",
                "--routines",
                "--triggers",
                database
            );
            
            pb.redirectOutput(new File(rutaCompleta));
            pb.redirectErrorStream(false);
            
            Process process = pb.start();
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                // Leer error
                BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
                String errorLine;
                StringBuilder error = new StringBuilder();
                while ((errorLine = errorReader.readLine()) != null) {
                    error.append(errorLine);
                }
                logger.error("Error en mysqldump: {}", error.toString());
                throw new RuntimeException("Error al crear backup: " + error.toString());
            }
            
            // Obtener tamaño del archivo
            File backupFile = new File(rutaCompleta);
            long tamano = backupFile.length();
            
            // Guardar en historial
            BackupHistorial historial = new BackupHistorial(nombreArchivo, tipo, usuario);
            historial.setTamanoBytes(tamano);
            historial.setRutaCompleta(rutaCompleta);
            historial.setTablasIncluidas(String.join(",", TABLAS_BACKUP));
            
            backupHistorialRepository.save(historial);
            
            // Actualizar último backup en configuración
            ConfiguracionBackup config = configRepository.getConfiguracion();
            config.setUltimoBackup(LocalDateTime.now());
            configRepository.save(config);
            
            // Limpiar backups antiguos
            limpiarBackupsAntiguos();
            
            logger.info("Backup creado exitosamente: {} ({} bytes)", nombreArchivo, tamano);
            
            return new BackupHistorialDTO(historial);
            
        } catch (Exception e) {
            logger.error("Error al crear backup: {}", e.getMessage(), e);
            throw new RuntimeException("Error al crear backup: " + e.getMessage());
        }
    }

    /**
     * Restaura un backup específico
     */
    @Transactional
    public void restaurarBackup(Long backupId, String usuario) {
        logger.info("Iniciando restauración de backup ID: {} por usuario: {}", backupId, usuario);
        
        BackupHistorial backup = backupHistorialRepository.findById(backupId)
            .orElseThrow(() -> new RuntimeException("Backup no encontrado"));
        
        if (!backup.getDisponible()) {
            throw new RuntimeException("El archivo de backup no está disponible");
        }
        
        File backupFile = new File(backup.getRutaCompleta());
        if (!backupFile.exists()) {
            backup.setDisponible(false);
            backupHistorialRepository.save(backup);
            throw new RuntimeException("El archivo de backup no existe en el servidor");
        }
        
        try {
            // Crear backup de seguridad antes de restaurar
            logger.info("Creando backup de seguridad antes de restaurar...");
            crearBackup(usuario, TipoBackup.PRE_RESTAURACION);
            
            // Extraer info de DB
            String[] dbInfo = extraerInfoDB();
            String host = dbInfo[0];
            String database = dbInfo[1];
            
            // Ejecutar restauración con mysql
            ProcessBuilder pb = new ProcessBuilder(
                "mysql",
                "-h", host,
                "-u", dbUsername,
                "-p" + dbPassword,
                database
            );
            
            pb.redirectInput(backupFile);
            pb.redirectErrorStream(true);
            
            Process process = pb.start();
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line;
                StringBuilder output = new StringBuilder();
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
                logger.error("Error en restauración: {}", output.toString());
                throw new RuntimeException("Error al restaurar backup: " + output.toString());
            }
            
            logger.info("Backup restaurado exitosamente desde: {}", backup.getNombreArchivo());
            
        } catch (Exception e) {
            logger.error("Error al restaurar backup: {}", e.getMessage(), e);
            throw new RuntimeException("Error al restaurar backup: " + e.getMessage());
        }
    }

    /**
     * Obtiene el historial de backups
     */
    public List<BackupHistorialDTO> getHistorial() {
        return backupHistorialRepository.findByDisponibleTrueOrderByFechaCreacionDesc()
            .stream()
            .map(BackupHistorialDTO::new)
            .collect(Collectors.toList());
    }

    /**
     * Verifica y ejecuta backup automático si es necesario
     */
    @Transactional
    public void verificarBackupAutomatico() {
        ConfiguracionBackup config = configRepository.getConfiguracion();
        
        if (!config.getBackupAutomaticoActivo()) {
            return;
        }
        
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime ultimoBackup = config.getUltimoBackup();
        
        if (ultimoBackup == null) {
            // Nunca se ha hecho backup, crear uno
            crearBackup("SISTEMA", TipoBackup.AUTOMATICO);
            return;
        }
        
        // Verificar si pasó el tiempo de frecuencia
        long minutosDesdeUltimo = java.time.Duration.between(ultimoBackup, ahora).toMinutes();
        if (minutosDesdeUltimo >= config.getFrecuenciaMinutos()) {
            crearBackup("SISTEMA", TipoBackup.AUTOMATICO);
        }
    }

    /**
     * Limpia backups antiguos según la configuración de retención
     */
    private void limpiarBackupsAntiguos() {
        ConfiguracionBackup config = configRepository.getConfiguracion();
        int retencion = config.getRetencionMaxima();
        
        List<BackupHistorial> backupsAutomaticos = backupHistorialRepository
            .findByTipoOrderByFechaCreacionDesc(TipoBackup.AUTOMATICO);
        
        if (backupsAutomaticos.size() > retencion) {
            List<BackupHistorial> aEliminar = backupsAutomaticos.subList(retencion, backupsAutomaticos.size());
            
            for (BackupHistorial backup : aEliminar) {
                try {
                    // Eliminar archivo físico
                    Files.deleteIfExists(Paths.get(backup.getRutaCompleta()));
                    // Marcar como no disponible o eliminar del historial
                    backup.setDisponible(false);
                    backupHistorialRepository.save(backup);
                    logger.info("Backup antiguo eliminado: {}", backup.getNombreArchivo());
                } catch (Exception e) {
                    logger.error("Error al eliminar backup antiguo: {}", e.getMessage());
                }
            }
        }
    }

    /**
     * Extrae host y database del datasource URL
     */
    private String[] extraerInfoDB() {
        // URL formato: jdbc:mysql://host:port/database?params
        String url = datasourceUrl;
        url = url.replace("jdbc:mysql://", "");
        
        String hostPort = url.split("/")[0];
        String host = hostPort.split(":")[0];
        
        String databaseWithParams = url.split("/")[1];
        String database = databaseWithParams.split("\\?")[0];
        
        return new String[]{host, database};
    }
}
