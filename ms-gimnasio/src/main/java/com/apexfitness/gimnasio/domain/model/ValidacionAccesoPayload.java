package com.apexfitness.gimnasio.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidacionAccesoPayload {
    private Boolean permitido;
    private String mensaje;
    private UUID clienteId;
    private String codigoMatricula;
    private String planNombre;
    private Integer sesionesRestantes;
    private Integer diasRestantes;
    private RegistroAcceso registroAcceso;
}
