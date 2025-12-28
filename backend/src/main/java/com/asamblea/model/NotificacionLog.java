package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aviso_id")
    private Aviso aviso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "canal")
    @Enumerated(EnumType.STRING)
    private CanalNotificacion canal;

    @Column(name = "attempt_number")
    private Integer attemptNumber;

    @Column(name = "attempt_at")
    private LocalDateTime attemptAt = LocalDateTime.now();

    @Column(name = "resultado")
    @Enumerated(EnumType.STRING)
    private ResultadoNotificacion resultado;

    @Column(name = "error_detail")
    private String errorDetail;

    public enum CanalNotificacion {
        WEB, MOBILE
    }

    public enum ResultadoNotificacion {
        ENVIADO_OK, FALLO, BLOQUEADO, NO_PERMISO
    }
}
