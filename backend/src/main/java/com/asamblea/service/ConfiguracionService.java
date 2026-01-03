package com.asamblea.service;

import com.asamblea.model.Configuracion;
import com.asamblea.repository.ConfiguracionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ConfiguracionService {

    @Autowired
    private ConfiguracionRepository configuracionRepository;

    @Autowired
    private com.asamblea.repository.AsambleaRepository asambleaRepository;

    // Claves para fecha límite de asignación
    public static final String FECHA_LIMITE_ASIGNACION = "FECHA_LIMITE_ASIGNACION";
    public static final String FECHA_LIMITE_ACTIVA = "FECHA_LIMITE_ACTIVA";
    public static final String FECHA_LIMITE_PRUEBA_ACTIVA = "FECHA_LIMITE_PRUEBA_ACTIVA";

    /**
     * Verifica si las asignaciones están bloqueadas.
     * Retorna un Map con:
     * - bloqueado: true/false
     * - mensaje: mensaje amigable para el usuario
     * - fechaLimite: la fecha límite configurada (si existe)
     * - esPrueba: true si está en modo prueba
     */
    public Map<String, Object> verificarBloqueoAsignaciones() {
        Map<String, Object> resultado = new HashMap<>();

        // Verificar si el modo prueba está activo
        String pruebaActiva = obtener(FECHA_LIMITE_PRUEBA_ACTIVA, "false");
        if ("true".equals(pruebaActiva)) {
            resultado.put("bloqueado", true);
            resultado.put("esPrueba", true);
            resultado.put("mensaje",
                    "🔒 El periodo de asignación ha finalizado. Las asignaciones están actualmente cerradas. ¡Gracias por tu colaboración!");
            return resultado;
        }

        // Verificar si la fecha límite está activa
        String limiteActiva = obtener(FECHA_LIMITE_ACTIVA, "false");
        if (!"true".equals(limiteActiva)) {
            resultado.put("bloqueado", false);
            resultado.put("esPrueba", false);
            resultado.put("mensaje", null);
            return resultado;
        }

        // Obtener la fecha límite
        String fechaLimiteStr = obtener(FECHA_LIMITE_ASIGNACION, null);
        if (fechaLimiteStr == null || fechaLimiteStr.isEmpty()) {
            resultado.put("bloqueado", false);
            resultado.put("esPrueba", false);
            resultado.put("mensaje", null);
            return resultado;
        }

        try {
            LocalDateTime fechaLimite = LocalDateTime.parse(fechaLimiteStr);
            LocalDateTime ahora = LocalDateTime.now();

            if (ahora.isAfter(fechaLimite)) {
                resultado.put("bloqueado", true);
                resultado.put("esPrueba", false);
                resultado.put("fechaLimite",
                        fechaLimite.format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm 'hs'")));
                resultado.put("mensaje", "🔒 El periodo de asignación finalizó el " +
                        fechaLimite.format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm 'hs'")) +
                        ". Las asignaciones están actualmente cerradas. ¡Gracias por tu colaboración!");
            } else {
                resultado.put("bloqueado", false);
                resultado.put("esPrueba", false);
                resultado.put("fechaLimite",
                        fechaLimite.format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm 'hs'")));
                resultado.put("mensaje", null);
            }
        } catch (Exception e) {
            System.err.println("Error parseando fecha límite: " + e.getMessage());
            resultado.put("bloqueado", false);
            resultado.put("esPrueba", false);
            resultado.put("mensaje", null);
        }

        return resultado;
    }

    /**
     * Activa el modo prueba que simula que la fecha límite ha pasado
     */
    public void activarModoPruebaFechaLimite() {
        guardar(FECHA_LIMITE_PRUEBA_ACTIVA, "true");
    }

    /**
     * Desactiva el modo prueba
     */
    public void desactivarModoPruebaFechaLimite() {
        guardar(FECHA_LIMITE_PRUEBA_ACTIVA, "false");
    }

    /**
     * Obtiene información completa sobre la configuración de fecha límite
     */
    public Map<String, Object> obtenerInfoFechaLimite() {
        Map<String, Object> info = new HashMap<>();

        String limiteActiva = obtener(FECHA_LIMITE_ACTIVA, "false");
        String fechaLimiteStr = obtener(FECHA_LIMITE_ASIGNACION, null);
        String pruebaActiva = obtener(FECHA_LIMITE_PRUEBA_ACTIVA, "false");

        info.put("activa", "true".equals(limiteActiva));
        info.put("pruebaActiva", "true".equals(pruebaActiva));
        info.put("fechaLimite", fechaLimiteStr);

        // Agregar información de bloqueo actual
        Map<String, Object> bloqueo = verificarBloqueoAsignaciones();
        info.put("bloqueado", bloqueo.get("bloqueado"));
        info.put("mensaje", bloqueo.get("mensaje"));

        return info;
    }

    public void guardar(String clave, String valor) {
        if (clave == null)
            return;
        Configuracion config = configuracionRepository.findById(clave).orElse(new Configuracion());
        config.setClave(clave);
        config.setValor(valor);
        config.setUpdatedAt(LocalDateTime.now());
        configuracionRepository.save(config);

        // Sincronizar con la Asamblea activa si es un parámetro relevante
        try {
            if ("ASAMBLEA_NOMBRE".equals(clave)) {
                asambleaRepository.findTopByActivoTrueOrderByFechaDesc().ifPresent(a -> {
                    a.setNombre(valor);
                    asambleaRepository.save(a);
                });
            } else if ("ASAMBLEA_FECHA".equals(clave)) {
                java.time.LocalDate nuevaFecha = java.time.LocalDate.parse(valor);
                asambleaRepository.findTopByActivoTrueOrderByFechaDesc().ifPresent(a -> {
                    a.setFecha(nuevaFecha);
                    asambleaRepository.save(a);
                });
            }
        } catch (Exception e) {
            System.err.println("Error sincronizando configuración con Asamblea: " + e.getMessage());
        }
    }

    public String obtener(String clave, String valorPorDefecto) {
        if (clave == null)
            return valorPorDefecto;
        return configuracionRepository.findById(clave)
                .map(Configuracion::getValor)
                .orElse(valorPorDefecto);
    }

    public Map<String, String> obtenerTodas() {
        List<Configuracion> configs = configuracionRepository.findAll();
        Map<String, String> result = new HashMap<>();
        for (Configuracion c : configs) {
            result.put(c.getClave(), c.getValor());
        }
        return result;
    }
}
