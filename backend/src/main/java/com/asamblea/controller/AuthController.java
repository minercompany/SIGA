package com.asamblea.controller;

import com.asamblea.dto.AuthResponse;
import com.asamblea.dto.LoginRequest;
import com.asamblea.model.Usuario;
import com.asamblea.repository.*;
import com.asamblea.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

        private final AuthenticationManager authenticationManager;
        private final UsuarioRepository usuarioRepository;
        private final JwtService jwtService;
        private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
        private final SocioRepository socioRepository;
        private final SucursalRepository sucursalRepository;
        private final AsistenciaRepository asistenciaRepository;
        private final AsignacionRepository asignacionRepository;
        private final ListaAsignacionRepository listaAsignacionRepository;
        private final ImportacionHistorialRepository importacionHistorialRepository;
        private final com.asamblea.service.LogAuditoriaService auditService;

        @PostMapping("/login")
        public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
                try {
                        System.out.println("DEBUG: Intento de login para usuario: " + request.getUsername());
                        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                                        request.getUsername(), request.getPassword()));
                        var user = usuarioRepository.findByUsername(request.getUsername()).orElseThrow();

                        System.out.println("DEBUG: Usuario autenticado con éxito, generando token...");

                        auditService.registrar("USUARIOS", "LOGIN", "Inició sesión exitosamente en el sistema.",
                                        user.getUsername(), httpRequest.getRemoteAddr());

                        // DESACTIVADO: Detectar acceso duplicado - generaba falsos positivos
                        // if (user.getLastLogin() != null) {
                        // long minutesSinceLast = Duration.between(user.getLastLogin(),
                        // LocalDateTime.now())
                        // .toMinutes();
                        // if (minutesSinceLast < 30) {
                        // avisoService.crearAvisoSeguridad(user,
                        // "Intento de acceso duplicado detectado en tu cuenta.");
                        // }
                        // }

                        user.setLastLogin(LocalDateTime.now());
                        user.setLoginCount((user.getLoginCount() != null ? user.getLoginCount() : 0) + 1);
                        usuarioRepository.save(user);

                        var jwtToken = jwtService.generateToken(user);
                        return ResponseEntity.ok(AuthResponse.builder().token(jwtToken).id(user.getId())
                                        .username(user.getUsername()).nombreCompleto(user.getNombreCompleto())
                                        .rol(user.getRol().name()).permisosEspeciales(user.getPermisosEspeciales())
                                        .requiresPasswordChange(user.getRequiresPasswordChange())
                                        .fotoPerfil(user.getFotoPerfil()).telefono(user.getTelefono()).build());
                } catch (Exception e) {
                        System.err.println("DEBUG: Error en login: " + e.getMessage());
                        e.printStackTrace();
                        return ResponseEntity.status(401).body(null);
                }
        }

        // Obtener información del usuario actual
        @GetMapping("/me")
        public ResponseEntity<?> getCurrentUser() {
                try {
                        var auth = SecurityContextHolder.getContext().getAuthentication();
                        if (auth == null || !auth.isAuthenticated()) {
                                return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
                        }

                        String username = auth.getName();
                        var userOpt = usuarioRepository.findByUsername(username);
                        if (userOpt.isEmpty()) {
                                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
                        }

                        Usuario user = userOpt.get();
                        Map<String, Object> response = new HashMap<>();
                        response.put("id", user.getId());
                        response.put("username", user.getUsername());
                        response.put("nombreCompleto", user.getNombreCompleto());
                        response.put("email", user.getEmail());
                        response.put("rol", user.getRol().name());
                        response.put("rolNombre", user.getRol().getNombre());
                        response.put("sucursal", user.getSucursal() != null ? user.getSucursal().getNombre() : null);
                        response.put("permisosEspeciales", user.getPermisosEspeciales());
                        response.put("requiresPasswordChange", user.getRequiresPasswordChange());
                        response.put("fotoPerfil", user.getFotoPerfil());
                        response.put("telefono", user.getTelefono());

                        // Permisos basados en rol
                        response.put("permisos",
                                        Map.of("puedeEditar", user.puedeEditar(), "puedeCargarPadron",
                                                        user.puedeCargarPadron(), "puedeAsignar", user.puedeAsignar(),
                                                        "puedeVerReportes", user.puedeVerReportes(),
                                                        "puedeHacerCheckin", user.puedeHacerCheckin()));

                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        @PostMapping("/change-password")
        public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
                try {
                        var auth = SecurityContextHolder.getContext().getAuthentication();
                        if (auth == null || !auth.isAuthenticated()) {
                                return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
                        }

                        String newPassword = request.get("password");
                        if (newPassword == null || newPassword.length() < 4) {
                                return ResponseEntity.badRequest().body(
                                                Map.of("error", "La contraseña debe tener al menos 4 caracteres"));
                        }

                        String username = auth.getName();
                        var user = usuarioRepository.findByUsername(username).orElseThrow();

                        user.setPassword(passwordEncoder.encode(newPassword));
                        user.setPasswordVisible(newPassword); // Mantener sincronizada la contraseña visible
                        user.setRequiresPasswordChange(false);
                        usuarioRepository.save(user);

                        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente"));
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        /**
         * Cerrar todas las sesiones del usuario actual
         * Incrementa tokenVersion para invalidar todos los JWT existentes
         */
        @PostMapping("/logout-all-sessions")
        public ResponseEntity<?> logoutAllSessions(HttpServletRequest httpRequest) {
                try {
                        var auth = SecurityContextHolder.getContext().getAuthentication();
                        if (auth == null || !auth.isAuthenticated()) {
                                return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
                        }

                        String username = auth.getName();
                        var user = usuarioRepository.findByUsername(username).orElseThrow();

                        // Incrementar tokenVersion para invalidar todos los tokens
                        Integer currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
                        user.setTokenVersion(currentVersion + 1);
                        usuarioRepository.save(user);

                        auditService.registrar("USUARIOS", "LOGOUT_ALL_SESSIONS",
                                        "Cerró todas las sesiones activas. Token version incrementado a "
                                                        + user.getTokenVersion(),
                                        user.getUsername(), httpRequest.getRemoteAddr());

                        return ResponseEntity.ok(Map.of("success", true, "message",
                                        "Todas las sesiones han sido cerradas. Debes iniciar sesión nuevamente."));
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }

        /**
         * Reset completo del sistema - PÚBLICO (solo para desarrollo)
         * Requiere código de autorización 226118
         */
        @Transactional
        @PostMapping("/system-reset")
        public ResponseEntity<?> systemReset(@RequestBody(required = false) Map<String, String> body,
                        HttpServletRequest httpRequest) {
                String code = body != null ? body.get("code") : null;
                System.out.println("DEBUG system-reset: body=" + body);
                System.out.println("DEBUG system-reset: code='" + code + "'");

                // Validar código de autorización
                if (!"226118".equals(code)) {
                        System.out.println("DEBUG: Código RECHAZADO");
                        return ResponseEntity.status(403)
                                        .body(Map.of("success", false, "error", "Código de autorización inválido"));
                }

                try {
                        System.out.println("========================================");
                        System.out.println("🔴 SYSTEM-RESET EJECUTANDO...");
                        System.out.println("========================================");

                        // Eliminar en orden correcto para evitar FK constraints
                        long asistencias = asistenciaRepository.count();
                        asistenciaRepository.deleteAll();

                        long asignaciones = asignacionRepository.count();
                        asignacionRepository.deleteAll();

                        long listas = listaAsignacionRepository.count();
                        listaAsignacionRepository.deleteAll();

                        long historial = importacionHistorialRepository.count();
                        importacionHistorialRepository.deleteAll();

                        long socios = socioRepository.count();
                        socioRepository.deleteAll();

                        long sucursales = sucursalRepository.count();
                        sucursalRepository.deleteAll();

                        System.out.println("✅ RESET COMPLETADO!");

                        auditService.registrar("CONFIGURACION", "SYSTEM_RESET_CODE",
                                        "Ejecutó un reinicio total de datos usando código de autorización 226118.",
                                        "ADMIN_BY_CODE", httpRequest.getRemoteAddr());
                        System.out.println("   - Socios: " + socios);
                        System.out.println("   - Asistencias: " + asistencias);
                        System.out.println("   - Asignaciones: " + asignaciones);

                        Map<String, Object> result = new HashMap<>();
                        result.put("success", true);
                        result.put("message", "Sistema reiniciado correctamente");
                        result.put("eliminados",
                                        Map.of("socios", socios, "sucursales", sucursales, "asistencias", asistencias,
                                                        "asignaciones", asignaciones, "listas", listas, "historial",
                                                        historial));

                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        System.err.println("❌ Error en reset: " + e.getMessage());
                        e.printStackTrace();
                        return ResponseEntity.internalServerError()
                                        .body(Map.of("success", false, "error", e.getMessage()));
                }
        }

        @PostMapping("/impersonate/{userId}")
        public ResponseEntity<?> impersonate(@PathVariable Long userId, HttpServletRequest httpRequest) {
                if (userId == null) {
                        return ResponseEntity.badRequest().body(Map.of("error", "ID de usuario requerido"));
                }
                try {
                        var auth = SecurityContextHolder.getContext().getAuthentication();
                        if (auth == null || !auth.isAuthenticated()) {
                                return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
                        }

                        // Verificar que el usuario actual sea SUPER_ADMIN
                        String currentUsername = auth.getName();
                        Usuario admin = usuarioRepository.findByUsername(currentUsername).orElseThrow();
                        if (admin.getRol() != Usuario.Rol.SUPER_ADMIN) {
                                return ResponseEntity.status(403).body(
                                                Map.of("error", "Acceso denegado. Solo Super Admin puede impersonar."));
                        }

                        // Buscar el usuario objetivo
                        Usuario targetUser = usuarioRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("Usuario objetivo no encontrado"));

                        if (!targetUser.isActivo()) {
                                return ResponseEntity.badRequest()
                                                .body(Map.of("error", "No se puede entrar en un perfil inactivo."));
                        }

                        System.out.println("DEBUG: Impersonando a: " + targetUser.getUsername());

                        auditService.registrar("USUARIOS", "IMPERSONATE",
                                        String.format("Super Admin '%s' inició sesión como '%s' (ID: %d)",
                                                        admin.getUsername(), targetUser.getUsername(),
                                                        targetUser.getId() != null ? targetUser.getId() : 0L),
                                        admin.getUsername(), httpRequest.getRemoteAddr());

                        // Generar token para el usuario objetivo
                        var jwtToken = jwtService.generateToken(targetUser);

                        return ResponseEntity.ok(AuthResponse.builder()
                                        .token(jwtToken)
                                        .id(targetUser.getId())
                                        .username(targetUser.getUsername())
                                        .nombreCompleto(targetUser.getNombreCompleto())
                                        .rol(targetUser.getRol().name())
                                        .permisosEspeciales(targetUser.getPermisosEspeciales())
                                        .requiresPasswordChange(targetUser.getRequiresPasswordChange())
                                        .fotoPerfil(targetUser.getFotoPerfil())
                                        .telefono(targetUser.getTelefono())
                                        .build());
                } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                }
        }
}
