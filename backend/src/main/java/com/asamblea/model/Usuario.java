package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String password;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    private String email;
    private String telefono;

    @Column(columnDefinition = "LONGTEXT")
    private String fotoPerfil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(50)")
    private Rol rol;

    @ManyToOne
    @JoinColumn(name = "id_sucursal")
    private Sucursal sucursal;

    private boolean activo = true;

    @Column(name = "permisos_especiales", columnDefinition = "TEXT")
    private String permisosEspeciales; // Comma separated screen keys

    @Column(name = "id_socio")
    private Long idSocio;

    @Column(name = "requires_password_change")
    private Boolean requiresPasswordChange = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Roles del Sistema:
     * - SUPER_ADMIN: Acceso total, puede editar, cargar, eliminar todo
     * - DIRECTIVO: Puede ver todo, asignar, pero NO editar/cargar/eliminar
     * - OPERADOR: Puede hacer check-in y ver información básica
     * - USUARIO_SOCIO: Acceso limitado, ve sus propias asignaciones
     */
    public enum Rol {
        SUPER_ADMIN("Super Administrador", "Acceso total al sistema"),
        DIRECTIVO("Directivo", "Ver todo, asignar, sin editar"),
        OPERADOR("Operador Check-in", "Registro de asistencia"),
        USUARIO_SOCIO("Usuario Socio", "Acceso limitado personal");

        private final String nombre;
        private final String descripcion;

        Rol(String nombre, String descripcion) {
            this.nombre = nombre;
            this.descripcion = descripcion;
        }

        public String getNombre() {
            return nombre;
        }

        public String getDescripcion() {
            return descripcion;
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + rol.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return activo;
    }

    // Helpers para verificar permisos
    public boolean puedeEditar() {
        return rol == Rol.SUPER_ADMIN;
    }

    public boolean puedeCargarPadron() {
        return rol == Rol.SUPER_ADMIN;
    }

    public boolean puedeAsignar() {
        return rol == Rol.SUPER_ADMIN || rol == Rol.DIRECTIVO;
    }

    public boolean puedeVerReportes() {
        return rol == Rol.SUPER_ADMIN || rol == Rol.DIRECTIVO;
    }

    public boolean puedeHacerCheckin() {
        return rol == Rol.SUPER_ADMIN || rol == Rol.DIRECTIVO || rol == Rol.OPERADOR;
    }
}
