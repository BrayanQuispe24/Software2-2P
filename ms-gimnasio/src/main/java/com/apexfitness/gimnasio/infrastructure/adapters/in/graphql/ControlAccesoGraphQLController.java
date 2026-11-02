package com.apexfitness.gimnasio.infrastructure.adapters.in.graphql;

import com.apexfitness.gimnasio.domain.model.RegistroAcceso;
import com.apexfitness.gimnasio.domain.model.ValidacionAccesoPayload;
import com.apexfitness.gimnasio.domain.model.dto.ValidarAccesoCommand;
import com.apexfitness.gimnasio.domain.ports.in.ControlAccesoUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ControlAccesoGraphQLController {

    private final ControlAccesoUseCase controlAccesoUseCase;

    @QueryMapping
    public List<RegistroAcceso> registrosAcceso(@Argument UUID clienteId, @Argument Integer limite) {
        return controlAccesoUseCase.listarRegistros(clienteId, limite != null ? limite : 50);
    }

    @QueryMapping
    public String obtenerQrPaseDigital(@Argument UUID inscripcionId) {
        return controlAccesoUseCase.generarQrPaseDigital(inscripcionId);
    }

    @MutationMapping
    public ValidacionAccesoPayload validarAccesoTorniquete(@Argument ValidarAccesoCommand input) {
        return controlAccesoUseCase.validarAcceso(input);
    }

    @MutationMapping
    public ValidacionAccesoPayload validarAccesoPorQr(@Argument com.apexfitness.gimnasio.domain.model.dto.ValidarAccesoQrCommand input) {
        return controlAccesoUseCase.validarAccesoPorQr(input);
    }
}
