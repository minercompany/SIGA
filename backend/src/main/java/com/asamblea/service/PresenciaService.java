package com.asamblea.service;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio de presencia para tracking de usuarios activos en tiempo real.
 * Utiliza un mapa en memoria con TTL basado en heartbeats.
 */
@Service
public class PresenciaService {

    // Tiempo máximo sin heartbeat para considerar inactivo (12 segundos)
    // Heartbeat cada 8 seg = detección en ~10 segundos máximo
    private static final long INACTIVITY_THRESHOLD_SECONDS = 12;

    // Mapa: userId -> timestampUltimoHeartbeat
    private final Map<Long, Instant> activeUsers = new ConcurrentHashMap<>();

    /**
     * Registra un heartbeat del usuario, marcándolo como activo.
     */
    public void heartbeat(Long userId) {
        activeUsers.put(userId, Instant.now());
    }

    /**
     * Remueve un usuario del tracking (por ejemplo, al hacer logout).
     */
    public void removeUser(Long userId) {
        activeUsers.remove(userId);
    }

    /**
     * Obtiene la cantidad de usuarios activos en este momento.
     * Un usuario se considera activo si envió heartbeat en los últimos 60 segundos.
     */
    public int getActiveUsersCount() {
        Instant threshold = Instant.now().minusSeconds(INACTIVITY_THRESHOLD_SECONDS);

        // Limpiar usuarios inactivos y contar activos
        activeUsers.entrySet().removeIf(entry -> entry.getValue().isBefore(threshold));

        return activeUsers.size();
    }

    /**
     * Obtiene el mapa de usuarios activos (para debug o admin).
     */
    public Map<Long, Instant> getActiveUsersMap() {
        Instant threshold = Instant.now().minusSeconds(INACTIVITY_THRESHOLD_SECONDS);
        activeUsers.entrySet().removeIf(entry -> entry.getValue().isBefore(threshold));
        return activeUsers;
    }
}
