package com.asamblea.repository;

import com.asamblea.model.LogAuditoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {
    Page<LogAuditoria> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<LogAuditoria> findByModuloOrderByCreatedAtDesc(String modulo);

    List<LogAuditoria> findByDetallesContainingOrderByCreatedAtDesc(String texto);
}
