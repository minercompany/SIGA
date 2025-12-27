package com.asamblea.repository;

import com.asamblea.model.Asignacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AsignacionRepository extends JpaRepository<Asignacion, Long> {
    List<Asignacion> findByListaAsignacionId(Long listaId);

    @Query("SELECT COUNT(a) FROM Asignacion a WHERE a.listaAsignacion.id = :listaId AND a.socio.aporteAlDia = true AND a.socio.solidaridadAlDia = true AND a.socio.fondoAlDia = true AND a.socio.incoopAlDia = true AND a.socio.creditoAlDia = true")
    Long countVyVByListaId(Long listaId);

    @Query("SELECT COUNT(a) FROM Asignacion a WHERE a.listaAsignacion.id = :listaId AND NOT (a.socio.aporteAlDia = true AND a.socio.solidaridadAlDia = true AND a.socio.fondoAlDia = true AND a.socio.incoopAlDia = true AND a.socio.creditoAlDia = true)")
    Long countSoloVozByListaId(Long listaId);

    boolean existsByListaAsignacionIdAndSocioId(Long listaId, Long socioId);

    // Verificar si un socio ya está asignado a CUALQUIER lista
    boolean existsBySocioId(Long socioId);

    // Obtener la asignación existente de un socio (para mostrar info en error)
    java.util.Optional<Asignacion> findBySocioId(Long socioId);

    java.util.Optional<Asignacion> findByListaAsignacionIdAndSocioId(Long listaId, Long socioId);

    // Consulta optimizada para evitar LazyInitializationException y cargar toda la
    // jerarquía
    @Query("SELECT a FROM Asignacion a JOIN FETCH a.listaAsignacion l LEFT JOIN FETCH l.usuario WHERE a.socio.id = :socioId")
    java.util.Optional<Asignacion> findBySocioIdWithDetails(
            @org.springframework.data.repository.query.Param("socioId") Long socioId);
}
