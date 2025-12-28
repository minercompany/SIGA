package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_mensajes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversacion_id", nullable = false)
    private Conversacion conversacion;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "sender_role", nullable = false)
    @Enumerated(EnumType.STRING)
    private SenderRole senderRole;

    @Column(name = "contenido", columnDefinition = "TEXT", nullable = false)
    private String contenido;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "estado")
    @Enumerated(EnumType.STRING)
    private EstadoMensaje estado = EstadoMensaje.ENVIADO;

    @Column(name = "ip_sender")
    private String ipSender;

    @Column(name = "user_agent")
    private String userAgent;

    public enum SenderRole {
        ADMIN, USUARIO
    }

    public enum EstadoMensaje {
        ENVIADO, ENTREGADO, LEIDO, FALLIDO
    }
}
