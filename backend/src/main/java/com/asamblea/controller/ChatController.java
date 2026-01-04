package com.asamblea.controller;

import com.asamblea.model.*;
import com.asamblea.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.*;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Transactional
public class ChatController {

    private final ConversacionRepository conversacionRepository;
    private final ChatMensajeRepository chatMensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final com.asamblea.service.LogAuditoriaService auditService;
    private final com.asamblea.service.PushNotificationService pushNotificationService;

    // ========================================================================
    // CONVERSACIONES
    // ========================================================================

    /**
     * Lista de conversaciones (Admin: todas, Usuario: solo la suya)
     */
    @GetMapping("/conversaciones")
    public ResponseEntity<?> listarConversaciones(Authentication auth) {
        Usuario current = getCurrentUser(auth);
        if (current == null)
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));

        List<Map<String, Object>> result = new ArrayList<>();

        if (isAdmin(current)) {
            // Admin ve todas las conversaciones
            List<Conversacion> convs = conversacionRepository.findAllOrderByLastMessageDesc();
            for (Conversacion c : convs) {
                result.add(mapConversacion(c, true));
            }
        } else {
            // Usuario solo ve su conversación (si existe)
            Optional<Conversacion> conv = conversacionRepository.findByUsuarioId(current.getId());
            conv.ifPresent(c -> result.add(mapConversacion(c, false)));
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Obtener o crear conversación para usuario actual
     */
    @GetMapping("/mi-conversacion")
    public ResponseEntity<?> getMiConversacion(Authentication auth) {
        Usuario current = getCurrentUser(auth);
        if (current == null)
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));

        Conversacion conv = conversacionRepository.findByUsuarioId(current.getId())
                .orElseGet(() -> {
                    Conversacion nueva = new Conversacion();
                    nueva.setUsuario(current);
                    nueva.setCreatedAt(LocalDateTime.now());
                    Conversacion guardada = conversacionRepository.save(nueva);

                    // Notificar a admins que un usuario entró al chat por primera vez
                    pushNotificationService.sendToAdmins(
                            "Nueva consulta iniciada",
                            current.getNombreCompleto() + " ha abierto el chat de soporte.");

                    return guardada;
                });

        // Obtener mensajes
        List<ChatMensaje> mensajes = chatMensajeRepository.findByConversacionIdOrderByCreatedAtAsc(conv.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("conversacion", mapConversacion(conv, false));
        response.put("mensajes", mensajes.stream().map(this::mapMensaje).toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Detalle de conversación con mensajes
     */
    @GetMapping("/conversacion/{id}")
    public ResponseEntity<?> getConversacion(@PathVariable long id, Authentication auth) {
        Usuario current = getCurrentUser(auth);
        if (current == null)
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));

        Optional<Conversacion> convOpt = conversacionRepository.findById(id);
        if (convOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Conversacion conv = convOpt.get();

        // Verificar acceso (admin o dueño)
        if (!isAdmin(current) && !conv.getUsuario().getId().equals(current.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Acceso denegado"));
        }

        // Marcar como leídos los mensajes del otro
        if (isAdmin(current)) {
            chatMensajeRepository.markAsRead(id, ChatMensaje.SenderRole.USUARIO, LocalDateTime.now());
            conv.setUnreadCountAdmin(0);
        } else {
            chatMensajeRepository.markAsRead(id, ChatMensaje.SenderRole.ADMIN, LocalDateTime.now());
            conv.setUnreadCountUsuario(0);
        }
        conversacionRepository.save(conv);

        List<ChatMensaje> mensajes = chatMensajeRepository.findByConversacionIdOrderByCreatedAtAsc(id);

        Map<String, Object> response = new HashMap<>();
        response.put("conversacion", mapConversacion(conv, isAdmin(current)));
        response.put("mensajes", mensajes.stream().map(this::mapMensaje).toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Admin: Iniciar o obtener conversación con un usuario específico
     */
    @PostMapping("/iniciar-con-usuario/{usuarioId}")
    public ResponseEntity<?> iniciarConversacionConUsuario(@PathVariable Long usuarioId,
            Authentication auth, HttpServletRequest request) {
        Usuario current = getCurrentUser(auth);
        if (current == null)
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));

        if (!isAdmin(current)) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Solo administradores pueden iniciar conversaciones"));
        }

        if (usuarioId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "ID de usuario inválido"));
        }

        // Verificar que el usuario destino existe
        Usuario usuarioDestino = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuarioDestino == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
        }

        // Buscar conversación existente o crear nueva
        Conversacion conv = conversacionRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> {
                    Conversacion nueva = new Conversacion();
                    nueva.setUsuario(usuarioDestino);
                    nueva.setCreatedAt(LocalDateTime.now());
                    return conversacionRepository.save(nueva);
                });

        // Obtener mensajes
        List<ChatMensaje> mensajes = chatMensajeRepository.findByConversacionIdOrderByCreatedAtAsc(conv.getId());

        auditService.registrar("CHAT", "INICIAR_CONVERSACION",
                String.format("Admin inició conversación con usuario #%d (%s)", usuarioId,
                        usuarioDestino.getNombreCompleto()),
                auth.getName(), request.getRemoteAddr());

        Map<String, Object> response = new HashMap<>();
        response.put("conversacion", mapConversacion(conv, true));
        response.put("mensajes", mensajes.stream().map(this::mapMensaje).toList());

        return ResponseEntity.ok(response);
    }

    // ========================================================================
    // MENSAJES
    // ========================================================================

    /**
     * Enviar mensaje
     */
    @PostMapping("/mensaje")
    public ResponseEntity<?> enviarMensaje(@RequestBody Map<String, Object> body,
            Authentication auth, HttpServletRequest request) {
        Usuario current = getCurrentUser(auth);
        if (current == null)
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));

        String contenido = (String) body.get("contenido");
        Long conversacionId = body.get("conversacionId") != null
                ? Long.valueOf(body.get("conversacionId").toString())
                : null;

        if (contenido == null || contenido.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Contenido vacío"));
        }

        Conversacion conv;
        if (conversacionId != null) {
            conv = conversacionRepository.findById(conversacionId).orElse(null);
            if (conv == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Conversación no encontrada"));
            }
        } else {
            // Usuario crea o recupera su conversación
            conv = conversacionRepository.findByUsuarioId(current.getId())
                    .orElseGet(() -> {
                        Conversacion nueva = new Conversacion();
                        nueva.setUsuario(current);
                        nueva.setCreatedAt(LocalDateTime.now());
                        return conversacionRepository.save(nueva);
                    });
        }

        // Crear mensaje
        ChatMensaje mensaje = new ChatMensaje();
        mensaje.setConversacion(conv);
        mensaje.setSenderId(current.getId());
        mensaje.setSenderRole(isAdmin(current) ? ChatMensaje.SenderRole.ADMIN : ChatMensaje.SenderRole.USUARIO);
        mensaje.setContenido(contenido.trim());
        mensaje.setCreatedAt(LocalDateTime.now());
        mensaje.setSentAt(LocalDateTime.now());
        mensaje.setIpSender(request.getRemoteAddr());
        mensaje.setUserAgent(request.getHeader("User-Agent"));

        chatMensajeRepository.save(mensaje);

        // Actualizar conversación
        conv.setLastMessageAt(LocalDateTime.now());
        if (isAdmin(current)) {
            conv.setUnreadCountUsuario(conv.getUnreadCountUsuario() + 1);
        } else {
            conv.setUnreadCountAdmin(conv.getUnreadCountAdmin() + 1);
        }
        conversacionRepository.save(conv);

        // Notificar a Super Admins si el mensaje lo envía un usuario regular
        if (!isAdmin(current)) {
            String tituloPush = "Mensaje de Chat: " + current.getNombreCompleto();
            String resumen = contenido.length() > 60 ? contenido.substring(0, 57) + "..." : contenido;
            pushNotificationService.sendToAdmins(tituloPush, resumen);
        }

        auditService.registrar("CHAT", "ENVIAR_MENSAJE",
                String.format("Mensaje enviado en conversación #%d", conv.getId()),
                auth.getName(), request.getRemoteAddr());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "mensaje", mapMensaje(mensaje),
                "conversacionId", conv.getId()));
    }

    /**
     * Marcar mensaje como leído
     */
    @PutMapping("/mensaje/{id}/leido")
    public ResponseEntity<?> marcarLeido(@PathVariable long id, Authentication auth) {
        Optional<ChatMensaje> msgOpt = chatMensajeRepository.findById(id);
        if (msgOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ChatMensaje msg = msgOpt.get();
        if (msg.getReadAt() == null) {
            msg.setReadAt(LocalDateTime.now());
            msg.setEstado(ChatMensaje.EstadoMensaje.LEIDO);
            chatMensajeRepository.save(msg);
        }

        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * Contador de mensajes no leídos
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        Usuario current = getCurrentUser(auth);
        if (current == null)
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));

        int count;
        if (isAdmin(current)) {
            count = conversacionRepository.countTotalUnreadForAdmin();
        } else {
            Integer c = conversacionRepository.countUnreadForUsuario(current.getId());
            count = c != null ? c : 0;
        }

        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private Usuario getCurrentUser(Authentication auth) {
        if (auth == null)
            return null;
        return usuarioRepository.findByUsername(auth.getName()).orElse(null);
    }

    private boolean isAdmin(Usuario user) {
        Usuario.Rol rol = user.getRol();
        return rol == Usuario.Rol.SUPER_ADMIN || rol == Usuario.Rol.DIRECTIVO;
    }

    private Map<String, Object> mapConversacion(Conversacion c, boolean isAdmin) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", c.getId());
        map.put("createdAt", c.getCreatedAt());
        map.put("lastMessageAt", c.getLastMessageAt());
        map.put("estado", c.getEstado());
        map.put("unreadCount", isAdmin ? c.getUnreadCountAdmin() : c.getUnreadCountUsuario());

        if (c.getUsuario() != null) {
            map.put("usuarioId", c.getUsuario().getId());
            map.put("usuarioNombre", c.getUsuario().getNombreCompleto());
        }

        // Obtener último mensaje para preview
        List<ChatMensaje> ultimosMensajes = chatMensajeRepository.findByConversacionIdOrderByCreatedAtAsc(c.getId());
        if (!ultimosMensajes.isEmpty()) {
            ChatMensaje ultimo = ultimosMensajes.get(ultimosMensajes.size() - 1);
            String contenido = ultimo.getContenido();
            // Truncar a 50 caracteres
            if (contenido.length() > 50) {
                contenido = contenido.substring(0, 47) + "...";
            }
            map.put("lastMessage", contenido);
        }

        return map;
    }

    private Map<String, Object> mapMensaje(ChatMensaje m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("senderId", m.getSenderId());
        map.put("senderRole", m.getSenderRole());
        map.put("contenido", m.getContenido());
        map.put("createdAt", m.getCreatedAt());
        map.put("sentAt", m.getSentAt());
        map.put("deliveredAt", m.getDeliveredAt());
        map.put("readAt", m.getReadAt());
        map.put("estado", m.getEstado());
        return map;
    }
}
