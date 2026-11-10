package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.dynamodb;

import com.apexfitness.gimnasio.domain.enums.EstadoAcceso;
import com.apexfitness.gimnasio.domain.enums.TipoMovimientoAcceso;
import com.apexfitness.gimnasio.domain.model.RegistroAcceso;
import com.apexfitness.gimnasio.domain.ports.out.RegistroAccesoRepositoryPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "gym.access.storage-driver", havingValue = "dynamodb", matchIfMissing = true)
public class DynamoDbRegistroAccesoAdapter implements RegistroAccesoRepositoryPort {

    private final DynamoDbTable<RegistroAccesoDynamoItem> table;

    @Override
    public List<RegistroAcceso> findAll(UUID clienteId, int limite) {
        int safeLimit = Math.max(1, Math.min(limite, 500));
        List<RegistroAcceso> result = new ArrayList<>();

        try {
            if (clienteId != null) {
                DynamoDbIndex<RegistroAccesoDynamoItem> index = table.index(RegistroAccesoDynamoItem.GSI_CLIENTE_ACCESOS);
                QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                        .queryConditional(QueryConditional.keyEqualTo(
                                Key.builder().partitionValue("CLIENT#" + clienteId).build()
                        ))
                        .scanIndexForward(false)
                        .limit(safeLimit)
                        .build();

                for (var page : index.query(queryRequest)) {
                    for (RegistroAccesoDynamoItem item : page.items()) {
                        result.add(toDomain(item));
                        if (result.size() >= safeLimit) break;
                    }
                    if (result.size() >= safeLimit) break;
                }
            } else {
                DynamoDbIndex<RegistroAccesoDynamoItem> index = table.index(RegistroAccesoDynamoItem.GSI_AUDITORIA_GLOBAL);
                QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                        .queryConditional(QueryConditional.keyEqualTo(
                                Key.builder().partitionValue("AUDITORIA").build()
                        ))
                        .scanIndexForward(false)
                        .limit(safeLimit)
                        .build();

                for (var page : index.query(queryRequest)) {
                    for (RegistroAccesoDynamoItem item : page.items()) {
                        result.add(toDomain(item));
                        if (result.size() >= safeLimit) break;
                    }
                    if (result.size() >= safeLimit) break;
                }
            }
        } catch (Exception e) {
            log.error("[DynamoDB] Error al listar registros de acceso: {}", e.getMessage(), e);
        }

        return result;
    }

    @Override
    public List<RegistroAcceso> findPage(int pagina, int limite) {
        int safeLimit = Math.max(1, Math.min(limite, 500));
        int safePage = Math.max(0, pagina);
        int needed = (safePage + 1) * safeLimit;
        List<RegistroAcceso> items = findAll(null, needed);
        int from = Math.min(safePage * safeLimit, items.size());
        int to = Math.min(from + safeLimit, items.size());
        return new ArrayList<>(items.subList(from, to));
    }

    @Override
    public Optional<RegistroAcceso> findById(UUID id) {
        if (id == null) return Optional.empty();
        try {
            // Buscamos por la clave primaria que inicia con ACCESO#id
            // Como el SortKey incluye el timestamp, realizamos query por prefijo de partición
            DynamoDbIndex<RegistroAccesoDynamoItem> index = table.index(RegistroAccesoDynamoItem.GSI_AUDITORIA_GLOBAL);
            for (var page : index.query(r -> r.limit(100))) {
                for (RegistroAccesoDynamoItem item : page.items()) {
                    if (id.toString().equals(item.getId())) {
                        return Optional.of(toDomain(item));
                    }
                }
            }
        } catch (Exception e) {
            log.error("[DynamoDB] Error al buscar registro por id: {}", e.getMessage());
        }
        return Optional.empty();
    }

    @Override
    public RegistroAcceso save(RegistroAcceso reg) {
        UUID id = reg.getId() != null ? reg.getId() : UUID.randomUUID();
        reg.setId(id);

        OffsetDateTime fechaHora = reg.getFechaHora() != null ? reg.getFechaHora() : OffsetDateTime.now();
        reg.setFechaHora(fechaHora);

        String clienteIdStr = reg.getClienteId() != null ? reg.getClienteId().toString() : "ANONYMOUS";
        String torniquete = reg.getDispositivoTorniquete() != null ? reg.getDispositivoTorniquete() : "TORNIQUETE-01";

        RegistroAccesoDynamoItem item = RegistroAccesoDynamoItem.builder()
                .pk("ACCESO#" + id)
                .sk("TS#" + fechaHora)
                .gsi1Pk("AUDITORIA")
                .gsi1Sk("TS#" + fechaHora)
                .gsiClientPk("CLIENT#" + clienteIdStr)
                .gsiClientSk("TS#" + fechaHora)
                .id(id.toString())
                .clienteId(clienteIdStr)
                .boletaInscripcionId(reg.getBoletaInscripcionId() != null ? reg.getBoletaInscripcionId().toString() : null)
                .tipoMovimiento(reg.getTipoMovimiento() != null ? reg.getTipoMovimiento().name() : TipoMovimientoAcceso.ENTRADA.name())
                .estadoAcceso(reg.getEstadoAcceso() != null ? reg.getEstadoAcceso().name() : EstadoAcceso.PERMITIDO.name())
                .fechaHora(fechaHora.toString())
                .dispositivoTorniquete(torniquete)
                .motivoDenegacion(reg.getMotivoDenegacion())
                .epochTimestamp(fechaHora.toInstant().toEpochMilli())
                .ttl(fechaHora.plusDays(90).toEpochSecond())
                .build();

        try {
            table.putItem(item);
            log.info("⚡ [DynamoDB] Evento de acceso guardado: ID={}, Cliente={}, Tipo={}, Estado={}",
                    id, clienteIdStr, item.getTipoMovimiento(), item.getEstadoAcceso());
        } catch (Exception e) {
            log.error("❌ [DynamoDB] Error al persistir acceso en DynamoDB: {}", e.getMessage(), e);
            throw new RuntimeException("Fallo al persistir acceso en DynamoDB: " + e.getMessage(), e);
        }

        return reg;
    }

    @Override
    public boolean existeEntradaPermitidaReciente(UUID clienteId, OffsetDateTime desde) {
        if (clienteId == null) return false;

        try {
            DynamoDbIndex<RegistroAccesoDynamoItem> index = table.index(RegistroAccesoDynamoItem.GSI_CLIENTE_ACCESOS);
            QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                    .queryConditional(QueryConditional.keyEqualTo(
                            Key.builder().partitionValue("CLIENT#" + clienteId).build()
                    ))
                    .scanIndexForward(false)
                    .limit(5)
                    .build();

            for (var page : index.query(queryRequest)) {
                for (RegistroAccesoDynamoItem item : page.items()) {
                    if (EstadoAcceso.PERMITIDO.name().equals(item.getEstadoAcceso())) {
                        if (TipoMovimientoAcceso.ENTRADA.name().equals(item.getTipoMovimiento())) {
                            OffsetDateTime fechaItem = OffsetDateTime.parse(item.getFechaHora());
                            return fechaItem.isAfter(desde) || fechaItem.isEqual(desde);
                        } else {
                            // Si el último movimiento permitido fue SALIDA, se permite volver a entrar
                            return false;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[DynamoDB] Error verificando anti-passback en DynamoDB: {}", e.getMessage());
        }

        return false;
    }

    private RegistroAcceso toDomain(RegistroAccesoDynamoItem item) {
        UUID id = null;
        try {
            id = UUID.fromString(item.getId());
        } catch (Exception ignored) {}

        UUID clienteId = null;
        try {
            if (item.getClienteId() != null && !item.getClienteId().equals("ANONYMOUS")) {
                clienteId = UUID.fromString(item.getClienteId());
            }
        } catch (Exception ignored) {}

        UUID boletaId = null;
        try {
            if (item.getBoletaInscripcionId() != null) {
                boletaId = UUID.fromString(item.getBoletaInscripcionId());
            }
        } catch (Exception ignored) {}

        OffsetDateTime fechaHora = null;
        try {
            fechaHora = OffsetDateTime.parse(item.getFechaHora());
        } catch (Exception e) {
            fechaHora = OffsetDateTime.now();
        }

        TipoMovimientoAcceso mov = TipoMovimientoAcceso.ENTRADA;
        try {
            if (item.getTipoMovimiento() != null) {
                mov = TipoMovimientoAcceso.valueOf(item.getTipoMovimiento());
            }
        } catch (Exception ignored) {}

        EstadoAcceso estado = EstadoAcceso.PERMITIDO;
        try {
            if (item.getEstadoAcceso() != null) {
                estado = EstadoAcceso.valueOf(item.getEstadoAcceso());
            }
        } catch (Exception ignored) {}

        return RegistroAcceso.builder()
                .id(id)
                .clienteId(clienteId)
                .boletaInscripcionId(boletaId)
                .tipoMovimiento(mov)
                .estadoAcceso(estado)
                .fechaHora(fechaHora)
                .dispositivoTorniquete(item.getDispositivoTorniquete())
                .motivoDenegacion(item.getMotivoDenegacion())
                .createdAt(fechaHora)
                .build();
    }
}

