package com.asamblea.repository;

import com.asamblea.model.Aviso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvisoRepository extends JpaRepository<Aviso, Long> {

    // Avisos enviados por un admin específico
    List<Aviso> findByEmisorIdOrderByCreatedAtDesc(Long emisorId);

    // Todos los avisos ordenados por fecha
    List<Aviso> findAllByOrderByCreatedAtDesc();

    // Avisos por tipo
    List<Aviso> findByTipoOrderByCreatedAtDesc(Aviso.TipoAviso tipo);

    // Avisos pendientes de envío (programados)
    @Query("SELECT a FROM Aviso a WHERE a.programadoPara IS NOT NULL " +
            "AND a.programadoPara <= CURRENT_TIMESTAMP AND a.estadoGeneral = 'CREADO'")
    List<Aviso> findPendingScheduled();

    // Avisos de alta/crítica prioridad
    List<Aviso> findByPrioridadInOrderByCreatedAtDesc(List<Aviso.PrioridadAviso> prioridades);
}
