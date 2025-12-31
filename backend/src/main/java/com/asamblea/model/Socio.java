package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "socios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Socio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_socio", unique = true, nullable = false)
    private String numeroSocio;

    @Column(unique = true, nullable = false)
    private String cedula;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    private String telefono;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_sucursal")
    private Sucursal sucursal;

    @Column(name = "aporte_al_dia")
    private boolean aporteAlDia;

    @Column(name = "solidaridad_al_dia")
    private boolean solidaridadAlDia;

    @Column(name = "fondo_al_dia")
    private boolean fondoAlDia;

    @Column(name = "incoop_al_dia")
    private boolean incoopAlDia;

    @Column(name = "credito_al_dia")
    private boolean creditoAlDia;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "en_padron_actual")
    private boolean enPadronActual = true;

    // El estado de voz y voto se calcula en la lógica de negocio o mediante una
    // columna persistida/virtual
    @Transient
    public boolean isEstadoVozVoto() {
        return aporteAlDia && solidaridadAlDia && fondoAlDia && incoopAlDia && creditoAlDia;
    }
}
