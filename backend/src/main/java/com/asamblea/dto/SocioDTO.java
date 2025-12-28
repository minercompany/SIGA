package com.asamblea.dto;

import com.asamblea.model.Socio;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SocioDTO {
    private Long id;
    private String numeroSocio;
    private String nombreCompleto;
    private String cedula;
    private String telefono;
    private SucursalDTO sucursal;
    private Boolean aporteAlDia;
    private Boolean solidaridadAlDia;
    private Boolean fondoAlDia;
    private Boolean incoopAlDia;
    private Boolean creditoAlDia;

    public static SocioDTO fromEntity(Socio socio) {
        SocioDTO dto = new SocioDTO();
        dto.setId(socio.getId());
        dto.setNumeroSocio(socio.getNumeroSocio());
        dto.setNombreCompleto(socio.getNombreCompleto());
        dto.setCedula(socio.getCedula());
        dto.setTelefono(socio.getTelefono());
        dto.setAporteAlDia(socio.isAporteAlDia());
        dto.setSolidaridadAlDia(socio.isSolidaridadAlDia());
        dto.setFondoAlDia(socio.isFondoAlDia());
        dto.setIncoopAlDia(socio.isIncoopAlDia());
        dto.setCreditoAlDia(socio.isCreditoAlDia());

        // ESTO ES LO IMPORTANTE - convertir Sucursal a DTO
        if (socio.getSucursal() != null) {
            SucursalDTO sucursalDTO = new SucursalDTO();
            sucursalDTO.setId(socio.getSucursal().getId());
            sucursalDTO.setCodigo(socio.getSucursal().getCodigo());
            sucursalDTO.setNombre(socio.getSucursal().getNombre());
            sucursalDTO.setCiudad(socio.getSucursal().getCiudad());
            dto.setSucursal(sucursalDTO);
        }

        return dto;
    }
}
