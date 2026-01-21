package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidatos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Candidato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Organo organo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoCandidato tipo;

    @Column(name = "foto_path", columnDefinition = "LONGTEXT") // Almacenaremos base64 o path
    private String foto;

    @Column(columnDefinition = "TEXT")
    private String biografia;
    
    @Column(name = "orden_prioridad")
    private Integer orden = 0;

    private boolean activo = true;

    @Column(name = "likes_count")
    private Integer likes = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Organo {
        CONSEJO_ADMINISTRACION("Consejo de Administración"),
        JUNTA_VIGILANCIA("Junta de Vigilancia"),
        JUNTA_ELECTORAL("Junta Electoral");

        private final String nombre;
        Organo(String nombre) { this.nombre = nombre; }
        public String getNombre() { return nombre; }
    }

    public enum TipoCandidato {
        TITULAR("Titular"),
        SUPLENTE("Suplente");

        private final String nombre;
        TipoCandidato(String nombre) { this.nombre = nombre; }
        public String getNombre() { return nombre; }
    }
}
