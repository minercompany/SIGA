package com.asamblea.repository;

import com.asamblea.model.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {

    @Query("SELECT COUNT(a) FROM Asistencia a WHERE a.socio.id IN (SELECT asig.socio.id FROM Asignacion asig WHERE asig.listaAsignacion.id = :listaId)")
    long countPresentesByListaId(Long listaId);

    long countByEstadoVozVoto(Boolean estadoVozVoto);

    // Contar presentes por sucursal
    @Query("SELECT COUNT(a) FROM Asistencia a WHERE a.socio.sucursal.id = :sucursalId")
    long countBySucursalId(Long sucursalId);

    // Verificar si un socio tiene asistencia
    // Verificar si un socio tiene asistencia
    boolean existsBySocioId(Long socioId);

    java.util.Optional<Asistencia> findFirstBySocioId(Long socioId);

    // Buscar asistencias por operador
    java.util.List<Asistencia> findByOperadorId(Long operadorId);

    // Eliminar asistencias por socio ID
    void deleteBySocioId(Long socioId);
}
