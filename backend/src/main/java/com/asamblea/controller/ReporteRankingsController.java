package com.asamblea.controller;

import com.asamblea.model.Usuario;
import com.asamblea.repository.UsuarioRepository;
import com.asamblea.service.ReporteExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes/rankings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class ReporteRankingsController {

    private final JdbcTemplate jdbcTemplate;
    private final UsuarioRepository usuarioRepository;
    private final ReporteExportService exportService;

    private boolean isAuthorized(Authentication auth) {
        if (auth == null)
            return false;
        Usuario user = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null)
            return false;
        return user.getRol() == Usuario.Rol.SUPER_ADMIN || user.getRol() == Usuario.Rol.DIRECTIVO;
    }

    @GetMapping("/asesores")
    public ResponseEntity<?> getTopAsesores(Authentication auth) {
        if (!isAuthorized(auth))
            return ResponseEntity.status(403).build();

        String sql = """
                    SELECT
                        u.nombre_completo as nombre,
                        u.username,
                        s.nombre as sucursal,
                        COUNT(a.id) as total_vyv
                    FROM usuarios u
                    INNER JOIN sucursales s ON u.id_sucursal = s.id
                    INNER JOIN listas_asignacion la ON la.user_id = u.id
                    INNER JOIN asignaciones_socios a ON a.lista_id = la.id
                    INNER JOIN socios socio ON a.socio_id = socio.id
                    WHERE u.rol = 'ASESOR_DE_CREDITO'
                    AND socio.aporte_al_dia = 1
                    AND socio.solidaridad_al_dia = 1
                    AND socio.fondo_al_dia = 1
                    AND socio.incoop_al_dia = 1
                    AND socio.credito_al_dia = 1
                    GROUP BY u.id, u.nombre_completo, u.username, s.nombre
                    ORDER BY total_vyv DESC
                    LIMIT 10
                """;

        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/usuarios")
    public ResponseEntity<?> getTopUsuarios(Authentication auth) {
        if (!isAuthorized(auth))
            return ResponseEntity.status(403).build();

        String sql = """
                    SELECT
                        u.nombre_completo as nombre,
                        u.username,
                        u.rol,
                        s.nombre as sucursal,
                        COUNT(a.id) as total_vyv
                    FROM usuarios u
                    LEFT JOIN sucursales s ON u.id_sucursal = s.id
                    INNER JOIN listas_asignacion la ON la.user_id = u.id
                    INNER JOIN asignaciones_socios a ON a.lista_id = la.id
                    INNER JOIN socios socio ON a.socio_id = socio.id
                    WHERE socio.aporte_al_dia = 1
                    AND socio.solidaridad_al_dia = 1
                    AND socio.fondo_al_dia = 1
                    AND socio.incoop_al_dia = 1
                    AND socio.credito_al_dia = 1
                    GROUP BY u.id, u.nombre_completo, u.username, u.rol, s.nombre
                    ORDER BY total_vyv DESC
                    LIMIT 10
                """;

        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sucursales")
    public ResponseEntity<?> getTopSucursales(Authentication auth) {
        if (!isAuthorized(auth))
            return ResponseEntity.status(403).build();

        String sql = """
                    SELECT
                        s.nombre as sucursal,
                        COUNT(a.id) as total_vyv
                    FROM sucursales s
                    INNER JOIN usuarios u ON u.id_sucursal = s.id
                    INNER JOIN listas_asignacion la ON la.user_id = u.id
                    INNER JOIN asignaciones_socios a ON a.lista_id = la.id
                    INNER JOIN socios socio ON a.socio_id = socio.id
                    WHERE socio.aporte_al_dia = 1
                    AND socio.solidaridad_al_dia = 1
                    AND socio.fondo_al_dia = 1
                    AND socio.incoop_al_dia = 1
                    AND socio.credito_al_dia = 1
                    GROUP BY s.id, s.nombre
                    ORDER BY total_vyv DESC
                    LIMIT 10
                """;

        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(result);
    }

    private List<Map<String, Object>> fetchAsesores() {
        return jdbcTemplate.queryForList(
                """
                            SELECT u.nombre_completo as asesor, s.nombre as sucursal, COUNT(a.id) as total_vyv
                            FROM usuarios u
                            INNER JOIN sucursales s ON u.id_sucursal = s.id
                            INNER JOIN listas_asignacion la ON la.user_id = u.id
                            INNER JOIN asignaciones_socios a ON a.lista_id = la.id
                            INNER JOIN socios socio ON a.socio_id = socio.id
                            WHERE u.rol = 'ASESOR_DE_CREDITO'
                            AND socio.aporte_al_dia = 1 AND socio.solidaridad_al_dia = 1 AND socio.fondo_al_dia = 1 AND socio.incoop_al_dia = 1 AND socio.credito_al_dia = 1
                            GROUP BY u.id, u.nombre_completo, s.nombre
                            ORDER BY total_vyv DESC LIMIT 10
                        """);
    }

    private List<Map<String, Object>> fetchUsuarios() {
        return jdbcTemplate.queryForList(
                """
                            SELECT u.nombre_completo as usuario, u.rol, s.nombre as sucursal, COUNT(a.id) as total_vyv
                            FROM usuarios u
                            LEFT JOIN sucursales s ON u.id_sucursal = s.id
                            INNER JOIN listas_asignacion la ON la.user_id = u.id
                            INNER JOIN asignaciones_socios a ON a.lista_id = la.id
                            INNER JOIN socios socio ON a.socio_id = socio.id
                            WHERE socio.aporte_al_dia = 1 AND socio.solidaridad_al_dia = 1 AND socio.fondo_al_dia = 1 AND socio.incoop_al_dia = 1 AND socio.credito_al_dia = 1
                            GROUP BY u.id, u.nombre_completo, u.rol, s.nombre
                            ORDER BY total_vyv DESC LIMIT 10
                        """);
    }

    private List<Map<String, Object>> fetchSucursales() {
        return jdbcTemplate.queryForList(
                """
                            SELECT s.nombre as sucursal, COUNT(a.id) as total_vyv
                            FROM sucursales s
                            INNER JOIN usuarios u ON u.id_sucursal = s.id
                            INNER JOIN listas_asignacion la ON la.user_id = u.id
                            INNER JOIN asignaciones_socios a ON a.lista_id = la.id
                            INNER JOIN socios socio ON a.socio_id = socio.id
                            WHERE socio.aporte_al_dia = 1 AND socio.solidaridad_al_dia = 1 AND socio.fondo_al_dia = 1 AND socio.incoop_al_dia = 1 AND socio.credito_al_dia = 1
                            GROUP BY s.id, s.nombre
                            ORDER BY total_vyv DESC LIMIT 10
                        """);
    }

    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportToExcel(Authentication auth) {
        if (!isAuthorized(auth))
            return ResponseEntity.status(403).build();
        byte[] excelContent = exportService.generarExcelRankings(fetchAsesores(), fetchUsuarios(), fetchSucursales());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rankings_vyv.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelContent);
    }

    @GetMapping("/export-pdf")
    public ResponseEntity<byte[]> exportToPdf(@RequestParam(defaultValue = "all") String type, Authentication auth) {
        if (!isAuthorized(auth))
            return ResponseEntity.status(403).build();
        byte[] pdfContent = exportService.generarPdfRankings(type, fetchAsesores(), fetchUsuarios(), fetchSucursales());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rankings_vyv_" + type + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfContent);
    }
}
