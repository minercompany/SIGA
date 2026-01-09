package com.asamblea.dto;

import com.asamblea.model.BackupHistorial;
import java.time.LocalDateTime;

public class BackupHistorialDTO {
    
    private Long id;
    private String nombreArchivo;
    private Long tamanoBytes;
    private String tamanoFormateado; // Ej: "5.8 MB"
    private LocalDateTime fechaCreacion;
    private String tipo; // AUTOMATICO, MANUAL, PRE_RESTAURACION
    private String creadoPor;
    private String tablasIncluidas;
    private Boolean disponible;
    private String notas;
    
    // Constructors
    public BackupHistorialDTO() {}
    
    public BackupHistorialDTO(BackupHistorial backup) {
        this.id = backup.getId();
        this.nombreArchivo = backup.getNombreArchivo();
        this.tamanoBytes = backup.getTamanoBytes();
        this.tamanoFormateado = formatearTamano(backup.getTamanoBytes());
        this.fechaCreacion = backup.getFechaCreacion();
        this.tipo = backup.getTipo() != null ? backup.getTipo().name() : null;
        this.creadoPor = backup.getCreadoPor();
        this.tablasIncluidas = backup.getTablasIncluidas();
        this.disponible = backup.getDisponible();
        this.notas = backup.getNotas();
    }
    
    private String formatearTamano(Long bytes) {
        if (bytes == null) return "0 B";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getNombreArchivo() {
        return nombreArchivo;
    }
    
    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }
    
    public Long getTamanoBytes() {
        return tamanoBytes;
    }
    
    public void setTamanoBytes(Long tamanoBytes) {
        this.tamanoBytes = tamanoBytes;
    }
    
    public String getTamanoFormateado() {
        return tamanoFormateado;
    }
    
    public void setTamanoFormateado(String tamanoFormateado) {
        this.tamanoFormateado = tamanoFormateado;
    }
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
    
    public String getTipo() {
        return tipo;
    }
    
    public void setTipo(String tipo) {
        this.tipo = tipo;
    }
    
    public String getCreadoPor() {
        return creadoPor;
    }
    
    public void setCreadoPor(String creadoPor) {
        this.creadoPor = creadoPor;
    }
    
    public String getTablasIncluidas() {
        return tablasIncluidas;
    }
    
    public void setTablasIncluidas(String tablasIncluidas) {
        this.tablasIncluidas = tablasIncluidas;
    }
    
    public Boolean getDisponible() {
        return disponible;
    }
    
    public void setDisponible(Boolean disponible) {
        this.disponible = disponible;
    }
    
    public String getNotas() {
        return notas;
    }
    
    public void setNotas(String notas) {
        this.notas = notas;
    }
}
