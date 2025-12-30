package com.asamblea.repository;

import com.asamblea.model.Asignacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AsignacionRepository extends JpaRepository<Asignacion, Long> {

        // Explicitly define the query to avoid potential naming convention issues
        @Query("SELECT a FROM Asignacion a WHERE a.listaAsignacion.id = :listaId")
        List<Asignacion> findByListaAsignacionId(
                        @org.springframework.data.repository.query.Param("listaId") Long listaId);

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

        // ====== Métodos para cálculo de METAS por rol del usuario ======

        // Contar asignaciones con Voz y Voto creadas por usuarios con rol específico
        @Query("SELECT COUNT(a) FROM Asignacion a WHERE a.listaAsignacion.usuario.rol = :rol AND a.socio.aporteAlDia = true AND a.socio.solidaridadAlDia = true AND a.socio.fondoAlDia = true AND a.socio.incoopAlDia = true AND a.socio.creditoAlDia = true")
        Long countVyVByUsuarioRol(
                        @org.springframework.data.repository.query.Param("rol") com.asamblea.model.Usuario.Rol rol);

        // Contar asignaciones con Solo Voz creadas por usuarios con rol específico
        @Query("SELECT COUNT(a) FROM Asignacion a WHERE a.listaAsignacion.usuario.rol = :rol AND NOT (a.socio.aporteAlDia = true AND a.socio.solidaridadAlDia = true AND a.socio.fondoAlDia = true AND a.socio.incoopAlDia = true AND a.socio.creditoAlDia = true)")
        Long countSoloVozByUsuarioRol(
                        @org.springframework.data.repository.query.Param("rol") com.asamblea.model.Usuario.Rol rol);

        // Contar asignaciones con Voz y Voto creadas por usuarios SIN el rol
        // especificado (funcionarios)
        @Query("SELECT COUNT(a) FROM Asignacion a WHERE a.listaAsignacion.usuario.rol != :rol AND a.socio.aporteAlDia = true AND a.socio.solidaridadAlDia = true AND a.socio.fondoAlDia = true AND a.socio.incoopAlDia = true AND a.socio.creditoAlDia = true")
        Long countVyVByUsuarioRolNot(
                        @org.springframework.data.repository.query.Param("rol") com.asamblea.model.Usuario.Rol rol);

        // Contar asignaciones con Solo Voz creadas por usuarios SIN el rol especificado
        @Query("SELECT COUNT(a) FROM Asignacion a WHERE a.listaAsignacion.usuario.rol != :rol AND NOT (a.socio.aporteAlDia = true AND a.socio.solidaridadAlDia = true AND a.socio.fondoAlDia = true AND a.socio.incoopAlDia = true AND a.socio.creditoAlDia = true)")
        Long countSoloVozByUsuarioRolNot(
                        @org.springframework.data.repository.query.Param("rol") com.asamblea.model.Usuario.Rol rol);

        // Total de asignaciones con Voz y Voto (global)
        @Query("SELECT COUNT(a) FROM Asignacion a WHERE a.socio.aporteAlDia = true AND a.socio.solidaridadAlDia = true AND a.socio.fondoAlDia = true AND a.socio.incoopAlDia = true AND a.socio.creditoAlDia = true")
        Long countTotalVyV();

        // Total de asignaciones con Solo Voz (global)
        @Query("SELECT COUNT(a) FROM Asignacion a WHERE NOT (a.socio.aporteAlDia = true AND a.socio.solidaridadAlDia = true AND a.socio.fondoAlDia = true AND a.socio.incoopAlDia = true AND a.socio.creditoAlDia = true)")
        Long countTotalSoloVoz();

        // Por usuario específico (para dashboard personal)
        @Query("SELECT COUNT(a) FROM Asignacion a WHERE a.listaAsignacion.usuario.id = :userId AND a.socio.aporteAlDia = true AND a.socio.solidaridadAlDia = true AND a.socio.fondoAlDia = true AND a.socio.incoopAlDia = true AND a.socio.creditoAlDia = true")
        Long countVyVByUsuarioId(@org.springframework.data.repository.query.Param("userId") Long userId);

        @Query("SELECT COUNT(a) FROM Asignacion a WHERE a.listaAsignacion.usuario.id = :userId AND NOT (a.socio.aporteAlDia = true AND a.socio.solidaridadAlDia = true AND a.socio.fondoAlDia = true AND a.socio.incoopAlDia = true AND a.socio.creditoAlDia = true)")
        Long countSoloVozByUsuarioId(@org.springframework.data.repository.query.Param("userId") Long userId);

        // Distribución por sucursal
        @Query("SELECT s.sucursal.nombre, COUNT(a.id), " +
                        "SUM(CASE WHEN s.aporteAlDia = true AND s.solidaridadAlDia = true AND s.fondoAlDia = true AND s.incoopAlDia = true AND s.creditoAlDia = true THEN 1 ELSE 0 END) "
                        +
                        "FROM Asignacion a JOIN a.socio s " +
                        "GROUP BY s.sucursal.nombre ORDER BY COUNT(a.id) DESC")
        java.util.List<Object[]> countBySucursal();

        // Últimas asignaciones (con detalles)
        @Query("SELECT s.nombreCompleto, s.numeroSocio, suc.nombre, u.username, " +
                        "CASE WHEN s.aporteAlDia = true AND s.solidaridadAlDia = true AND s.fondoAlDia = true AND s.incoopAlDia = true AND s.creditoAlDia = true THEN true ELSE false END "
                        +
                        "FROM Asignacion a JOIN a.socio s LEFT JOIN s.sucursal suc " +
                        "JOIN a.listaAsignacion l JOIN l.usuario u " +
                        "ORDER BY a.id DESC")
        java.util.List<Object[]> findUltimasAsignaciones();
}
