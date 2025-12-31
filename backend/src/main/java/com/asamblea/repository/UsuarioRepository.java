package com.asamblea.repository;

import com.asamblea.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);

    Optional<Usuario> findByIdSocio(Long idSocio);

    // Meta GLOBAL = Asesores + Funcionarios (todos los usuarios que pueden
    // registrar)
    @Query("SELECT SUM(u.meta) FROM Usuario u")
    Long sumTotalMetas();

    // Meta por rol específico (ej: ASESOR_DE_CREDITO)
    @Query("SELECT SUM(u.meta) FROM Usuario u WHERE u.rol = :rol")
    Long sumTotalMetasByRol(@Param("rol") Usuario.Rol rol);

    // Meta de FUNCIONARIOS = todos los que NO son ASESOR_DE_CREDITO (incluye
    // USUARIO_SOCIO, DIRECTIVO, OPERADOR, etc)
    @Query("SELECT SUM(u.meta) FROM Usuario u WHERE u.rol != :rol")
    Long sumTotalMetasByRolNot(@Param("rol") Usuario.Rol rol);

    // Ranking de funcionarios por cantidad de registros en sus listas
    // Sucursal: First try Usuario.sucursal, fallback to Socio.sucursal via idSocio
    @Query("SELECT u.username, u.cargo, u.meta, COUNT(a.id), " +
            "CASE WHEN u.meta > 0 THEN (COUNT(a.id) * 100.0 / u.meta) ELSE 0 END, " +
            "u.nombreCompleto, COALESCE(s.nombre, socioSuc.nombre), socio.nombreCompleto " +
            "FROM Usuario u " +
            "LEFT JOIN ListaAsignacion l ON l.usuario.id = u.id " +
            "LEFT JOIN Asignacion a ON a.listaAsignacion.id = l.id " +
            "LEFT JOIN Sucursal s ON u.sucursal.id = s.id " +
            "LEFT JOIN Socio socio ON u.idSocio = socio.id " +
            "LEFT JOIN Sucursal socioSuc ON socio.sucursal.id = socioSuc.id " +
            "GROUP BY u.id, u.username, u.cargo, u.meta, u.nombreCompleto, s.nombre, socioSuc.nombre, socio.nombreCompleto "
            +
            "ORDER BY COUNT(a.id) DESC")
    List<Object[]> findRankingByAsignaciones();

    List<Usuario> findByActivoTrue();
}
