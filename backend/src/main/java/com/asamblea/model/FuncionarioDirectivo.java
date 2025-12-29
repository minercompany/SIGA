package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "funcionarios_directivos")
@Data
public class FuncionarioDirectivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_socio", unique = true, nullable = false, length = 20)
    private String numeroSocio;

    @Column(nullable = false, length = 20)
    private String cedula;

    @Column(name = "nombre_completo", nullable = false, length = 200)
    private String nombreCompleto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RolFuncionario rol = RolFuncionario.DIRECTIVO;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum RolFuncionario {
        DIRECTIVO,
        OPERADOR,
        ASESOR_DE_CREDITO
    }
}
