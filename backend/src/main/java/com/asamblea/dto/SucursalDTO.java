package com.asamblea.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SucursalDTO {
    private Long id;
    private String codigo;
    private String nombre;
    private String ciudad;
}
