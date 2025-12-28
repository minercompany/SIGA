package com.asamblea.repository;

import com.asamblea.model.NotificacionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionLogRepository extends JpaRepository<NotificacionLog, Long> {

    // Log de notificaciones por aviso
    List<NotificacionLog> findByAvisoIdOrderByAttemptAtDesc(Long avisoId);

    // Log de notificaciones por usuario
    List<NotificacionLog> findByUsuarioIdOrderByAttemptAtDesc(Long usuarioId);

    // Contar intentos para un aviso/usuario
    int countByAvisoIdAndUsuarioId(Long avisoId, Long usuarioId);
}
