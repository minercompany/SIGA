package com.asamblea.controller;

import com.asamblea.model.FuncionarioDirectivo;
import com.asamblea.service.FuncionarioDirectivoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/funcionarios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FuncionarioDirectivoController {

    private final FuncionarioDirectivoService funcionarioService;

    /**
     * Importar Excel de funcionarios y directivos
     * Solo SUPER_ADMIN puede hacer esto
     */
    @PostMapping("/importar")
    // @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> importarFuncionarios(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El archivo está vacío"));
            }

            String filename = file.getOriginalFilename();
            if (filename == null || !filename.endsWith(".xlsx")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten archivos .xlsx"));
            }

            Map<String, Object> resultado = funcionarioService.importarFuncionarios(file);
            return ResponseEntity.ok(resultado);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al importar: " + e.getMessage()));
        }
    }

    /**
     * Listar todos los funcionarios/directivos registrados
     */
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<FuncionarioDirectivo>> listar() {
        return ResponseEntity.ok(funcionarioService.listarTodos());
    }

    /**
     * Eliminar un funcionario de la lista
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            funcionarioService.eliminar(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> contar() {
        return ResponseEntity.ok(Map.of("total", funcionarioService.contarTotal()));
    }
}
