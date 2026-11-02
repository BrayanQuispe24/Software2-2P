package com.apexfitness.gimnasio.domain.model;

import com.apexfitness.gimnasio.domain.enums.EstadoValidacionDoc;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Documento {
    private UUID id;
    private UUID formularioSolicitudId;
    private UUID tipoDocumentoId;
    private TipoDocumento tipoDocumento;
    private String nombreArchivo;
    private String urlArchivo;
    private EstadoValidacionDoc estadoValidacion;
    private String observaciones;
    private OffsetDateTime fechaSubida;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
