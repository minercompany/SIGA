package com.asamblea.repository;

import com.asamblea.model.PushSubscription;
import com.asamblea.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    List<PushSubscription> findByUsuario(Usuario usuario);

    List<PushSubscription> findByUsuario_Rol(Usuario.Rol rol);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    void deleteByEndpoint(String endpoint);
}
