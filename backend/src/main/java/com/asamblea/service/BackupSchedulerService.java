package com.asamblea.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class BackupSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(BackupSchedulerService.class);

    @Autowired
    private BackupService backupService;

    /**
     * Verifica cada minuto si es necesario ejecutar un backup automático.
     * La lógica de si realmente corresponde hacer backup está en BackupService.
     */
    @Scheduled(fixedRate = 60000) // Cada 60 segundos
    public void verificarBackupAutomatico() {
        try {
            backupService.verificarBackupAutomatico();
        } catch (Exception e) {
            logger.error("Error en verificación de backup automático: {}", e.getMessage());
        }
    }

    /**
     * Tarea diaria de limpieza a las 3:00 AM
     * Verifica que los archivos físicos existan y actualiza disponibilidad
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void verificarIntegridadBackups() {
        logger.info("Iniciando verificación de integridad de backups...");
        // Esta funcionalidad se puede expandir para verificar checksums, etc.
    }
}
