package com.asamblea.repository;

import com.asamblea.model.ListaAsignacion;
import com.asamblea.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ListaAsignacionRepository extends JpaRepository<ListaAsignacion, Long> {
    List<ListaAsignacion> findByUsuarioId(Long usuarioId);

    List<ListaAsignacion> findByUsuario(Usuario usuario);
}
