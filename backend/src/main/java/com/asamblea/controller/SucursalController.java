package com.asamblea.controller;

import com.asamblea.model.Sucursal;
import com.asamblea.repository.SucursalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sucursales")
@RequiredArgsConstructor
public class SucursalController {

    private final SucursalRepository sucursalRepository;

    @GetMapping
    public ResponseEntity<List<Sucursal>> listar() {
        return ResponseEntity.ok(sucursalRepository.findAllByOrderByCodigoAsc());
    }
}
