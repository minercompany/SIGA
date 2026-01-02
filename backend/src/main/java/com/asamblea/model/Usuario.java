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

    @Column(columnDefinition = "VARCHAR(100)")
    private String cargo;

    @Column(name = "meta_registro", columnDefinition = "INT DEFAULT 20")
    private Integer meta = 20;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(50)")
    private Rol rol;

    @ManyToOne
    @JoinColumn(name = "id_sucursal")
    private Sucursal sucursal;

    private boolean activo = true;

    @Column(name = "permisos_especiales", columnDefinition = "TEXT")
    private String permisosEspeciales; // Comma separated screen keys

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_socio", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))

    private Socio socio;

    @Column(name = "password_visible")
    private String passwordVisible; // Contraseña en texto plano para visualización administrativa

    @Column(name = "requires_password_change")
    private Boolean requiresPasswordChange = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_login")
    private LocalDateTime lastLogin;
    @Column(name = "total_online_seconds")
    private Long totalOnlineSeconds = 0L;

    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;

    @Column(name = "token_version")
    private Integer tokenVersion = 0;

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
        USUARIO_SOCIO("Usuario Socio", "Acceso limitado personal"),
        ASESOR_DE_CREDITO("Asesor de Crédito", "Gestión de créditos y asignaciones");

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

    /**
     * Verifica si el usuario tiene un rol básico (USUARIO_SOCIO o
     * ASESOR_DE_CREDITO)
     * Ambos roles tienen exactamente los mismos permisos
     */
    public boolean esUsuarioBasico() {
        return rol == Rol.USUARIO_SOCIO || rol == Rol.ASESOR_DE_CREDITO;
    }

    /**
     * Verifica si el usuario es un asesor de crédito
     */
    public boolean esAsesor() {
        return rol == Rol.ASESOR_DE_CREDITO;
    }

    // --- MÉTODOS DE COMPATIBILIDAD (idSocio) ---
    public Long getIdSocio() {
        return socio != null ? socio.getId() : null;
    }

    public void setIdSocio(Long idSocio) {
        // No hace nada para persistencia, pero ayuda a compilar
    }

}
