package com.asamblea.service;

import com.asamblea.model.Configuracion;
import com.asamblea.repository.ConfiguracionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ConfiguracionService {

    @Autowired
    private ConfiguracionRepository configuracionRepository;

    @Autowired
    private com.asamblea.repository.AsambleaRepository asambleaRepository;

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
