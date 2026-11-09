package com.apexfitness.gimnasio.domain.ports.in;

import com.apexfitness.gimnasio.domain.model.RegistroAcceso;
import com.apexfitness.gimnasio.domain.model.ValidacionAccesoPayload;
import com.apexfitness.gimnasio.domain.model.dto.ValidarAccesoCommand;

import java.util.List;
import java.util.UUID;

public interface ControlAccesoUseCase {
    ValidacionAccesoPayload validarAcceso(ValidarAccesoCommand command);
    ValidacionAccesoPayload validarAccesoPorQr(com.apexfitness.gimnasio.domain.model.dto.ValidarAccesoQrCommand command);
    String generarQrPaseDigital(UUID inscripcionId);
    List<RegistroAcceso> listarRegistros(UUID clienteId, int limite);
    List<RegistroAcceso> listarRegistrosPagina(int pagina, int limite);
}
