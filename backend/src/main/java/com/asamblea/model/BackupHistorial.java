package com.asamblea.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "backup_historial")
public class BackupHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_archivo", nullable = false)
    private String nombreArchivo;

    @Column(name = "tamano_bytes")
    private Long tamanoBytes;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoBackup tipo;

    @Column(name = "creado_por")
    private String creadoPor; // username del admin que lo creó

    @Column(name = "tablas_incluidas", columnDefinition = "TEXT")
    private String tablasIncluidas; // JSON con lista de tablas

    @Column(name = "disponible")
    private Boolean disponible = true; // Si el archivo físico existe

    @Column(name = "notas")
    private String notas;

    @Column(name = "ruta_completa")
    private String rutaCompleta;

    public enum TipoBackup {
        AUTOMATICO,
        MANUAL,
        PRE_RESTAURACION // backup de seguridad antes de restaurar
    }

    // Constructors
    public BackupHistorial() {
        this.fechaCreacion = LocalDateTime.now();
        this.disponible = true;
    }

    public BackupHistorial(String nombreArchivo, TipoBackup tipo, String creadoPor) {
        this();
        this.nombreArchivo = nombreArchivo;
        this.tipo = tipo;
        this.creadoPor = creadoPor;
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

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public TipoBackup getTipo() {
        return tipo;
    }

    public void setTipo(TipoBackup tipo) {
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

    public String getRutaCompleta() {
        return rutaCompleta;
    }

    public void setRutaCompleta(String rutaCompleta) {
        this.rutaCompleta = rutaCompleta;
    }
}
