package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "asignaciones_socios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Asignacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lista_id", nullable = false)
    private ListaAsignacion listaAsignacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;

    @Column(name = "fecha_asignacion")
    private java.time.LocalDateTime fechaAsignacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "asignado_por_id")
    private Usuario asignadoPor;

    @PrePersist
    protected void onCreate() {
        if (fechaAsignacion == null) {
            fechaAsignacion = java.time.LocalDateTime.now();
        }
    }
}
