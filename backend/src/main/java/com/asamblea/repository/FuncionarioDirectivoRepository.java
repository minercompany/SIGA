package com.asamblea.repository;

import com.asamblea.model.FuncionarioDirectivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FuncionarioDirectivoRepository extends JpaRepository<FuncionarioDirectivo, Long> {

    Optional<FuncionarioDirectivo> findByNumeroSocio(String numeroSocio);

    Optional<FuncionarioDirectivo> findByCedula(String cedula);

    boolean existsByNumeroSocio(String numeroSocio);

    boolean existsByCedula(String cedula);

    long countByRol(FuncionarioDirectivo.RolFuncionario rol);

    long countByRolNot(FuncionarioDirectivo.RolFuncionario rol);
}
