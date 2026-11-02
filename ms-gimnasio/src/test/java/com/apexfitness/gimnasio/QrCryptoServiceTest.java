package com.apexfitness.gimnasio;

import com.apexfitness.gimnasio.application.service.QrCryptoService;
import com.apexfitness.gimnasio.domain.model.dto.QrPayloadDto;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class QrCryptoServiceTest {

    @Test
    void testValidarPayloadReal() {
        QrCryptoService service = new QrCryptoService("ApexFitnessGymSecureQrHmacKey2026!");
        String raw = "eyJpbnMiOiIzNGZkNjI1Ni00Y2YzLTQwNzktYTZjNy0yOWQwZTZjNWQ5NjIiLCJjbGkiOiJjMjAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJtYXQiOiJNQVQtMjAyNi0xOTQ3MzgiLCJleHAiOlsyMDI2LDExLDI1XSwiaWF0IjoxNzkzMTE2MTA1LCJzaWciOiI4M2I5MDlmMjkzZWI5NTFmMTM3OTU0NzFkNjkyODJmMDUwMzQ2NmI4NGZlYzgwNTM5MGVlMDY3NTZiZGY3NDYxIn0";
        QrPayloadDto dto = service.validarYExtraerPayload(raw);
        System.out.println("DTO RESULTADO: " + dto);
        assertNotNull(dto);
    }
}
