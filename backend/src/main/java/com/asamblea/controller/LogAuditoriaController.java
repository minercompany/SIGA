package com.asamblea.controller;

import com.asamblea.model.LogAuditoria;
import com.asamblea.service.LogAuditoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class LogAuditoriaController {

    private final LogAuditoriaService logAuditoriaService;

    @GetMapping
    public ResponseEntity<Page<LogAuditoria>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(logAuditoriaService.obtenerTodos(page, size));
    }
}
