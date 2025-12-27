package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "configuracion")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Configuracion {

    @Id
    private String clave;

    @Column(columnDefinition = "TEXT")
    private String valor;

    @Column(name = "tipo_dato")
    private String tipoDato = "STRING";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
