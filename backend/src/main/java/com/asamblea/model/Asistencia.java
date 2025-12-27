package com.asamblea.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "asistencias")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Asistencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_asamblea")
    private Asamblea asamblea;

    @ManyToOne
    @JoinColumn(name = "id_socio", nullable = false)
    private Socio socio;

    @ManyToOne
    @JoinColumn(name = "id_operador")
    private Usuario operador;

    @Column(name = "estado_voz_voto")
    private Boolean estadoVozVoto = false;

    @Column(name = "id_voto_impreso")
    private Boolean idVotoImpreso = false;

    @Column(name = "carnet_impreso")
    private Boolean carnetImpreso = false;

    @Column(name = "fecha_hora", updatable = false)
    private LocalDateTime fechaHora = LocalDateTime.now();
}
