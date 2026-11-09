package com.apexfitness.gimnasio.infrastructure.adapters.in.graphql;

import com.apexfitness.gimnasio.domain.enums.EstadoInscripcion;
import com.apexfitness.gimnasio.domain.model.BoletaInscripcion;
import com.apexfitness.gimnasio.domain.model.BoletaPago;
import com.apexfitness.gimnasio.domain.model.dto.ConfirmarPagoCommand;
import com.apexfitness.gimnasio.domain.model.dto.ProcesarInscripcionCommand;
import com.apexfitness.gimnasio.domain.ports.in.InscripcionUseCase;
import com.apexfitness.gimnasio.domain.ports.in.PagoUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import com.apexfitness.gimnasio.domain.model.Disciplina;
import com.apexfitness.gimnasio.domain.ports.in.CatalogoUseCase;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class InscripcionGraphQLController {

    private final InscripcionUseCase inscripcionUseCase;
    private final PagoUseCase pagoUseCase;
    private final CatalogoUseCase catalogoUseCase;

    @QueryMapping
    public List<BoletaInscripcion> inscripcionesPagina(@Argument Integer pagina, @Argument Integer limite) {
        return inscripcionUseCase.listarInscripcionesPagina(pagina != null ? pagina : 0, limite != null ? limite : 500);
    }

    @QueryMapping
    public List<BoletaInscripcion> inscripciones(@Argument UUID clienteId, @Argument EstadoInscripcion estado) {
        return inscripcionUseCase.listarInscripciones(clienteId, estado);
    }

    @QueryMapping
    public BoletaInscripcion inscripcion(@Argument UUID id) {
        return inscripcionUseCase.buscarPorId(id).orElse(null);
    }

    @QueryMapping
    public BoletaInscripcion inscripcionActivaCliente(@Argument UUID clienteId) {
        return inscripcionUseCase.obtenerInscripcionActivaCliente(clienteId).orElse(null);
    }

    @QueryMapping
    public BoletaPago boletaPago(@Argument UUID id) {
        return pagoUseCase.buscarPorId(id).orElse(null);
    }

    @QueryMapping
    public List<BoletaPago> pagosPorCliente(@Argument UUID clienteId) {
        return pagoUseCase.listarPagosPorCliente(clienteId);
    }

    @MutationMapping
    public BoletaInscripcion procesarInscripcion(@Argument ProcesarInscripcionCommand input) {
        return inscripcionUseCase.procesarInscripcion(input);
    }

    @MutationMapping
    public BoletaPago confirmarPago(@Argument ConfirmarPagoCommand input) {
        return pagoUseCase.confirmarPago(input);
    }

    @MutationMapping
    public BoletaInscripcion congelarInscripcion(@Argument UUID id, @Argument String motivo) {
        return inscripcionUseCase.congelarInscripcion(id, motivo);
    }

    @MutationMapping
    public BoletaInscripcion reactivarInscripcion(@Argument UUID id) {
        return inscripcionUseCase.reactivarInscripcion(id);
    }

    @BatchMapping(typeName = "BoletaInscripcion", field = "boletaPago")
    public Map<BoletaInscripcion, BoletaPago> boletaPago(List<BoletaInscripcion> inscripciones) {
        Map<BoletaInscripcion, BoletaPago> result = new HashMap<>();
        for (BoletaInscripcion bi : inscripciones) {
            BoletaPago pago = pagoUseCase.buscarPorInscripcionId(bi.getId()).orElse(null);
            result.put(bi, pago);
        }
        return result;
    }

    @BatchMapping(typeName = "BoletaInscripcion", field = "disciplina")
    public Map<BoletaInscripcion, Disciplina> disciplina(List<BoletaInscripcion> inscripciones) {
        Map<BoletaInscripcion, Disciplina> result = new HashMap<>();
        for (BoletaInscripcion bi : inscripciones) {
            Disciplina d = bi.getDisciplina();
            if (d == null && bi.getDisciplinaId() != null) {
                d = catalogoUseCase.buscarDisciplinaPorId(bi.getDisciplinaId()).orElse(null);
            }
            result.put(bi, d);
        }
        return result;
    }
}
