package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.model.Documento;
import com.apexfitness.gimnasio.domain.ports.out.DocumentoRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.DocumentoEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.FormularioSolicitudEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.TipoDocumentoEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataDocumentoRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataFormularioSolicitudRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataTipoDocumentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DocumentoRepositoryAdapter implements DocumentoRepositoryPort {

    private final SpringDataDocumentoRepository repository;
    private final SpringDataFormularioSolicitudRepository solicitudRepository;
    private final SpringDataTipoDocumentoRepository tipoDocumentoRepository;

    @Override
    public List<Documento> findByFormularioSolicitudId(UUID formularioSolicitudId) {
        return repository.findByFormularioSolicitudId(formularioSolicitudId).stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Documento> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Documento save(Documento doc) {
        FormularioSolicitudEntity solicitud = doc.getFormularioSolicitudId() != null
                ? solicitudRepository.findById(doc.getFormularioSolicitudId()).orElse(null)
                : null;
        TipoDocumentoEntity tipo = doc.getTipoDocumentoId() != null
                ? tipoDocumentoRepository.findById(doc.getTipoDocumentoId()).orElse(null)
                : null;

        DocumentoEntity entity = DocumentoEntity.builder()
                .id(doc.getId())
                .formularioSolicitud(solicitud)
                .tipoDocumento(tipo)
                .nombreArchivo(doc.getNombreArchivo())
                .urlArchivo(doc.getUrlArchivo())
                .estadoValidacion(doc.getEstadoValidacion())
                .observaciones(doc.getObservaciones())
                .fechaSubida(doc.getFechaSubida() != null ? doc.getFechaSubida() : OffsetDateTime.now())
                .build();

        return PersistenceMapper.toDomain(repository.save(entity));
    }
}
