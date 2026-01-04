package com.asamblea.controller;

import com.asamblea.model.PushSubscription;
import com.asamblea.model.Usuario;
import com.asamblea.repository.PushSubscriptionRepository;
import com.asamblea.repository.UsuarioRepository;
import com.asamblea.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private final PushNotificationService pushService;
    private final PushSubscriptionRepository subscriptionRepository;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/public-key")
    public ResponseEntity<Map<String, String>> getPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", pushService.getPublicKey()));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();

        Usuario user = usuarioRepository.findByUsername(auth.getName()).orElseThrow();

        String endpoint = body.get("endpoint");
        String p256dh = body.get("keys_p256dh"); // Adaptar según lo que envíe el front
        String authKey = body.get("keys_auth");

        if (endpoint == null || p256dh == null || authKey == null) {
            return ResponseEntity.badRequest().body("Missing subscription data");
        }

        // Verificar si ya existe para actualizar
        PushSubscription subscription = subscriptionRepository.findByEndpoint(endpoint)
                .orElse(new PushSubscription());

        subscription.setUsuario(user);
        subscription.setEndpoint(endpoint);
        subscription.setP256dh(p256dh);
        subscription.setAuth(authKey);

        subscriptionRepository.save(subscription);

        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/send-test")
    public ResponseEntity<?> sendTest(Authentication auth) {
        // Solo para admin
        pushService.sendToAdmins("Prueba de Notificación", "Esto es una prueba del sistema de asamblea.");
        return ResponseEntity.ok(Map.of("message", "Sent"));
    }
}
