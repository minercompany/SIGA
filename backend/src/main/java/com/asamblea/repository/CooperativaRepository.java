package com.asamblea.repository;

import com.asamblea.model.Cooperativa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CooperativaRepository extends JpaRepository<Cooperativa, Long> {

    /**
     * Obtiene el primer registro de cooperativa (debería haber solo uno).
     */
    Optional<Cooperativa> findFirstByOrderByIdAsc();
}
