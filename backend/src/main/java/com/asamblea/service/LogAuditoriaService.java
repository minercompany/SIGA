package com.asamblea.service;

import com.asamblea.model.LogAuditoria;
import com.asamblea.repository.LogAuditoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LogAuditoriaService {

    private final LogAuditoriaRepository logAuditoriaRepository;

    @Transactional
    public void registrar(String modulo, String accion, String detalles, String usuario, String ip) {
        LogAuditoria log = LogAuditoria.builder()
                .modulo(modulo)
                .accion(accion)
                .detalles(detalles)
                .usuario(usuario)
                .ipAddress(ip)
                .build();
        if (log != null) {
            logAuditoriaRepository.save(log);
        }
    }

    public Page<LogAuditoria> obtenerTodos(int page, int size) {
        return logAuditoriaRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Transactional
    public void borrarTodo() {
        logAuditoriaRepository.deleteAll();
    }

    public java.util.List<LogAuditoria> buscarPorTermino(String termino) {
        return logAuditoriaRepository.findByDetallesContainingOrderByCreatedAtDesc(termino);
    }
}
