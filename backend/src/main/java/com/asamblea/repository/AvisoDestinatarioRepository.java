package com.asamblea.repository;

import com.asamblea.model.AvisoDestinatario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvisoDestinatarioRepository extends JpaRepository<AvisoDestinatario, Long> {

    // Avisos para un usuario específico
    List<AvisoDestinatario> findByUsuarioIdOrderByEnviadoAtDesc(Long usuarioId);

    // Avisos no leídos para un usuario
    List<AvisoDestinatario> findByUsuarioIdAndLeidoAtIsNullOrderByEnviadoAtDesc(Long usuarioId);

    // Contar avisos no leídos
    int countByUsuarioIdAndLeidoAtIsNull(Long usuarioId);

    // Buscar por aviso y usuario
    Optional<AvisoDestinatario> findByAvisoIdAndUsuarioId(Long avisoId, Long usuarioId);

    // Destinatarios de un aviso específico
    List<AvisoDestinatario> findByAvisoId(Long avisoId);

    // Pendientes de notificación (para scheduler de reintentos)
    @Query("SELECT ad FROM AvisoDestinatario ad WHERE ad.estado = 'PENDIENTE' OR ad.estado = 'NOTIFICADO' " +
            "AND ad.leidoAt IS NULL AND ad.confirmadoAt IS NULL")
    List<AvisoDestinatario> findPendingNotification();

    // Marcar como leído
    @Modifying
    @Query("UPDATE AvisoDestinatario ad SET ad.leidoAt = :leidoAt, ad.estado = 'LEIDO' " +
            "WHERE ad.id = :id AND ad.leidoAt IS NULL")
    int markAsRead(Long id, LocalDateTime leidoAt);

    // Estadísticas por aviso
    @Query("SELECT ad.estado, COUNT(ad) FROM AvisoDestinatario ad WHERE ad.aviso.id = :avisoId GROUP BY ad.estado")
    List<Object[]> countByEstadoForAviso(Long avisoId);
}
