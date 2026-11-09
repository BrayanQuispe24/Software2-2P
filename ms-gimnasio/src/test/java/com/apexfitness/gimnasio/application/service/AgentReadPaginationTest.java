package com.apexfitness.gimnasio.application.service;

import com.apexfitness.gimnasio.domain.model.BoletaInscripcion;
import com.apexfitness.gimnasio.domain.model.RegistroAcceso;
import com.apexfitness.gimnasio.domain.ports.out.*;
import com.apexfitness.gimnasio.infrastructure.adapters.out.payment.PaymentStrategyFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AgentReadPaginationTest {
    private final RegistroAccesoRepositoryPort accesses = mock(RegistroAccesoRepositoryPort.class);
    private final BoletaInscripcionRepositoryPort enrollments = mock(BoletaInscripcionRepositoryPort.class);
    private final ControlAccesoService accessService = new ControlAccesoService(enrollments, mock(PlanRepositoryPort.class), accesses, mock(QrCryptoService.class), 10);
    private final InscripcionService enrollmentService = new InscripcionService(enrollments, mock(BoletaPagoRepositoryPort.class),
            mock(PlanRepositoryPort.class), mock(TarifaRepositoryPort.class), mock(DisciplinaHorarioRepositoryPort.class),
            mock(FormularioSolicitudRepositoryPort.class), mock(PaymentStrategyFactory.class));

    @Test
    void returnsRequestedAccessPageWithoutOldHundredRowLimit() {
        var row = RegistroAcceso.builder().id(UUID.randomUUID()).build();
        when(accesses.findPage(1, 500)).thenReturn(List.of(row));
        assertEquals(List.of(row), accessService.listarRegistrosPagina(1, 500));
        verify(accesses).findPage(1, 500);
        verify(accesses, never()).findAll(any(), anyInt());
    }

    @Test
    void preservesRegistrationDateOnEnrollmentPages() {
        var date = java.time.OffsetDateTime.now().minusDays(8);
        var row = BoletaInscripcion.builder().id(UUID.randomUUID()).createdAt(date).build();
        when(enrollments.findPage(2, 500)).thenReturn(List.of(row));
        assertEquals(date, enrollmentService.listarInscripcionesPagina(2, 500).get(0).getCreatedAt());
        verify(enrollments).findPage(2, 500);
    }

    @ParameterizedTest
    @CsvSource({"-1,500", "0,0", "0,501"})
    void rejectsInvalidPaginationBeforeQueryingDatabase(int page, int limit) {
        assertThrows(IllegalArgumentException.class, () -> accessService.listarRegistrosPagina(page, limit));
        assertThrows(IllegalArgumentException.class, () -> enrollmentService.listarInscripcionesPagina(page, limit));
        verifyNoInteractions(accesses, enrollments);
    }
}
