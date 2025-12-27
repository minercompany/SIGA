package com.asamblea.controller;

import com.asamblea.repository.AsambleaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/asambleas")
@RequiredArgsConstructor
public class AsambleaController {

    private final AsambleaRepository asambleaRepository;

    @GetMapping("/proxima")
    public ResponseEntity<?> getProximaAsamblea() {
        return asambleaRepository.findProximaAsamblea(LocalDate.now())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
