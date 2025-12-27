package com.asamblea.repository;

import com.asamblea.model.Asamblea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.Optional;

public interface AsambleaRepository extends JpaRepository<Asamblea, Long> {

    // Buscar la próxima asamblea activa
    @Query("SELECT a FROM Asamblea a WHERE a.activo = true AND a.fecha >= :today ORDER BY a.fecha ASC LIMIT 1")
    Optional<Asamblea> findProximaAsamblea(LocalDate today);

    Optional<Asamblea> findTopByActivoTrueOrderByFechaDesc();
}
