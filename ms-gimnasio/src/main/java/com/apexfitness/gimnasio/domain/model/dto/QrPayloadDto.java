package com.apexfitness.gimnasio.domain.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.time.LocalDate;
import java.util.UUID;

@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public record QrPayloadDto(
        @JsonAlias({"inscripcionId", "ins"})
        @JsonProperty("ins") UUID inscripcionId,

        @JsonAlias({"clienteId", "cli"})
        @JsonProperty("cli") UUID clienteId,

        @JsonAlias({"codigoMatricula", "mat"})
        @JsonProperty("mat") String codigoMatricula,

        @JsonAlias({"fechaFin", "exp"})
        @JsonProperty("exp") LocalDate fechaFin,

        @JsonAlias({"emitidoEnEpoch", "iat"})
        @JsonProperty("iat") long emitidoEnEpoch,

        @JsonAlias({"firmaHmac", "sig"})
        @JsonProperty("sig") String firmaHmac
) {}
