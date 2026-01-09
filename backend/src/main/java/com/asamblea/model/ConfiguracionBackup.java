package com.asamblea.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "configuracion_backup")
public class ConfiguracionBackup {

    @Id
    private Long id = 1L; // Singleton - solo un registro

    @Column(name = "backup_automatico_activo")
    private Boolean backupAutomaticoActivo = false;

    @Column(name = "frecuencia_minutos")
    private Integer frecuenciaMinutos = 60; // 60 = cada hora

    @Column(name = "retencion_maxima")
    private Integer retencionMaxima = 24; // mantener últimos 24 backups

    @Column(name = "codigo_acceso_hash")
    private String codigoAccesoHash; // hash bcrypt del código

    @Column(name = "ultimo_backup")
    private LocalDateTime ultimoBackup;

    @Column(name = "directorio_backups")
    private String directorioBackups = "/backups";

    // Constructors
    public ConfiguracionBackup() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getCodigoAccesoHash() {
        return codigoAccesoHash;
    }

    public void setCodigoAccesoHash(String codigoAccesoHash) {
        this.codigoAccesoHash = codigoAccesoHash;
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
}
