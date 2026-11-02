package com.apexfitness.gimnasio.application.service;

import com.apexfitness.gimnasio.domain.enums.EstadoSolicitud;
import com.apexfitness.gimnasio.domain.enums.EstadoValidacionDoc;
import com.apexfitness.gimnasio.domain.model.Documento;
import com.apexfitness.gimnasio.domain.model.FormularioSolicitud;
import com.apexfitness.gimnasio.domain.model.TipoDocumento;
import com.apexfitness.gimnasio.domain.model.dto.CatalogoCommands.AdjuntarDocumentoCommand;
import com.apexfitness.gimnasio.domain.model.dto.CatalogoCommands.CrearSolicitudCommand;
import com.apexfitness.gimnasio.domain.ports.in.SolicitudUseCase;
import com.apexfitness.gimnasio.domain.ports.out.DocumentoRepositoryPort;
import com.apexfitness.gimnasio.domain.ports.out.FormularioSolicitudRepositoryPort;
import com.apexfitness.gimnasio.domain.ports.out.TipoDocumentoRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SolicitudService implements SolicitudUseCase {

    private final TipoDocumentoRepositoryPort tipoDocumentoRepository;
    private final FormularioSolicitudRepositoryPort formularioSolicitudRepository;
    private final DocumentoRepositoryPort documentoRepository;

    @Override
    public List<TipoDocumento> listarTiposDocumento() {
        return tipoDocumentoRepository.findAll();
    }

    @Override
    public List<FormularioSolicitud> listarSolicitudes(EstadoSolicitud estado, UUID clienteId) {
        return formularioSolicitudRepository.findAll(estado, clienteId);
    }

    @Override
    public Optional<FormularioSolicitud> buscarPorId(UUID id) {
        return formularioSolicitudRepository.findById(id);
    }

    @Override
    @Transactional
    public FormularioSolicitud crearSolicitud(CrearSolicitudCommand command) {
        String numSolicitud = "SOL-" + System.currentTimeMillis() % 1000000;
        FormularioSolicitud solicitud = FormularioSolicitud.builder()
                .numeroSolicitud(numSolicitud)
                .clienteId(command.clienteId())
                .planId(command.planId())
                .disciplinaId(command.disciplinaId())
                .fechaSolicitud(LocalDate.now())
                .estado(EstadoSolicitud.DOCUMENTACION_PENDIENTE)
                .observaciones(command.observaciones())
                .build();
        return formularioSolicitudRepository.save(solicitud);
    }

    @Override
    @Transactional
    public Documento adjuntarDocumento(AdjuntarDocumentoCommand command) {
        Documento doc = Documento.builder()
                .formularioSolicitudId(command.formularioSolicitudId())
                .tipoDocumentoId(command.tipoDocumentoId())
                .nombreArchivo(command.nombreArchivo())
                .urlArchivo(command.urlArchivo())
                .estadoValidacion(EstadoValidacionDoc.PENDIENTE)
                .fechaSubida(OffsetDateTime.now())
                .build();
        return documentoRepository.save(doc);
    }

    @Override
    @Transactional
    public FormularioSolicitud aprobarSolicitud(UUID id) {
        FormularioSolicitud solicitud = formularioSolicitudRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud no encontrada: " + id));
        solicitud.setEstado(EstadoSolicitud.APROBADA);
        return formularioSolicitudRepository.save(solicitud);
    }

    @Override
    @Transactional
    public FormularioSolicitud rechazarSolicitud(UUID id, String motivo) {
        FormularioSolicitud solicitud = formularioSolicitudRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud no encontrada: " + id));
        solicitud.setEstado(EstadoSolicitud.RECHAZADA);
        solicitud.setMotivoRechazo(motivo);
        return formularioSolicitudRepository.save(solicitud);
    }
}
