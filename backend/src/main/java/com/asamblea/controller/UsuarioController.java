package com.asamblea.controller;

import com.asamblea.model.Socio;
import com.asamblea.model.Usuario;
import com.asamblea.repository.SocioRepository;
import com.asamblea.repository.SucursalRepository;
import com.asamblea.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final SocioRepository socioRepository;
    private final SucursalRepository sucursalRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.asamblea.service.LogAuditoriaService auditService;
    private final com.asamblea.service.ArizarService arizarService;

    // Buscar unificado (Usuarios + Socios) con FUSIÓN INTELIGENTE
    @GetMapping("/unificados")
    public ResponseEntity<List<Map<String, Object>>> buscarUnificado(@RequestParam(required = false) String term) {
        String query = (term != null) ? term.trim() : "";

        // Usamos un Map para fusionar coincicencias por Cédula/Username
        // Key: Cédula limpia (o Username limpio)
        Map<String, Map<String, Object>> mergedResults = new LinkedHashMap<>();

        // 1. Usuarios del sistema
        List<Usuario> usuarios = usuarioRepository.findAll();
        if (!query.isEmpty()) {
            final String qLower = query.toLowerCase();
            usuarios = usuarios.stream()
                    .filter(u -> u.getUsername().equalsIgnoreCase(query) ||
                            u.getNombreCompleto().equalsIgnoreCase(query) ||
                            u.getUsername().toLowerCase().contains(qLower) ||
                            u.getNombreCompleto().toLowerCase().contains(qLower))
                    .sorted((u1, u2) -> {
                        boolean exacto1 = u1.getUsername().equalsIgnoreCase(query);
                        boolean exacto2 = u2.getUsername().equalsIgnoreCase(query);
                        return Boolean.compare(exacto2, exacto1);
                    })
                    .collect(Collectors.toList());
        }

        for (Usuario u : usuarios) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("nombreCompleto", u.getNombreCompleto());
            map.put("email", u.getEmail());
            map.put("telefono", u.getTelefono());
            map.put("rol", u.getRol().name());
            map.put("rolNombre", u.getRol().getNombre());
            map.put("activo", u.isActivo());
            map.put("permisosEspeciales", u.getPermisosEspeciales());
            map.put("idSocio", u.getIdSocio());
            map.put("sucursalId", u.getSucursal() != null ? u.getSucursal().getId() : null);
            map.put("sucursal", u.getSucursal() != null ? u.getSucursal().getNombre() : null);
            map.put("passwordVisible", u.getPasswordVisible()); // Contraseña visible para admins
            map.put("tipo", "USUARIO");

            // Usamos username como clave de fusión (asumiendo que es la cédula)
            String key = u.getUsername().replaceAll("[^0-9]", "");
            if (!key.isEmpty()) {
                mergedResults.put(key, map);
            } else {
                // Si el username no es numérico (ej: "admin"), usamos el ID como key única temp
                mergedResults.put("USER_" + u.getId(), map);
            }
        }

        // 2. Socios
        if (!query.isEmpty() || mergedResults.size() < 100) {
            List<Socio> socios;
            if (!query.isEmpty()) {
                List<Socio> exactos = socioRepository.buscarExacto(query);
                socios = !exactos.isEmpty() ? exactos : socioRepository.buscarParcial(query);
            } else {
                socios = socioRepository.findAll().stream().limit(100).collect(Collectors.toList());
            }

            for (Socio s : socios) {
                String cedulaKey = s.getCedula().replaceAll("[^0-9]", "");

                // ¿Existe ya este socio como usuario en la lista?
                if (mergedResults.containsKey(cedulaKey)) {
                    // FUSIÓN: Enriquecer el resultado existente
                    Map<String, Object> existingMap = mergedResults.get(cedulaKey);
                    existingMap.put("idSocio", s.getId()); // Vincular ID Socio
                    existingMap.put("nroSocio", s.getNumeroSocio()); // Agregar Nro Socio visual
                    existingMap.put("cedula", s.getCedula());
                    existingMap.put("vozVoto", s.isEstadoVozVoto());
                    existingMap.put("rolNombre", existingMap.get("rolNombre") + " / Socio"); // Mostrar ambos roles
                                                                                             // visualmente
                } else {
                    // NUEVO: No estaba como usuario, agregarlo como socio puro
                    // Verificar si ya fue agregado por IdSocio linkeado (edge case)
                    boolean alreadyLinked = mergedResults.values().stream()
                            .anyMatch(m -> m.get("idSocio") != null
                                    && m.get("idSocio").toString().equals(s.getId().toString()));

                    if (alreadyLinked)
                        continue;

                    Map<String, Object> map = new HashMap<>();
                    map.put("id", null);
                    map.put("username", null);
                    map.put("nombreCompleto", s.getNombreCompleto());
                    map.put("rol", "USUARIO_SOCIO");
                    map.put("rolNombre", "Socio");
                    map.put("activo", false);
                    map.put("idSocio", s.getId());
                    map.put("nroSocio", s.getNumeroSocio());
                    map.put("cedula", s.getCedula());
                    map.put("tipo", "SOCIO");
                    map.put("vozVoto", s.isEstadoVozVoto());
                    mergedResults.put("SOCIO_" + s.getId(), map);
                }
            }
        }

        // 3. FILTRO FINAL: SUPREMACÍA EXACTA
        // Si hay algún resultado EXACTO (por username, nroSocio o cedula), eliminamos
        // el ruido parcial.
        // IMPORTANTE: Normalizamos quitando puntos y espacios para comparar '56015' con
        // '56.015'
        if (!query.isEmpty()) {
            final String qClean = query.replaceAll("[^0-9]", "");

            // Solo aplicamos esto si el query es numérico
            if (!qClean.isEmpty()) {
                List<Map<String, Object>> exactMatches = new ArrayList<>();

                for (Map<String, Object> result : mergedResults.values()) {
                    boolean isExact = false;

                    // Helper para limpiar valores del mapa
                    String username = result.get("username") != null
                            ? String.valueOf(result.get("username")).replaceAll("[^0-9]", "")
                            : "";
                    String cedula = result.get("cedula") != null
                            ? String.valueOf(result.get("cedula")).replaceAll("[^0-9]", "")
                            : "";
                    String nroSocio = result.get("nroSocio") != null
                            ? String.valueOf(result.get("nroSocio")).replaceAll("[^0-9]", "")
                            : "";

                    if (username.equals(qClean) || cedula.equals(qClean) || nroSocio.equals(qClean)) {
                        isExact = true;
                    }

                    if (isExact) {
                        exactMatches.add(result);
                    }
                }

                // Si encontramos exactos, SOLO devolvemos esos. Si no, devolvemos todo
                // (parciales).
                if (!exactMatches.isEmpty()) {
                    return ResponseEntity.ok(exactMatches);
                }
            }
        }

        return ResponseEntity.ok(new ArrayList<>(mergedResults.values()));
    }

    private final com.asamblea.repository.FuncionarioDirectivoRepository funcionarioRepository;



    // Listar todos los usuarios + Funcionarios importados
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarTodos() {
        List<Map<String, Object>> result = new ArrayList<>();
        
        // 1. Obtener usuarios registrados
        List<Usuario> usuarios = usuarioRepository.findAll();
        Set<String> procesados = new HashSet<>(); // Para evitar duplicados (username/cedula)

        for (Usuario u : usuarios) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("nombreCompleto", u.getNombreCompleto());
            map.put("email", u.getEmail());
            map.put("telefono", u.getTelefono());
            map.put("rol", u.getRol().name());
            map.put("rolNombre", u.getRol().getNombre());
            map.put("activo", u.isActivo());
            map.put("permisosEspeciales", u.getPermisosEspeciales());
            map.put("idSocio", u.getIdSocio());
            map.put("sucursal", u.getSucursal() != null ? u.getSucursal().getNombre() : null);
            map.put("sucursalId", u.getSucursal() != null ? u.getSucursal().getId() : null);
            map.put("tipo", "USUARIO");

            if (u.getIdSocio() != null) {
                socioRepository.findById(u.getIdSocio()).ifPresent(s -> {
                    map.put("cedula", s.getCedula());
                    map.put("numeroSocio", s.getNumeroSocio());
                });
            } else {
                 // Intentar recuperar cédula del username si es numérico
                 if (u.getUsername().matches("\\d+")) {
                     map.put("cedula", u.getUsername());
                 }
            }
            
            result.add(map);
            procesados.add(u.getUsername()); // Asumimos username como identificador clave
        }

        // 2. Obtener funcionarios importados que NO son usuarios aún
        List<com.asamblea.model.FuncionarioDirectivo> funcionarios = funcionarioRepository.findAll();
        for (com.asamblea.model.FuncionarioDirectivo f : funcionarios) {
            // Verificar si ya está procesado como usuario (por Cédula o NroSocio)
            // Normalizamos cédula quitando puntos
            String cedulaLimpia = f.getCedula() != null ? f.getCedula().replaceAll("[^0-9]", "") : "";
            
            if (procesados.contains(cedulaLimpia) || procesados.contains(f.getNumeroSocio())) {
                continue; // Ya está listado como Usuario
            }
            
            Map<String, Object> map = new HashMap<>();
            map.put("id", null); // No tiene ID de Usuario
            map.put("idFuncionario", f.getId());
            map.put("username", f.getCedula()); // Mostramos cédula como "usuario" sugerido
            map.put("nombreCompleto", f.getNombreCompleto());
            map.put("email", ""); // No tiene email aún
            map.put("telefono", "");
            map.put("rol", f.getRol().name());
            map.put("rolNombre", "Funcionario / " + f.getRol().name());
            map.put("activo", false); // Inactivo porque no tiene usuario creado
            map.put("sucursal", null);
            map.put("cedula", f.getCedula());
            map.put("numeroSocio", f.getNumeroSocio());
            map.put("tipo", "FUNCIONARIO"); // Flag para UI
            
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    // Obtener roles disponibles
    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, String>>> obtenerRoles() {
        List<Map<String, String>> roles = Arrays.stream(Usuario.Rol.values())
                .map(r -> Map.of(
                        "value", r.name(),
                        "nombre", r.getNombre(),
                        "descripcion", r.getDescripcion()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(roles);
    }

    // Crear nuevo usuario
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> data, Authentication auth,
            HttpServletRequest request) {
        try {
            String username = (String) data.get("username");
            String password = (String) data.get("password");
            String nombreCompleto = (String) data.get("nombreCompleto");
            String email = (String) data.get("email");
            String telefono = (String) data.get("telefono");
            String rol = (String) data.get("rol");
            Long sucursalId = data.get("sucursalId") != null ? Long.parseLong(data.get("sucursalId").toString()) : null;

            // Validar username único
            if (usuarioRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El nombre de usuario ya existe"));
            }

            Usuario usuario = new Usuario();
            usuario.setUsername(username);
            usuario.setPassword(passwordEncoder.encode(password));
            usuario.setPasswordVisible(password); // Guardar contraseña visible para admins
            usuario.setNombreCompleto(nombreCompleto);
            usuario.setEmail(email);
            usuario.setTelefono(telefono);
            usuario.setRol(Usuario.Rol.valueOf(rol));
            usuario.setActivo(true);
            usuario.setPermisosEspeciales((String) data.get("permisosEspeciales"));
            if (data.containsKey("idSocio") && data.get("idSocio") != null) {
                usuario.setIdSocio(Long.parseLong(data.get("idSocio").toString()));
            }

            if (sucursalId != null) {
                sucursalRepository.findById(sucursalId).ifPresent(usuario::setSucursal);
            }

            usuarioRepository.save(usuario);

            auditService.registrar(
                    "USUARIOS",
                    "CREAR_USUARIO",
                    String.format("Creó al usuario '%s' con rol %s", username, rol),
                    auth != null ? auth.getName() : "SISTEMA",
                    request.getRemoteAddr());

            return ResponseEntity.ok(Map.of("message", "Usuario creado exitosamente", "id", usuario.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Actualizar usuario
    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> data,
            Authentication auth, HttpServletRequest request) {
        try {
            Optional<Usuario> opt = usuarioRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Usuario usuario = opt.get();

            if (data.containsKey("nombreCompleto")) {
                usuario.setNombreCompleto((String) data.get("nombreCompleto"));
            }
            if (data.containsKey("email")) {
                usuario.setEmail((String) data.get("email"));
            }
            if (data.containsKey("telefono")) {
                String nuevoTelefono = (String) data.get("telefono");
                String oldTelefono = usuario.getTelefono();
                usuario.setTelefono(nuevoTelefono);

                // Trigger Arizar si es un teléfono nuevo o cambió
                if (nuevoTelefono != null && !nuevoTelefono.isEmpty() && !nuevoTelefono.equals(oldTelefono)) {
                    // Guardamos primero para asegurar persistencia antes del async
                    usuarioRepository.save(usuario);
                    arizarService.notificarRegistro(usuario);
                }
            }
            if (data.containsKey("rol")) {
                usuario.setRol(Usuario.Rol.valueOf((String) data.get("rol")));
            }
            if (data.containsKey("fotoPerfil")) {
                usuario.setFotoPerfil((String) data.get("fotoPerfil"));
            }
            if (data.containsKey("activo")) {
                usuario.setActivo((Boolean) data.get("activo"));
            }
            if (data.containsKey("password") && data.get("password") != null
                    && !((String) data.get("password")).isEmpty()) {
                String newPassword = (String) data.get("password");
                usuario.setPassword(passwordEncoder.encode(newPassword));
                usuario.setPasswordVisible(newPassword); // Actualizar contraseña visible
            }
            if (data.containsKey("permisosEspeciales")) {
                usuario.setPermisosEspeciales((String) data.get("permisosEspeciales"));
            }
            if (data.containsKey("idSocio")) {
                usuario.setIdSocio(data.get("idSocio") != null ? Long.parseLong(data.get("idSocio").toString()) : null);
            }
            if (data.containsKey("sucursalId")) {
                Long sucursalId = data.get("sucursalId") != null ? Long.parseLong(data.get("sucursalId").toString())
                        : null;
                if (sucursalId != null) {
                    sucursalRepository.findById(sucursalId).ifPresent(usuario::setSucursal);
                } else {
                    usuario.setSucursal(null);
                }
            }

            usuarioRepository.save(usuario);

            auditService.registrar(
                    "USUARIOS",
                    "ACTUALIZAR_USUARIO",
                    String.format("Actualizó datos del usuario '%s'", usuario.getUsername()),
                    auth.getName(),
                    request.getRemoteAddr());

            return ResponseEntity.ok(Map.of("message", "Usuario actualizado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Desactivar usuario
    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<?> desactivar(@PathVariable Long id, Authentication auth, HttpServletRequest request) {
        Optional<Usuario> opt = usuarioRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario usuario = opt.get();
        usuario.setActivo(false);
        usuarioRepository.save(usuario);

        auditService.registrar(
                "USUARIOS",
                "DESACTIVAR_USUARIO",
                String.format("Desactivó al usuario '%s'", usuario.getUsername()),
                auth.getName(),
                request.getRemoteAddr());

        return ResponseEntity.ok(Map.of("message", "Usuario desactivado"));
    }

    // Obtener usuario por ID
    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("username", u.getUsername());
                    map.put("nombreCompleto", u.getNombreCompleto());
                    map.put("email", u.getEmail());
                    map.put("telefono", u.getTelefono());
                    map.put("rol", u.getRol().name());
                    map.put("rolNombre", u.getRol().getNombre());
                    map.put("activo", u.isActivo());
                    map.put("sucursalId", u.getSucursal() != null ? u.getSucursal().getId() : null);
                    return ResponseEntity.ok(map);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Listar operadores/funcionarios con CRUCE DE PADRÓN DE SOCIOS
    @GetMapping("/operadores")
    public ResponseEntity<List<Map<String, Object>>> listarOperadores() {
        // Obtenemos solo usuarios que pueden ser operadores (excluimos socios puros)
        List<Usuario> usuarios = usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() != Usuario.Rol.USUARIO_SOCIO)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Usuario u : usuarios) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("nombreCompleto", u.getNombreCompleto());
            map.put("rol", u.getRol().name());

            // LÓGICA DE CRUCE: Consultar el padrón de socios por cédula (username)
            Optional<Socio> socioOpt = socioRepository.findByCedula(u.getUsername());
            if (socioOpt.isPresent()) {
                Socio s = socioOpt.get();
                // Si es socio, la sucursal del padrón manda
                map.put("sucursal", s.getSucursal() != null ? s.getSucursal().getNombre() : "Sin Sucursal");
                map.put("sucursalId", s.getSucursal() != null ? s.getSucursal().getId() : null);
                map.put("cedula", s.getCedula());
                map.put("numeroSocio", s.getNumeroSocio());
            } else {
                // Fallback: Si no es socio, usamos su configuración de usuario
                map.put("sucursal", u.getSucursal() != null ? u.getSucursal().getNombre() : "Sin Sucursal");
                map.put("sucursalId", u.getSucursal() != null ? u.getSucursal().getId() : null);
                map.put("cedula", u.getUsername());
            }
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }
}
