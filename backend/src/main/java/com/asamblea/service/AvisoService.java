package com.asamblea.service;

import com.asamblea.model.Aviso;
import com.asamblea.model.AvisoDestinatario;
import com.asamblea.model.Usuario;
import com.asamblea.repository.AvisoDestinatarioRepository;
import com.asamblea.repository.AvisoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AvisoService {

    private final AvisoRepository avisoRepository;
    private final AvisoDestinatarioRepository destinatarioRepository;

    @Transactional
    public void crearAvisoSeguridad(Usuario usuario, String contenido) {
        Aviso aviso = new Aviso();
        aviso.setTipo(Aviso.TipoAviso.INDIVIDUAL);
        aviso.setPrioridad(Aviso.PrioridadAviso.CRITICA);
        aviso.setTitulo("Alerta de Seguridad");
        aviso.setContenido(contenido);
        aviso.setMostrarModal(true);
        // Usamos al propio usuario como emisor "Sistema" para cumplir restricción NOT
        // NULL
        aviso.setEmisor(usuario);
        aviso.setIpEmisor("SYSTEM");
        aviso.setUserAgentEmisor("SYSTEM");
        aviso.setEstadoGeneral(Aviso.EstadoAviso.ENVIADO);

        avisoRepository.save(aviso);

        AvisoDestinatario dest = new AvisoDestinatario();
        dest.setAviso(aviso);
        dest.setUsuario(usuario);
        dest.setEnviadoAt(LocalDateTime.now());
        dest.setEstado(AvisoDestinatario.EstadoDestinatario.PENDIENTE);

        destinatarioRepository.save(dest);
    }
}
