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

            // Claves VAPID de prueba
            // IMPORTANTE: Reemplazar estas claves con unas generadas por `npx web-push
            // generate-vapid-keys`
            this.publicKeyEncoded = "BOjqV6FYd22aB4BNHVsomKDAEFyjMCqSJfaFUMwdegb1_dRfN8KdO8_TEV9ilPVVixPkW8wjFiIGWOWiQvGs6Bc";
            this.privateKeyEncoded = "uyXD43VLrlDAGyg1dIDvWT37y3xPmtIJV_2p4L61Ba8";

            pushService = new PushService(publicKeyEncoded, privateKeyEncoded, "mailto:admin@asamblea.com");
        } catch (Exception e) {
            System.err.println("Error inicializando PushService: " + e.getMessage());
        }
    }

    public String getPublicKey() {
        return this.publicKeyEncoded;
    }

    public void sendToAdmins(String title, String message) {
        if (pushService == null)
            return;

        List<PushSubscription> admins = subscriptionRepository.findByUsuario_Rol(Usuario.Rol.SUPER_ADMIN);
        admins.addAll(subscriptionRepository.findByUsuario_Rol(Usuario.Rol.DIRECTIVO));

        System.out.println("DEBUG: Enviando push a " + admins.size() + " suscripciones administrativas.");

        String payload = String.format(
                "{\"title\": \"%s\", \"body\": \"%s\", \"icon\": \"/logo.png\", \"badge\": \"/logo.png\", \"image\": \"/images/notification-banner.jpg\", \"data\": {\"url\": \"/dashboard\"}}",
                title.replace("\"", "\\\""),
                message.replace("\"", "\\\""));

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
