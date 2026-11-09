package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Setter;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class RegistroAccesoDynamoItem {

    public static final String GSI_AUDITORIA_GLOBAL = "GSI_AuditoriaGlobal";
    public static final String GSI_CLIENTE_ACCESOS = "GSI_ClienteAccesos";

    private String pk;
    private String sk;

    private String gsi1Pk;
    private String gsi1Sk;

    private String gsiClientPk;
    private String gsiClientSk;

    private String id;
    private String clienteId;
    private String boletaInscripcionId;
    private String tipoMovimiento;
    private String estadoAcceso;
    private String fechaHora;
    private String dispositivoTorniquete;
    private String motivoDenegacion;
    private Long epochTimestamp;
    private Long ttl;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("pk")
    public String getPk() {
        return pk;
    }

    @DynamoDbSortKey
    @DynamoDbAttribute("sk")
    public String getSk() {
        return sk;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = GSI_AUDITORIA_GLOBAL)
    @DynamoDbAttribute("gsi1_pk")
    public String getGsi1Pk() {
        return gsi1Pk;
    }

    @DynamoDbSecondarySortKey(indexNames = GSI_AUDITORIA_GLOBAL)
    @DynamoDbAttribute("gsi1_sk")
    public String getGsi1Sk() {
        return gsi1Sk;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = GSI_CLIENTE_ACCESOS)
    @DynamoDbAttribute("gsi_client_pk")
    public String getGsiClientPk() {
        return gsiClientPk;
    }

    @DynamoDbSecondarySortKey(indexNames = GSI_CLIENTE_ACCESOS)
    @DynamoDbAttribute("gsi_client_sk")
    public String getGsiClientSk() {
        return gsiClientSk;
    }

    @DynamoDbAttribute("id")
    public String getId() {
        return id;
    }

    @DynamoDbAttribute("cliente_id")
    public String getClienteId() {
        return clienteId;
    }

    @DynamoDbAttribute("boleta_inscripcion_id")
    public String getBoletaInscripcionId() {
        return boletaInscripcionId;
    }

    @DynamoDbAttribute("tipo_movimiento")
    public String getTipoMovimiento() {
        return tipoMovimiento;
    }

    @DynamoDbAttribute("estado_acceso")
    public String getEstadoAcceso() {
        return estadoAcceso;
    }

    @DynamoDbAttribute("fecha_hora")
    public String getFechaHora() {
        return fechaHora;
    }

    @DynamoDbAttribute("dispositivo_torniquete")
    public String getDispositivoTorniquete() {
        return dispositivoTorniquete;
    }

    @DynamoDbAttribute("motivo_denegacion")
    public String getMotivoDenegacion() {
        return motivoDenegacion;
    }

    @DynamoDbAttribute("epoch_timestamp")
    public Long getEpochTimestamp() {
        return epochTimestamp;
    }

    @DynamoDbAttribute("ttl")
    public Long getTtl() {
        return ttl;
    }
}

