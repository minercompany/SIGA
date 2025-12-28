package com.asamblea.repository;

import com.asamblea.model.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SocioRepository extends JpaRepository<Socio, Long> {
    @Query("SELECT s FROM Socio s LEFT JOIN FETCH s.sucursal ORDER BY CAST(s.numeroSocio AS int) ASC")
    List<Socio> findAllByOrderByNumeroSocioAsc();

    // Paginación con sucursal cargada y ordenamiento numérico
    @Query(value = "SELECT s FROM Socio s LEFT JOIN FETCH s.sucursal ORDER BY CAST(s.numeroSocio AS int) ASC", countQuery = "SELECT COUNT(s) FROM Socio s")
    org.springframework.data.domain.Page<Socio> findAllWithSucursal(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT s FROM Socio s LEFT JOIN FETCH s.sucursal WHERE s.numeroSocio = :numeroSocio")
    Optional<Socio> findByNumeroSocio(String numeroSocio);

    @Query("SELECT s FROM Socio s LEFT JOIN FETCH s.sucursal WHERE s.cedula = :cedula")
    Optional<Socio> findByCedula(String cedula);

    @Query("SELECT s FROM Socio s LEFT JOIN FETCH s.sucursal WHERE s.sucursal.id = :sucursalId")
    List<Socio> findBySucursalId(Long sucursalId);

    // Contar total con Voz y Voto (los 4 campos en SI)
    @Query("SELECT COUNT(s) FROM Socio s WHERE s.aporteAlDia = true AND s.solidaridadAlDia = true AND s.fondoAlDia = true AND s.incoopAlDia = true AND s.creditoAlDia = true")
    Long countConVozYVoto();

    // Contar solo voz (al menos 1 campo en NO)
    @Query("SELECT COUNT(s) FROM Socio s WHERE NOT (s.aporteAlDia = true AND s.solidaridadAlDia = true AND s.fondoAlDia = true AND s.incoopAlDia = true AND s.creditoAlDia = true)")
    Long countSoloVoz();

    // Contar por sucursal
    @Query("SELECT COUNT(s) FROM Socio s WHERE s.sucursal.id = :sucursalId")
    Long countBySucursalId(Long sucursalId);

    // Contar con voz y voto por sucursal
    @Query("SELECT COUNT(s) FROM Socio s WHERE s.sucursal.id = :sucursalId AND s.aporteAlDia = true AND s.solidaridadAlDia = true AND s.fondoAlDia = true AND s.incoopAlDia = true AND s.creditoAlDia = true")
    Long countConVozYVotoBySucursalId(Long sucursalId);

    // Buscar exacto por número de socio o cédula - CON SUCURSAL
    @Query("SELECT s FROM Socio s LEFT JOIN FETCH s.sucursal WHERE s.numeroSocio = :term OR s.cedula = :term")
    List<Socio> buscarExacto(String term);

    // Buscar parcial por nombre, cédula o número socio - CON SUCURSAL
    @Query("SELECT s FROM Socio s LEFT JOIN FETCH s.sucursal WHERE LOWER(s.nombreCompleto) LIKE LOWER(CONCAT('%', :term, '%')) OR s.cedula LIKE CONCAT('%', :term, '%') OR s.numeroSocio LIKE CONCAT('%', :term, '%') ORDER BY s.nombreCompleto ASC")
    List<Socio> buscarParcial(String term);
}
