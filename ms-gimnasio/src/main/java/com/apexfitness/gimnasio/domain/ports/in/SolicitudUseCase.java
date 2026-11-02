package com.apexfitness.gimnasio.domain.ports.in;

import com.apexfitness.gimnasio.domain.enums.EstadoSolicitud;
import com.apexfitness.gimnasio.domain.model.Documento;
import com.apexfitness.gimnasio.domain.model.FormularioSolicitud;
import com.apexfitness.gimnasio.domain.model.TipoDocumento;
import com.apexfitness.gimnasio.domain.model.dto.CatalogoCommands.AdjuntarDocumentoCommand;
import com.apexfitness.gimnasio.domain.model.dto.CatalogoCommands.CrearSolicitudCommand;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SolicitudUseCase {
    List<TipoDocumento> listarTiposDocumento();
    List<FormularioSolicitud> listarSolicitudes(EstadoSolicitud estado, UUID clienteId);
    Optional<FormularioSolicitud> buscarPorId(UUID id);
    FormularioSolicitud crearSolicitud(CrearSolicitudCommand command);
    Documento adjuntarDocumento(AdjuntarDocumentoCommand command);
    FormularioSolicitud aprobarSolicitud(UUID id);
    FormularioSolicitud rechazarSolicitud(UUID id, String motivo);
}
