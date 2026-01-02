package com.asamblea.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UsuarioActivityDto {
    private Long id;
    private String username;
    private String nombreCompleto;
    private String rol;
    private String sucursal;
    private LocalDateTime lastLogin;
    private Long totalOnlineSeconds;
    private boolean isOnline;
    private long totalRegistros;
    private long totalAsignaciones;
    private String timeOnlineFormatted;
    private String lastSeenRelative;
}
