package com.apexfitness.gimnasio.infrastructure.adapters.in.graphql;

import com.apexfitness.gimnasio.domain.enums.EstadoSolicitud;
import com.apexfitness.gimnasio.domain.model.Documento;
import com.apexfitness.gimnasio.domain.model.FormularioSolicitud;
import com.apexfitness.gimnasio.domain.model.TipoDocumento;
import com.apexfitness.gimnasio.domain.model.dto.CatalogoCommands.AdjuntarDocumentoCommand;
import com.apexfitness.gimnasio.domain.model.dto.CatalogoCommands.CrearSolicitudCommand;
import com.apexfitness.gimnasio.domain.ports.in.SolicitudUseCase;
import com.apexfitness.gimnasio.domain.ports.out.DocumentoRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class SolicitudGraphQLController {

    private final SolicitudUseCase solicitudUseCase;
    private final DocumentoRepositoryPort documentoRepository;

    @QueryMapping
    public List<TipoDocumento> tiposDocumento() {
        return solicitudUseCase.listarTiposDocumento();
    }

    @QueryMapping
    public List<FormularioSolicitud> solicitudes(@Argument EstadoSolicitud estado, @Argument UUID clienteId) {
        return solicitudUseCase.listarSolicitudes(estado, clienteId);
    }

    @QueryMapping
    public FormularioSolicitud solicitud(@Argument UUID id) {
        return solicitudUseCase.buscarPorId(id).orElse(null);
    }

    @MutationMapping
    public FormularioSolicitud crearSolicitud(@Argument CrearSolicitudCommand input) {
        return solicitudUseCase.crearSolicitud(input);
    }

    @MutationMapping
    public Documento adjuntarDocumento(@Argument AdjuntarDocumentoCommand input) {
        return solicitudUseCase.adjuntarDocumento(input);
    }

    @MutationMapping
    public FormularioSolicitud aprobarSolicitud(@Argument UUID id) {
        return solicitudUseCase.aprobarSolicitud(id);
    }

    @MutationMapping
    public FormularioSolicitud rechazarSolicitud(@Argument UUID id, @Argument String motivo) {
        return solicitudUseCase.rechazarSolicitud(id, motivo);
    }

    @BatchMapping(typeName = "FormularioSolicitud", field = "documentos")
    public Map<FormularioSolicitud, List<Documento>> documentos(List<FormularioSolicitud> solicitudes) {
        Map<FormularioSolicitud, List<Documento>> result = new HashMap<>();
        for (FormularioSolicitud s : solicitudes) {
            List<Documento> docs = documentoRepository.findByFormularioSolicitudId(s.getId());
            result.put(s, docs);
        }
        return result;
    }
}
