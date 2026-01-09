package com.asamblea.dto;

import java.time.LocalDateTime;

public class ConfiguracionBackupDTO {
    
    private Boolean backupAutomaticoActivo;
    private Integer frecuenciaMinutos;
    private Integer retencionMaxima;
    private LocalDateTime ultimoBackup;
    private String directorioBackups;
    
    // Para cambiar el código de acceso
    private String nuevoCodigoAcceso;
    
    // Constructors
    public ConfiguracionBackupDTO() {}
    
    // Getters and Setters
    public Boolean getBackupAutomaticoActivo() {
        return backupAutomaticoActivo;
    }
    
    public void setBackupAutomaticoActivo(Boolean backupAutomaticoActivo) {
        this.backupAutomaticoActivo = backupAutomaticoActivo;
    }
    
    public Integer getFrecuenciaMinutos() {
        return frecuenciaMinutos;
    }
    
    public void setFrecuenciaMinutos(Integer frecuenciaMinutos) {
        this.frecuenciaMinutos = frecuenciaMinutos;
    }
    
    public Integer getRetencionMaxima() {
        return retencionMaxima;
    }
    
    public void setRetencionMaxima(Integer retencionMaxima) {
        this.retencionMaxima = retencionMaxima;
    }
    
    public LocalDateTime getUltimoBackup() {
        return ultimoBackup;
    }
    
    public void setUltimoBackup(LocalDateTime ultimoBackup) {
        this.ultimoBackup = ultimoBackup;
    }
    
    public String getDirectorioBackups() {
        return directorioBackups;
    }
    
    public void setDirectorioBackups(String directorioBackups) {
        this.directorioBackups = directorioBackups;
    }
    
    public String getNuevoCodigoAcceso() {
        return nuevoCodigoAcceso;
    }
    
    public void setNuevoCodigoAcceso(String nuevoCodigoAcceso) {
        this.nuevoCodigoAcceso = nuevoCodigoAcceso;
    }
}
