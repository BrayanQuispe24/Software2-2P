package com.apexfitness.gimnasio.application.service;

import com.apexfitness.gimnasio.domain.enums.EstadoAcceso;
import com.apexfitness.gimnasio.domain.enums.EstadoInscripcion;
import com.apexfitness.gimnasio.domain.enums.TipoMovimientoAcceso;
import com.apexfitness.gimnasio.domain.model.BoletaInscripcion;
import com.apexfitness.gimnasio.domain.model.Plan;
import com.apexfitness.gimnasio.domain.model.RegistroAcceso;
import com.apexfitness.gimnasio.domain.model.ValidacionAccesoPayload;
import com.apexfitness.gimnasio.domain.model.dto.ValidarAccesoCommand;
import com.apexfitness.gimnasio.domain.ports.in.ControlAccesoUseCase;
import com.apexfitness.gimnasio.domain.ports.out.BoletaInscripcionRepositoryPort;
import com.apexfitness.gimnasio.domain.ports.out.PlanRepositoryPort;
import com.apexfitness.gimnasio.domain.ports.out.RegistroAccesoRepositoryPort;
import lombok.RequiredArgsConstructor;
import com.apexfitness.gimnasio.domain.model.dto.QrPayloadDto;
import com.apexfitness.gimnasio.domain.model.dto.ValidarAccesoQrCommand;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ControlAccesoService implements ControlAccesoUseCase {

    private static final UUID ANONYMOUS_CLIENTE_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private final BoletaInscripcionRepositoryPort inscripcionRepository;
    private final PlanRepositoryPort planRepository;
    private final RegistroAccesoRepositoryPort registroAccesoRepository;
    private final QrCryptoService qrCryptoService;
    private final int antiPassbackMinutes;

    public ControlAccesoService(
            BoletaInscripcionRepositoryPort inscripcionRepository,
            PlanRepositoryPort planRepository,
            RegistroAccesoRepositoryPort registroAccesoRepository,
            QrCryptoService qrCryptoService,
            @Value("${gym.security.anti-passback-minutes:10}") int antiPassbackMinutes) {
        this.inscripcionRepository = inscripcionRepository;
        this.planRepository = planRepository;
        this.registroAccesoRepository = registroAccesoRepository;
        this.qrCryptoService = qrCryptoService;
        this.antiPassbackMinutes = antiPassbackMinutes;
    }

    @Override
    @Transactional
    public ValidacionAccesoPayload validarAcceso(ValidarAccesoCommand command) {
        LocalDate hoy = LocalDate.now();
        TipoMovimientoAcceso movimiento = command.tipoMovimiento() != null ? command.tipoMovimiento() : TipoMovimientoAcceso.ENTRADA;
        String torniquete = command.dispositivoTorniquete() != null ? command.dispositivoTorniquete() : "TORNIQUETE-01";

        // Regla Anti-Passback: bloquear ingresos sucesivos en menos del tiempo configurado
        if (movimiento == TipoMovimientoAcceso.ENTRADA && antiPassbackMinutes > 0) {
            OffsetDateTime desde = OffsetDateTime.now().minusMinutes(antiPassbackMinutes);
            if (registroAccesoRepository.existeEntradaPermitidaReciente(command.clienteId(), desde)) {
                String motivo = "Anti-Passback: Ya registraste un ingreso en menos de " + antiPassbackMinutes + " minutos";
                RegistroAcceso denegado = registrarIntento(command.clienteId(), null, movimiento, EstadoAcceso.DENEGADO, torniquete, motivo);
                return ValidacionAccesoPayload.builder()
                        .permitido(false)
                        .mensaje("Acceso denegado: " + motivo)
                        .clienteId(command.clienteId())
                        .registroAcceso(denegado)
                        .build();
            }
        }

        Optional<BoletaInscripcion> inscripcionOpt = inscripcionRepository.findInscripcionVigenteCliente(command.clienteId(), hoy);

        if (inscripcionOpt.isEmpty()) {
            RegistroAcceso denegado = registrarIntento(command.clienteId(), null, movimiento, EstadoAcceso.DENEGADO, torniquete, "Sin membresía activa o fuera de vigencia");
            return ValidacionAccesoPayload.builder()
                    .permitido(false)
                    .mensaje("Acceso denegado: Cliente no tiene membresía vigente")
                    .clienteId(command.clienteId())
                    .registroAcceso(denegado)
                    .build();
        }

        BoletaInscripcion inscripcion = inscripcionOpt.get();

        if (inscripcion.getEstado() != EstadoInscripcion.ACTIVA) {
            String motivo = "Membresía en estado " + inscripcion.getEstado();
            RegistroAcceso denegado = registrarIntento(command.clienteId(), inscripcion.getId(), movimiento, EstadoAcceso.DENEGADO, torniquete, motivo);
            return ValidacionAccesoPayload.builder()
                    .permitido(false)
                    .mensaje("Acceso denegado: " + motivo)
                    .clienteId(command.clienteId())
                    .codigoMatricula(inscripcion.getCodigoMatricula())
                    .registroAcceso(denegado)
                    .build();
        }

        // Validación de sesiones consumidas
        if (inscripcion.getTotalSesiones() != null && inscripcion.getTotalSesiones() > 0) {
            if (inscripcion.getSesionesConsumidas() >= inscripcion.getTotalSesiones()) {
                RegistroAcceso denegado = registrarIntento(command.clienteId(), inscripcion.getId(), movimiento, EstadoAcceso.DENEGADO, torniquete, "Total de sesiones del paquete agotadas");
                return ValidacionAccesoPayload.builder()
                        .permitido(false)
                        .mensaje("Acceso denegado: Has consumido todas las sesiones de tu paquete")
                        .clienteId(command.clienteId())
                        .codigoMatricula(inscripcion.getCodigoMatricula())
                        .sesionesRestantes(0)
                        .registroAcceso(denegado)
                        .build();
            }

            // Si es ENTRADA, debitar una sesión
            if (movimiento == TipoMovimientoAcceso.ENTRADA) {
                inscripcion.setSesionesConsumidas(inscripcion.getSesionesConsumidas() + 1);
                inscripcionRepository.save(inscripcion);
            }
        }

        // Acceso permitido
        RegistroAcceso permitido = registrarIntento(command.clienteId(), inscripcion.getId(), movimiento, EstadoAcceso.PERMITIDO, torniquete, null);

        int diasRestantes = (int) ChronoUnit.DAYS.between(hoy, inscripcion.getFechaFin());
        Integer sesionesRestantes = inscripcion.getTotalSesiones() != null
                ? Math.max(0, inscripcion.getTotalSesiones() - inscripcion.getSesionesConsumidas())
                : null;

        Plan plan = planRepository.findById(inscripcion.getPlanId()).orElse(null);

        return ValidacionAccesoPayload.builder()
                .permitido(true)
                .mensaje("¡Bienvenido a ApexFitness! Acceso permitido")
                .clienteId(command.clienteId())
                .codigoMatricula(inscripcion.getCodigoMatricula())
                .planNombre(plan != null ? plan.getNombre() : "Plan Activo")
                .sesionesRestantes(sesionesRestantes)
                .diasRestantes(Math.max(0, diasRestantes))
                .registroAcceso(permitido)
                .build();
    }

    @Override
    @Transactional
    public ValidacionAccesoPayload validarAccesoPorQr(ValidarAccesoQrCommand command) {
        String torniquete = command.dispositivoTorniquete() != null ? command.dispositivoTorniquete() : "TORNIQUETE-01";
        TipoMovimientoAcceso movimiento = command.tipoMovimiento() != null ? command.tipoMovimiento() : TipoMovimientoAcceso.ENTRADA;

        QrPayloadDto payload;
        try {
            payload = qrCryptoService.validarYExtraerPayload(command.qrPayload());
        } catch (Exception e) {
            RegistroAcceso denegado = registrarIntento(
                    ANONYMOUS_CLIENTE_ID,
                    null,
                    movimiento,
                    EstadoAcceso.DENEGADO,
                    torniquete,
                    "QR inválido o firma HMAC adulterada: " + e.getMessage()
            );
            return ValidacionAccesoPayload.builder()
                    .permitido(false)
                    .mensaje("Acceso denegado: Código QR no auténtico o adulterado")
                    .clienteId(ANONYMOUS_CLIENTE_ID)
                    .registroAcceso(denegado)
                    .build();
        }

        ValidarAccesoCommand delegate = ValidarAccesoCommand.builder()
                .clienteId(payload.clienteId())
                .dispositivoTorniquete(torniquete)
                .tipoMovimiento(movimiento)
                .build();

        return validarAcceso(delegate);
    }

    @Override
    @Transactional(readOnly = true)
    public String generarQrPaseDigital(UUID inscripcionId) {
        BoletaInscripcion inscripcion = inscripcionRepository.findById(inscripcionId)
                .orElseThrow(() -> new IllegalArgumentException("Inscripción no encontrada con id: " + inscripcionId));

        if (inscripcion.getEstado() != EstadoInscripcion.ACTIVA) {
            throw new IllegalStateException("Solo se puede generar el Pase Digital para inscripciones activas");
        }

        return qrCryptoService.generarPayloadQr(inscripcion);
    }

    private RegistroAcceso registrarIntento(UUID clienteId, UUID inscripcionId, TipoMovimientoAcceso mov, EstadoAcceso estado, String torniquete, String motivo) {
        RegistroAcceso reg = RegistroAcceso.builder()
                .clienteId(clienteId)
                .boletaInscripcionId(inscripcionId)
                .tipoMovimiento(mov)
                .estadoAcceso(estado)
                .dispositivoTorniquete(torniquete)
                .motivoDenegacion(motivo)
                .fechaHora(OffsetDateTime.now())
                .build();
        return registroAccesoRepository.save(reg);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistroAcceso> listarRegistros(UUID clienteId, int limite) {
        return registroAccesoRepository.findAll(clienteId, Math.min(limite, 100));
    }
}
