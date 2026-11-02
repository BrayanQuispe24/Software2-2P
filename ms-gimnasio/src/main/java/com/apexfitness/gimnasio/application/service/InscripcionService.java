package com.apexfitness.gimnasio.application.service;

import com.apexfitness.gimnasio.domain.enums.EstadoInscripcion;
import com.apexfitness.gimnasio.domain.enums.EstadoPago;
import com.apexfitness.gimnasio.domain.enums.EstadoSolicitud;
import com.apexfitness.gimnasio.domain.model.*;
import com.apexfitness.gimnasio.domain.model.dto.ProcesarInscripcionCommand;
import com.apexfitness.gimnasio.domain.ports.in.InscripcionUseCase;
import com.apexfitness.gimnasio.domain.ports.out.*;
import com.apexfitness.gimnasio.domain.strategy.PaymentStrategy;
import com.apexfitness.gimnasio.domain.strategy.PagoContext;
import com.apexfitness.gimnasio.domain.strategy.ResultadoPago;
import com.apexfitness.gimnasio.infrastructure.adapters.out.payment.PaymentStrategyFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InscripcionService implements InscripcionUseCase {

    private final BoletaInscripcionRepositoryPort inscripcionRepository;
    private final BoletaPagoRepositoryPort pagoRepository;
    private final PlanRepositoryPort planRepository;
    private final TarifaRepositoryPort tarifaRepository;
    private final DisciplinaHorarioRepositoryPort disciplinaHorarioRepository;
    private final FormularioSolicitudRepositoryPort solicitudRepository;
    private final PaymentStrategyFactory paymentStrategyFactory;

    @Override
    @Transactional
    public BoletaInscripcion procesarInscripcion(ProcesarInscripcionCommand command) {
        Plan plan = planRepository.findById(command.planId())
                .orElseThrow(() -> new IllegalArgumentException("Plan no encontrado: " + command.planId()));

        Tarifa tarifa = tarifaRepository.findById(command.tarifaId())
                .orElseThrow(() -> new IllegalArgumentException("Tarifa no encontrada: " + command.tarifaId()));

        UUID disciplinaId = command.disciplinaId();
        // Manejo de aforo si se especificó disciplina_horario
        if (command.disciplinaHorarioId() != null) {
            DisciplinaHorario dh = disciplinaHorarioRepository.findById(command.disciplinaHorarioId())
                    .orElseThrow(() -> new IllegalArgumentException("Horario de disciplina no encontrado"));
            if (dh.getCupoDisponible() <= 0) {
                throw new IllegalStateException("El horario seleccionado no cuenta con cupos disponibles");
            }
            if (disciplinaId == null) {
                disciplinaId = dh.getDisciplinaId();
            }
            disciplinaHorarioRepository.decrementarCupo(command.disciplinaHorarioId());
        }

        LocalDate fechaInicio = command.fechaInicio() != null ? command.fechaInicio() : LocalDate.now();
        LocalDate fechaFin = fechaInicio.plusDays(plan.getDuracionDias());

        String codigoMatricula = "MAT-" + LocalDate.now().getYear() + "-" + (System.currentTimeMillis() % 1000000);

        BoletaInscripcion inscripcion = BoletaInscripcion.builder()
                .codigoMatricula(codigoMatricula)
                .clienteId(command.clienteId())
                .planId(plan.getId())
                .disciplinaId(disciplinaId)
                .disciplinaHorarioId(command.disciplinaHorarioId())
                .formularioSolicitudId(command.solicitudId())
                .fechaInicio(fechaInicio)
                .fechaFin(fechaFin)
                .totalSesiones(plan.getSesionesTotales())
                .sesionesConsumidas(0)
                .estado(EstadoInscripcion.ACTIVA)
                .build();

        BoletaInscripcion savedInscripcion = inscripcionRepository.save(inscripcion);

        // Crear Boleta de Pago Inicial
        BigDecimal subtotal = tarifa.getMonto().add(tarifa.getMatriculaInscripcion());
        BigDecimal descuento = command.montoDescuento() != null ? command.montoDescuento() : BigDecimal.ZERO;
        BigDecimal total = subtotal.subtract(descuento);
        if (total.compareTo(BigDecimal.ZERO) < 0) total = BigDecimal.ZERO;

        String numComprobante = "BOL-" + System.currentTimeMillis();

        // Procesar pago mediante la estrategia correspondiente si se proveen datos o se solicita pago inmediato
        boolean intentarPagoInmediato = command.datosEfectivo() != null
                || command.datosQr() != null
                || command.datosStripe() != null
                || (command.codigoTransaccionExterna() != null && !command.codigoTransaccionExterna().isBlank());

        EstadoPago estadoPago = EstadoPago.PENDIENTE;
        String transaccionFinal = command.codigoTransaccionExterna();
        String comprobanteFinal = command.comprobanteUrl();
        OffsetDateTime fechaPagoFinal = null;

        if (intentarPagoInmediato && command.metodoPago() != null) {
            try {
                BigDecimal montoRecibido = command.datosEfectivo() != null ? command.datosEfectivo().montoRecibido() : null;
                String comprobanteUrl = command.datosQr() != null ? command.datosQr().comprobanteUrl() : command.comprobanteUrl();
                String codigoTransaccion = command.datosQr() != null && command.datosQr().codigoTransaccion() != null
                        ? command.datosQr().codigoTransaccion()
                        : command.codigoTransaccionExterna();

                String stripeToken = command.datosStripe() != null ? command.datosStripe().stripePaymentMethodId() : null;
                String numeroTarjeta = command.datosStripe() != null ? command.datosStripe().numeroTarjeta() : null;
                String titular = command.datosStripe() != null ? command.datosStripe().titular() : null;
                String expMes = command.datosStripe() != null ? command.datosStripe().expiracionMes() : null;
                String expAnio = command.datosStripe() != null ? command.datosStripe().expiracionAnio() : null;
                String cvc = command.datosStripe() != null ? command.datosStripe().cvc() : null;

                PagoContext ctx = PagoContext.builder()
                        .boletaPagoId(null)
                        .clienteId(command.clienteId())
                        .montoTotal(total)
                        .metodoPago(command.metodoPago())
                        .montoRecibido(montoRecibido)
                        .comprobanteUrl(comprobanteUrl)
                        .codigoTransaccion(codigoTransaccion)
                        .stripeToken(stripeToken)
                        .numeroTarjeta(numeroTarjeta)
                        .titularTarjeta(titular)
                        .expiracionMes(expMes)
                        .expiracionAnio(expAnio)
                        .cvc(cvc)
                        .build();

                PaymentStrategy strategy = paymentStrategyFactory.getStrategy(command.metodoPago());
                ResultadoPago resultado = strategy.procesar(ctx);

                estadoPago = resultado.estado();
                transaccionFinal = resultado.codigoTransaccion();
                if (resultado.comprobanteUrl() != null) {
                    comprobanteFinal = resultado.comprobanteUrl();
                }
                fechaPagoFinal = resultado.fechaPago();
            } catch (Exception e) {
                log.warn("No se pudo completar el pago inmediato mediante la estrategia {}: {}", command.metodoPago(), e.getMessage());
                throw e; // Lanza para que el usuario reciba la validación (ej. comprobante faltante en QR o monto insuficiente en efectivo)
            }
        }

        BoletaPago pago = BoletaPago.builder()
                .boletaInscripcionId(savedInscripcion.getId())
                .tarifaId(tarifa.getId())
                .numeroComprobante(numComprobante)
                .montoSubtotal(subtotal)
                .montoDescuento(descuento)
                .montoTotal(total)
                .metodoPago(command.metodoPago())
                .estado(estadoPago)
                .codigoTransaccionExterna(transaccionFinal)
                .fechaPago(fechaPagoFinal)
                .comprobanteUrl(comprobanteFinal)
                .build();

        BoletaPago savedPago = pagoRepository.save(pago);
        savedInscripcion.setBoletaPago(savedPago);

        // Si venía de una solicitud, marcarla como aprobada
        if (command.solicitudId() != null) {
            solicitudRepository.findById(command.solicitudId()).ifPresent(sol -> {
                sol.setEstado(EstadoSolicitud.APROBADA);
                solicitudRepository.save(sol);
            });
        }

        return savedInscripcion;
    }

    @Override
    public List<BoletaInscripcion> listarInscripciones(UUID clienteId, EstadoInscripcion estado) {
        return inscripcionRepository.findAll(clienteId, estado);
    }

    @Override
    public Optional<BoletaInscripcion> buscarPorId(UUID id) {
        return inscripcionRepository.findById(id);
    }

    @Override
    public Optional<BoletaInscripcion> obtenerInscripcionActivaCliente(UUID clienteId) {
        return inscripcionRepository.findInscripcionVigenteCliente(clienteId, LocalDate.now());
    }

    @Override
    @Transactional
    public BoletaInscripcion congelarInscripcion(UUID id, String motivo) {
        BoletaInscripcion inscripcion = inscripcionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inscripción no encontrada"));
        inscripcion.setEstado(EstadoInscripcion.CONGELADA);
        return inscripcionRepository.save(inscripcion);
    }

    @Override
    @Transactional
    public BoletaInscripcion reactivarInscripcion(UUID id) {
        BoletaInscripcion inscripcion = inscripcionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inscripción no encontrada"));
        inscripcion.setEstado(EstadoInscripcion.ACTIVA);
        return inscripcionRepository.save(inscripcion);
    }
}
