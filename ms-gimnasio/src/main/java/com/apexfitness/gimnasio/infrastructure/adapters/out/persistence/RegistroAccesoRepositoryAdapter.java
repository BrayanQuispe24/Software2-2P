package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence;

import com.apexfitness.gimnasio.domain.model.RegistroAcceso;
import com.apexfitness.gimnasio.domain.ports.out.RegistroAccesoRepositoryPort;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.BoletaInscripcionEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.entity.RegistroAccesoEntity;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.mapper.PersistenceMapper;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataBoletaInscripcionRepository;
import com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.repository.SpringDataRegistroAccesoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RegistroAccesoRepositoryAdapter implements RegistroAccesoRepositoryPort {

    private final SpringDataRegistroAccesoRepository repository;
    private final SpringDataBoletaInscripcionRepository inscripcionRepository;

    @Override
    public List<RegistroAcceso> findPage(int pagina, int limite) {
        return repository.findByFilter(null, PageRequest.of(pagina, limite)).stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<RegistroAcceso> findAll(UUID clienteId, int limite) {
        return repository.findByFilter(clienteId, PageRequest.of(0, limite)).stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<RegistroAcceso> findById(UUID id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public RegistroAcceso save(RegistroAcceso reg) {
        BoletaInscripcionEntity inscripcion = reg.getBoletaInscripcionId() != null
                ? inscripcionRepository.findById(reg.getBoletaInscripcionId()).orElse(null)
                : null;

        RegistroAccesoEntity entity = RegistroAccesoEntity.builder()
                .id(reg.getId())
                .clienteId(reg.getClienteId())
                .boletaInscripcion(inscripcion)
                .tipoMovimiento(reg.getTipoMovimiento())
                .estadoAcceso(reg.getEstadoAcceso())
                .fechaHora(reg.getFechaHora() != null ? reg.getFechaHora() : OffsetDateTime.now())
                .dispositivoTorniquete(reg.getDispositivoTorniquete() != null ? reg.getDispositivoTorniquete() : "TORNIQUETE-01")
                .motivoDenegacion(reg.getMotivoDenegacion())
                .build();

        return PersistenceMapper.toDomain(repository.save(entity));
    }

    @Override
    public boolean existeEntradaPermitidaReciente(UUID clienteId, OffsetDateTime desde) {
        List<RegistroAccesoEntity> ultimos = repository.findUltimoAccesoPorEstado(
                clienteId,
                com.apexfitness.gimnasio.domain.enums.EstadoAcceso.PERMITIDO,
                org.springframework.data.domain.PageRequest.of(0, 1)
        );
        if (ultimos == null || ultimos.isEmpty()) {
            return false;
        }
        RegistroAccesoEntity ultimo = ultimos.get(0);
        // Si el último movimiento permitido fue ENTRADA y ocurrió después de 'desde' (dentro del lapso anti-passback),
        // el socio todavía está adentro y no puede volver a registrar ENTRADA.
        // Si el último movimiento fue SALIDA, ya egresó legítimamente y sí puede volver a ingresar.
        return ultimo.getTipoMovimiento() == com.apexfitness.gimnasio.domain.enums.TipoMovimientoAcceso.ENTRADA
                && (ultimo.getFechaHora() == null || !ultimo.getFechaHora().isBefore(desde));
    }
}
