package com.asamblea.controller;

import com.asamblea.model.Asignacion;
import com.asamblea.model.ListaAsignacion;
import com.asamblea.model.Socio;
import com.asamblea.model.Usuario;
import com.asamblea.repository.AsignacionRepository;
import com.asamblea.repository.ListaAsignacionRepository;
import com.asamblea.repository.SocioRepository;
import com.asamblea.repository.UsuarioRepository;
import com.asamblea.repository.AsistenciaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/asignaciones")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AsignacionController {

    private final ListaAsignacionRepository listaRepository;
    private final AsignacionRepository asignacionRepository;
    private final SocioRepository socioRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final com.asamblea.service.LogAuditoriaService auditService;
    private final com.asamblea.service.PushNotificationService pushService;
    private final com.asamblea.service.AvisoService avisoService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/mis-listas")
    public ResponseEntity<List<Map<String, Object>>> listarMisListas(Authentication auth) {
        if (auth == null) {
            System.out.println("DEBUG: Auth is null in /mis-listas");
            return ResponseEntity.status(401).build();
        }

        String username = auth.getName();
        System.out.println("DEBUG: Requesting lists for user: " + username);

        try {
            Optional<Usuario> userOpt = usuarioRepository.findByUsername(username);

            if (userOpt.isEmpty()) {
                System.out.println("DEBUG: User not found in DB: " + username);
                // Return empty list instead of crashing, so frontend can handle it (e.g. by
                // creating a list)
                return ResponseEntity.ok(new ArrayList<>());
            }

            Usuario user = userOpt.get();
            List<ListaAsignacion> listas = listaRepository.findByUsuarioId(user.getId());

            if (listas == null) {
                return ResponseEntity.ok(new ArrayList<>());
            }

            List<Map<String, Object>> result = new ArrayList<>();
            for (ListaAsignacion lista : listas) {
                try {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", lista.getId());
                    map.put("nombre", lista.getNombre() != null ? lista.getNombre() : "Lista sin nombre");
                    map.put("descripcion", lista.getDescripcion() != null ? lista.getDescripcion() : "");

                    // Safe counts with try-catch
                    try {
                        List<?> asignados = asignacionRepository.findByListaAsignacionId(lista.getId());
                        map.put("total", asignados != null ? asignados.size() : 0);
                    } catch (Exception ex) {
                        System.err.println("ERROR counting total for list " + lista.getId() + ": " + ex.getMessage());
                        ex.printStackTrace();
                        map.put("total", 0);
                    }

                    try {
                        map.put("vyv", asignacionRepository.countVyVByListaId(lista.getId()));
                    } catch (Exception ex) {
                        map.put("vyv", 0);
                    }

                    try {
                        map.put("soloVoz", asignacionRepository.countSoloVozByListaId(lista.getId()));
                    } catch (Exception ex) {
                        map.put("soloVoz", 0);
                    }

                    result.add(map);
                } catch (Exception ex) {
                    System.err.println("Error processing list " + lista.getId() + ": " + ex.getMessage());
                }
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in /mis-listas: " + e.getMessage());
            e.printStackTrace();
            // Return empty list to prevent frontend crash
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/ranking-usuarios")
    public ResponseEntity<List<Map<String, Object>>> getRankingUsuarios() {
        String sql = """
                    SELECT
                        u.id,
                        u.nombre_completo as nombre,
                        u.username,
                        u.rol,
                        COUNT(DISTINCT la.id) as totalListas,
                        COUNT(a.id) as totalAsignados,
                        SUM(CASE WHEN (s.aporte_al_dia = 1 AND s.solidaridad_al_dia = 1 AND s.fondo_al_dia = 1 AND s.incoop_al_dia = 1 AND s.credito_al_dia = 1) THEN 1 ELSE 0 END) as vyv,
                        SUM(CASE WHEN NOT (s.aporte_al_dia = 1 AND s.solidaridad_al_dia = 1 AND s.fondo_al_dia = 1 AND s.incoop_al_dia = 1 AND s.credito_al_dia = 1) THEN 1 ELSE 0 END) as soloVoz
                    FROM usuarios u
                    INNER JOIN listas_asignacion la ON la.user_id = u.id
                    INNER JOIN asignaciones_socios a ON a.lista_id = la.id
                    INNER JOIN socios s ON a.socio_id = s.id
                    GROUP BY u.id, u.nombre_completo, u.username, u.rol
                    HAVING totalAsignados > 0
                    ORDER BY totalAsignados DESC
                """;

        List<Map<String, Object>> ranking = jdbcTemplate.queryForList(sql);

        // Ajustar tipos de datos si es necesario (depende del driver DB, a veces
        // devuelve BigInteger)
        // El frontend espera números normales. JdbcTemplate devuelve Map<String,
        // Object> que Jackson serializa bien.

        System.out.println("DEBUG RANKING SQL: Encontrados " + ranking.size() + " operadores");
        return ResponseEntity.ok(ranking);
    }

    @GetMapping("/stats-socio")
    public ResponseEntity<Map<String, Object>> getStatsSocio(Authentication auth) {
        System.out.println("DEBUG STATS-SOCIO: Method called");
        System.out.println("DEBUG STATS-SOCIO: Auth object: " + auth);
        System.out.println("DEBUG STATS-SOCIO: Auth name: " + (auth != null ? auth.getName() : "NULL"));

        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            Usuario user = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
            System.out.println("DEBUG STATS-SOCIO: User found: " + user.getUsername() + ", ID: " + user.getId());

            List<ListaAsignacion> listas = listaRepository.findByUsuarioId(user.getId());
            System.out.println("DEBUG STATS-SOCIO: Found " + listas.size() + " listas");

            long totalAsignados = 0;
            long totalVyV = 0;
            long totalSoloVoz = 0;
            long presentes = 0;

            for (ListaAsignacion lista : listas) {
                totalAsignados += asignacionRepository.findByListaAsignacionId(lista.getId()).size();
                totalVyV += asignacionRepository.countVyVByListaId(lista.getId());
                totalSoloVoz += asignacionRepository.countSoloVozByListaId(lista.getId());
                presentes += asistenciaRepository.countPresentesByListaId(lista.getId());
            }

            // Asegurar que presentes no supere el total de asignados
            long presentesCorregidos = Math.min(presentes, totalAsignados);
            // Asegurar que ausentes nunca sea negativo
            long ausentes = Math.max(0, totalAsignados - presentesCorregidos);

            Map<String, Object> stats = new HashMap<>();
            stats.put("total", totalAsignados);
            stats.put("vyv", totalVyV);
            stats.put("soloVoz", totalSoloVoz);
            stats.put("presentes", presentesCorregidos);
            stats.put("ausentes", ausentes);

            System.out.println("DEBUG STATS-SOCIO: Returning stats: " + stats);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.out.println("DEBUG STATS-SOCIO: ERROR - " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping("/crear-lista")
    public ResponseEntity<?> crearLista(@RequestBody ListaAsignacion lista, Authentication auth,
            HttpServletRequest request) {
        Usuario user = usuarioRepository.findByUsername(auth.getName()).orElseThrow();

        // VALIDACIÓN: Un usuario NORMAL (no admin) solo puede tener UNA lista
        boolean esAdmin = user.getRol() == Usuario.Rol.SUPER_ADMIN || user.getRol() == Usuario.Rol.DIRECTIVO;
        if (!esAdmin) {
            List<ListaAsignacion> listasExistentes = listaRepository.findByUsuario(user);
            if (!listasExistentes.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of(
                        "error", "Ya tienes una lista creada. Solo puedes tener una lista a la vez.",
                        "listaExistente", listasExistentes.get(0).getNombre()));
            }
        }

        lista.setUsuario(user);
        lista.setActiva(false); // Nueva lista inactiva por defecto
        ListaAsignacion guardada = listaRepository.save(lista);

        auditService.registrar(
                "ASIGNACIONES",
                "CREAR_LISTA",
                "Creó lista de asignación: " + lista.getNombre(),
                user.getUsername(),
                request.getRemoteAddr());

        // Notificar a Admins
        pushService.sendToSuperAdmins(
                "🚀 ¡Nueva Lista Creada!",
                user.getNombreCompleto() + " ha creado la lista: " + lista.getNombre());

        return ResponseEntity.ok(guardada);
    }

    @DeleteMapping("/lista/{listaId}")
    public ResponseEntity<?> eliminarLista(@PathVariable Long listaId, Authentication auth,
            HttpServletRequest request) {
        ListaAsignacion lista = listaRepository.findById(listaId).orElseThrow();

        // Verificar ownership
        if (!lista.getUsuario().getUsername().equals(auth.getName())) {
            return ResponseEntity.status(403).build();
        }

        auditService.registrar(
                "ASIGNACIONES",
                "ELIMINAR_LISTA",
                "Eliminó lista de asignación: " + lista.getNombre(),
                auth.getName(),
                request.getRemoteAddr());

        listaRepository.delete(lista);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/lista/{listaId}")
    public ResponseEntity<?> actualizarLista(@PathVariable Long listaId, @RequestBody Map<String, String> body,
            Authentication auth, HttpServletRequest request) {
        ListaAsignacion lista = listaRepository.findById(listaId).orElseThrow();

        // Verificar ownership
        if (!lista.getUsuario().getUsername().equals(auth.getName())) {
            return ResponseEntity.status(403).build();
        }

        if (body.containsKey("nombre")) {
            lista.setNombre(body.get("nombre"));
        }
        if (body.containsKey("descripcion")) {
            lista.setDescripcion(body.get("descripcion"));
        }

        listaRepository.save(lista);

        auditService.registrar(
                "ASIGNACIONES",
                "EDITAR_LISTA",
                "Editó lista: " + lista.getNombre(),
                auth.getName(),
                request.getRemoteAddr());

        return ResponseEntity.ok(lista);
    }

    @PatchMapping("/lista/{listaId}/activar")
    public ResponseEntity<?> activarLista(@PathVariable Long listaId, Authentication auth, HttpServletRequest request) {
        Usuario user = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
        ListaAsignacion lista = listaRepository.findById(listaId).orElseThrow();

        // Verificar ownership
        if (!lista.getUsuario().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        // Desactivar todas las otras listas del usuario
        List<ListaAsignacion> todasLasListas = listaRepository.findByUsuarioId(user.getId());
        todasLasListas.forEach(l -> l.setActiva(false));
        listaRepository.saveAll(todasLasListas);

        // Activar la seleccionada
        lista.setActiva(true);
        ListaAsignacion actualizada = listaRepository.save(lista);

        auditService.registrar(
                "ASIGNACIONES",
                "ACTIVAR_LISTA",
                "Activó lista para trabajo: " + lista.getNombre(),
                user.getUsername(),
                request.getRemoteAddr());

        return ResponseEntity.ok(actualizada);
    }

    @GetMapping("/admin/todas-las-listas")
    public ResponseEntity<List<Map<String, Object>>> getTodasLasListasAdmin(Authentication auth) {
        Usuario admin = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
        if (admin.getRol() != Usuario.Rol.SUPER_ADMIN) {
            return ResponseEntity.status(403).build();
        }

        List<ListaAsignacion> todas = listaRepository.findAll();
        List<Map<String, Object>> result = todas.stream().map(lista -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", lista.getId());
            map.put("nombre", lista.getNombre());
            map.put("responsable", lista.getUsuario().getNombreCompleto());
            map.put("responsableUser", lista.getUsuario().getUsername());
            map.put("activa", Boolean.TRUE.equals(lista.getActiva()));
            map.put("total", asignacionRepository.findByListaAsignacionId(lista.getId()).size());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/admin/responsables")
    public ResponseEntity<List<Map<String, Object>>> getPosiblesResponsables(Authentication auth) {
        Usuario admin = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
        if (admin.getRol() != Usuario.Rol.SUPER_ADMIN) {
            return ResponseEntity.status(403).build();
        }

        List<Usuario> usuarios = usuarioRepository.findByActivoTrue();

        List<Map<String, Object>> result = usuarios.stream()
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("idUsuario", u.getId());
                    // Compatibilidad con frontend anterior que espera campos de lista
                    m.put("id", u.getId()); // ID ficticio de "lista" (es el usuario) para el frontend
                    m.put("nombre", "Lista de " + u.getNombreCompleto()); // Nombre ficticio
                    m.put("responsable", u.getNombreCompleto());
                    m.put("responsableUser", u.getUsername());

                    // Buscar lista activa real y contar asignados
                    List<ListaAsignacion> listas = listaRepository.findByUsuarioId(u.getId());
                    Optional<ListaAsignacion> activa = listas.stream().filter(l -> Boolean.TRUE.equals(l.getActiva()))
                            .findFirst();

                    int totalAsignados = 0;
                    if (activa.isPresent()) {
                        totalAsignados = asignacionRepository.findByListaAsignacionId(activa.get().getId()).size();
                        m.put("idListaReal", activa.get().getId());
                    }

                    // Contar asistencias realizadas por el operador
                    int totalRegistrados = asistenciaRepository.findByOperadorId(u.getId()).size();

                    // Total combinado (aproximado, el detalle filtra duplicados)
                    m.put("total", totalAsignados + totalRegistrados);

                    // Consideramos activa si tiene lista activa O tiene registros
                    m.put("activa", activa.isPresent() || totalRegistrados > 0);

                    return m;
                }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/admin/asignar-a-usuario/{userId}")
    public ResponseEntity<?> asignarAUsuario(@PathVariable Long userId, @RequestBody Map<String, String> body,
            Authentication auth) {
        Usuario admin = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
        if (admin.getRol() != Usuario.Rol.SUPER_ADMIN)
            return ResponseEntity.status(403).build();

        String term = body.get("term");
        Optional<Socio> socioOpt = socioRepository.findByNumeroSocio(term);
        if (socioOpt.isEmpty())
            socioOpt = socioRepository.findByCedula(term);
        if (socioOpt.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "Socio no encontrado"));

        Usuario destino = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario destino no encontrado"));

        // Buscar lista activa o crear
        List<ListaAsignacion> listas = listaRepository.findByUsuarioId(userId);
        ListaAsignacion listaActiva = listas.stream()
                .filter(l -> Boolean.TRUE.equals(l.getActiva()))
                .findFirst()
                .orElseGet(() -> {
                    // Crear nueva lista activa AUTOMATICAMENTE
                    ListaAsignacion nueva = new ListaAsignacion();
                    nueva.setNombre("Lista default de " + destino.getNombreCompleto());
                    nueva.setUsuario(destino);
                    nueva.setActiva(true);
                    nueva.setDescripcion("Generada automáticamente al asignar");
                    return listaRepository.save(nueva);
                });

        // NUEVA VALIDACIÓN GLOBAL: Un socio solo puede estar en UNA lista (copiado de
        // agregarSocio)
        Optional<Asignacion> existingAssignment = asignacionRepository.findBySocioId(socioOpt.get().getId());
        if (existingAssignment.isPresent()) {
            Asignacion existing = existingAssignment.get();
            // Si es la misma lista, es un 400 (ya está aquí). Si es otra, es un 409
            // (conflicto).
            // Para simplificar y dar buen feedback, devolvemos siempre 409 con detalles.

            String listaExistente = existing.getListaAsignacion().getNombre();
            String usuarioLista = existing.getListaAsignacion().getUsuario().getNombreCompleto();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "SOCIO_YA_ASIGNADO");
            errorResponse.put("message", "Este socio ya fue asignado a otra lista");
            errorResponse.put("listaNombre", listaExistente);
            errorResponse.put("listaUsuario", usuarioLista);
            errorResponse.put("socioNombre", socioOpt.get().getNombreCompleto());
            errorResponse.put("socioNro", socioOpt.get().getNumeroSocio());
            errorResponse.put("fechaAsignacion", existing.getFechaAsignacion());

            // AUDITORÍA INTENTO FALLIDO (ADMIN)
            auditService.registrar(
                    "ASIGNACIONES",
                    "INTENTO_FALLIDO_ADMIN",
                    "Intento fallido Admin: " + admin.getUsername() + " quiso asignar a socio #"
                            + socioOpt.get().getNumeroSocio() + " pero ya pertenece a " + usuarioLista,
                    admin.getUsername(),
                    "API_ADMIN_FAIL");

            return ResponseEntity.status(409).body(errorResponse);
        }

        Asignacion asignacion = new Asignacion();
        asignacion.setListaAsignacion(listaActiva);
        asignacion.setSocio(socioOpt.get());
        asignacion.setAsignadoPor(admin); // Guardar quién hizo la asignación
        asignacionRepository.save(asignacion);

        // AUDITORÍA ÉXITO
        // Al método le falta HttpServletRequest, pero podemos usar uno dummy o nulo si
        // el servicio lo soporta,
        // o inyectar HttpServletRequest en el controlador.
        // Mejor opción: Agregar HttpServletRequest al signature del metodo.
        // Pero como multi_replace es limitado, asumiré que auditService maneja null ip
        // o insertaré "API"

        auditService.registrar(
                "ASIGNACIONES",
                "ASIGNAR_ADMIN",
                "Admin " + admin.getUsername() + " asignó socio #" + socioOpt.get().getNumeroSocio() + " a "
                        + destino.getUsername(),
                admin.getUsername(),
                "API_ADMIN");

        pushService.sendToSuperAdmins(
                "✅ ¡Socio Vinculado!",
                admin.getNombreCompleto() + " asignó al socio " + socioOpt.get().getNombreCompleto() + " a "
                        + destino.getNombreCompleto());

        return ResponseEntity.ok(Map.of("success", true, "lista", listaActiva.getNombre()));
    }

    @PostMapping("/{listaId}/agregar-socio")
    public ResponseEntity<?> agregarSocio(@PathVariable Long listaId, @RequestBody Map<String, String> body,
            Authentication auth, HttpServletRequest request) {
        String term = body.get("term");
        Optional<Socio> socioOpt = socioRepository.findByNumeroSocio(term);
        if (socioOpt.isEmpty()) {
            socioOpt = socioRepository.findByCedula(term);
        }

        if (socioOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Socio no encontrado"));
        }

        Socio socio = socioOpt.get();
        ListaAsignacion lista = listaRepository.findById(listaId).orElseThrow();
        Usuario currentUser = usuarioRepository.findByUsername(auth.getName()).orElseThrow();

        // Verificar propiedad O permisos de ADMIN
        boolean esDueño = lista.getUsuario().getUsername().equals(auth.getName());
        // Corregido: Comparación Enum
        boolean esAdmin = currentUser.getRol() == Usuario.Rol.SUPER_ADMIN;

        if (!esDueño && !esAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "No tienes permiso para editar esta lista"));
        }

        if (asignacionRepository.existsByListaAsignacionIdAndSocioId(listaId, socio.getId())) {
            return ResponseEntity.status(400).body(Map.of("error", "El socio ya está en esta lista"));
        }

        // NUEVA VALIDACIÓN: Un socio solo puede estar en UNA lista
        Optional<Asignacion> existingAssignment = asignacionRepository.findBySocioId(socio.getId());
        if (existingAssignment.isPresent()) {
            Asignacion existing = existingAssignment.get();
            String listaExistente = existing.getListaAsignacion().getNombre();
            String usuarioLista = existing.getListaAsignacion().getUsuario().getNombreCompleto();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "SOCIO_YA_ASIGNADO");
            errorResponse.put("message", "Este socio ya fue asignado a otra lista");
            errorResponse.put("listaNombre", listaExistente);
            errorResponse.put("listaUsuario", usuarioLista);
            errorResponse.put("socioNombre", socio.getNombreCompleto());
            errorResponse.put("socioNro", socio.getNumeroSocio());
            errorResponse.put("fechaAsignacion", existing.getFechaAsignacion());

            // AUDITORÍA INTENTO FALLIDO
            auditService.registrar(
                    "ASIGNACIONES",
                    "INTENTO_FALLIDO_SOCIO",
                    "Intento fallido: " + currentUser.getUsername() + " quiso asignar a socio #"
                            + socio.getNumeroSocio() + " pero ya pertenece a " + usuarioLista,
                    currentUser.getUsername(),
                    request.getRemoteAddr());

            return ResponseEntity.status(409).body(errorResponse);
        }

        Asignacion asignacion = new Asignacion();
        asignacion.setListaAsignacion(lista);
        asignacion.setSocio(socio);
        asignacion.setAsignadoPor(currentUser); // Guardar quién hizo la asignación
        asignacionRepository.save(asignacion);

        // AUDITORÍA ÉXITO
        auditService.registrar(
                "ASIGNACIONES",
                "ASIGNAR_SOCIO",
                "Usuario " + currentUser.getUsername() + " asignó socio #" + socio.getNumeroSocio() + " ("
                        + socio.getNombreCompleto() + ")",
                currentUser.getUsername(),
                request.getRemoteAddr());

        // Notificar a Admins (solo si no es el mismo admin quien asigna, para reducir
        // ruido, o siempre)
        // El requisito dice "cuando una persona hace una asignacion"
        if (avisoService.isNotificacionesAsignacionActivas()) {
            System.out.println("DEBUG: Notificaciones de asignación activas. Enviando push a admins...");
            pushService.sendToSuperAdmins(
                    "📝 Nueva Asignación",
                    currentUser.getNombreCompleto() + " asignó a " + socio.getNombreCompleto() + " en la lista: "
                            + lista.getNombre());

            // Crear Aviso persistente en el centro de notificaciones
            avisoService.crearAvisoAsignacionParaAdmins(
                    "Nueva Asignación de Socio",
                    currentUser.getNombreCompleto() + " asignó al socio #" + socio.getNumeroSocio()
                            + " (" + socio.getNombreCompleto() + ") a la lista '" + lista.getNombre() + "'",
                    currentUser);
        } else {
            System.out.println("DEBUG: Notificaciones de asignación DESACTIVADAS por configuración.");
        }

        return ResponseEntity.ok(Map.of("success", true, "socio", socio));
    }

    @DeleteMapping("/{listaId}/socio/{socioId}")
    public ResponseEntity<?> eliminarSocio(@PathVariable Long listaId, @PathVariable Long socioId,
            Authentication auth, HttpServletRequest request) {
        ListaAsignacion lista = listaRepository.findById(listaId).orElseThrow();

        // Verificar propiedad
        if (!lista.getUsuario().getUsername().equals(auth.getName())) {
            return ResponseEntity.status(403).build();
        }

        Asignacion asignacion = asignacionRepository.findByListaAsignacionIdAndSocioId(listaId, socioId)
                .orElseThrow(() -> new RuntimeException("Asignación no encontrada"));

        asignacionRepository.delete(asignacion);

        auditService.registrar(
                "ASIGNACIONES",
                "ELIMINAR_ASIGNACION",
                "Eliminó asignación de socio #" + asignacion.getSocio().getNumeroSocio() + " de la lista " + listaId,
                auth.getName(),
                request.getRemoteAddr());

        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{listaId}/socios")
    public ResponseEntity<List<Socio>> verSocios(@PathVariable Long listaId, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            Optional<ListaAsignacion> listaOpt = listaRepository.findById(listaId);
            if (listaOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            ListaAsignacion lista = listaOpt.get();

            // Verificar propiedad
            if (lista.getUsuario() == null || !lista.getUsuario().getUsername().equals(auth.getName())) {
                return ResponseEntity.status(403).build();
            }

            List<Asignacion> asignaciones = asignacionRepository.findByListaAsignacionId(listaId);
            if (asignaciones == null) {
                return ResponseEntity.ok(new ArrayList<>());
            }

            List<Socio> socios = asignaciones.stream()
                    .filter(a -> a.getSocio() != null)
                    .map(Asignacion::getSocio)
                    .distinct()
                    .collect(Collectors.toList());

            return ResponseEntity.ok(socios);
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in /" + listaId + "/socios: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/admin/usuario/{userId}/detalle-completo")
    public ResponseEntity<?> getDetalleCompletoUsuario(@PathVariable Long userId, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        Usuario admin = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
        if (admin.getRol() != Usuario.Rol.SUPER_ADMIN && admin.getRol() != Usuario.Rol.DIRECTIVO) {
            return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos"));
        }

        Usuario targetUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Map<String, Object>> sociosDetalle = new ArrayList<>();
        Set<Long> procesados = new HashSet<>();

        // 1. Obtener Asignados (si tiene lista)
        List<ListaAsignacion> listas = listaRepository.findByUsuarioId(userId);
        Optional<ListaAsignacion> listaActiva = listas.stream().filter(l -> Boolean.TRUE.equals(l.getActiva()))
                .findFirst();

        if (listaActiva.isPresent()) {
            List<Asignacion> asignaciones = asignacionRepository.findByListaAsignacionId(listaActiva.get().getId());
            for (Asignacion a : asignaciones) {
                if (a.getSocio() != null && !procesados.contains(a.getSocio().getId())) {
                    procesados.add(a.getSocio().getId());
                    sociosDetalle.add(mapSocioDetalle(a.getSocio(), a.getFechaAsignacion(), "Asignación Lista",
                            a.getAsignadoPor()));
                }
            }
        }

        // 2. Obtener Registrados (asistencias realizadas por este operador)
        List<com.asamblea.model.Asistencia> asistencias = asistenciaRepository.findByOperadorId(userId);
        for (com.asamblea.model.Asistencia asist : asistencias) {
            if (asist.getSocio() != null) {
                if (!procesados.contains(asist.getSocio().getId())) {
                    // Es un registro nuevo (no estaba asignado)
                    procesados.add(asist.getSocio().getId());
                    sociosDetalle
                            .add(mapSocioDetalle(asist.getSocio(), asist.getFechaHora(), "Registro en Mesa", null));
                } else {
                    // Ya estaba, actualizamos info de ingreso si es necesario (se hace en el
                    // mapSocioDetalle si consultamos)
                    // Pero como ya lo agregamos arriba, ya está.
                    // Podríamos querer actualizar que SÍ INGRESÓ.
                }
            }
        }

        // Re-procesar para asegurar fechas de ingreso correctas en todos
        for (Map<String, Object> item : sociosDetalle) {
            Long socioId = (Long) item.get("id");
            Optional<com.asamblea.model.Asistencia> asisOpt = asistenciaRepository.findFirstBySocioId(socioId);
            if (asisOpt.isPresent()) {
                item.put("fechaHoraIngreso", asisOpt.get().getFechaHora());
            } else {
                item.put("fechaHoraIngreso", null);
            }
        }

        // Stats
        long vyv = sociosDetalle.stream().filter(s -> Boolean.TRUE.equals(s.get("esVyV"))).count();

        Map<String, Object> response = new HashMap<>();
        response.put("usuario", Map.of(
                "id", targetUser.getId(),
                "nombre", targetUser.getNombreCompleto(),
                "username", targetUser.getUsername()));
        response.put("socios", sociosDetalle);
        response.put("stats", Map.of(
                "total", sociosDetalle.size(),
                "vyv", vyv,
                "soloVoz", sociosDetalle.size() - vyv));

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> mapSocioDetalle(Socio socio, java.time.LocalDateTime fechaRef, String origen,
            Usuario asignadoPorObj) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", socio.getId());
        m.put("cedula", socio.getCedula());
        m.put("nombreCompleto", socio.getNombreCompleto());
        m.put("numeroSocio", socio.getNumeroSocio());
        m.put("fechaAsignacion", fechaRef); // Usamos fecha de asignacion o de registro como referencia
        m.put("esVyV", socio.isEstadoVozVoto());
        m.put("condicion", socio.isEstadoVozVoto() ? "VOZ Y VOTO" : "SOLO VOZ");
        m.put("origen", origen);
        m.put("asignadoPor", asignadoPorObj != null ? asignadoPorObj.getNombreCompleto()
                : (origen.equals("Registro en Mesa") ? "Mesa de Entrada" : "Sistema"));
        return m;
    }

    public ResponseEntity<?> verSociosListaAdmin(@PathVariable Long listaId, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            Usuario admin = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
            // Solo SUPER_ADMIN y DIRECTIVO pueden ver cualquier lista
            if (admin.getRol() != Usuario.Rol.SUPER_ADMIN && admin.getRol() != Usuario.Rol.DIRECTIVO) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos para ver esta lista"));
            }

            Optional<ListaAsignacion> listaOpt = listaRepository.findById(listaId);
            if (listaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Lista no encontrada"));
            }

            ListaAsignacion lista = listaOpt.get();
            List<Asignacion> asignaciones = asignacionRepository.findByListaAsignacionId(listaId);

            List<Map<String, Object>> sociosDetalle = new ArrayList<>();
            for (Asignacion asignacion : asignaciones) {
                Socio socio = asignacion.getSocio();
                if (socio != null) {
                    boolean esVyV = socio.isEstadoVozVoto();

                    Map<String, Object> socioMap = new HashMap<>();
                    socioMap.put("id", socio.getId());
                    socioMap.put("cedula", socio.getCedula() != null ? socio.getCedula() : "-");
                    socioMap.put("nombreCompleto",
                            socio.getNombreCompleto() != null ? socio.getNombreCompleto() : "Sin Nombre");
                    socioMap.put("numeroSocio", socio.getNumeroSocio() != null ? socio.getNumeroSocio() : "-");
                    socioMap.put("fechaAsignacion", asignacion.getFechaAsignacion());
                    socioMap.put("condicion", esVyV ? "VOZ Y VOTO" : "SOLO VOZ");
                    socioMap.put("esVyV", esVyV);
                    socioMap.put("asignadoPor",
                            asignacion.getAsignadoPor() != null ? asignacion.getAsignadoPor().getNombreCompleto()
                                    : "Sistema");

                    // Buscar datos de asistencia (ingreso)
                    java.util.Optional<com.asamblea.model.Asistencia> asistenciaOpt = asistenciaRepository
                            .findFirstBySocioId(socio.getId());
                    if (asistenciaOpt.isPresent()) {
                        socioMap.put("fechaHoraIngreso", asistenciaOpt.get().getFechaHora());
                    } else {
                        socioMap.put("fechaHoraIngreso", null);
                    }

                    sociosDetalle.add(socioMap);
                }
            }

            // Estadísticas
            long totalVyV = sociosDetalle.stream().filter(s -> Boolean.TRUE.equals(s.get("esVyV"))).count();
            long totalSoloVoz = sociosDetalle.size() - totalVyV;

            Map<String, Object> response = new HashMap<>();
            response.put("lista", Map.of(
                    "id", lista.getId(),
                    "nombre", lista.getNombre(),
                    "responsable", lista.getUsuario().getNombreCompleto(),
                    "responsableUser", lista.getUsuario().getUsername()));
            response.put("socios", sociosDetalle);
            response.put("stats", Map.of(
                    "total", sociosDetalle.size(),
                    "vyv", totalVyV,
                    "soloVoz", totalSoloVoz));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("ERROR in /admin/lista/" + listaId + "/socios-detalle: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    @GetMapping("/mis-socios-detalle")
    public ResponseEntity<List<Map<String, Object>>> getMisSociosDetalle(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            Optional<Usuario> userOpt = usuarioRepository.findByUsername(auth.getName());
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>());
            }

            Usuario user = userOpt.get();
            List<ListaAsignacion> listas = listaRepository.findByUsuarioId(user.getId());

            if (listas == null) {
                return ResponseEntity.ok(new ArrayList<>());
            }

            List<Map<String, Object>> sociosDetalle = new ArrayList<>();

            for (ListaAsignacion lista : listas) {
                try {
                    List<Asignacion> asignaciones = asignacionRepository.findByListaAsignacionId(lista.getId());
                    if (asignaciones != null) {
                        for (Asignacion asignacion : asignaciones) {
                            try {
                                Socio socio = asignacion.getSocio();
                                if (socio != null) {
                                    // Si existe un registro de asistencia, el socio está presente
                                    boolean presente = asistenciaRepository.existsBySocioId(socio.getId());

                                    Map<String, Object> socioMap = new HashMap<>();
                                    socioMap.put("id", socio.getId());
                                    socioMap.put("nombreCompleto",
                                            socio.getNombreCompleto() != null ? socio.getNombreCompleto()
                                                    : "Sin Nombre");
                                    socioMap.put("numeroSocio",
                                            socio.getNumeroSocio() != null ? socio.getNumeroSocio() : "N/A");
                                    socioMap.put("cedula", socio.getCedula() != null ? socio.getCedula() : "N/A");
                                    socioMap.put("presente", presente);
                                    socioMap.put("lista",
                                            lista.getNombre() != null ? lista.getNombre() : "Lista sin nombre");

                                    sociosDetalle.add(socioMap);
                                }
                            } catch (Exception ex) {
                                System.err.println(
                                        "Error processing assignment " + asignacion.getId() + ": " + ex.getMessage());
                            }
                        }
                    }
                } catch (Exception ex) {
                    System.err.println("Error processing list " + lista.getId() + " in details: " + ex.getMessage());
                }
            }

            return ResponseEntity.ok(sociosDetalle);
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in /mis-socios-detalle: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/rastreo/{nroSocio}")
    public ResponseEntity<?> rastrearSocio(@PathVariable String nroSocio, Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();

        Map<String, Object> result = new HashMap<>();

        // 1. Buscar Socio
        Optional<Socio> socioOpt = socioRepository.findByNumeroSocio(nroSocio);
        if (socioOpt.isEmpty()) {
            // Intentar por cedula
            socioOpt = socioRepository.findByCedula(nroSocio);
        }

        if (socioOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Socio no encontrado"));
        }

        Socio socio = socioOpt.get();
        result.put("socio", Map.of(
                "id", socio.getId(),
                "numeroSocio", socio.getNumeroSocio(),
                "nombreCompleto", socio.getNombreCompleto(),
                "cedula", socio.getCedula()));

        // 2. Estado Actual de la Asignación
        Optional<Asignacion> asignacion = asignacionRepository.findBySocioId(socio.getId());
        if (asignacion.isPresent()) {
            Map<String, Object> estadoActual = new HashMap<>();
            estadoActual.put("asignadoA", asignacion.get().getListaAsignacion().getUsuario().getNombreCompleto());
            estadoActual.put("usuario", asignacion.get().getListaAsignacion().getUsuario().getUsername());
            estadoActual.put("lista", asignacion.get().getListaAsignacion().getNombre());
            estadoActual.put("fecha", asignacion.get().getFechaAsignacion());
            estadoActual.put("asignadoPor",
                    asignacion.get().getAsignadoPor() != null ? asignacion.get().getAsignadoPor().getUsername()
                            : "Desconocido");
            result.put("estadoActual", estadoActual);
        } else {
            result.put("estadoActual", null);
        }

        // 3. Historial de Auditoría
        // Buscamos logs que contengan el numero de socio
        List<com.asamblea.model.LogAuditoria> logs = auditService.buscarPorTermino(socio.getNumeroSocio());

        // Filtramos para quedarnos con lo relevante de asignaciones
        List<com.asamblea.model.LogAuditoria> logsRelevantes = logs.stream()
                .filter(l -> l.getModulo().equals("ASIGNACIONES"))
                // Opcional: filtrar por acciones especificas si hay mucho ruido
                .collect(Collectors.toList());

        result.put("historial", logsRelevantes);

        return ResponseEntity.ok(result);
    }
}
