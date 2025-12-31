package com.asamblea.controller;

import com.asamblea.model.Usuario;
import com.asamblea.repository.AsignacionRepository;
import com.asamblea.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AsignacionRepository asignacionRepository;

    @GetMapping("/metas")
    public ResponseEntity<?> getMetas(Authentication authentication, @RequestParam(required = false) Long userId) {
        try {
            Usuario usuario;

            // Si viene userId y quien pide es admin, usamos ese user. Si no, usamos el
            // logueado.
            if (userId != null) {
                // Verificar permisos: Solo Admin/Directivo puede ver metas de otros
                String requesterUsername = authentication.getName();
                Usuario requester = usuarioRepository.findByUsername(requesterUsername).orElse(null);

                if (requester != null && !requester.getId().equals(userId)) {
                    if (requester.getRol() != Usuario.Rol.SUPER_ADMIN && requester.getRol() != Usuario.Rol.DIRECTIVO) {
                        return ResponseEntity.status(403)
                                .body("No tienes permisos para ver las metas de otros usuarios");
                    }
                }

                Optional<Usuario> targetUser = usuarioRepository.findById(userId);
                if (targetUser.isEmpty()) {
                    return ResponseEntity.notFound().build();
                }
                usuario = targetUser.get();
            } else {
                String username = authentication.getName();
                Optional<Usuario> currentUser = usuarioRepository.findByUsername(username);
                if (currentUser.isEmpty()) {
                    return ResponseEntity.notFound().build();
                }
                usuario = currentUser.get();
            }

            // 1. Determinar Meta y Conteos
            long vozYVoto;
            long soloVoz;
            int meta;
            String cargo;

            // Variables para segmentación (solo admin)
            Map<String, Object> asesoresData = null;
            Map<String, Object> funcionariosData = null;

            // Lógica GLOBAL para SUPER_ADMIN (si no está viendo a otro usuario específico)
            if (userId == null && usuario.getRol() == Usuario.Rol.SUPER_ADMIN) {
                Long totalMeta = usuarioRepository.sumTotalMetas();
                meta = totalMeta != null ? totalMeta.intValue() : 0;

                // CORREGIDO: Contar desde ASIGNACIONES (listas), NO desde ASISTENCIAS
                // (check-ins)
                Long vyv = asignacionRepository.countTotalVyV();
                Long sv = asignacionRepository.countTotalSoloVoz();
                vozYVoto = vyv != null ? vyv : 0;
                soloVoz = sv != null ? sv : 0;
                cargo = "Meta Global";

                // --- SEGMENTACION ASESORES vs FUNCIONARIOS ---
                // 1. Asesores de Crédito (cuentan desde sus listas)
                Long metaAsesores = usuarioRepository.sumTotalMetasByRol(Usuario.Rol.ASESOR_DE_CREDITO);
                Long vozAsesores = asignacionRepository.countVyVByUsuarioRol(Usuario.Rol.ASESOR_DE_CREDITO);
                if (vozAsesores == null)
                    vozAsesores = 0L;

                asesoresData = new HashMap<>();
                asesoresData.put("meta", metaAsesores != null ? metaAsesores : 0);
                asesoresData.put("registradosVozYVoto", vozAsesores);
                asesoresData.put("porcentajeMeta",
                        (metaAsesores != null && metaAsesores > 0) ? ((double) vozAsesores / metaAsesores) * 100 : 0);

                // 2. Funcionarios (todos los demás roles)
                Long metaFunc = usuarioRepository.sumTotalMetasByRolNot(Usuario.Rol.ASESOR_DE_CREDITO);
                Long vozFunc = asignacionRepository.countVyVByUsuarioRolNot(Usuario.Rol.ASESOR_DE_CREDITO);
                if (vozFunc == null)
                    vozFunc = 0L;

                funcionariosData = new HashMap<>();
                funcionariosData.put("meta", metaFunc != null ? metaFunc : 0);
                funcionariosData.put("registradosVozYVoto", vozFunc);
                funcionariosData.put("porcentajeMeta",
                        (metaFunc != null && metaFunc > 0) ? ((double) vozFunc / metaFunc) * 100 : 0);

            } else {
                // Lógica PERSONAL (para operadores, asesores o ver un usuario específico)
                meta = usuario.getMeta() != null ? usuario.getMeta() : 50;
                // CORREGIDO: Contar desde ASIGNACIONES del usuario
                Long vyv = asignacionRepository.countVyVByUsuarioId(usuario.getId());
                Long sv = asignacionRepository.countSoloVozByUsuarioId(usuario.getId());
                vozYVoto = vyv != null ? vyv : 0;
                soloVoz = sv != null ? sv : 0;
                cargo = usuario.getCargo() != null ? usuario.getCargo() : "Funcionario";
            }

            long totalRegistrados = vozYVoto + soloVoz;

            Map<String, Object> response = new HashMap<>();
            response.put("usuarioId", usuario.getId());
            response.put("cargo", cargo);
            response.put("meta", meta);
            response.put("registradosVozYVoto", vozYVoto);
            response.put("registradosSoloVoz", soloVoz);
            response.put("totalRegistrados", totalRegistrados);

            if (asesoresData != null)
                response.put("asesores", asesoresData);
            if (funcionariosData != null)
                response.put("funcionarios", funcionariosData);

            // Cálculos derivados facilitan al frontend
            double porcentajeMeta = meta > 0 ? ((double) vozYVoto / meta) * 100 : 0;
            response.put("porcentajeMeta", porcentajeMeta);
            response.put("faltanMeta", Math.max(0, meta - vozYVoto));
            response.put("cumplida", vozYVoto >= meta);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error calculando metas: " + e.getMessage());
        }
    }
}
