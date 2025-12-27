package com.asamblea.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String modulo; // ASISTENCIA, SOCIOS, ASIGNACIONES, CONFIGURACION, USUARIOS

    @Column(nullable = false)
    private String accion; // CREAR, EDITAR, ELIMINAR, MARCAR_ASISTENCIA, ASIGNAR_LISTA

    @Column(columnDefinition = "TEXT")
    private String detalles; // JSON o descripción detallada

    private String usuario; // Nombre de usuario o ID que realizó la acción

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
