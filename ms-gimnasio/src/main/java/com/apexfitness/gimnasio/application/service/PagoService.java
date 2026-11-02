package com.apexfitness.gimnasio.application.service;

import com.apexfitness.gimnasio.domain.enums.EstadoPago;
import com.apexfitness.gimnasio.domain.enums.MetodoPago;
import com.apexfitness.gimnasio.domain.model.BoletaPago;
import com.apexfitness.gimnasio.domain.model.dto.ConfirmarPagoCommand;
import com.apexfitness.gimnasio.domain.ports.in.PagoUseCase;
import com.apexfitness.gimnasio.domain.ports.out.BoletaPagoRepositoryPort;
import com.apexfitness.gimnasio.domain.strategy.PaymentStrategy;
import com.apexfitness.gimnasio.domain.strategy.PagoContext;
import com.apexfitness.gimnasio.domain.strategy.ResultadoPago;
import com.apexfitness.gimnasio.infrastructure.adapters.out.payment.PaymentStrategyFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PagoService implements PagoUseCase {

    private final BoletaPagoRepositoryPort pagoRepository;
    private final PaymentStrategyFactory paymentStrategyFactory;

    @Override
    @Transactional
    public BoletaPago confirmarPago(ConfirmarPagoCommand command) {
        BoletaPago pago = pagoRepository.findById(command.boletaPagoId())
                .orElseThrow(() -> new IllegalArgumentException("Boleta de pago no encontrada: " + command.boletaPagoId()));

        MetodoPago metodoPago = command.metodoPago() != null ? command.metodoPago() : pago.getMetodoPago();

        // Extraer valores según inputs de estrategia o campos directos
        BigDecimal montoRecibido = null;
        if (command.datosEfectivo() != null) {
            montoRecibido = command.datosEfectivo().montoRecibido();
        }

        String comprobanteUrl = command.comprobanteUrl();
        String codigoTransaccion = command.codigoTransaccionExterna();
        if (command.datosQr() != null) {
            if (command.datosQr().comprobanteUrl() != null) {
                comprobanteUrl = command.datosQr().comprobanteUrl();
            }
            if (command.datosQr().codigoTransaccion() != null) {
                codigoTransaccion = command.datosQr().codigoTransaccion();
            }
        }

        String stripeToken = null;
        String numeroTarjeta = null;
        String titular = null;
        String expMes = null;
        String expAnio = null;
        String cvc = null;
        if (command.datosStripe() != null) {
            stripeToken = command.datosStripe().stripePaymentMethodId();
            numeroTarjeta = command.datosStripe().numeroTarjeta();
            titular = command.datosStripe().titular();
            expMes = command.datosStripe().expiracionMes();
            expAnio = command.datosStripe().expiracionAnio();
            cvc = command.datosStripe().cvc();
        }

        PagoContext context = PagoContext.builder()
                .boletaPagoId(pago.getId())
                .montoTotal(pago.getMontoTotal())
                .metodoPago(metodoPago)
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

        PaymentStrategy strategy = paymentStrategyFactory.getStrategy(metodoPago);
        ResultadoPago resultado = strategy.procesar(context);

        pago.setMetodoPago(metodoPago);
        pago.setEstado(resultado.estado());
        pago.setCodigoTransaccionExterna(resultado.codigoTransaccion());
        if (resultado.comprobanteUrl() != null) {
            pago.setComprobanteUrl(resultado.comprobanteUrl());
        }
        pago.setFechaPago(resultado.fechaPago());

        return pagoRepository.save(pago);
    }

    @Override
    public Optional<BoletaPago> buscarPorId(UUID id) {
        return pagoRepository.findById(id);
    }

    @Override
    public Optional<BoletaPago> buscarPorInscripcionId(UUID boletaInscripcionId) {
        return pagoRepository.findByBoletaInscripcionId(boletaInscripcionId);
    }

    @Override
    public List<BoletaPago> listarPagosPorCliente(UUID clienteId) {
        return pagoRepository.findByClienteId(clienteId);
    }
}
