package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "importaciones_historial")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportacionHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha_importacion")
    private LocalDateTime fechaImportacion = LocalDateTime.now();

    @Column(name = "usuario_importador")
    private String usuarioImportador;

    @Column(name = "total_registros")
    private Integer totalRegistros;

    @Column(name = "archivo_nombre")
    private String archivoNombre;

    @Column(name = "archivo_ruta")
    private String archivoRuta;

    @Column(name = "vista_previa", columnDefinition = "TEXT")
    private String vistaPreviaJson;
}
