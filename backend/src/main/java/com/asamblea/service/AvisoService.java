package com.asamblea.service;

import com.asamblea.model.Aviso;
import com.asamblea.model.AvisoDestinatario;
import com.asamblea.model.Configuracion;
import com.asamblea.model.Usuario;
import com.asamblea.repository.AvisoDestinatarioRepository;
import com.asamblea.repository.AvisoRepository;
import com.asamblea.repository.ConfiguracionRepository;
import com.asamblea.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AvisoService {

    private final AvisoRepository avisoRepository;
    private final AvisoDestinatarioRepository destinatarioRepository;
    private final ConfiguracionRepository configuracionRepository;
    private final UsuarioRepository usuarioRepository;

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

    /**
     * Crea un aviso de sistema para todos los Super Admins.
     * Respeta la configuración 'notificaciones_asignacion_activas'.
     */
    @Transactional
    public void crearAvisoAsignacionParaAdmins(String titulo, String contenido, Usuario emisor) {
        // Verificar si las notificaciones están habilitadas
        Optional<Configuracion> config = configuracionRepository.findById("notificaciones_asignacion_activas");
        if (config.isPresent() && "false".equalsIgnoreCase(config.get().getValor())) {
            return; // Deshabilitado, no enviar nada
        }

        // Crear el aviso
        Aviso aviso = new Aviso();
        aviso.setTipo(Aviso.TipoAviso.POR_FILTRO);
        aviso.setPrioridad(Aviso.PrioridadAviso.NORMAL);
        aviso.setTitulo(titulo);
        aviso.setContenido(contenido);
        aviso.setMostrarModal(false);
        aviso.setEmisor(emisor);
        aviso.setIpEmisor("SYSTEM");
        aviso.setUserAgentEmisor("SYSTEM");
        aviso.setEstadoGeneral(Aviso.EstadoAviso.ENVIADO);
        aviso.setFiltroRol("SUPER_ADMIN");

        avisoRepository.save(aviso);

        // Enviar a todos los Super Admins
        List<Usuario> admins = usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() == Usuario.Rol.SUPER_ADMIN && u.isActivo())
                .toList();

        for (Usuario admin : admins) {
            AvisoDestinatario dest = new AvisoDestinatario();
            dest.setAviso(aviso);
            dest.setUsuario(admin);
            dest.setEnviadoAt(LocalDateTime.now());
            dest.setEstado(AvisoDestinatario.EstadoDestinatario.PENDIENTE);
            destinatarioRepository.save(dest);
        }
    }

    /**
     * Verifica si las notificaciones de asignación están activas.
     */
    public boolean isNotificacionesAsignacionActivas() {
        Optional<Configuracion> config = configuracionRepository.findById("notificaciones_asignacion_activas");
        return config.isEmpty() || !"false".equalsIgnoreCase(config.get().getValor());
    }
}
