package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Conversacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private Usuario admin;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "estado")
    @Enumerated(EnumType.STRING)
    private EstadoConversacion estado = EstadoConversacion.ACTIVA;

    @Column(name = "unread_count_usuario")
    private Integer unreadCountUsuario = 0;

    @Column(name = "unread_count_admin")
    private Integer unreadCountAdmin = 0;

    public enum EstadoConversacion {
        ACTIVA, ARCHIVADA
    }
}
