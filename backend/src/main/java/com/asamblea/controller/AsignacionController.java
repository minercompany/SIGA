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

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/mis-listas")
    public ResponseEntity<List<Map<String, Object>>> listarMisListas(Authentication auth) {
        Usuario user = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
        List<ListaAsignacion> listas = listaRepository.findByUsuarioId(user.getId());

        List<Map<String, Object>> result = listas.stream().map(lista -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", lista.getId());
            map.put("nombre", lista.getNombre());
            map.put("descripcion", lista.getDescripcion());
            map.put("total", asignacionRepository.findByListaAsignacionId(lista.getId()).size());
            map.put("vyv", asignacionRepository.countVyVByListaId(lista.getId()));
            map.put("soloVoz", asignacionRepository.countSoloVozByListaId(lista.getId()));
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
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
                "Nueva Lista Creada",
                "El usuario " + user.getUsername() + " ha creado la lista '" + lista.getNombre() + "'");

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

        List<Usuario> usuarios = usuarioRepository.findAll();

        List<Map<String, Object>> result = usuarios.stream()
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("idUsuario", u.getId());
                    // Compatibilidad con frontend anterior que espera campos de lista
                    m.put("id", u.getId()); // ID ficticio de "lista" (es el usuario) para el frontend
                    m.put("nombre", "Lista de " + u.getNombreCompleto()); // Nombre ficticio
                    m.put("responsable", u.getNombreCompleto());
                    m.put("responsableUser", u.getUsername());

                    // Buscar lista activa real
                    List<ListaAsignacion> listas = listaRepository.findByUsuarioId(u.getId());
                    Optional<ListaAsignacion> activa = listas.stream().filter(l -> Boolean.TRUE.equals(l.getActiva()))
                            .findFirst();

                    m.put("activa", activa.isPresent());
                    if (activa.isPresent()) {
                        m.put("total", asignacionRepository.findByListaAsignacionId(activa.get().getId()).size());
                        m.put("idListaReal", activa.get().getId());
                    } else {
                        m.put("total", 0);
                    }
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

        if (asignacionRepository.existsByListaAsignacionIdAndSocioId(listaActiva.getId(), socioOpt.get().getId())) {
            return ResponseEntity.status(400).body(Map.of("error", "El socio ya está asignado a esta lista"));
        }

        Asignacion asignacion = new Asignacion();
        asignacion.setListaAsignacion(listaActiva);
        asignacion.setSocio(socioOpt.get());
        asignacionRepository.save(asignacion);

        pushService.sendToSuperAdmins(
                "Nueva Asignación Admin",
                "Admin " + auth.getName() + " asignó socio a " + destino.getNombreCompleto());

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

            return ResponseEntity.status(409).body(errorResponse);
        }

        Asignacion asignacion = new Asignacion();
        asignacion.setListaAsignacion(lista);
        asignacion.setSocio(socio);
        asignacionRepository.save(asignacion);

        // Notificar a Admins (solo si no es el mismo admin quien asigna, para reducir
        // ruido, o siempre)
        // El requisito dice "cuando una persona hace una asignacion"
        pushService.sendToSuperAdmins(
                "Nueva Asignación",
                "Usuario " + auth.getName() + " asignó a " + socio.getNombreCompleto() + " en lista '"
                        + lista.getNombre() + "' de " + lista.getUsuario().getNombreCompleto());

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

        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{listaId}/socios")
    public ResponseEntity<List<Socio>> verSocios(@PathVariable Long listaId, Authentication auth) {
        ListaAsignacion lista = listaRepository.findById(listaId).orElseThrow();

        // Verificar propiedad
        if (!lista.getUsuario().getUsername().equals(auth.getName())) {
            return ResponseEntity.status(403).build();
        }

        List<Socio> socios = asignacionRepository.findByListaAsignacionId(listaId)
                .stream()
                .map(Asignacion::getSocio)
                .collect(Collectors.toList());

        return ResponseEntity.ok(socios);
    }

    @GetMapping("/mis-socios-detalle")
    public ResponseEntity<List<Map<String, Object>>> getMisSociosDetalle(Authentication auth) {
        Usuario user = usuarioRepository.findByUsername(auth.getName()).orElseThrow();
        List<ListaAsignacion> listas = listaRepository.findByUsuarioId(user.getId());

        List<Map<String, Object>> sociosDetalle = new ArrayList<>();

        for (ListaAsignacion lista : listas) {
            List<Asignacion> asignaciones = asignacionRepository.findByListaAsignacionId(lista.getId());

            for (Asignacion asignacion : asignaciones) {
                Socio socio = asignacion.getSocio();
                // Si existe un registro de asistencia, el socio está presente
                boolean presente = asistenciaRepository.existsBySocioId(socio.getId());

                Map<String, Object> socioMap = new HashMap<>();
                socioMap.put("id", socio.getId());
                socioMap.put("nombreCompleto", socio.getNombreCompleto());
                socioMap.put("numeroSocio", socio.getNumeroSocio());
                socioMap.put("cedula", socio.getCedula());
                socioMap.put("presente", presente);
                socioMap.put("lista", lista.getNombre());

                sociosDetalle.add(socioMap);
            }
        }

        return ResponseEntity.ok(sociosDetalle);
    }
}
