package com.asamblea.repository;

import com.asamblea.model.ChatMensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMensajeRepository extends JpaRepository<ChatMensaje, Long> {

    // Mensajes de una conversación ordenados por fecha
    List<ChatMensaje> findByConversacionIdOrderByCreatedAtAsc(Long conversacionId);

    // Últimos N mensajes de una conversación
    @Query("SELECT m FROM ChatMensaje m WHERE m.conversacion.id = :conversacionId ORDER BY m.createdAt DESC")
    List<ChatMensaje> findLastMessages(Long conversacionId, org.springframework.data.domain.Pageable pageable);

    // Marcar mensajes como leídos
    @Modifying
    @Query("UPDATE ChatMensaje m SET m.readAt = :readAt, m.estado = 'LEIDO' " +
            "WHERE m.conversacion.id = :conversacionId AND m.senderRole = :senderRole AND m.readAt IS NULL")
    int markAsRead(Long conversacionId, ChatMensaje.SenderRole senderRole, LocalDateTime readAt);

    // Contar mensajes no leídos por conversación
    @Query("SELECT COUNT(m) FROM ChatMensaje m WHERE m.conversacion.id = :conversacionId " +
            "AND m.senderRole = :senderRole AND m.readAt IS NULL")
    int countUnreadByConversacion(Long conversacionId, ChatMensaje.SenderRole senderRole);
}
