package com.asamblea.controller;

import com.asamblea.model.Asistencia;
import com.asamblea.model.Usuario;
import com.asamblea.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controlador con endpoints PÚBLICOS para la pantalla de presentación.
 * NO requieren autenticación - diseñado para proyección en pantalla grande.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicDashboardController {

    private final SocioRepository socioRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final AsignacionRepository asignacionRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Estadísticas generales del padrón - PÚBLICO
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> getEstadisticas() {
        Map<String, Object> stats = new HashMap<>();

        long totalPadron = socioRepository.count();
        Long conVozYVoto = socioRepository.countConVozYVoto();
        if (conVozYVoto == null)
            conVozYVoto = 0L;
        Long soloVoz = socioRepository.countSoloVoz();
        if (soloVoz == null)
            soloVoz = 0L;

        // Presentes hoy
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime finDia = LocalDate.now().atTime(23, 59, 59);

        long presentes = asistenciaRepository.countByFechaHoraBetween(inicioDia, finDia);
        long presentesVyV = asistenciaRepository.countByFechaHoraBetweenAndEstadoVozVoto(inicioDia, finDia, true);

        stats.put("totalPadron", totalPadron);
        stats.put("conVozYVoto", conVozYVoto);
        stats.put("soloVoz", soloVoz);
        stats.put("presentes", presentes);
        stats.put("presentesVyV", presentesVyV);

        return ResponseEntity.ok(stats);
    }

    /**
     * Metas de registro segmentadas - PÚBLICO
     * CORREGIDO: Cuenta desde ASIGNACIONES (listas), NO desde ASISTENCIAS
     * (check-ins)
     */
    @GetMapping("/metas")
    public ResponseEntity<Map<String, Object>> getMetas() {
        Map<String, Object> response = new HashMap<>();

        // Meta global
        Long metaGlobal = usuarioRepository.sumTotalMetas();
        if (metaGlobal == null)
            metaGlobal = 0L;

        // CORREGIDO: Contar desde ASIGNACIONES (listas creadas por usuarios)
        Long registradosVyV = asignacionRepository.countTotalVyV();
        if (registradosVyV == null)
            registradosVyV = 0L;

        double porcentaje = metaGlobal > 0 ? (registradosVyV.doubleValue() / metaGlobal.doubleValue()) * 100 : 0;

        response.put("meta", metaGlobal);
        response.put("registradosVozYVoto", registradosVyV);
        response.put("porcentajeMeta", porcentaje);

        // Segmentado: Asesores (desde sus listas)
        Long metaAsesores = usuarioRepository.sumTotalMetasByRol(Usuario.Rol.ASESOR_DE_CREDITO);
        if (metaAsesores == null)
            metaAsesores = 0L;

        Long regAsesores = asignacionRepository.countVyVByUsuarioRol(Usuario.Rol.ASESOR_DE_CREDITO);
        if (regAsesores == null)
            regAsesores = 0L;

        double porcAsesores = metaAsesores > 0 ? (regAsesores.doubleValue() / metaAsesores.doubleValue()) * 100 : 0;

        Map<String, Object> asesoresData = new HashMap<>();
        asesoresData.put("meta", metaAsesores);
        asesoresData.put("registradosVozYVoto", regAsesores);
        asesoresData.put("porcentajeMeta", porcAsesores);
        response.put("asesores", asesoresData);

        // Segmentado: Funcionarios (desde sus listas)
        Long metaFunc = usuarioRepository.sumTotalMetasByRolNot(Usuario.Rol.ASESOR_DE_CREDITO);
        if (metaFunc == null)
            metaFunc = 0L;

        Long regFunc = asignacionRepository.countVyVByUsuarioRolNot(Usuario.Rol.ASESOR_DE_CREDITO);
        if (regFunc == null)
            regFunc = 0L;

        double porcFunc = metaFunc > 0 ? (regFunc.doubleValue() / metaFunc.doubleValue()) * 100 : 0;

        Map<String, Object> funcData = new HashMap<>();
        funcData.put("meta", metaFunc);
        funcData.put("registradosVozYVoto", regFunc);
        funcData.put("porcentajeMeta", porcFunc);
        response.put("funcionarios", funcData);

        return ResponseEntity.ok(response);
    }

    /**
     * Asistencias del día - PÚBLICO (solo datos mínimos)
     */
    @GetMapping("/asistencia-hoy")
    public ResponseEntity<List<Map<String, Object>>> getAsistenciaHoy() {
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime finDia = LocalDate.now().atTime(23, 59, 59);

        List<Asistencia> asistencias = asistenciaRepository.findByFechaHoraBetween(inicioDia, finDia);

        // Retornar datos mínimos para la gráfica pública
        List<Map<String, Object>> result = asistencias.stream().map(a -> {
            Map<String, Object> item = new HashMap<>();
            item.put("fechaHora", a.getFechaHora());
            item.put("vozVoto", a.getEstadoVozVoto());
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Ranking de funcionarios por registros en listas - PÚBLICO
     * Muestra el top de funcionarios que más socios han registrado
     */
    @GetMapping("/ranking-funcionarios")
    public ResponseEntity<List<Map<String, Object>>> getRankingFuncionarios() {
        List<Object[]> resultados = usuarioRepository.findRankingByAsignaciones();

        List<Map<String, Object>> ranking = resultados.stream()
                .limit(10) // Top 10
                .map(row -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("nombre", row[0]);
                    item.put("cargo", row[1]);
                    item.put("meta", row[2]);
                    item.put("registrados", row[3]);
                    item.put("porcentaje", row[4] != null ? row[4] : 0);
                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ranking);
    }

    /**
     * Distribución de registros por sucursal - PÚBLICO
     */
    @GetMapping("/distribucion-sucursales")
    public ResponseEntity<List<Map<String, Object>>> getDistribucionSucursales() {
        List<Object[]> resultados = asignacionRepository.countBySucursal();

        List<Map<String, Object>> distribucion = resultados.stream()
                .map(row -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("sucursal", row[0] != null ? row[0] : "Sin Sucursal");
                    item.put("total", row[1]);
                    item.put("conVyV", row[2] != null ? row[2] : 0);
                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(distribucion);
    }

    /**
     * Últimas asignaciones (registros en listas) - PÚBLICO
     */
    @GetMapping("/ultimas-asignaciones")
    public ResponseEntity<List<Map<String, Object>>> getUltimasAsignaciones() {
        List<Object[]> resultados = asignacionRepository.findUltimasAsignaciones();

        List<Map<String, Object>> ultimas = resultados.stream()
                .limit(8)
                .map(row -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("socioNombre", row[0]);
                    item.put("socioNumero", row[1]);
                    item.put("sucursal", row[2] != null ? row[2] : "N/A");
                    item.put("funcionario", row[3]);
                    item.put("tieneVyV", row[4]);
                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ultimas);
    }
}
