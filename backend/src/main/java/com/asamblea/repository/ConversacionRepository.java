package com.asamblea.repository;

import com.asamblea.model.Conversacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversacionRepository extends JpaRepository<Conversacion, Long> {

    // Buscar conversación existente entre usuario y admin
    Optional<Conversacion> findByUsuarioId(Long usuarioId);

    // Lista de conversaciones para admin (ordenadas por último mensaje)
    @Query("SELECT c FROM Conversacion c ORDER BY c.lastMessageAt DESC")
    List<Conversacion> findAllOrderByLastMessageDesc();

    // Conversaciones con mensajes no leídos para admin
    @Query("SELECT c FROM Conversacion c WHERE c.unreadCountAdmin > 0 ORDER BY c.lastMessageAt DESC")
    List<Conversacion> findWithUnreadForAdmin();

    // Contar mensajes no leídos totales para admin
    @Query("SELECT COALESCE(SUM(c.unreadCountAdmin), 0) FROM Conversacion c")
    Integer countTotalUnreadForAdmin();

    // Contar mensajes no leídos para usuario específico
    @Query("SELECT COALESCE(c.unreadCountUsuario, 0) FROM Conversacion c WHERE c.usuario.id = :usuarioId")
    Integer countUnreadForUsuario(Long usuarioId);
}
