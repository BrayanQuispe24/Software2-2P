package com.apexfitness.gimnasio.infrastructure.adapters.out.persistence.dynamodb;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.model.CreateTableEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.model.EnhancedGlobalSecondaryIndex;
import software.amazon.awssdk.services.dynamodb.model.ProjectionType;
import software.amazon.awssdk.services.dynamodb.model.ResourceInUseException;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "gym.access.storage-driver", havingValue = "dynamodb", matchIfMissing = true)
public class DynamoDbTableInitializer implements CommandLineRunner {

    private final DynamoDbTable<RegistroAccesoDynamoItem> table;

    @Override
    public void run(String... args) {
        log.info("[DynamoDB] Inicializando y verificando esquema de la tabla de accesos...");
        try {
            CreateTableEnhancedRequest request = CreateTableEnhancedRequest.builder()
                    .globalSecondaryIndices(
                            EnhancedGlobalSecondaryIndex.builder()
                                    .indexName(RegistroAccesoDynamoItem.GSI_AUDITORIA_GLOBAL)
                                    .projection(p -> p.projectionType(ProjectionType.ALL))
                                    .build(),
                            EnhancedGlobalSecondaryIndex.builder()
                                    .indexName(RegistroAccesoDynamoItem.GSI_CLIENTE_ACCESOS)
                                    .projection(p -> p.projectionType(ProjectionType.ALL))
                                    .build()
                    )
                    .build();

            table.createTable(request);
            log.info("✅ [DynamoDB] Tabla '{}' creada exitosamente con sus índices secundarios.", table.tableName());
        } catch (ResourceInUseException e) {
            log.info("ℹ️ [DynamoDB] La tabla '{}' ya existe y está disponible.", table.tableName());
        } catch (Exception e) {
            log.warn("⚠️ [DynamoDB] No se pudo crear/verificar la tabla '{}' en el arranque: {}", table.tableName(), e.getMessage());
        }
    }
}

