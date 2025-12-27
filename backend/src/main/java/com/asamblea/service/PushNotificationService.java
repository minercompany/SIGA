package com.asamblea.service;

import com.asamblea.model.PushSubscription;
import com.asamblea.model.Usuario;
import com.asamblea.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import java.security.Security;
import java.util.List;

@Service
public class PushNotificationService {

    private final PushSubscriptionRepository subscriptionRepository;
    private PushService pushService;
    private String publicKeyEncoded;
    private String privateKeyEncoded;

    public PushNotificationService(PushSubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @PostConstruct
    public void init() {
        try {
            // Intentar cargar BouncyCastle dinámicamente si es necesario
            if (Security.getProvider("BC") == null) {
                try {
                    Class<?> clazz = Class.forName("org.bouncycastle.jce.provider.BouncyCastleProvider");
                    Security.addProvider((java.security.Provider) clazz.getDeclaredConstructor().newInstance());
                } catch (Exception e) {
                    // BC no encontrado o no necesario
                }
            }

            // Claves VAPID de demostración (NO PRODUCCIÓN)
            this.publicKeyEncoded = "BKbk4r2d4_2r5s6t7u8v9w0x1y2z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9a0b1c2d3e4f";
            this.privateKeyEncoded = "X1y2z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S";

            pushService = new PushService(publicKeyEncoded, privateKeyEncoded, "mailto:admin@asamblea.com");
        } catch (Exception e) {
            System.err.println("Error inicializando PushService: " + e.getMessage());
        }
    }

    public String getPublicKey() {
        return this.publicKeyEncoded;
    }

    public void sendToSuperAdmins(String title, String message) {
        if (pushService == null)
            return;

        List<PushSubscription> admins = subscriptionRepository.findByUsuario_Rol(Usuario.Rol.SUPER_ADMIN);

        String payload = String.format("{\"title\": \"%s\", \"body\": \"%s\"}", title, message);

        for (PushSubscription sub : admins) {
            try {
                Subscription subscription = new Subscription(sub.getEndpoint(),
                        new Subscription.Keys(sub.getP256dh(), sub.getAuth()));
                Notification notification = new Notification(subscription, payload);
                pushService.send(notification);
            } catch (Exception e) {
                System.err.println("Error enviando push a " + sub.getUsuario().getUsername() + ": " + e.getMessage());
                // Si la suscripción ya no es válida, la borramos
                if (e.getMessage() != null && (e.getMessage().contains("410") || e.getMessage().contains("404"))) {
                    try {
                        subscriptionRepository.delete(sub);
                    } catch (Exception ex) {
                        // ignore
                    }
                }
            }
        }
    }
}
