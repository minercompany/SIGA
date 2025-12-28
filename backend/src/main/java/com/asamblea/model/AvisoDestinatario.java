package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "avisos_destinatarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvisoDestinatario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aviso_id", nullable = false)
    private Aviso aviso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "enviado_at")
    private LocalDateTime enviadoAt;

    @Column(name = "entregado_at")
    private LocalDateTime entregadoAt;

    @Column(name = "notificado_pc_at")
    private LocalDateTime notificadoPcAt;

    @Column(name = "notificado_mobile_at")
    private LocalDateTime notificadoMobileAt;

    @Column(name = "abierto_at")
    private LocalDateTime abiertoAt;

    @Column(name = "leido_at")
    private LocalDateTime leidoAt;

    @Column(name = "confirmado_at")
    private LocalDateTime confirmadoAt;

    @Column(name = "respondido_at")
    private LocalDateTime respondidoAt;

    @Column(name = "respuesta_tipo")
    private String respuestaTipo; // "Leído", "Entendido", "A la orden", etc.

    @Column(name = "respuesta_texto", columnDefinition = "TEXT")
    private String respuestaTexto;

    @Column(name = "estado")
    @Enumerated(EnumType.STRING)
    private EstadoDestinatario estado = EstadoDestinatario.PENDIENTE;

    @Column(name = "reintentos_count")
    private Integer reintentosCount = 0;

    @Column(name = "ultimo_reintento_at")
    private LocalDateTime ultimoReintentoAt;

    public enum EstadoDestinatario {
        PENDIENTE, NOTIFICADO, ABIERTO, LEIDO, CONFIRMADO, RESPONDIDO, FALLIDO
    }
}
