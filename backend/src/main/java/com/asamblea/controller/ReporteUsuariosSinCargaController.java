package com.asamblea.controller;

import com.asamblea.model.Usuario;
import com.asamblea.repository.SucursalRepository;
import com.asamblea.repository.UsuarioRepository;
import com.asamblea.service.ReporteExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reportes/usuarios-sin-carga")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class ReporteUsuariosSinCargaController {

    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;
    private final ReporteExportService exportService;

    private boolean isAuthorized(Authentication auth) {
        if (auth == null)
            return false;
        Usuario user = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null)
            return false;
        return user.getRol() == Usuario.Rol.SUPER_ADMIN || user.getRol() == Usuario.Rol.DIRECTIVO;
    }

    /**
     * GET /api/reportes/usuarios-sin-carga
     * Params:
     * - soloAsesores: boolean (default false) - If true, only show
     * ASESOR_DE_CREDITO
     * - sucursalId: Long (optional) - Filter by specific branch
     */
    @GetMapping
    public ResponseEntity<?> getUsuariosSinCarga(
            Authentication auth,
            @RequestParam(defaultValue = "false") boolean soloAsesores,
            @RequestParam(required = false) Long sucursalId) {
        if (!isAuthorized(auth))
            return ResponseEntity.status(403).build();

        List<Usuario> usuarios = fetchUsuarios(soloAsesores, sucursalId);

        // Map to DTOs for JSON response
        List<Map<String, Object>> result = usuarios.stream().map(u -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", u.getId());
            dto.put("username", u.getUsername());
            dto.put("nombreCompleto", u.getNombreCompleto());
            dto.put("rol", u.getRol().getNombre());
            dto.put("sucursal", getSucursalNombre(u));
            dto.put("cargo", u.getCargo() != null ? u.getCargo() : "-");
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // Helper to get sucursal name from Usuario or fallback to Socio's sucursal
    private String getSucursalNombre(Usuario u) {
        // First try Usuario.sucursal
        if (u.getSucursal() != null) {
            return u.getSucursal().getNombre();
        }
        // Fallback: try Socio's sucursal
        if (u.getSocio() != null && u.getSocio().getSucursal() != null) {
            return u.getSocio().getSucursal().getNombre();
        }
        return "Sin Sucursal";
    }

    /**
     * GET /api/reportes/usuarios-sin-carga/export-pdf
     */
    @GetMapping("/export-pdf")
    public ResponseEntity<byte[]> exportPdf(
            Authentication auth,
            @RequestParam(defaultValue = "false") boolean soloAsesores,
            @RequestParam(required = false) Long sucursalId) {
        if (!isAuthorized(auth))
            return ResponseEntity.status(403).build();

        List<Usuario> usuarios = fetchUsuarios(soloAsesores, sucursalId);

        // Build filter description
        String filtroInfo = buildFiltroInfo(soloAsesores, sucursalId);

        byte[] pdf = exportService.generarPdfUsuariosSinCarga(usuarios, filtroInfo);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=usuarios_sin_carga.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    /**
     * GET /api/reportes/usuarios-sin-carga/export-excel
     */
    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportExcel(
            Authentication auth,
            @RequestParam(defaultValue = "false") boolean soloAsesores,
            @RequestParam(required = false) Long sucursalId) {
        if (!isAuthorized(auth))
            return ResponseEntity.status(403).build();

        List<Usuario> usuarios = fetchUsuarios(soloAsesores, sucursalId);

        byte[] excel = exportService.generarExcelUsuariosSinCarga(usuarios);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=usuarios_sin_carga.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excel);
    }

    private List<Usuario> fetchUsuarios(boolean soloAsesores, Long sucursalId) {
        if (sucursalId != null) {
            if (soloAsesores) {
                return usuarioRepository.findAsesoresSinAsignacionesBySucursal(sucursalId);
            } else {
                return usuarioRepository.findUsuariosSinAsignacionesBySucursal(sucursalId);
            }
        } else {
            if (soloAsesores) {
                return usuarioRepository.findAsesoresSinAsignaciones();
            } else {
                return usuarioRepository.findUsuariosSinAsignaciones();
            }
        }
    }

    private String buildFiltroInfo(boolean soloAsesores, Long sucursalId) {
        StringBuilder sb = new StringBuilder();
        sb.append(soloAsesores ? "Solo Asesores de Crédito" : "Todos los Usuarios");

        if (sucursalId != null) {
            sucursalRepository.findById(sucursalId).ifPresent(s -> sb.append(" | Sucursal: ").append(s.getNombre()));
        } else {
            sb.append(" | Todas las Sucursales");
        }

        return sb.toString();
    }
}
