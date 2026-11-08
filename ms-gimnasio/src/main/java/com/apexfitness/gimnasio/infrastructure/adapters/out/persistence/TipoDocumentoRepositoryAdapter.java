package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.model.TipoDocumento;
import com.apexfitness.gimnasio.domain.ports.out.TipoDocumentoRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.TipoDocumentoEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataTipoDocumentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TipoDocumentoRepositoryAdapter implements TipoDocumentoRepositoryPort {

    private final SpringDataTipoDocumentoRepository repository;

    @Override
    public List<TipoDocumento> findAll() {
        return repository.findByActivoTrue().stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<TipoDocumento> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<TipoDocumento> findByCodigo(String codigo) {
        return repository.findByCodigo(codigo).map(PersistenceMapper::toDomain);
    }

    @Override
    public TipoDocumento save(TipoDocumento tipoDocumento) {
        TipoDocumentoEntity entity = TipoDocumentoEntity.builder()
                .id(tipoDocumento.getId())
                .codigo(tipoDocumento.getCodigo())
                .nombre(tipoDocumento.getNombre())
                .descripcion(tipoDocumento.getDescripcion())
                .obligatorio(tipoDocumento.getObligatorio() != null ? tipoDocumento.getObligatorio() : true)
                .activo(tipoDocumento.getActivo() != null ? tipoDocumento.getActivo() : true)
                .build();
        return PersistenceMapper.toDomain(repository.save(entity));
    }
}
