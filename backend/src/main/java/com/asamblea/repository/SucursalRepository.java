package com.asamblea.repository;

import com.asamblea.model.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SucursalRepository extends JpaRepository<Sucursal, Long> {
    Optional<Sucursal> findByCodigo(String codigo);

    Optional<Sucursal> findByNombre(String nombre);

    List<Sucursal> findAllByOrderByCodigoAsc();
}
