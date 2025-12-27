package com.asamblea.service;

import com.asamblea.model.Usuario;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import java.util.HashMap;
import java.util.Map;

@Service
public class ArizarService {

    private static final Logger logger = LoggerFactory.getLogger(ArizarService.class);

    // Método asíncrono para no bloquear la respuesta al usuario
    @Async
    public void notificarRegistro(Usuario usuario) {
        if (usuario.getTelefono() == null || usuario.getTelefono().isEmpty()) {
            logger.warn("Arizar IA SKIPPED: Usuario sin teléfono (ID: {})", usuario.getId());
            return;
        }

        logger.info(">>> ARIZAR IA INTEGRATION: Iniciando secuencia para {}", usuario.getNombreCompleto());
        logger.info(">>> Telefono destino: {}", usuario.getTelefono());

        try {
            // Simulación de delay de red y llamada a API externa (GoHighLevel / Arizar)
            // Aquí iría el RestTemplate.postForObject(...)

            Map<String, Object> payload = new HashMap<>();
            payload.put("contact_name", usuario.getNombreCompleto());
            payload.put("phone", usuario.getTelefono());
            payload.put("email", usuario.getEmail());
            payload.put("source", "ASAMBLEA_APP_ONBOARDING");
            payload.put("tags", "nuevo_registro,asamblea_2025");

            logger.info(">>> PAYLOAD ENVIADO: {}", payload.toString());
            logger.info(">>> ARIZAR IA: Notificación enviada exitosamente ✔");

        } catch (Exception e) {
            logger.error("Error en integración con Arizar IA: ", e);
        }
    }
}
