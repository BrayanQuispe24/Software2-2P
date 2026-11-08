package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.model.BoletaPago;
import com.apexfitness.gimnasio.domain.ports.out.BoletaPagoRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.BoletaInscripcionEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.BoletaPagoEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.TarifaEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataBoletaInscripcionRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataBoletaPagoRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataTarifaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BoletaPagoRepositoryAdapter implements BoletaPagoRepositoryPort {

    private final SpringDataBoletaPagoRepository repository;
    private final SpringDataBoletaInscripcionRepository inscripcionRepository;
    private final SpringDataTarifaRepository tarifaRepository;

    @Override
    public Optional<BoletaPago> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<BoletaPago> findByBoletaInscripcionId(UUID boletaInscripcionId) {
        return repository.findByBoletaInscripcionId(boletaInscripcionId).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<BoletaPago> findByNumeroComprobante(String numeroComprobante) {
        return repository.findByNumeroComprobante(numeroComprobante).map(PersistenceMapper::toDomain);
    }

    @Override
    public List<BoletaPago> findByClienteId(UUID clienteId) {
        return repository.findByClienteId(clienteId).stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public BoletaPago save(BoletaPago pago) {
        BoletaInscripcionEntity inscripcion = pago.getBoletaInscripcionId() != null
                ? inscripcionRepository.findById(pago.getBoletaInscripcionId()).orElse(null)
                : null;
        TarifaEntity tarifa = pago.getTarifaId() != null
                ? tarifaRepository.findById(pago.getTarifaId()).orElse(null)
                : null;

        BoletaPagoEntity entity = BoletaPagoEntity.builder()
                .id(pago.getId())
                .boletaInscripcion(inscripcion)
                .tarifa(tarifa)
                .numeroComprobante(pago.getNumeroComprobante())
                .montoSubtotal(pago.getMontoSubtotal())
                .montoDescuento(pago.getMontoDescuento())
                .montoTotal(pago.getMontoTotal())
                .metodoPago(pago.getMetodoPago())
                .estado(pago.getEstado())
                .codigoTransaccionExterna(pago.getCodigoTransaccionExterna())
                .fechaPago(pago.getFechaPago())
                .comprobanteUrl(pago.getComprobanteUrl())
                .build();

        return PersistenceMapper.toDomain(repository.save(entity));
    }
}
