package com.apexfitness.gimnasio.application.service;

import com.apexfitness.gimnasio.domain.model.BoletaInscripcion;
import com.apexfitness.gimnasio.domain.model.dto.QrPayloadDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class QrCryptoService {

    private final String secretKey;
    private final ObjectMapper objectMapper;

    public QrCryptoService(@Value("${gym.security.qr-secret:ApexFitnessGymSecureQrHmacKey2026!}") String secretKey) {
        this.secretKey = secretKey;
        this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    /**
     * Genera un payload de código QR firmado digitalmente con HMAC-SHA256.
     * El resultado se codifica en Base64 URL-safe para máxima eficiencia y nitidez en escaneos ópticos.
     */
    public String generarPayloadQr(BoletaInscripcion inscripcion) {
        try {
            long epochNow = Instant.now().getEpochSecond();
            String datosCanonicos = construirCadenaCanonica(
                    inscripcion.getId().toString(),
                    inscripcion.getClienteId().toString(),
                    inscripcion.getCodigoMatricula(),
                    inscripcion.getFechaFin().toString(),
                    epochNow
            );

            String firma = calcularHmacSha256(datosCanonicos);

            QrPayloadDto dto = QrPayloadDto.builder()
                    .inscripcionId(inscripcion.getId())
                    .clienteId(inscripcion.getClienteId())
                    .codigoMatricula(inscripcion.getCodigoMatricula())
                    .fechaFin(inscripcion.getFechaFin())
                    .emitidoEnEpoch(epochNow)
                    .firmaHmac(firma)
                    .build();

            String json = objectMapper.writeValueAsString(dto);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Error al generar payload criptográfico del QR", e);
        }
    }

    /**
     * Valida la autenticidad del código QR contra ataques de adulteración y clústeres no autorizados.
     * Retorna el payload decodificado si la firma HMAC-SHA256 es auténtica.
     */
    public QrPayloadDto validarYExtraerPayload(String qrRaw) {
        try {
            String json;
            String trimmed = qrRaw.trim();
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                json = trimmed;
            } else {
                byte[] decoded = Base64.getUrlDecoder().decode(trimmed);
                json = new String(decoded, StandardCharsets.UTF_8);
            }

            QrPayloadDto dto = objectMapper.readValue(json, QrPayloadDto.class);

            if (dto.inscripcionId() == null || dto.clienteId() == null || dto.firmaHmac() == null) {
                throw new SecurityException("Formato de payload QR incompleto o inválido");
            }

            String datosCanonicos = construirCadenaCanonica(
                    dto.inscripcionId().toString(),
                    dto.clienteId().toString(),
                    dto.codigoMatricula() != null ? dto.codigoMatricula() : "",
                    dto.fechaFin() != null ? dto.fechaFin().toString() : "",
                    dto.emitidoEnEpoch()
            );

            String firmaCalculada = calcularHmacSha256(datosCanonicos);

            // Comparación en tiempo constante (protección contra timing attacks)
            boolean esValida = MessageDigest.isEqual(
                    firmaCalculada.getBytes(StandardCharsets.UTF_8),
                    dto.firmaHmac().getBytes(StandardCharsets.UTF_8)
            );

            if (!esValida) {
                throw new SecurityException("Firma criptográfica inválida: código QR no auténtico o modificado");
            }

            return dto;
        } catch (SecurityException se) {
            throw se;
        } catch (Exception e) {
            throw new SecurityException("Error al decodificar código QR: " + e.getMessage(), e);
        }
    }

    private String construirCadenaCanonica(String inscripcionId, String clienteId, String matricula, String fechaFin, long epoch) {
        return inscripcionId + "|" + clienteId + "|" + matricula + "|" + fechaFin + "|" + epoch;
    }

    private String calcularHmacSha256(String data) throws Exception {
        Mac hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        hmac.init(secretKeySpec);
        byte[] hash = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
