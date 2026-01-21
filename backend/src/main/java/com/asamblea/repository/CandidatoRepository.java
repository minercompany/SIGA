package com.asamblea.repository;

import com.asamblea.model.Candidato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CandidatoRepository extends JpaRepository<Candidato, Long> {
    List<Candidato> findByActivoTrueOrderByOrganoAscOrdenAsc();
    List<Candidato> findByOrganoAndActivoTrueOrderByOrdenAsc(Candidato.Organo organo);
}
